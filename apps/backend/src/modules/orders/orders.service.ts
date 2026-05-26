import { prisma } from "../../prisma.js";

const orderInclude = {
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
