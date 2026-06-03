const authStorageKey = "health.auth";
const codeVerifierKey = "health.auth.codeVerifier";
const stateKey = "health.auth.state";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
  token_type: string;
};

export type AuthSession = {
  accessToken: string;
  expiresAt: number;
  idToken: string;
  refreshToken?: string;
};

export const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, "") ?? "";
export const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
export const cognitoRegion = process.env.NEXT_PUBLIC_COGNITO_REGION ?? inferCognitoRegion(cognitoDomain);

export function isAuthConfigured() {
  return Boolean(cognitoDomain && cognitoClientId);
}

export function getIdToken() {
  return getSession()?.idToken;
}

export function getSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(authStorageKey);

  if (!raw) {
    return null;
  }

  const session = JSON.parse(raw) as AuthSession;

  if (session.expiresAt <= Date.now()) {
    clearSession();
    return null;
  }

  return session;
}

export function clearSession() {
  window.localStorage.removeItem(authStorageKey);
  window.sessionStorage.removeItem(codeVerifierKey);
  window.sessionStorage.removeItem(stateKey);
}

export async function startLogin() {
  ensureConfigured();

  const codeVerifier = randomString(64);
  const state = randomString(32);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  window.sessionStorage.setItem(codeVerifierKey, codeVerifier);
  window.sessionStorage.setItem(stateKey, state);

  const params = new URLSearchParams({
    client_id: cognitoClientId,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state
  });

  window.location.assign(`${cognitoDomain}/oauth2/authorize?${params.toString()}`);
}

export function signOut() {
  ensureConfigured();
  clearSession();

  const params = new URLSearchParams({
    client_id: cognitoClientId,
    logout_uri: getLogoutUri()
  });

  window.location.assign(`${cognitoDomain}/logout?${params.toString()}`);
}

export async function completeLogin(searchParams: URLSearchParams) {
  ensureConfigured();

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = window.sessionStorage.getItem(stateKey);
  const codeVerifier = window.sessionStorage.getItem(codeVerifierKey);

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    throw new Error("Invalid Cognito callback");
  }

  const response = await fetch(`${cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: cognitoClientId,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: getRedirectUri()
    })
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const tokenResponse = (await response.json()) as TokenResponse;
  const session: AuthSession = {
    accessToken: tokenResponse.access_token,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    idToken: tokenResponse.id_token,
    refreshToken: tokenResponse.refresh_token
  };

  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
  window.sessionStorage.removeItem(codeVerifierKey);
  window.sessionStorage.removeItem(stateKey);

  return session;
}

export async function confirmSignUp(username: string, confirmationCode: string) {
  ensureCognitoApiConfigured();

  await callCognito("ConfirmSignUp", {
    ClientId: cognitoClientId,
    ConfirmationCode: confirmationCode,
    Username: username
  });
}

export async function resendSignUpConfirmation(username: string) {
  ensureCognitoApiConfigured();

  await callCognito("ResendConfirmationCode", {
    ClientId: cognitoClientId,
    Username: username
  });
}

function getRedirectUri() {
  return `${window.location.origin}/auth/callback`;
}

function getLogoutUri() {
  return window.location.origin;
}

function ensureConfigured() {
  if (!isAuthConfigured()) {
    throw new Error("Cognito frontend auth is not configured");
  }
}

function ensureCognitoApiConfigured() {
  if (!cognitoClientId || !cognitoRegion) {
    throw new Error("Cognito confirmation is not configured");
  }
}

async function callCognito(target: "ConfirmSignUp" | "ResendConfirmationCode", body: Record<string, string>) {
  const response = await fetch(`https://cognito-idp.${cognitoRegion}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": `AWSCognitoIdentityProviderService.${target}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(await getCognitoErrorMessage(response));
  }
}

async function getCognitoErrorMessage(response: Response) {
  const text = await response.text();

  if (!text) {
    return `Cognito request failed with ${response.status}`;
  }

  try {
    const payload = JSON.parse(text) as { message?: string; __type?: string };
    return payload.message ?? payload.__type ?? text;
  } catch {
    return text;
  }
}

function inferCognitoRegion(domain: string) {
  return domain.match(/\.auth\.([a-z0-9-]+)\.amazoncognito\.com$/)?.[1] ?? "";
}

function randomString(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

async function createCodeChallenge(codeVerifier: string) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
