import { prisma } from "../../prisma.js";
import type { CreateUserInput } from "./users.schemas.js";

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
