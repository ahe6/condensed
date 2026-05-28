import { FulfillmentStatus, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { config } from "../../config.js";
import { prisma } from "../../prisma.js";
import type { AdminOrderQuery, CreateOrderNoteInput } from "./orders.schemas.js";

export const orderInclude = {
  addresses: true,
  items: true,
  payments: {
    include: {
      statusEvents: {
        orderBy: {
          createdAt: "asc" as const
        }
      }
    }
  },
  shipments: {
    include: {
      items: {
        include: {
          orderItem: true
        },
        orderBy: {
          createdAt: "asc" as const
        }
      },
      statusEvents: {
        orderBy: {
          createdAt: "asc" as const
        }
      },
      trackingEvents: {
        orderBy: {
          createdAt: "asc" as const
        }
      }
    }
  }
};

export const adminOrderInclude = {
  ...orderInclude,
  notes: {
    orderBy: {
      createdAt: "desc" as const
    }
  },
  notificationEvents: {
    orderBy: {
      createdAt: "desc" as const
    }
  }
};

export function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: {
      orderNumber
    },
    include: orderInclude
  });
}

export function getOrderByNumberForUser(orderNumber: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      orderNumber,
      userId
    },
    include: orderInclude
  });
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: typeof adminOrderInclude;
}>;

type ExpireUnpaidOrdersOptions = {
  batchSize?: number;
  olderThanMinutes?: number;
  now?: Date;
};
type StripePaymentForExpiry = {
  provider: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
};

let stripe: Stripe | null = null;

export class OrderError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export async function listOrders(query: AdminOrderQuery) {
  const whereClause = adminOrderWhereClause(query);
  const [{ count }] = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "orders" o
    WHERE ${whereClause}
  `;
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const offset = (page - 1) * query.pageSize;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT o."id"::text AS id
    FROM "orders" o
    WHERE ${whereClause}
    ORDER BY ${adminOrderSortClause(query.sort)}
    LIMIT ${query.pageSize}
    OFFSET ${offset}
  `;
  const ids = rows.map((row) => row.id);

  if (ids.length === 0) {
    return {
      orders: [],
      total,
      page,
      pageSize: query.pageSize,
      pageCount
    };
  }

  const orders = await prisma.order.findMany({
    where: {
      id: {
        in: ids
      }
    },
    include: adminOrderInclude
  });
  const ordersById = new Map(orders.map((order) => [order.id, order]));

  return {
    orders: ids.map((id) => ordersById.get(id)).filter((order): order is OrderWithRelations => Boolean(order)),
    total,
    page,
    pageSize: query.pageSize,
    pageCount
  };
}

export async function createOrderNote(
  orderId: string,
  input: CreateOrderNoteInput,
  authorEmail: string | null
) {
  await prisma.orderNote.create({
    data: {
      orderId,
      body: input.body,
      authorEmail
    }
  });

  return prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    include: adminOrderInclude
  });
}

export async function cancelOrder(orderId: string) {
  const orderForStripe = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    include: {
      payments: true
    }
  });

  await expireStripeCheckoutSessionsForCancellation(orderForStripe.payments, {
    throwWhenPaid: true
  });

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: {
        id: orderId
      },
      include: {
        items: true
      }
    });
    const shouldReleaseInventory =
      order.inventoryReleasedAt === null &&
      order.fulfillmentStatus === FulfillmentStatus.UNFULFILLED &&
      (order.paymentStatus === PaymentStatus.UNPAID ||
        order.paymentStatus === PaymentStatus.FAILED ||
        order.paymentStatus === PaymentStatus.EXPIRED);

    if (shouldReleaseInventory) {
      for (const item of order.items) {
        if (!item.variantId) {
          continue;
        }

        await tx.productVariant.update({
          where: {
            id: item.variantId
          },
          data: {
            inventoryQuantity: {
              increment: item.quantity
            }
          }
        });
      }
    }

    return tx.order.update({
      where: {
        id: order.id
      },
      data: {
        inventoryReleasedAt: shouldReleaseInventory ? new Date() : order.inventoryReleasedAt,
        status: OrderStatus.CANCELLED
      },
      include: orderInclude
    });
  });
}

export function markOrderPlaced(orderId: string) {
  return prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      status: OrderStatus.PLACED,
      placedAt: new Date()
    },
    include: orderInclude
  });
}

export function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  return prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      paymentStatus
    },
    include: orderInclude
  });
}

export function updateFulfillmentStatus(orderId: string, fulfillmentStatus: FulfillmentStatus) {
  return prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      fulfillmentStatus
    },
    include: orderInclude
  });
}

export async function expireUnpaidOrders(options: ExpireUnpaidOrdersOptions = {}) {
  const now = options.now ?? new Date();
  const olderThanMinutes = options.olderThanMinutes ?? 15;
  const batchSize = options.batchSize ?? 50;
  const expiresBefore = new Date(now.getTime() - olderThanMinutes * 60_000);
  const candidates = await prisma.order.findMany({
    where: unpaidExpiryWhere(expiresBefore),
    select: {
      id: true,
      payments: {
        select: {
          provider: true,
          providerPaymentId: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    take: batchSize
  });
  const expiredOrderIds: string[] = [];

  for (const candidate of candidates) {
    const canCancel = await expireStripeCheckoutSessionsForCancellation(candidate.payments, {
      throwWhenPaid: false
    });

    if (!canCancel) {
      continue;
    }

    const expired = await cancelOrderAndReleaseInventory(candidate.id, expiresBefore, now);

    if (expired) {
      expiredOrderIds.push(expired.id);
    }
  }

  return {
    batchSize,
    expiredCount: expiredOrderIds.length,
    expiredOrderIds,
    expiresBefore: expiresBefore.toISOString()
  };
}

async function cancelOrderAndReleaseInventory(
  orderId: string,
  expiresBefore: Date,
  releasedAt = new Date()
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        ...unpaidExpiryWhere(expiresBefore)
      },
      include: {
        items: true
      }
    });

    if (!order) {
      return null;
    }

    const updateResult = await tx.order.updateMany({
      where: {
        id: order.id,
        inventoryReleasedAt: null
      },
      data: {
        inventoryReleasedAt: releasedAt,
        status: OrderStatus.CANCELLED
      }
    });

    if (updateResult.count !== 1) {
      return null;
    }

    for (const item of order.items) {
      if (!item.variantId) {
        continue;
      }

      await tx.productVariant.update({
        where: {
          id: item.variantId
        },
        data: {
          inventoryQuantity: {
            increment: item.quantity
          }
        }
      });
    }

    return tx.order.findUniqueOrThrow({
      where: {
        id: order.id
      },
      include: orderInclude
    });
  });
}

function unpaidExpiryWhere(expiresBefore: Date) {
  return {
    createdAt: {
      lte: expiresBefore
    },
    fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
    inventoryReleasedAt: null,
    paymentStatus: {
      in: [PaymentStatus.UNPAID, PaymentStatus.FAILED, PaymentStatus.EXPIRED]
    },
    status: {
      in: [OrderStatus.PENDING, OrderStatus.PLACED]
    }
  } satisfies Prisma.OrderWhereInput;
}

async function expireStripeCheckoutSessionsForCancellation(
  payments: StripePaymentForExpiry[],
  options: { throwWhenPaid: boolean }
) {
  const checkoutSessionIds = payments
    .filter(
      (payment) =>
        payment.provider === "stripe" &&
        payment.providerPaymentId?.startsWith("cs_") &&
        payment.status !== PaymentStatus.PAID &&
        payment.status !== PaymentStatus.REFUNDED
    )
    .map((payment) => payment.providerPaymentId)
    .filter((id): id is string => Boolean(id));

  if (checkoutSessionIds.length === 0) {
    return true;
  }

  const stripeClient = getStripe();

  for (const checkoutSessionId of checkoutSessionIds) {
    const checkoutSession = await stripeClient.checkout.sessions.retrieve(checkoutSessionId);

    if (checkoutSession.payment_status === "paid" || checkoutSession.status === "complete") {
      if (options.throwWhenPaid) {
        throw new OrderError("Cannot cancel an order with a completed Stripe Checkout Session", 409);
      }

      return false;
    }

    if (checkoutSession.status === "open") {
      await stripeClient.checkout.sessions.expire(checkoutSession.id);
    }
  }

  return true;
}

function getStripe() {
  if (!config.STRIPE_API_KEY) {
    throw new OrderError("Stripe is not configured", 503);
  }

  if (!stripe) {
    stripe = new Stripe(config.STRIPE_API_KEY);
  }

  return stripe;
}

function adminOrderWhereClause(query: AdminOrderQuery) {
  const clauses: Prisma.Sql[] = [Prisma.sql`TRUE`];

  if (query.search) {
    const pattern = `%${query.search}%`;

    clauses.push(Prisma.sql`(
      o."orderNumber" ILIKE ${pattern}
      OR o."email" ILIKE ${pattern}
      OR o."status"::text ILIKE ${pattern}
      OR o."paymentStatus"::text ILIKE ${pattern}
      OR o."fulfillmentStatus"::text ILIKE ${pattern}
      OR EXISTS (
        SELECT 1
        FROM "order_addresses" oa
        WHERE oa."orderId" = o."id"
          AND oa."recipientName" ILIKE ${pattern}
      )
      OR EXISTS (
        SELECT 1
        FROM "order_items" oi
        WHERE oi."orderId" = o."id"
          AND (
            oi."productName" ILIKE ${pattern}
            OR oi."sku" ILIKE ${pattern}
            OR oi."variantTitle" ILIKE ${pattern}
          )
      )
      OR EXISTS (
        SELECT 1
        FROM "order_notes" note
        WHERE note."orderId" = o."id"
          AND (
            note."body" ILIKE ${pattern}
            OR note."authorEmail" ILIKE ${pattern}
          )
      )
    )`);
  }

  if (query.payment !== "ALL") {
    clauses.push(Prisma.sql`o."paymentStatus" = ${query.payment}::"PaymentStatus"`);
  }

  if (query.fulfillment !== "ALL") {
    clauses.push(Prisma.sql`o."fulfillmentStatus" = ${query.fulfillment}::"FulfillmentStatus"`);
  }

  const dateClause = adminOrderDateClause(query);

  if (dateClause) {
    clauses.push(dateClause);
  }

  return Prisma.join(clauses, " AND ");
}

function adminOrderDateClause(query: AdminOrderQuery) {
  if (!query.dateFrom && !query.dateTo) {
    return null;
  }

  const fromDate = query.dateFrom ? new Date(`${query.dateFrom}T00:00:00`) : null;
  const toDate = query.dateTo ? new Date(`${query.dateTo}T23:59:59.999`) : null;
  const rangeClause = (expression: Prisma.Sql) => {
    const clauses: Prisma.Sql[] = [];

    if (fromDate) {
      clauses.push(Prisma.sql`${expression} >= ${fromDate}`);
    }

    if (toDate) {
      clauses.push(Prisma.sql`${expression} <= ${toDate}`);
    }

    return Prisma.join(clauses, " AND ");
  };

  switch (query.dateField) {
    case "ORDER_CREATED":
      return rangeClause(Prisma.sql`o."createdAt"`);
    case "ORDER_PLACED":
      return rangeClause(Prisma.sql`o."placedAt"`);
    case "ORDER_UPDATED":
      return rangeClause(Prisma.sql`o."updatedAt"`);
    case "SHIPMENT_CREATED":
      return Prisma.sql`EXISTS (
        SELECT 1
        FROM "shipments" s
        WHERE s."orderId" = o."id"
          AND ${rangeClause(Prisma.sql`s."createdAt"`)}
      )`;
    case "SHIPMENT_SHIPPED":
      return Prisma.sql`EXISTS (
        SELECT 1
        FROM "shipments" s
        WHERE s."orderId" = o."id"
          AND ${rangeClause(Prisma.sql`s."shippedAt"`)}
      )`;
    case "SHIPMENT_DELIVERED":
      return Prisma.sql`EXISTS (
        SELECT 1
        FROM "shipments" s
        WHERE s."orderId" = o."id"
          AND ${rangeClause(Prisma.sql`s."deliveredAt"`)}
      )`;
    case "ANY":
      return Prisma.sql`(
        ${rangeClause(Prisma.sql`o."createdAt"`)}
        OR ${rangeClause(Prisma.sql`o."placedAt"`)}
        OR ${rangeClause(Prisma.sql`o."updatedAt"`)}
        OR EXISTS (
          SELECT 1
          FROM "shipments" s
          WHERE s."orderId" = o."id"
            AND (
              ${rangeClause(Prisma.sql`s."createdAt"`)}
              OR ${rangeClause(Prisma.sql`s."shippedAt"`)}
              OR ${rangeClause(Prisma.sql`s."deliveredAt"`)}
            )
        )
      )`;
  }
}

function adminOrderSortClause(sort: AdminOrderQuery["sort"]) {
  switch (sort) {
    case "CREATED_ASC":
      return Prisma.sql`o."createdAt" ASC, o."id" ASC`;
    case "CREATED_DESC":
      return Prisma.sql`o."createdAt" DESC, o."id" DESC`;
    case "UPDATED_DESC":
      return Prisma.sql`o."updatedAt" DESC, o."createdAt" DESC, o."id" DESC`;
    case "PLACED_DESC":
      return Prisma.sql`o."placedAt" DESC NULLS LAST, o."createdAt" DESC, o."id" DESC`;
    case "SHIPPED_DESC":
      return Prisma.sql`(
        SELECT MAX(s."shippedAt")
        FROM "shipments" s
        WHERE s."orderId" = o."id"
      ) DESC NULLS LAST, o."createdAt" DESC, o."id" DESC`;
    case "DELIVERED_DESC":
      return Prisma.sql`(
        SELECT MAX(s."deliveredAt")
        FROM "shipments" s
        WHERE s."orderId" = o."id"
      ) DESC NULLS LAST, o."createdAt" DESC, o."id" DESC`;
    case "TOTAL_DESC":
      return Prisma.sql`o."total" DESC, o."createdAt" DESC, o."id" DESC`;
    case "TOTAL_ASC":
      return Prisma.sql`o."total" ASC, o."createdAt" DESC, o."id" DESC`;
  }
}
