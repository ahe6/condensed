#!/usr/bin/env node
import { createPrismaClient } from "./database-url.mjs";

function getEmail() {
  const emailFlagIndex = process.argv.indexOf("--email");
  const email = emailFlagIndex >= 0 ? process.argv[emailFlagIndex + 1] : process.env.RESET_EMAIL;

  if (!email) {
    throw new Error("Set RESET_EMAIL or pass --email user@example.com.");
  }

  return email.trim().toLowerCase();
}

const email = getEmail();
const prisma = await createPrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    select: {
      id: true,
      email: true,
      externalAuthId: true
    }
  });

  if (!user) {
    console.log(`No app user found for ${email}`);
    process.exit(0);
  }

  if (!user.externalAuthId) {
    console.log(`App user ${email} is already unlinked from Cognito`);
    process.exit(0);
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      externalAuthId: null
    }
  });

  console.log(`Cleared Cognito link for app user ${email}`);
} finally {
  await prisma.$disconnect();
}
