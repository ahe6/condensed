import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import type { AddCartItemInput, CreateCartInput, UpdateCartItemInput } from "./carts.schemas.js";

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: true
        }
      }
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
};

export async function createCart(input: CreateCartInput) {
  const cart = await prisma.cart.create({
    data: {
      userId: input.userId
    },
    include: cartInclude
  });

  return withCartTotals(cart);
}

export async function getCart(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: {
      id: cartId
    },
    include: cartInclude
  });

  return cart ? withCartTotals(cart) : null;
}

export async function addCartItem(cartId: string, input: AddCartItemInput) {
  await prisma.cart.findUniqueOrThrow({
    where: {
      id: cartId
    },
    select: {
      id: true
    }
  });

  await prisma.productVariant.findUniqueOrThrow({
    where: {
      id: input.variantId
    },
    select: {
      id: true
    }
  });

  await prisma.cartItem.upsert({
    where: {
      cartId_variantId: {
        cartId,
        variantId: input.variantId
      }
    },
    create: {
      cartId,
      variantId: input.variantId,
      quantity: input.quantity
    },
    update: {
      quantity: {
        increment: input.quantity
      }
    }
  });

  return getCartOrThrow(cartId);
}

export async function updateCartItemQuantity(
  cartId: string,
  cartItemId: string,
  input: UpdateCartItemInput
) {
  await prisma.cartItem.findFirstOrThrow({
    where: {
      id: cartItemId,
      cartId
    },
    select: {
      id: true
    }
  });

  await prisma.cartItem.update({
    where: {
      id: cartItemId
    },
    data: {
      quantity: input.quantity
    }
  });

  return getCartOrThrow(cartId);
}

export async function removeCartItem(cartId: string, cartItemId: string) {
  await prisma.cartItem.findFirstOrThrow({
    where: {
      id: cartItemId,
      cartId
    },
    select: {
      id: true
    }
  });

  await prisma.cartItem.delete({
    where: {
      id: cartItemId
    }
  });

  return getCartOrThrow(cartId);
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({
    where: {
      cartId
    }
  });

  return getCartOrThrow(cartId);
}

async function getCartOrThrow(cartId: string) {
  const cart = await prisma.cart.findUniqueOrThrow({
    where: {
      id: cartId
    },
    include: cartInclude
  });

  return withCartTotals(cart);
}

function withCartTotals<T extends { items: Array<{ quantity: number; variant: { price: Prisma.Decimal } }> }>(
  cart: T
) {
  const subtotal = cart.items.reduce(
    (total, item) => total.plus(item.variant.price.mul(item.quantity)),
    new Prisma.Decimal(0)
  );

  return {
    ...cart,
    totals: {
      itemCount: cart.items.reduce((total, item) => total + item.quantity, 0),
      subtotal: subtotal.toFixed(2),
      total: subtotal.toFixed(2)
    }
  };
}
