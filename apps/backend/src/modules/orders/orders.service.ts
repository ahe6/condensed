import { FulfillmentStatus, OrderStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";

export const orderInclude = {
  addresses: true,
  items: true,
  payments: true,
  shipments: true
};

export function getOrderByNumber(orderNumber: string) {
  return prisma.order.findUnique({
    where: {
      orderNumber
    },
    include: orderInclude
  });
}

export function listOrders() {
  return prisma.order.findMany({
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export function cancelOrder(orderId: string) {
  return prisma.order.update({
    where: {
      id: orderId
    },
    data: {
      status: OrderStatus.CANCELLED
    },
    include: orderInclude
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
