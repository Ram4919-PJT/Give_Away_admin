import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/adminClient";
import {
  clearAuthStorage,
  getStoredAccessToken,
  isAdminRole,
  loadAdminUser,
  saveAdminUser,
  saveTokens,
} from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => loadAdminUser());
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!getStoredAccessToken()) {
        clearAuthStorage();
        if (!cancelled) {
          setAdmin(null);
          setBooting(false);
        }
        return;
      }
      try {
        const me = await adminApi.getMe();
        if (!isAdminRole(me)) {
          clearAuthStorage();
          if (!cancelled) setAdmin(null);
          return;
        }
        saveAdminUser(me);
        if (!cancelled) setAdmin(me);
      } catch {
        clearAuthStorage();
        if (!cancelled) setAdmin(null);
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const tokens = await adminApi.login(email, password);
    saveTokens(tokens);
    const me = await adminApi.getMe();
    if (!isAdminRole(me)) {
      clearAuthStorage();
      throw new Error("Only Super Admin accounts can sign in to this portal.");
    }
    saveAdminUser(me);
    setAdmin(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.logout();
    } catch {
      /* ignore */
    }
    clearAuthStorage();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, booting, login, logout }),
    [admin, booting, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AuthProvider");
  return ctx;
}
