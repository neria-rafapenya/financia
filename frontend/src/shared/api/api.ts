import type {
  ApiErrorPayload,
  ApiRequestOptions,
} from "@/domain/interfaces/api.interface";
import { env } from "@/shared/config/env";
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_SESSION_EXPIRED_EVENT,
} from "@/shared/config/auth";
import { getCookie, removeCookie } from "@/shared/utils/cookies";
import { isTokenExpired } from "@/shared/utils/jwt";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorPayload,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class AuthSessionExpiredError extends Error {
  constructor(message = "La sesion ha caducado") {
    super(message);
    this.name = "AuthSessionExpiredError";
  }
}

function resolveBody(body: ApiRequestOptions["body"]) {
  if (
    body === undefined ||
    body === null ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    typeof body === "string"
  ) {
    return body ?? undefined;
  }

  return JSON.stringify(body);
}

function createHeaders(
  headers: HeadersInit | undefined,
  body: ApiRequestOptions["body"],
) {
  const resolvedHeaders = new Headers(headers);

  if (
    !(body instanceof FormData) &&
    body !== undefined &&
    body !== null &&
    !resolvedHeaders.has("Content-Type")
  ) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  return resolvedHeaders;
}

async function request<T>(endpoint: string, options: ApiRequestOptions = {}) {
  const response = await requestRaw(endpoint, options);
  const rawText = await response.text();
  const data = rawText ? (JSON.parse(rawText) as unknown) : null;

  if (!response.ok) {
    const payload = (data ?? undefined) as ApiErrorPayload | undefined;
    throw new ApiError(
      payload?.message ?? "Error de comunicacion con la API",
      response.status,
      payload,
    );
  }

  return data as T;
}

async function requestRaw(endpoint: string, options: ApiRequestOptions = {}) {
  const response = await fetch(`${env.apiBaseUrl}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: createHeaders(options.headers, options.body),
    body: resolveBody(options.body),
  });

  return response;
}

function notifySessionExpired() {
  removeCookie(ACCESS_TOKEN_COOKIE);
  globalThis.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
}

export async function fetchWithoutAuth<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
) {
  return request<T>(endpoint, options);
}

export async function fetchWithAuth<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
) {
  return withAccessToken(options, (requestOptions) =>
    request<T>(endpoint, requestOptions),
  );
}

export async function fetchWithAuthBlob(
  endpoint: string,
  options: ApiRequestOptions = {},
) {
  return withAccessToken(options, async (requestOptions) => {
    const response = await requestRaw(endpoint, requestOptions);

    if (!response.ok) {
      const rawText = await response.text();
      const payload = rawText
        ? (JSON.parse(rawText) as unknown as ApiErrorPayload)
        : undefined;

      throw new ApiError(
        payload?.message ?? "Error de comunicacion con la API",
        response.status,
        payload,
      );
    }

    return response.blob();
  });
}

async function withAccessToken<T>(
  options: ApiRequestOptions,
  requestHandler: (options: ApiRequestOptions) => Promise<T>,
) {
  const accessToken = getCookie(ACCESS_TOKEN_COOKIE);

  if (!accessToken || isTokenExpired(accessToken)) {
    notifySessionExpired();
    throw new AuthSessionExpiredError();
  }

  try {
    return await requestHandler({
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      notifySessionExpired();
      throw new AuthSessionExpiredError();
    }

    throw error;
  }
}
