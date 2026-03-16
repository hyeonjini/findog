import { headers as getRequestHeaders } from "next/headers";
import { cache } from "react";

import { env } from "../env";

const AUTHORIZATION_HEADER = "Authorization";
const COOKIE_HEADER = "cookie";
const DEFAULT_API_BASE_URL = "http://localhost:8001";
const JSON_CONTENT_TYPE = "application/json";

export type ServerApiQueryValue = string | number | boolean | null | undefined;
export type ServerApiRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  json?: unknown;
  query?: Record<string, ServerApiQueryValue>;
};
export type ServerApiResponseOf<TRequest extends (...args: never[]) => Promise<unknown>> = Awaited<
  ReturnType<TRequest>
>;

const hasValue = (value: string | null | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

const ensureTrailingSlash = (value: string) => (value.endsWith("/") ? value : `${value}/`);

const isAbsoluteUrl = (value: string) => /^https?:\/\//.test(value);

const getCookieValue = (cookieHeader: string | null, cookieName: string) => {
  if (!hasValue(cookieHeader)) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name !== cookieName) {
      continue;
    }

    const value = valueParts.join("=");

    if (!hasValue(value)) {
      return undefined;
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return undefined;
};

const toBearerAuthorization = (token: string) =>
  token.startsWith("Bearer ") ? token : `Bearer ${token}`;

const getCookieAuthorization = (cookieHeader: string | null) => {
  const token =
    getCookieValue(cookieHeader, "access_token") ?? getCookieValue(cookieHeader, "accessToken");

  return hasValue(token) ? toBearerAuthorization(token) : undefined;
};

const getRequestAuthorization = cache(async () => {
  try {
    const requestHeaders = await getRequestHeaders();
    const authorization = requestHeaders.get("authorization");

    if (hasValue(authorization)) {
      return authorization;
    }

    return getCookieAuthorization(requestHeaders.get(COOKIE_HEADER));
  } catch {
    return undefined;
  }
});

const parseJsonSafely = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

export class ServerApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ServerApiError";
    this.status = status;
    this.payload = payload;
  }
}

export const getServerApiBaseUrl = () => {
  const baseUrl = env.serverApiBaseUrl ?? env.publicApiBaseUrl ?? env.apiBaseUrl;

  return hasValue(baseUrl) ? baseUrl : DEFAULT_API_BASE_URL;
};

export const buildServerApiUrl = (
  path: string,
  query?: Record<string, ServerApiQueryValue>,
) => {
  const url = isAbsoluteUrl(path)
    ? new URL(path)
    : new URL(path.replace(/^\//, ""), ensureTrailingSlash(getServerApiBaseUrl()));

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
};

export const serverApiFetch = async <TData>(
  path: string,
  init: ServerApiRequestInit = {},
): Promise<TData> => {
  const { json, query, headers: headerInit, ...requestInit } = init;
  const headers = new Headers(headerInit);

  if (!headers.has("Accept")) {
    headers.set("Accept", JSON_CONTENT_TYPE);
  }

  if (json !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", JSON_CONTENT_TYPE);
  }

  if (!headers.has(AUTHORIZATION_HEADER)) {
    const authorization = await getRequestAuthorization();

    if (hasValue(authorization)) {
      headers.set(AUTHORIZATION_HEADER, authorization);
    }
  }

  const response = await fetch(buildServerApiUrl(path, query), {
    ...requestInit,
    headers,
    body: json === undefined ? requestInit.body : JSON.stringify(json),
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    throw new ServerApiError(
      `API request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return payload as TData;
};

export const createServerApiFetcher = <TArgs extends readonly unknown[], TData>(
  getRequest: (...args: TArgs) => {
    path: string;
    init?: ServerApiRequestInit;
  },
) => {
  return cache(async (...args: TArgs) => {
    const { path, init } = getRequest(...args);

    return serverApiFetch<TData>(path, init);
  });
};
