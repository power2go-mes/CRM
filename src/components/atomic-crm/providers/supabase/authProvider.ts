import type { AuthProvider } from "ra-core";
import { supabaseAuthProvider } from "ra-supabase-core";

import { canAccess } from "../commons/canAccess";
import { getMigratedRole } from "../commons/roles";
import { getSupabaseClient } from "./supabase";

const getBaseAuthProvider = () =>
  supabaseAuthProvider(getSupabaseClient(), {
    getIdentity: async () => {
      const sale = await getCurrentSale();

      if (sale == null) {
        throw new Error();
      }

      return {
        id: sale.id,
        user_id: sale.user_id,
        email: sale.email,
        fullName: `${sale.first_name} ${sale.last_name}`,
        avatar: sale.avatar?.src,
        designation: sale.designation,
        role: getMigratedRole(sale.role, sale.administrator),
        reports_to_user_id: sale.reports_to_user_id,
        region_id: sale.region_id,
        region: sale.region,
        area: sale.area,
        disabled: sale.disabled,
      };
    },
  });

// To speed up checks, we cache the initialization state
// and the current sale in the local storage. They are cleared on logout.
const IS_INITIALIZED_CACHE_KEY = "RaStore.auth.is_initialized";
const CURRENT_SALE_CACHE_KEY = "RaStore.auth.current_sale";

function getLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export async function getIsInitialized() {
  const storage = getLocalStorage();
  const cachedValue = storage?.getItem(IS_INITIALIZED_CACHE_KEY);
  if (cachedValue === "true") {
    return true;
  }

  const { data, error } = await getSupabaseClient()
    .from("init_state")
    .select("is_initialized");

  if (error) {
    console.error("init_state fetch error:", error);
  }

  const isInitialized = (data?.at(0)?.is_initialized ?? 0) > 0;

  if (isInitialized) {
    storage?.setItem(IS_INITIALIZED_CACHE_KEY, "true");
  } else {
    storage?.removeItem(IS_INITIALIZED_CACHE_KEY);
  }

  return isInitialized;
}

export const getCurrentSale = async () => {
  const storage = getLocalStorage();
  const { data: dataSession, error: errorSession } =
    await getSupabaseClient().auth.getSession();

  // Shouldn't happen after login but just in case
  if (dataSession?.session?.user == null || errorSession) {
    return undefined;
  }

  const cachedValue = storage?.getItem(CURRENT_SALE_CACHE_KEY);
  if (cachedValue != null) {
    try {
      const cachedSale = JSON.parse(cachedValue);
      if (cachedSale.user_id === dataSession.session.user.id) {
        return cachedSale;
      }
    } catch {
      storage?.removeItem(CURRENT_SALE_CACHE_KEY);
    }
  }

  const { data: dataSale, error: errorSale } = await getSupabaseClient()
    .from("sales")
    .select(
      "id, first_name, last_name, avatar, administrator, role, designation, reports_to_user_id, region_id, region, area, disabled, email, user_id",
    )
    .match({ user_id: dataSession?.session?.user.id })
    .single();

  // Shouldn't happen either as all users are sales but just in case
  if (dataSale == null || errorSale) {
    return undefined;
  }

  storage?.setItem(CURRENT_SALE_CACHE_KEY, JSON.stringify(dataSale));
  return dataSale;
};

function clearCache() {
  const storage = getLocalStorage();
  storage?.removeItem(IS_INITIALIZED_CACHE_KEY);
  storage?.removeItem(CURRENT_SALE_CACHE_KEY);
}

export const getAuthProvider = (): AuthProvider => {
  const baseAuthProvider = getBaseAuthProvider();
  return {
    ...baseAuthProvider,
    login: async (params) => {
      clearCache();
      if (params.ssoDomain) {
        const { error } = await getSupabaseClient().auth.signInWithSSO({
          domain: params.ssoDomain,
        });
        if (error) {
          throw error;
        }
        return;
      }
      const result = await baseAuthProvider.login(params);
      const sale = await getCurrentSale();
      if (!sale || sale.disabled) {
        await getSupabaseClient().auth.signOut();
        clearCache();
        throw new Error("Account disabled");
      }
      return result;
    },
    logout: async (params) => {
      clearCache();
      return baseAuthProvider.logout(params);
    },
    checkAuth: async (params) => {
      // Users are on the set-password page, nothing to do
      if (
        window.location.pathname === "/set-password" ||
        window.location.hash.includes("#/set-password")
      ) {
        return;
      }
      // Users are on the forgot-password page, nothing to do
      if (
        window.location.pathname === "/forgot-password" ||
        window.location.hash.includes("#/forgot-password")
      ) {
        return;
      }
      const isInitialized = await getIsInitialized();

      if (!isInitialized) {
        await getSupabaseClient().auth.signOut();
        throw {
          redirectTo: "/login",
          message: false,
        };
      }

      const sale = await getCurrentSale();
      if (!sale || sale.disabled) {
        await getSupabaseClient().auth.signOut();
        clearCache();
        throw new Error("Account disabled");
      }

      return baseAuthProvider.checkAuth(params);
    },
    canAccess: async (params) => {
      const isInitialized = await getIsInitialized();
      if (!isInitialized) return false;

      // Get the current user
      const sale = await getCurrentSale();
      if (sale == null || sale.disabled) return false;

      // Compute access rights from the sale role
      return canAccess(getMigratedRole(sale.role, sale.administrator), params);
    },
    getAuthorizationDetails(authorizationId: string) {
      return getSupabaseClient().auth.oauth.getAuthorizationDetails(
        authorizationId,
      );
    },
    approveAuthorization(authorizationId: string) {
      return getSupabaseClient().auth.oauth.approveAuthorization(
        authorizationId,
      );
    },
    denyAuthorization(authorizationId: string) {
      return getSupabaseClient().auth.oauth.denyAuthorization(authorizationId);
    },
  };
};
