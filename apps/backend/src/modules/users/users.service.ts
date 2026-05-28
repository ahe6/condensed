import { prisma } from "../../prisma.js";
import type {
  CreateAddressInput,
  CreateUserInput,
  UpdateAddressInput,
  UpdateCurrentUserInput
} from "./users.schemas.js";

export function listUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
}

export function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: input
  });
}

export function updateUserProfile(userId: string, input: UpdateCurrentUserInput) {
  return prisma.user.update({
    where: {
      id: userId
    },
    data: input
  });
}

export function listUserAddresses(userId: string) {
  return prisma.address.findMany({
    where: {
      userId
    },
    orderBy: [
      {
        isDefaultShipping: "desc"
      },
      {
        isDefaultBilling: "desc"
      },
      {
        createdAt: "desc"
      }
    ]
  });
}

export async function createUserAddress(userId: string, input: CreateAddressInput) {
  return prisma.$transaction(async (tx) => {
    const addressCount = await tx.address.count({
      where: {
        userId
      }
    });
    const isDefaultShipping = input.isDefaultShipping ?? addressCount === 0;
    const isDefaultBilling = input.isDefaultBilling ?? addressCount === 0;

    if (isDefaultShipping) {
      await tx.address.updateMany({
        where: {
          userId,
          isDefaultShipping: true
        },
        data: {
          isDefaultShipping: false
        }
      });
    }

    if (isDefaultBilling) {
      await tx.address.updateMany({
        where: {
          userId,
          isDefaultBilling: true
        },
        data: {
          isDefaultBilling: false
        }
      });
    }

    return tx.address.create({
      data: {
        ...input,
        userId,
        isDefaultShipping,
        isDefaultBilling
      }
    });
  });
}

export async function updateUserAddress(userId: string, addressId: string, input: UpdateAddressInput) {
  return prisma.$transaction(async (tx) => {
    await tx.address.findFirstOrThrow({
      where: {
        id: addressId,
        userId
      },
      select: {
        id: true
      }
    });

    if (input.isDefaultShipping) {
      await tx.address.updateMany({
        where: {
          userId,
          id: {
            not: addressId
          },
          isDefaultShipping: true
        },
        data: {
          isDefaultShipping: false
        }
      });
    }

    if (input.isDefaultBilling) {
      await tx.address.updateMany({
        where: {
          userId,
          id: {
            not: addressId
          },
          isDefaultBilling: true
        },
        data: {
          isDefaultBilling: false
        }
      });
    }

    return tx.address.update({
      where: {
        id: addressId
      },
      data: input
    });
  });
}

export async function deleteUserAddress(userId: string, addressId: string) {
  await prisma.address.findFirstOrThrow({
    where: {
      id: addressId,
      userId
    },
    select: {
      id: true
    }
  });

  await prisma.address.delete({
    where: {
      id: addressId
    }
  });

  return {
    ok: true
  };
}
