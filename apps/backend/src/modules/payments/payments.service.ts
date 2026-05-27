import { PaymentStatus, Prisma } from "@prisma/client";
import Stripe from "stripe";
import { config } from "../../config.js";
import { prisma } from "../../prisma.js";
import { orderInclude } from "../orders/orders.service.js";
import type { CreatePaymentInput } from "./payments.schemas.js";

const paymentInclude = {
  order: {
    include: orderInclude
  }
};

let stripe: Stripe | null = null;

export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

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

export async function createStripePaymentIntent(orderId: string) {
  const stripeClient = getStripe();
  const order = await prisma.order.findUniqueOrThrow({
    where: {
      id: orderId
    },
    include: {
      payments: true
    }
  });

  const existingPayment = order.payments.find(
    (payment) => payment.provider === "stripe" && payment.providerPaymentId && payment.status === PaymentStatus.UNPAID
  );

  if (existingPayment?.providerPaymentId) {
    const paymentIntent = await stripeClient.paymentIntents.retrieve(existingPayment.providerPaymentId);

    if (!paymentIntent.client_secret) {
      throw new PaymentError("Stripe payment intent has no client secret", 502);
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      payment: await prisma.payment.findUniqueOrThrow({
        where: {
          id: existingPayment.id
        },
        include: paymentInclude
      })
    };
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: decimalToMinorUnits(order.total, order.currency),
    currency: order.currency.toLowerCase(),
    receipt_email: order.email,
    automatic_payment_methods: {
      enabled: true
    },
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber
    }
  });

  if (!paymentIntent.client_secret) {
    throw new PaymentError("Stripe payment intent has no client secret", 502);
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "stripe",
      providerPaymentId: paymentIntent.id,
      status: PaymentStatus.UNPAID,
      amount: order.total,
      currency: order.currency,
      metadata: {
        stripeStatus: paymentIntent.status
      }
    },
    include: paymentInclude
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
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
    case "payment_intent.succeeded":
      await updateStripePayment(event.data.object, PaymentStatus.PAID);
      break;
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      await updateStripePayment(event.data.object, PaymentStatus.FAILED);
      break;
    case "payment_intent.amount_capturable_updated":
      await updateStripePayment(event.data.object, PaymentStatus.AUTHORIZED);
      break;
  }

  return {
    received: true
  };
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

async function updateStripePayment(paymentIntent: Stripe.PaymentIntent, status: PaymentStatus) {
  const payment = await prisma.payment.findUnique({
    where: {
      provider_providerPaymentId: {
        provider: "stripe",
        providerPaymentId: paymentIntent.id
      }
    }
  });

  if (!payment) {
    return;
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: {
        id: payment.id
      },
      data: {
        status,
        processedAt: new Date(),
        metadata: {
          stripeStatus: paymentIntent.status,
          lastStripeEventAt: new Date().toISOString()
        }
      }
    }),
    prisma.order.update({
      where: {
        id: payment.orderId
      },
      data: {
        paymentStatus: status
      }
    })
  ]);
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
