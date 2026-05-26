import { randomInt } from "node:crypto";
import { AddressType, OrderStatus, Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
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

export async function checkoutCart(input: CheckoutCartInput) {
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

    const currency = cart.items[0]?.variant.currency ?? "USD";
    const subtotal = cart.items.reduce((total, item) => {
      if (item.variant.currency !== currency) {
        throw new CheckoutError("Cart contains multiple currencies");
      }

      if (item.variant.product.status !== ProductStatus.ACTIVE) {
        throw new CheckoutError(`Product is not active: ${item.variant.product.slug}`);
      }

      if (item.variant.inventoryQuantity < item.quantity) {
        throw new CheckoutError(`Insufficient inventory for SKU ${item.variant.sku}`);
      }

      return total.plus(item.variant.price.mul(item.quantity));
    }, new Prisma.Decimal(0));

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
        userId: cart.userId,
        orderNumber: generateOrderNumber(),
        email: input.email,
        status: OrderStatus.PLACED,
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

    return order;
  });
}

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const suffix = randomInt(1000, 10000).toString();

  return `TELE-${timestamp}-${suffix}`;
}
