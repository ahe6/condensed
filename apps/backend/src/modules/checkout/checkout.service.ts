import { randomInt } from "node:crypto";
import { AddressType, OrderStatus, Prisma, ProductPurchaseMode, ProductStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
import {
  findActiveCheckoutAuthorization,
  markCheckoutAuthorizationUsed
} from "../checkout-authorizations/checkout-authorizations.service.js";
import { getOrderReservationExpiresAt } from "../orders/orders.service.js";
import type { CheckoutCartInput } from "./checkout.schemas.js";

const orderInclude = {
  addresses: true,
  items: true,
  payments: true,
  shipments: true
};

export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export async function checkoutCart(input: CheckoutCartInput, options: { userId?: string } = {}) {
  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUniqueOrThrow({
      where: {
        id: input.cartId
      },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (cart.items.length === 0) {
      throw new CheckoutError("Cart is empty");
    }

    if (cart.userId && cart.userId !== options.userId) {
      throw new CheckoutError("Cart access denied", 403);
    }

    const currency = cart.items[0]?.variant.currency ?? "USD";
    const checkoutAuthorizationsToUse: Array<{ id: string }> = [];
    let subtotal = new Prisma.Decimal(0);

    for (const item of cart.items) {
      if (item.variant.currency !== currency) {
        throw new CheckoutError("Cart contains multiple currencies");
      }

      if (item.variant.product.status !== ProductStatus.ACTIVE) {
        throw new CheckoutError(`Product is not active: ${item.variant.product.slug}`);
      }

      if (item.variant.product.purchaseMode !== ProductPurchaseMode.DIRECT) {
        if (!options.userId) {
          throw new CheckoutError(
            `Product requires sign-in and assessment approval: ${item.variant.product.slug}`
          );
        }

        const authorization = await findActiveCheckoutAuthorization(tx, {
          productId: item.variant.productId,
          userId: options.userId,
          variantId: item.variantId
        });

        if (!authorization) {
          throw new CheckoutError(
            `Product requires assessment approval before checkout: ${item.variant.product.slug}`
          );
        }

        checkoutAuthorizationsToUse.push(authorization);
      }

      if (item.variant.inventoryQuantity < item.quantity) {
        throw new CheckoutError(`Insufficient inventory for SKU ${item.variant.sku}`);
      }

      subtotal = subtotal.plus(item.variant.price.mul(item.quantity));
    }

    for (const item of cart.items) {
      const updateResult = await tx.productVariant.updateMany({
        where: {
          id: item.variantId,
          inventoryQuantity: {
            gte: item.quantity
          }
        },
        data: {
          inventoryQuantity: {
            decrement: item.quantity
          }
        }
      });

      if (updateResult.count !== 1) {
        throw new CheckoutError(`Insufficient inventory for SKU ${item.variant.sku}`);
      }
    }

    const order = await tx.order.create({
      data: {
        userId: options.userId ?? cart.userId,
        orderNumber: generateOrderNumber(),
        email: input.email,
        status: OrderStatus.PLACED,
        reservationExpiresAt: getOrderReservationExpiresAt(),
        currency,
        subtotal,
        total: subtotal,
        placedAt: new Date(),
        addresses: {
          create: [
            {
              type: AddressType.SHIPPING,
              ...input.shippingAddress
            },
            {
              type: AddressType.BILLING,
              ...input.billingAddress
            }
          ]
        },
        items: {
          create: cart.items.map((item) => ({
            productId: item.variant.productId,
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantTitle: item.variant.title,
            sku: item.variant.sku,
            unitPrice: item.variant.price,
            quantity: item.quantity,
            total: item.variant.price.mul(item.quantity)
          }))
        }
      },
      include: orderInclude
    });

    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id
      }
    });

    for (const authorization of dedupeCheckoutAuthorizations(checkoutAuthorizationsToUse)) {
      await markCheckoutAuthorizationUsed(tx, authorization);
    }

    return order;
  });
}

function dedupeCheckoutAuthorizations(authorizations: Array<{ id: string }>) {
  return Array.from(
    new Map(authorizations.map((authorization) => [authorization.id, authorization])).values()
  );
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomInt(1000, 10000).toString();

  return `HEALTH-${timestamp}-${suffix}`;
}
