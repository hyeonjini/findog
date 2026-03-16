import { useAuthStore } from "./auth.store";

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const beforeEach: (fn: () => void | Promise<void>) => void;
declare const afterEach: (fn: () => void | Promise<void>) => void;
declare const expect: (value: unknown) => {
  toBe: (expected: unknown) => void;
  toEqual: (expected: unknown) => void;
  toBeNull: () => void;
  not: {
    toBeNull: () => void;
  };
};

const STORAGE_KEY = "findog-auth";

if (typeof globalThis.localStorage === "undefined") {
  let store: Record<string, string> = {};

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => (key in store ? store[key] : null),
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    } as Storage,
  });
}

const resetStore = () => {
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    isHydrated: false,
  });
};

beforeEach(() => {
  resetStore();
  localStorage.clear();
});

afterEach(() => {
  resetStore();
  localStorage.clear();
});

describe("useAuthStore", () => {
  it("initializes with unauthenticated default state", () => {
    const state = useAuthStore.getState();

    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isHydrated).toBe(false);
  });

  it("sets tokens and marks authenticated", () => {
    const state = useAuthStore.getState();

    state.setTokens("access-token", "refresh-token");

    const nextState = useAuthStore.getState();
    expect(nextState.accessToken).toBe("access-token");
    expect(nextState.refreshToken).toBe("refresh-token");
    expect(nextState.isAuthenticated).toBe(true);
  });

  it("clears auth state", () => {
    const state = useAuthStore.getState();

    state.setTokens("access-token", "refresh-token");
    state.setUser({ id: "user-1" });
    state.clearAuth();

    const clearedState = useAuthStore.getState();
    expect(clearedState.accessToken).toBeNull();
    expect(clearedState.refreshToken).toBeNull();
    expect(clearedState.user).toBeNull();
    expect(clearedState.isAuthenticated).toBe(false);
    expect(clearedState.isHydrated).toBe(false);
  });

  it("persists auth fields and hydrates with skipHydration", async () => {
    const state = useAuthStore.getState();
    state.setTokens("persisted-access", "persisted-refresh");
    state.setUser({ id: "user-2", email: "user2@example.com" });

    const persistedRaw = localStorage.getItem(STORAGE_KEY);
    expect(persistedRaw).not.toBeNull();

    const persisted = JSON.parse(persistedRaw ?? "{}") as {
      state: {
        accessToken?: string;
        refreshToken?: string;
        user?: { id?: string; email?: string };
      };
    };

    expect(persisted.state.accessToken).toBe("persisted-access");
    expect(persisted.state.refreshToken).toBe("persisted-refresh");
    expect(persisted.state.user).toEqual({ id: "user-2", email: "user2@example.com" });

    resetStore();
    expect(useAuthStore.getState().isHydrated).toBe(false);

    await useAuthStore.getState().hydrate();

    const hydratedState = useAuthStore.getState();
    expect(hydratedState.accessToken).toBe("persisted-access");
    expect(hydratedState.refreshToken).toBe("persisted-refresh");
    expect(hydratedState.user).toEqual({ id: "user-2", email: "user2@example.com" });
    expect(hydratedState.isAuthenticated).toBe(true);
    expect(hydratedState.isHydrated).toBe(true);
  });
});
