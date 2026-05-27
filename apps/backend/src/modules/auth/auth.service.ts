import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../../config.js";
import { prisma } from "../../prisma.js";
import { orderInclude } from "../orders/orders.service.js";

type CognitoClaims = {
  "cognito:groups"?: string[];
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  token_use?: string;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 401
  ) {
    super(message);
  }
}

export async function getOptionalCurrentUser(authorization: string | undefined) {
  if (!authorization) {
    return null;
  }

  return getCurrentUser(authorization);
}

export async function getCurrentUser(authorization: string | undefined) {
  const claims = await verifyCognitoToken(authorization);
  const externalAuthId = requireClaim(claims.sub, "Missing Cognito subject");
  const email = requireClaim(claims.email, "Missing Cognito email").toLowerCase();
  const name = getDisplayName(claims);

  const existingByExternalAuthId = await prisma.user.findUnique({
    where: {
      externalAuthId
    }
  });

  if (existingByExternalAuthId) {
    return prisma.user.update({
      where: {
        id: existingByExternalAuthId.id
      },
      data: {
        email,
        name
      }
    });
  }

  const existingByEmail = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existingByEmail) {
    if (existingByEmail.externalAuthId && existingByEmail.externalAuthId !== externalAuthId) {
      throw new AuthError("Email is already linked to another identity", 409);
    }

    return prisma.user.update({
      where: {
        id: existingByEmail.id
      },
      data: {
        externalAuthId,
        name
      }
    });
  }

  return prisma.user.create({
    data: {
      externalAuthId,
      email,
      name
    }
  });
}

export async function listCurrentUserOrders(authorization: string | undefined) {
  const user = await getCurrentUser(authorization);

  return prisma.order.findMany({
    where: {
      userId: user.id
    },
    include: orderInclude,
    orderBy: {
      createdAt: "desc"
    }
  });
}

export async function requireAdmin(authorization: string | undefined) {
  const claims = await verifyCognitoToken(authorization);
  const groups = claims["cognito:groups"] ?? [];

  if (!groups.includes("admin")) {
    throw new AuthError("Admin access required", 403);
  }
}

async function verifyCognitoToken(authorization: string | undefined): Promise<CognitoClaims> {
  if (!config.COGNITO_ISSUER || !config.COGNITO_CLIENT_ID) {
    throw new AuthError("Cognito auth is not configured", 503);
  }

  const token = parseBearerToken(authorization);

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${config.COGNITO_ISSUER}/.well-known/jwks.json`));
  }

  const result = await jwtVerify(token, jwks, {
    issuer: config.COGNITO_ISSUER,
    audience: config.COGNITO_CLIENT_ID
  }).catch(() => {
    throw new AuthError("Invalid auth token");
  });

  const claims = result.payload as CognitoClaims;

  if (claims.token_use !== "id") {
    throw new AuthError("Use a Cognito ID token for app identity");
  }

  return claims;
}

function parseBearerToken(authorization: string | undefined) {
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new AuthError("Missing bearer token");
  }

  return token;
}

function requireClaim(value: string | undefined, message: string) {
  if (!value) {
    throw new AuthError(message);
  }

  return value;
}

function getDisplayName(claims: CognitoClaims) {
  if (claims.name) {
    return claims.name;
  }

  return [claims.given_name, claims.family_name].filter(Boolean).join(" ") || undefined;
}
