const isBrowser = typeof window !== "undefined";

const hasValue = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

const defaultApiBaseUrl = "http://localhost:8001";

function getApiBaseUrl() {
  const browserUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const serverUrl = process.env.API_BASE_URL;

  if (isBrowser) {
    return hasValue(browserUrl) ? browserUrl : defaultApiBaseUrl;
  }

  return hasValue(serverUrl) ? serverUrl : hasValue(browserUrl) ? browserUrl : defaultApiBaseUrl;
}

export const env = {
  isBrowser,
  isServer: !isBrowser,
  apiBaseUrl: getApiBaseUrl(),
  publicApiBaseUrl: hasValue(process.env.NEXT_PUBLIC_API_BASE_URL)
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : undefined,
  serverApiBaseUrl: hasValue(process.env.API_BASE_URL) ? process.env.API_BASE_URL : undefined,
};
