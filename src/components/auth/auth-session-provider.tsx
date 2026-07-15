"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { DemoSession } from "@/domain/types";
import { services } from "@/services/container";
import { STORAGE_KEYS } from "@/services/storage";
import { useDemoStore } from "@/store/demo-store";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthSessionContextValue {
  session: DemoSession | null;
  status: SessionStatus;
  establishSession: (session: DemoSession) => void;
  refreshSession: () => Promise<DemoSession | null>;
  signOut: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function activateSessionTenant(session: DemoSession | null) {
  if (!session || session.role === "PLATFORM_ADMIN") return;
  useDemoStore.getState().activateTenant({
    tenantId: session.tenantId,
    ownerName: session.name,
    ownerEmail: session.email,
    restaurantName: session.restaurantName,
  });
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  const refreshSession = useCallback(async () => {
    const current = await services.auth.getSession();
    activateSessionTenant(current);
    setSession(current);
    setStatus(current ? "authenticated" : "unauthenticated");
    return current;
  }, []);

  const establishSession = useCallback((nextSession: DemoSession) => {
    activateSessionTenant(nextSession);
    setSession(nextSession);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await services.auth.logout();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    let active = true;
    void services.auth.getSession().then((current) => {
      if (!active) return;
      activateSessionTenant(current);
      setSession(current);
      setStatus(current ? "authenticated" : "unauthenticated");
    });
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.session) void refreshSession();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshSession]);

  const value = useMemo(() => ({ session, status, establishSession, refreshSession, signOut }), [session, status, establishSession, refreshSession, signOut]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error("useAuthSession must be used inside AuthSessionProvider");
  return context;
}
