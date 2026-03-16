import { create } from "zustand";

const AUTH_STORAGE_KEY = "findog-auth";
const ACCESS_TOKEN_STORAGE_KEY = "access_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "accessToken";
const LEGACY_REFRESH_TOKEN_STORAGE_KEY = "refreshToken";

const ACCESS_TOKEN_COOKIE_MAX_AGE = 1800;

const isBrowser = () => typeof window !== "undefined";

const syncAccessTokenCookie = (accessToken: string | null) => {
  if (typeof document === "undefined") {
    return;
  }

  if (accessToken) {
    document.cookie = `${ACCESS_TOKEN_STORAGE_KEY}=${encodeURIComponent(accessToken)}; path=/; max-age=${ACCESS_TOKEN_COOKIE_MAX_AGE}; SameSite=Lax`;
  } else {
    document.cookie = `${ACCESS_TOKEN_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  }
};

const syncBrowserTokenStorage = (
  accessToken: string | null,
  refreshToken: string | null,
) => {
  if (!isBrowser()) {
    return;
  }

  syncAccessTokenCookie(accessToken);

  if (accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }

  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY);
};

interface PersistedAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

const readPersistedState = (): PersistedAuthState => {
  if (!isBrowser()) {
    return { accessToken: null, refreshToken: null, user: null };
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { accessToken: null, refreshToken: null, user: null };
    }

    const parsed = JSON.parse(raw) as { state?: PersistedAuthState };
    return {
      accessToken: parsed?.state?.accessToken ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null,
      user: parsed?.state?.user ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
};

const writePersistedState = (state: PersistedAuthState) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ state, version: 0 }),
  );
};

export interface AuthUser {
  [key: string]: unknown;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  setTokens: (accessToken, refreshToken) => {
    syncBrowserTokenStorage(accessToken, refreshToken);
    const newState = { accessToken, refreshToken };
    writePersistedState({ ...newState, user: useAuthStore.getState().user });
    set({
      ...newState,
      isAuthenticated: Boolean(accessToken),
    });
  },

  setUser: (user) => {
    set({ user });
    const { accessToken, refreshToken } = useAuthStore.getState();
    writePersistedState({ accessToken, refreshToken, user });
  },

  clearAuth: () => {
    syncBrowserTokenStorage(null, null);
    writePersistedState({ accessToken: null, refreshToken: null, user: null });
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      isHydrated: false,
    });
  },

  hydrate: async () => {
    const persisted = readPersistedState();
    syncBrowserTokenStorage(persisted.accessToken, persisted.refreshToken);
    set({
      accessToken: persisted.accessToken,
      refreshToken: persisted.refreshToken,
      user: persisted.user,
      isAuthenticated: Boolean(persisted.accessToken),
      isHydrated: true,
    });
  },
}));
