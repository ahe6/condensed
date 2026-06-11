import {
  CheckoutAuthorizationStatus,
  type CheckoutAuthorization,
  type Prisma,
  type PrismaClient
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const checkoutAuthorizationDays = 14;

export function getCheckoutAuthorizationExpiry(now = new Date()) {
  return new Date(now.getTime() + checkoutAuthorizationDays * 24 * 60 * 60 * 1000);
}

export function createCheckoutAuthorization(
  db: DbClient,
  input: {
    assessmentSubmissionId: string;
    productId: string;
    userId: string;
    variantId?: string | null;
  }
) {
  return db.checkoutAuthorization.create({
    data: {
      assessmentSubmissionId: input.assessmentSubmissionId,
      expiresAt: getCheckoutAuthorizationExpiry(),
      productId: input.productId,
      userId: input.userId,
      variantId: input.variantId ?? null
    }
  });
}

export async function findActiveCheckoutAuthorization(
  db: DbClient,
  input: {
    productId: string;
    userId: string;
    variantId?: string | null;
  }
) {
  return db.checkoutAuthorization.findFirst({
    where: getActiveCheckoutAuthorizationWhere(input),
    orderBy: {
      expiresAt: "desc"
    }
  });
}

export async function hasActiveCheckoutAuthorization(
  db: DbClient,
  input: {
    productId: string;
    userId: string;
    variantId?: string | null;
  }
) {
  const authorization = await findActiveCheckoutAuthorization(db, input);

  return Boolean(authorization);
}

export async function markCheckoutAuthorizationUsed(
  db: DbClient,
  authorization: Pick<CheckoutAuthorization, "id">
) {
  return db.checkoutAuthorization.update({
    where: {
      id: authorization.id
    },
    data: {
      status: CheckoutAuthorizationStatus.USED,
      usedAt: new Date()
    }
  });
}

function getActiveCheckoutAuthorizationWhere(input: {
  productId: string;
  userId: string;
  variantId?: string | null;
}) {
  return {
    expiresAt: {
      gt: new Date()
    },
    productId: input.productId,
    status: CheckoutAuthorizationStatus.ACTIVE,
    userId: input.userId,
    OR: [
      {
        variantId: null
      },
      {
        variantId: input.variantId ?? null
      }
    ]
  } satisfies Prisma.CheckoutAuthorizationWhereInput;
}
