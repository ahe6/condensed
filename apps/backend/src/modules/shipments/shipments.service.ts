import { FulfillmentStatus, ShipmentStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { orderInclude } from "../orders/orders.service.js";
import type { CreateShipmentInput, UpdateShipmentTrackingInput } from "./shipments.schemas.js";

const shipmentInclude = {
  order: {
    include: orderInclude
  }
};

export function createShipment(orderId: string, input: CreateShipmentInput) {
  return prisma.shipment.create({
    data: {
      orderId,
      carrier: input.carrier,
      trackingNumber: input.trackingNumber
    },
    include: shipmentInclude
  });
}

export function addTrackingNumber(shipmentId: string, input: UpdateShipmentTrackingInput) {
  return prisma.shipment.update({
    where: {
      id: shipmentId
    },
    data: input,
    include: shipmentInclude
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

    return tx.shipment.findUniqueOrThrow({
      where: {
        id: shipment.id
      },
      include: shipmentInclude
    });
  });
}
