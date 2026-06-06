import { Prisma, ProductPurchaseMode, ProductStatus } from "@prisma/client";
import { prisma } from "../../prisma.js";
import type {
  AddCartItemInput,
  CreateCartInput,
  GetMyCartInput,
  UpdateCartItemInput
} from "./carts.schemas.js";

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
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{
  include: typeof cartInclude;
}>;

type CartWithTotals = CartWithItems & {
  totals: {
    itemCount: number;
    subtotal: string;
    total: string;
  };
};

export class CartError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

export async function createCart(
  _input: CreateCartInput,
  actorUserId?: string
): Promise<CartWithTotals> {
  const cart = await prisma.cart.create({
    data: {
      userId: actorUserId ?? null
    },
    include: cartInclude
  });

  return withCartTotals(cart);
}

export async function getOrCreateUserCart(
  userId: string,
  input: GetMyCartInput = {}
): Promise<CartWithTotals> {
  if (input.cartId) {
    return adoptCartForUser(userId, input.cartId);
  }

  const existingCart = await prisma.cart.findFirst({
    where: {
      userId
    },
    include: cartInclude,
    orderBy: {
      updatedAt: "desc"
    }
  });

  if (existingCart) {
    return withCartTotals(existingCart);
  }

  return createCart({}, userId);
}

export async function getCart(
  cartId: string,
  actorUserId?: string
): Promise<CartWithTotals | null> {
  const cart = await prisma.cart.findUnique({
    where: {
      id: cartId
    },
    include: cartInclude
  });

  if (!cart) {
    return null;
  }

  assertCartAccess(cart, actorUserId);

  return withCartTotals(cart);
}

export async function addCartItem(
  cartId: string,
  input: AddCartItemInput,
  actorUserId?: string
): Promise<CartWithTotals> {
  await getCartOrThrow(cartId, actorUserId);

  const variant = await prisma.productVariant.findUniqueOrThrow({
    where: {
      id: input.variantId
    },
    select: {
      id: true,
      inventoryQuantity: true,
      product: {
        select: {
          slug: true,
          purchaseMode: true,
          status: true
        }
      },
      sku: true
    }
  });
  const existingItem = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId,
        variantId: input.variantId
      }
    },
    select: {
      quantity: true
    }
  });

  assertVariantCanBeInCart(variant, (existingItem?.quantity ?? 0) + input.quantity);

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

  return getCartOrThrow(cartId, actorUserId);
}

export async function updateCartItemQuantity(
  cartId: string,
  cartItemId: string,
  input: UpdateCartItemInput,
  actorUserId?: string
): Promise<CartWithTotals> {
  await getCartOrThrow(cartId, actorUserId);

  const cartItem = await prisma.cartItem.findFirstOrThrow({
    where: {
      id: cartItemId,
      cartId
    },
    select: {
      id: true,
      variant: {
        select: {
          inventoryQuantity: true,
          product: {
            select: {
              slug: true,
              purchaseMode: true,
              status: true
            }
          },
          sku: true
        }
      }
    }
  });
  assertVariantCanBeInCart(cartItem.variant, input.quantity);

  await prisma.cartItem.update({
    where: {
      id: cartItemId
    },
    data: {
      quantity: input.quantity
    }
  });

  return getCartOrThrow(cartId, actorUserId);
}

export async function removeCartItem(
  cartId: string,
  cartItemId: string,
  actorUserId?: string
): Promise<CartWithTotals> {
  await getCartOrThrow(cartId, actorUserId);

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

  return getCartOrThrow(cartId, actorUserId);
}

export async function clearCart(cartId: string, actorUserId?: string): Promise<CartWithTotals> {
  await getCartOrThrow(cartId, actorUserId);

  await prisma.cartItem.deleteMany({
    where: {
      cartId
    }
  });

  return getCartOrThrow(cartId, actorUserId);
}

async function adoptCartForUser(userId: string, cartId: string): Promise<CartWithTotals> {
  const sourceCart = await prisma.cart.findUnique({
    where: {
      id: cartId
    },
    include: {
      items: true
    }
  });

  if (!sourceCart) {
    return getOrCreateUserCart(userId);
  }

  assertCartAccess(sourceCart, userId);

  const existingCart = await prisma.cart.findFirst({
    where: {
      userId,
      id: {
        not: sourceCart.id
      }
    },
    include: cartInclude,
    orderBy: {
      updatedAt: "desc"
    }
  });
  const sourceVariantsById = await getCartItemVariantsById(sourceCart.items.map((item) => item.variantId));

  if (!existingCart) {
    for (const item of sourceCart.items) {
      assertVariantCanBeInCart(getCartItemVariant(sourceVariantsById, item.variantId), item.quantity);
    }

    const adoptedCart = await prisma.cart.update({
      where: {
        id: sourceCart.id
      },
      data: {
        userId
      },
      include: cartInclude
    });

    return withCartTotals(adoptedCart);
  }

  if (sourceCart.items.length > 0) {
    const existingItemsByVariantId = new Map(
      existingCart.items.map((item) => [item.variantId, item.quantity])
    );

    for (const item of sourceCart.items) {
      assertVariantCanBeInCart(
        getCartItemVariant(sourceVariantsById, item.variantId),
        (existingItemsByVariantId.get(item.variantId) ?? 0) + item.quantity
      );
    }

    await prisma.$transaction(
      sourceCart.items.map((item) =>
        prisma.cartItem.upsert({
          where: {
            cartId_variantId: {
              cartId: existingCart.id,
              variantId: item.variantId
            }
          },
          create: {
            cartId: existingCart.id,
            variantId: item.variantId,
            quantity: item.quantity
          },
          update: {
            quantity: {
              increment: item.quantity
            }
          }
        })
      )
    );
  }

  await prisma.cart.delete({
    where: {
      id: sourceCart.id
    }
  });

  return getCartOrThrow(existingCart.id, userId);
}

async function getCartOrThrow(cartId: string, actorUserId?: string): Promise<CartWithTotals> {
  const cart = await prisma.cart.findUniqueOrThrow({
    where: {
      id: cartId
    },
    include: cartInclude
  });

  assertCartAccess(cart, actorUserId);

  return withCartTotals(cart);
}

function assertCartAccess(cart: { userId: string | null }, actorUserId?: string) {
  if (cart.userId && cart.userId !== actorUserId) {
    throw new CartError("Cart access denied", 403);
  }
}

async function getCartItemVariantsById(variantIds: string[]) {
  const variants = await prisma.productVariant.findMany({
    where: {
      id: {
        in: variantIds
      }
    },
    select: {
      id: true,
      inventoryQuantity: true,
      product: {
        select: {
          slug: true,
          purchaseMode: true,
          status: true
        }
      },
      sku: true
    }
  });

  return new Map(variants.map((variant) => [variant.id, variant]));
}

function getCartItemVariant(
  variantsById: Awaited<ReturnType<typeof getCartItemVariantsById>>,
  variantId: string
) {
  const variant = variantsById.get(variantId);

  if (!variant) {
    throw new CartError("Cart contains an invalid variant");
  }

  return variant;
}

function assertVariantCanBeInCart(
  variant: {
    inventoryQuantity: number;
    product: {
      slug: string;
      purchaseMode: ProductPurchaseMode;
      status: ProductStatus;
    };
    sku: string;
  },
  requestedQuantity: number
) {
  if (variant.product.status !== ProductStatus.ACTIVE) {
    throw new CartError(`Product is not active: ${variant.product.slug}`);
  }

  if (variant.product.purchaseMode !== ProductPurchaseMode.DIRECT) {
    throw new CartError(`Product requires assessment before checkout: ${variant.product.slug}`);
  }

  if (requestedQuantity > variant.inventoryQuantity) {
    throw new CartError(`Only ${variant.inventoryQuantity} in stock for SKU ${variant.sku}`);
  }
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
