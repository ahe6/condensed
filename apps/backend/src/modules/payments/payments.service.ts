import { PaymentStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { orderInclude } from "../orders/orders.service.js";
import type { CreatePaymentInput } from "./payments.schemas.js";

const paymentInclude = {
  order: {
    include: orderInclude
  }
};

export function createPayment(orderId: string, input: CreatePaymentInput) {
  return prisma.payment.create({
    data: {
      orderId,
      provider: input.provider,
      providerPaymentId: input.providerPaymentId,
      amount: input.amount,
      currency: input.currency
    },
    include: paymentInclude
  });
}

export function markPaymentAuthorized(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.AUTHORIZED);
}

export function markPaymentPaid(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.PAID);
}

export function markPaymentFailed(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.FAILED);
}

export function refundPayment(paymentId: string) {
  return updatePaymentAndOrder(paymentId, PaymentStatus.REFUNDED);
}

function updatePaymentAndOrder(paymentId: string, status: PaymentStatus) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
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
        id: payment.orderId
      },
      data: {
        paymentStatus: status
      }
    });

    return tx.payment.findUniqueOrThrow({
      where: {
        id: payment.id
      },
      include: paymentInclude
    });
  });
}
