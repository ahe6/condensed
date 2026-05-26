export type User = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiStatus = "checking" | "online" | "offline";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:3000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getReadiness() {
  return request<{ ok: boolean }>("/ready");
}

export async function listUsers() {
  return request<User[]>("/users");
}

export async function createUser(input: { email: string; name?: string }) {
  return request<User>("/users", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

