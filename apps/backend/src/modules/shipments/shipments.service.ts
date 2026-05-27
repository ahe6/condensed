import {
  FulfillmentStatus,
  Prisma,
  ShipmentStatus,
  ShipmentStatusEventSource,
  ShipmentTrackingEventSource
} from "@prisma/client";
import { prisma } from "../../prisma.js";
import { orderInclude } from "../orders/orders.service.js";
import type { CreateShipmentInput, UpdateShipmentTrackingInput } from "./shipments.schemas.js";

const shipmentInclude = {
  statusEvents: {
    orderBy: {
      createdAt: "asc" as const
    }
  },
  trackingEvents: {
    orderBy: {
      createdAt: "asc" as const
    }
  },
  order: {
    include: orderInclude
  }
};

export class ShipmentError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export function createShipment(orderId: string, input: CreateShipmentInput) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: {
        id: orderId
      },
      select: {
        paymentStatus: true
      }
    });

    assertFulfillmentAllowed(order.paymentStatus);

    const shipment = await tx.shipment.create({
      data: {
        orderId,
        carrier: input.carrier,
        trackingNumber: input.trackingNumber
      }
    });

    await createShipmentStatusEvent(tx, shipment, ShipmentStatus.PENDING, {
      source: ShipmentStatusEventSource.ADMIN_MANUAL,
      reason: "Shipment created",
      metadata: {
        carrier: input.carrier,
        trackingNumber: input.trackingNumber
      },
      recordSameStatus: true
    });

    await createShipmentTrackingEvent(tx, shipment, {
      source: ShipmentTrackingEventSource.ADMIN_MANUAL,
      reason: "Shipment tracking set at creation",
      toCarrier: input.carrier,
      toTrackingNumber: input.trackingNumber,
      metadata: {
        status: shipment.status
      },
      recordInitialValues: true
    });

    return tx.shipment.findUniqueOrThrow({
      where: {
        id: shipment.id
      },
      include: shipmentInclude
    });
  });
}

export function addTrackingNumber(shipmentId: string, input: UpdateShipmentTrackingInput) {
  return prisma.$transaction(async (tx) => {
    const existingShipment = await tx.shipment.findUniqueOrThrow({
      where: {
        id: shipmentId
      }
    });

    const shipment = await tx.shipment.update({
      where: {
        id: shipmentId
      },
      data: input
    });

    await createShipmentTrackingEvent(tx, existingShipment, {
      source: ShipmentTrackingEventSource.ADMIN_MANUAL,
      reason: "Shipment tracking updated",
      toCarrier: shipment.carrier,
      toTrackingNumber: shipment.trackingNumber
    });

    return tx.shipment.findUniqueOrThrow({
      where: {
        id: shipment.id
      },
      include: shipmentInclude
    });
  });
}

export function markShipmentShipped(shipmentId: string) {
  return updateShipmentAndOrder(shipmentId, ShipmentStatus.SHIPPED, FulfillmentStatus.FULFILLED, {
    shippedAt: new Date()
  });
}

export function markShipmentDelivered(shipmentId: string) {
  return updateShipmentAndOrder(shipmentId, ShipmentStatus.DELIVERED, FulfillmentStatus.FULFILLED, {
    deliveredAt: new Date()
  });
}

export function markShipmentReturned(shipmentId: string) {
  return updateShipmentAndOrder(shipmentId, ShipmentStatus.RETURNED, FulfillmentStatus.RETURNED);
}

function updateShipmentAndOrder(
  shipmentId: string,
  status: ShipmentStatus,
  fulfillmentStatus: FulfillmentStatus,
  timestamps: { shippedAt?: Date; deliveredAt?: Date } = {}
) {
  return prisma.$transaction(async (tx) => {
    const existingShipment = await tx.shipment.findUniqueOrThrow({
      where: {
        id: shipmentId
      },
      include: {
        order: {
          select: {
            paymentStatus: true
          }
        }
      }
    });

    if (status !== ShipmentStatus.RETURNED) {
      assertFulfillmentAllowed(existingShipment.order.paymentStatus);
    }

    const shipment = await tx.shipment.update({
      where: {
        id: shipmentId
      },
      data: {
        status,
        ...timestamps
      }
    });

    await tx.order.update({
      where: {
        id: shipment.orderId
      },
      data: {
        fulfillmentStatus
      }
    });

    await createShipmentStatusEvent(tx, existingShipment, status, {
      source: ShipmentStatusEventSource.ADMIN_MANUAL,
      reason: `Shipment marked ${status.toLowerCase()}`,
      metadata: timestamps
    });

    return tx.shipment.findUniqueOrThrow({
      where: {
        id: shipment.id
      },
      include: shipmentInclude
    });
  });
}

type ShipmentStatusEventContext = {
  source: ShipmentStatusEventSource;
  reason?: string;
  metadata?: Record<string, unknown>;
  recordSameStatus?: boolean;
};

type ShipmentStatusRecord = {
  id: string;
  orderId: string;
  status: ShipmentStatus;
};

type ShipmentTrackingEventContext = {
  source: ShipmentTrackingEventSource;
  reason?: string;
  toCarrier?: string | null;
  toTrackingNumber?: string | null;
  metadata?: Record<string, unknown>;
  recordInitialValues?: boolean;
};

type ShipmentTrackingRecord = {
  id: string;
  orderId: string;
  carrier: string | null;
  trackingNumber: string | null;
};

async function createShipmentStatusEvent(
  tx: Prisma.TransactionClient,
  shipment: ShipmentStatusRecord,
  toStatus: ShipmentStatus,
  context: ShipmentStatusEventContext
) {
  if (shipment.status === toStatus && !context.recordSameStatus) {
    return;
  }

  await tx.shipmentStatusEvent.create({
    data: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      fromStatus: context.recordSameStatus ? null : shipment.status,
      toStatus,
      source: context.source,
      reason: context.reason,
      metadata: context.metadata ? compactJsonObject(context.metadata) : undefined
    }
  });
}

async function createShipmentTrackingEvent(
  tx: Prisma.TransactionClient,
  shipment: ShipmentTrackingRecord,
  context: ShipmentTrackingEventContext
) {
  const toCarrier = context.toCarrier ?? null;
  const toTrackingNumber = context.toTrackingNumber ?? null;
  const hasTrackingValue = toCarrier !== null || toTrackingNumber !== null;
  const hasChange = shipment.carrier !== toCarrier || shipment.trackingNumber !== toTrackingNumber;

  if (!hasTrackingValue || (!hasChange && !context.recordInitialValues)) {
    return;
  }

  await tx.shipmentTrackingEvent.create({
    data: {
      shipmentId: shipment.id,
      orderId: shipment.orderId,
      fromCarrier: context.recordInitialValues ? null : shipment.carrier,
      toCarrier,
      fromTrackingNumber: context.recordInitialValues ? null : shipment.trackingNumber,
      toTrackingNumber,
      source: context.source,
      reason: context.reason,
      metadata: context.metadata ? compactJsonObject(context.metadata) : undefined
    }
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

function assertFulfillmentAllowed(paymentStatus: string) {
  if (paymentStatus === "PAID" || paymentStatus === "AUTHORIZED") {
    return;
  }

  throw new ShipmentError(`Cannot fulfill an order with payment status ${paymentStatus}`, 409);
}
