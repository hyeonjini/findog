import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const AUTH_STORAGE_KEY = "findog-auth";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const ACCESS_TOKEN_STATE_KEY = "accessToken";
const REFRESH_TOKEN_STATE_KEY = "refreshToken";

const ACCESS_TOKEN_FALLBACK_KEYS = [ACCESS_TOKEN_KEY, ACCESS_TOKEN_STATE_KEY] as const;
const REFRESH_TOKEN_FALLBACK_KEYS = [REFRESH_TOKEN_KEY, REFRESH_TOKEN_STATE_KEY] as const;

type RetryableAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
};

type PersistedAuthStorage = {
  state?: {
    accessToken?: string | null;
    refreshToken?: string | null;
    user?: unknown;
  };
  version?: number;
};

const getBaseURL = () => {
  const browserBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const serverBaseUrl = process.env.API_BASE_URL;

  if (typeof window !== "undefined") {
    return browserBaseUrl;
  }

  return serverBaseUrl ?? browserBaseUrl;
};

const AXIOS_INSTANCE = axios.create({
  baseURL: getBaseURL(),
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (accessToken: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processRefreshQueue = (error: unknown, accessToken?: string) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (accessToken) {
      resolve(accessToken);
      return;
    }

    reject(error);
  });

  refreshQueue = [];
};

const normalizeStorageToken = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  return value.replace(/^"|"$/g, "");
};

const getPersistedAuthStorage = (): PersistedAuthStorage | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedAuthStorage;
  } catch {
    return null;
  }
};

const setPersistedAuthTokens = (tokens: RefreshResponse) => {
  if (typeof window === "undefined") {
    return;
  }

  const current = getPersistedAuthStorage();
  const next: PersistedAuthStorage = {
    version: current?.version ?? 0,
    state: {
      ...current?.state,
      [ACCESS_TOKEN_STATE_KEY]: tokens.access_token,
      [REFRESH_TOKEN_STATE_KEY]: tokens.refresh_token,
    },
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
};

const clearPersistedAuthTokens = () => {
  if (typeof window === "undefined") {
    return;
  }

  const current = getPersistedAuthStorage();
  if (!current?.state) {
    return;
  }

  const next: PersistedAuthStorage = {
    version: current.version ?? 0,
    state: {
      ...current.state,
      [ACCESS_TOKEN_STATE_KEY]: null,
      [REFRESH_TOKEN_STATE_KEY]: null,
    },
  };

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
};

const clearTokens = () => {
  if (typeof window === "undefined") {
    return;
  }

  clearPersistedAuthTokens();
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_STATE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STATE_KEY);
  delete AXIOS_INSTANCE.defaults.headers.common.Authorization;
};

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.href = "/login";
};

const getDirectStorageToken = (keys: readonly string[]) => {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of keys) {
    const token = normalizeStorageToken(window.localStorage.getItem(key));
    if (token) {
      return token;
    }
  }

  return null;
};

const getPersistedStorageToken = (
  key: typeof ACCESS_TOKEN_STATE_KEY | typeof REFRESH_TOKEN_STATE_KEY,
) => {
  const persisted = getPersistedAuthStorage();
  if (!persisted?.state) {
    return null;
  }

  return normalizeStorageToken(persisted.state[key] ?? null);
};

const getStorageToken = (
  persistedKey: typeof ACCESS_TOKEN_STATE_KEY | typeof REFRESH_TOKEN_STATE_KEY,
  fallbackKeys: readonly string[],
) => {
  return getPersistedStorageToken(persistedKey) ?? getDirectStorageToken(fallbackKeys);
};

const setTokens = (tokens: RefreshResponse) => {
  if (typeof window !== "undefined") {
    setPersistedAuthTokens(tokens);
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    window.localStorage.removeItem(ACCESS_TOKEN_STATE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STATE_KEY);
  }

  AXIOS_INSTANCE.defaults.headers.common.Authorization = `Bearer ${tokens.access_token}`;
};

const refreshAccessToken = async () => {
  const refreshToken = getStorageToken(
    REFRESH_TOKEN_STATE_KEY,
    REFRESH_TOKEN_FALLBACK_KEYS,
  );
  if (!refreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await AXIOS_INSTANCE.post<RefreshResponse>("/api/auth/refresh", {
    refresh_token: refreshToken,
  });

  setTokens(response.data);
  return response.data.access_token;
};

AXIOS_INSTANCE.interceptors.request.use((config) => {
  const accessToken = getStorageToken(
    ACCESS_TOKEN_STATE_KEY,
    ACCESS_TOKEN_FALLBACK_KEYS,
  );

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";

    if (requestUrl.includes("/api/auth/refresh")) {
      clearTokens();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        refreshQueue.push({
          resolve: (accessToken) => {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            AXIOS_INSTANCE.request(originalRequest).then(resolve).catch(reject);
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const accessToken = await refreshAccessToken();
      processRefreshQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return AXIOS_INSTANCE.request(originalRequest);
    } catch (refreshError) {
      clearTokens();
      redirectToLogin();
      processRefreshQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export const axiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return AXIOS_INSTANCE(config).then(({ data }) => data);
};
