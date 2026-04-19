export interface JwtPayload {
  sub?: string | number;
  email?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );
  return globalThis.atob(padded);
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");

    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 5) {
  const payload = parseJwt(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export function getTokenRemainingMs(token: string) {
  const payload = parseJwt(token);

  if (!payload?.exp) {
    return 0;
  }

  return Math.max(payload.exp * 1000 - Date.now(), 0);
}
