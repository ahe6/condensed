import { PaymentStatus, PaymentStatusEventSource, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { config } from "../../config.js";
import { prisma } from "../../prisma.js";
import { orderInclude } from "../orders/orders.service.js";
import type { CreatePaymentInput, CreateStripeCheckoutSessionInput } from "./payments.schemas.js";

const paymentInclude = {
  statusEvents: {
    orderBy: {
      createdAt: "asc" as const
    }
  },
  order: {
    include: orderInclude
  }
};

let stripe: Stripe | null = null;

type CheckoutSessionCreateParams = NonNullable<Parameters<Stripe["checkout"]["sessions"]["create"]>[0]>;
type CheckoutLineItem = NonNullable<CheckoutSessionCreateParams["line_items"]>[number];
type StripePaymentRecord = {
  id: string;
  orderId: string;
  processedAt: Date | null;
  status: PaymentStatus;
  metadata: Prisma.JsonValue | null;
};
type PaymentStatusEventContext = {
  source: PaymentStatusEventSource;
  providerEventId?: string;
  providerObjectId?: string | null;
  reason?: string;
  metadata?: Record<string, unknown>;
  recordSameStatus?: boolean;
};

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createPayment(orderId: string, input: CreatePaymentInput) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        orderId,
        provider: input.provider,
        providerPaymentId: input.providerPaymentId,
        amount: input.amount,
        currency: input.currency
      }
    });

    await createPaymentStatusEvent(tx, payment, PaymentStatus.UNPAID, {
      source: PaymentStatusEventSource.ADMIN_MANUAL,
      providerObjectId: input.providerPaymentId,
      reason: "Manual payment created",
      recordSameStatus: true
    });

    return tx.payment.findUniqueOrThrow({
      where: {
        id: payment.id
      },
      include: paymentInclude
    });
  });
}

export function markPaymentAuthorized(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.AUTHORIZED, "Admin marked payment authorized");
}

export function markPaymentPaid(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.PAID, "Admin marked payment paid");
}

export function markPaymentFailed(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.FAILED, "Admin marked payment failed");
}

export function refundPayment(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.REFUNDED, "Admin marked payment refunded");
}

export async function syncStripePayment(paymentId: string) {
  const stripeClient = getStripe();
  const payment = await prisma.payment.findUniqueOrThrow({
    where: {
      id: paymentId
    }
  });

  if (payment.provider !== "stripe") {
    throw new PaymentError("Only Stripe payments can be synced", 400);
  }

  if (!payment.providerPaymentId) {
    throw new PaymentError("Stripe payment has no provider payment id", 400);
  }

  if (payment.providerPaymentId.startsWith("cs_")) {
    const checkoutSession = await retrieveCheckoutSession(stripeClient, payment.providerPaymentId);

    const metadata = {
      ...checkoutSessionMetadata(checkoutSession),
      lastStripeSyncAt: new Date().toISOString()
    };

    return applyStripePaymentUpdate(payment, statusFromCheckoutSession(checkoutSession), metadata, {
      source: PaymentStatusEventSource.ADMIN_SYNC,
      providerObjectId: checkoutSession.id,
      reason: "Admin synced Stripe Checkout Session",
      metadata
    });
  }

  if (payment.providerPaymentId.startsWith("pi_")) {
    const paymentIntent = await retrievePaymentIntent(stripeClient, payment.providerPaymentId);

    const metadata = {
      ...paymentIntentMetadata(paymentIntent),
      lastStripeSyncAt: new Date().toISOString()
    };

    return applyStripePaymentUpdate(payment, statusFromPaymentIntent(paymentIntent), metadata, {
      source: PaymentStatusEventSource.ADMIN_SYNC,
      providerObjectId: paymentIntent.id,
      reason: "Admin synced Stripe PaymentIntent",
      metadata
    });
  }

  throw new PaymentError("Stripe payment id must be a Checkout Session or PaymentIntent id", 400);
}

export async function createStripeCheckoutSession(orderId: string, input: CreateStripeCheckoutSessionInput) {
  const stripeClient = getStripe();
  const order = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    include: {
      items: true,
      payments: true
    }
  });

  if (order.paymentStatus === PaymentStatus.PAID || order.paymentStatus === PaymentStatus.REFUNDED) {
    throw new PaymentError(`Order payment is already ${order.paymentStatus.toLowerCase()}`, 409);
  }

  if (order.items.length === 0) {
    throw new PaymentError("Order has no items", 400);
  }

  const existingPayment = order.payments.find(
    (payment) =>
      payment.provider === "stripe" &&
      payment.providerPaymentId?.startsWith("cs_") &&
      payment.status === PaymentStatus.UNPAID
  );

  if (existingPayment?.providerPaymentId) {
    const checkoutSession = await stripeClient.checkout.sessions.retrieve(existingPayment.providerPaymentId);

    if (canReuseCheckoutSession(checkoutSession)) {
      return {
        clientSecret: checkoutSession.client_secret,
        checkoutSessionId: checkoutSession.id,
        payment: await prisma.payment.findUniqueOrThrow({
          where: {
            id: existingPayment.id
          },
          include: paymentInclude
        })
      };
    }
  }

  const checkoutSession = await stripeClient.checkout.sessions.create({
    mode: "payment",
    ui_mode: "elements",
    return_url: input.returnUrl,
    customer_email: order.email,
    client_reference_id: order.id,
    line_items: buildCheckoutLineItems(order),
    payment_method_types: ["card"],
    phone_number_collection: {
      enabled: true
    },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber
    },
    payment_intent_data: {
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber
      }
    }
  });

  if (!checkoutSession.client_secret) {
    throw new PaymentError("Stripe checkout session has no client secret", 502);
  }

  const payment = await prisma.$transaction(async (tx) => {
    const createdPayment = await tx.payment.create({
      data: {
        orderId: order.id,
        provider: "stripe",
        providerPaymentId: checkoutSession.id,
        status: PaymentStatus.UNPAID,
        amount: order.total,
        currency: order.currency,
        metadata: {
          checkoutPaymentStatus: checkoutSession.payment_status,
          checkoutSessionId: checkoutSession.id,
          checkoutSessionStatus: checkoutSession.status
        }
      }
    });

    await createPaymentStatusEvent(tx, createdPayment, PaymentStatus.UNPAID, {
      source: PaymentStatusEventSource.SYSTEM,
      providerObjectId: checkoutSession.id,
      reason: "Stripe Checkout Session payment created",
      metadata: {
        checkoutPaymentStatus: checkoutSession.payment_status,
        checkoutSessionId: checkoutSession.id,
        checkoutSessionStatus: checkoutSession.status
      },
      recordSameStatus: true
    });

    return tx.payment.findUniqueOrThrow({
      where: {
        id: createdPayment.id
      },
      include: paymentInclude
    });
  });

  return {
    clientSecret: checkoutSession.client_secret,
    checkoutSessionId: checkoutSession.id,
    payment
  };
}

export async function handleStripeWebhook(rawBody: string, signature: string | undefined) {
  const stripeClient = getStripe();

  if (!config.STRIPE_WEBHOOK_SECRET) {
    throw new PaymentError("Stripe webhook secret is not configured", 503);
  }

  if (!signature) {
    throw new PaymentError("Missing Stripe signature", 400);
  }

  const event = stripeClient.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET);

  switch (event.type) {
    case "checkout.session.completed":
      await updateStripeCheckoutSession(
        event.data.object,
        event.data.object.payment_status === "paid" || event.data.object.payment_status === "no_payment_required"
          ? PaymentStatus.PAID
          : PaymentStatus.UNPAID,
        event
      );
      break;
    case "checkout.session.async_payment_succeeded":
      await updateStripeCheckoutSession(event.data.object, PaymentStatus.PAID, event);
      break;
    case "checkout.session.async_payment_failed":
      await updateStripeCheckoutSession(event.data.object, PaymentStatus.FAILED, event);
      break;
    case "checkout.session.expired":
      await updateStripeCheckoutSession(event.data.object, PaymentStatus.EXPIRED, event);
      break;
    case "payment_intent.succeeded":
      await updateStripePayment(event.data.object, PaymentStatus.PAID, event);
      break;
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      await updateStripePayment(event.data.object, PaymentStatus.FAILED, event);
      break;
    case "payment_intent.amount_capturable_updated":
      await updateStripePayment(event.data.object, PaymentStatus.AUTHORIZED, event);
      break;
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
      await updateStripeDispute(event.data.object, event);
      break;
  }

  return {
    received: true
  };
}

function updatePaymentAndOrder(paymentId: string, status: PaymentStatus, reason: string) {
  return prisma.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUniqueOrThrow({
      where: {
        id: paymentId
      }
    });

    await tx.payment.update({
      where: {
        id: paymentId
      },
      data: {
        status,
        processedAt: new Date()
      }
    });

    await tx.order.update({
      where: {
        id: existingPayment.orderId
      },
      data: {
        paymentStatus: status
      }
    });

    await createPaymentStatusEvent(tx, existingPayment, status, {
      source: PaymentStatusEventSource.ADMIN_MANUAL,
      providerObjectId: existingPayment.providerPaymentId,
      reason
    });

    return tx.payment.findUniqueOrThrow({
      where: {
        id: existingPayment.id
      },
      include: paymentInclude
    });
  });
}

async function updateStripeCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
  status: PaymentStatus,
  event: Stripe.Event
) {
  const syncedSession = await retrieveCheckoutSession(getStripe(), checkoutSession.id);
  const payment = await prisma.payment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider: "stripe",
        providerPaymentId: syncedSession.id
      }
    }
  });

  if (!payment || status === PaymentStatus.UNPAID) {
    return;
  }

  const metadata = {
    ...checkoutSessionMetadata(syncedSession),
    lastStripeEventAt: new Date().toISOString()
  };

  await applyStripePaymentUpdate(payment, statusFromCheckoutSession(syncedSession, status), metadata, {
    source: PaymentStatusEventSource.STRIPE_WEBHOOK,
    providerEventId: event.id,
    providerObjectId: syncedSession.id,
    reason: event.type,
    metadata
  });
}

async function updateStripePayment(paymentIntent: Stripe.PaymentIntent, status: PaymentStatus, event: Stripe.Event) {
  const syncedPaymentIntent = await retrievePaymentIntent(getStripe(), paymentIntent.id);
  const paymentByPaymentIntent = await prisma.payment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider: "stripe",
        providerPaymentId: syncedPaymentIntent.id
      }
    }
  });
  const payment =
    paymentByPaymentIntent ??
    (syncedPaymentIntent.metadata.orderId
      ? await prisma.payment.findFirst({
          where: {
            orderId: syncedPaymentIntent.metadata.orderId,
            provider: "stripe",
            status: PaymentStatus.UNPAID
          },
          orderBy: {
            createdAt: "desc"
          }
        })
      : null);

  if (!payment) {
    return;
  }

  const metadata = {
    ...paymentIntentMetadata(syncedPaymentIntent, payment.providerPaymentId),
    lastStripeEventAt: new Date().toISOString()
  };

  await applyStripePaymentUpdate(payment, statusFromPaymentIntent(syncedPaymentIntent, status), metadata, {
    source: PaymentStatusEventSource.STRIPE_WEBHOOK,
    providerEventId: event.id,
    providerObjectId: syncedPaymentIntent.id,
    reason: event.type,
    metadata
  });
}

async function updateStripeDispute(dispute: Stripe.Dispute, event: Stripe.Event) {
  const chargeId = stripeId(dispute.charge);

  if (!chargeId) {
    return;
  }

  const charge = await getStripe().charges.retrieve(chargeId, {
    expand: ["payment_intent"]
  });
  const paymentIntent = stripePaymentIntent(charge.payment_intent);

  if (!paymentIntent) {
    return;
  }

  const payment = await findStripePaymentForPaymentIntent(paymentIntent);

  if (!payment) {
    return;
  }

  const metadata = {
    chargeDisputed: dispute.status !== "won",
    chargeId,
    disputeAmount: dispute.amount,
    disputeCurrency: dispute.currency,
    disputeId: dispute.id,
    disputeReason: dispute.reason,
    disputeStatus: dispute.status,
    lastStripeEventAt: new Date().toISOString(),
    paymentIntentId: paymentIntent.id
  };

  await applyStripePaymentUpdate(payment, dispute.status === "won" ? PaymentStatus.PAID : PaymentStatus.DISPUTED, metadata, {
    source: PaymentStatusEventSource.STRIPE_WEBHOOK,
    providerEventId: event.id,
    providerObjectId: dispute.id,
    reason: event.type,
    metadata
  });
}

async function applyStripePaymentUpdate(
  payment: StripePaymentRecord,
  status: PaymentStatus,
  metadata: Record<string, unknown>,
  eventContext: PaymentStatusEventContext
) {
  return prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: {
        id: payment.id
      },
      data: {
        status,
        processedAt: status === PaymentStatus.UNPAID ? payment.processedAt : new Date(),
        metadata: mergeMetadata(payment.metadata, metadata)
      }
    });

    await tx.order.update({
      where: {
        id: payment.orderId
      },
      data: {
        paymentStatus: status
      }
    });

    await createPaymentStatusEvent(tx, payment, status, eventContext);

    return tx.payment.findUniqueOrThrow({
      where: {
        id: payment.id
      },
      include: paymentInclude
    });
  });
}

async function createPaymentStatusEvent(
  tx: Prisma.TransactionClient,
  payment: StripePaymentRecord,
  toStatus: PaymentStatus,
  context: PaymentStatusEventContext
) {
  const isInitialEvent = payment.status === toStatus && context.recordSameStatus === true;

  if (payment.status === toStatus && !context.recordSameStatus) {
    return;
  }

  await tx.paymentStatusEvent.create({
    data: {
      paymentId: payment.id,
      orderId: payment.orderId,
      fromStatus: isInitialEvent ? null : payment.status,
      toStatus,
      source: context.source,
      providerEventId: context.providerEventId,
      providerObjectId: context.providerObjectId,
      reason: context.reason,
      metadata: context.metadata ? compactJsonObject(context.metadata) : undefined
    }
  });
}

async function findStripePaymentForPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
  const paymentByPaymentIntent = await prisma.payment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider: "stripe",
        providerPaymentId: paymentIntent.id
      }
    }
  });

  return (
    paymentByPaymentIntent ??
    (paymentIntent.metadata.orderId
      ? prisma.payment.findFirst({
          where: {
            orderId: paymentIntent.metadata.orderId,
            provider: "stripe"
          },
          orderBy: {
            createdAt: "desc"
          }
        })
      : null)
  );
}

function statusFromCheckoutSession(
  checkoutSession: Stripe.Checkout.Session,
  fallbackStatus: PaymentStatus = PaymentStatus.UNPAID
) {
  const paymentIntent = stripePaymentIntent(checkoutSession.payment_intent);
  const charge = paymentIntent ? stripeCharge(paymentIntent.latest_charge) : null;

  if (charge?.disputed) {
    return PaymentStatus.DISPUTED;
  }

  if (checkoutSession.payment_status === "paid" || checkoutSession.payment_status === "no_payment_required") {
    return PaymentStatus.PAID;
  }

  if (checkoutSession.status === "expired") {
    return PaymentStatus.EXPIRED;
  }

  return fallbackStatus;
}

function statusFromPaymentIntent(paymentIntent: Stripe.PaymentIntent, fallbackStatus: PaymentStatus = PaymentStatus.UNPAID) {
  const charge = stripeCharge(paymentIntent.latest_charge);

  if (charge?.disputed) {
    return PaymentStatus.DISPUTED;
  }

  switch (paymentIntent.status) {
    case "succeeded":
      return PaymentStatus.PAID;
    case "requires_capture":
      return PaymentStatus.AUTHORIZED;
    case "canceled":
      return PaymentStatus.FAILED;
    default:
      return fallbackStatus;
  }
}

function checkoutSessionMetadata(checkoutSession: Stripe.Checkout.Session) {
  const paymentIntent = stripePaymentIntent(checkoutSession.payment_intent);
  const charge = paymentIntent ? stripeCharge(paymentIntent.latest_charge) : null;

  return {
    chargeDisputed: charge?.disputed,
    chargeId: stripeId(paymentIntent?.latest_charge),
    checkoutPaymentStatus: checkoutSession.payment_status,
    checkoutSessionId: checkoutSession.id,
    checkoutSessionStatus: checkoutSession.status,
    paymentIntentId: stripeId(checkoutSession.payment_intent),
    stripeStatus: paymentIntent?.status
  };
}

function paymentIntentMetadata(paymentIntent: Stripe.PaymentIntent, providerPaymentId?: string | null) {
  const charge = stripeCharge(paymentIntent.latest_charge);

  return {
    chargeDisputed: charge?.disputed,
    chargeId: stripeId(paymentIntent.latest_charge),
    checkoutSessionId: providerPaymentId?.startsWith("cs_") ? providerPaymentId : undefined,
    paymentIntentId: paymentIntent.id,
    stripeStatus: paymentIntent.status
  };
}

async function retrieveCheckoutSession(stripeClient: Stripe, checkoutSessionId: string) {
  return stripeClient.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ["payment_intent", "payment_intent.latest_charge"]
  });
}

async function retrievePaymentIntent(stripeClient: Stripe, paymentIntentId: string) {
  return stripeClient.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge"]
  });
}

function mergeMetadata(current: Prisma.JsonValue | null, next: Record<string, unknown>) {
  const base =
    current && typeof current === "object" && !Array.isArray(current) ? (current as Prisma.JsonObject) : {};

  return compactJsonObject({
    ...base,
    ...next
  });
}

function compactJsonObject(input: Record<string, unknown>) {
  const output: Prisma.JsonObject = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key] = value as Prisma.JsonValue;
    }
  }

  return output;
}

function stripePaymentIntent(value: string | Stripe.PaymentIntent | null) {
  return value && typeof value !== "string" ? value : null;
}

function stripeCharge(value: string | Stripe.Charge | null) {
  return value && typeof value !== "string" ? value : null;
}

function canReuseCheckoutSession(checkoutSession: Stripe.Checkout.Session): checkoutSession is Stripe.Checkout.Session & {
  client_secret: string;
} {
  return (
    checkoutSession.status !== "expired" &&
    Boolean(checkoutSession.client_secret) &&
    checkoutSession.payment_method_types.length === 1 &&
    checkoutSession.payment_method_types[0] === "card" &&
    checkoutSession.phone_number_collection?.enabled === true &&
    Boolean(checkoutSession.return_url?.includes("{CHECKOUT_SESSION_ID}"))
  );
}

function buildCheckoutLineItems(order: {
  currency: string;
  discountTotal: Prisma.Decimal;
  items: Array<{
    productName: string;
    quantity: number;
    sku: string;
    unitPrice: Prisma.Decimal;
    variantTitle: string | null;
  }>;
  shippingTotal: Prisma.Decimal;
  taxTotal: Prisma.Decimal;
}): CheckoutLineItem[] {
  if (order.discountTotal.greaterThan(0)) {
    throw new PaymentError("Stripe Checkout discounts are not configured", 400);
  }

  const currency = order.currency.toLowerCase();
  const lineItems: CheckoutLineItem[] = order.items.map((item) => ({
    price_data: {
      currency,
      product_data: {
        name: item.variantTitle ? `${item.productName} - ${item.variantTitle}` : item.productName,
        metadata: {
          sku: item.sku
        }
      },
      unit_amount: decimalToMinorUnits(item.unitPrice, order.currency)
    },
    quantity: item.quantity
  }));

  if (order.shippingTotal.greaterThan(0)) {
    lineItems.push(buildAdjustmentLineItem("Shipping", order.shippingTotal, order.currency));
  }

  if (order.taxTotal.greaterThan(0)) {
    lineItems.push(buildAdjustmentLineItem("Tax", order.taxTotal, order.currency));
  }

  return lineItems;
}

function buildAdjustmentLineItem(name: string, amount: Prisma.Decimal, currency: string): CheckoutLineItem {
  return {
    price_data: {
      currency: currency.toLowerCase(),
      product_data: {
        name
      },
      unit_amount: decimalToMinorUnits(amount, currency)
    },
    quantity: 1
  };
}

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getStripe() {
  if (!config.STRIPE_API_KEY) {
    throw new PaymentError("Stripe is not configured", 503);
  }

  if (!stripe) {
    stripe = new Stripe(config.STRIPE_API_KEY);
  }

  return stripe;
}

function decimalToMinorUnits(amount: Prisma.Decimal, currency: string) {
  const multiplier = zeroDecimalCurrencies.has(currency.toUpperCase()) ? 1 : 100;

  return amount.mul(multiplier).toDecimalPlaces(0).toNumber();
}

const zeroDecimalCurrencies = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF"
]);
