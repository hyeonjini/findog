import type { MutationFunction, QueryFunction, QueryKey } from "@tanstack/react-query";

import { axiosInstance } from "../../../../api-client/src/mutator/axios-instance";

import { env } from "../env";

const DEFAULT_API_BASE_URL = "http://localhost:8001";

type ApiClientConfig = Parameters<typeof axiosInstance>[0];

export type BrowserApiRequestConfig = ApiClientConfig;
export type BrowserApiRequestOverrides = Partial<Omit<ApiClientConfig, "baseURL">>;
export type ApiResponseOf<TRequest extends (...args: never[]) => Promise<unknown>> = Awaited<
  ReturnType<TRequest>
>;

const hasValue = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

const mergeHeaders = (
  baseHeaders: BrowserApiRequestConfig["headers"],
  overrideHeaders: BrowserApiRequestOverrides["headers"],
) => {
  if (!baseHeaders) {
    return overrideHeaders;
  }

  if (!overrideHeaders) {
    return baseHeaders;
  }

  return {
    ...(baseHeaders as Record<string, string>),
    ...(overrideHeaders as Record<string, string>),
  };
};

export const getBrowserApiBaseUrl = () => {
  const baseUrl = env.publicApiBaseUrl ?? env.apiBaseUrl;

  return hasValue(baseUrl) ? baseUrl : DEFAULT_API_BASE_URL;
};

export const browserApiRequest = <TData>(
  config: BrowserApiRequestConfig,
  overrides?: BrowserApiRequestOverrides,
) => {
  return axiosInstance<TData>({
    baseURL: getBrowserApiBaseUrl(),
    ...config,
    ...overrides,
    headers: mergeHeaders(config.headers, overrides?.headers),
  });
};

export const createBrowserQueryFn = <TData>(
  config: BrowserApiRequestConfig,
  overrides?: BrowserApiRequestOverrides,
): QueryFunction<TData, QueryKey> => {
  return ({ signal }) =>
    browserApiRequest<TData>(
      {
        ...config,
        signal,
      },
      overrides,
    );
};

export const createBrowserMutationFn = <TData, TVariables>(
  getConfig: (variables: TVariables) => BrowserApiRequestConfig,
  overrides?: BrowserApiRequestOverrides,
): MutationFunction<TData, TVariables> => {
  return (variables) => browserApiRequest<TData>(getConfig(variables), overrides);
};
