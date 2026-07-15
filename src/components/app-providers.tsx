"use client";

import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import { useDemoStore } from "@/store/demo-store";
import { services } from "@/services/container";
import type { NotificationInput, RealtimeEvent } from "@/services/contracts";
import { AuthSessionProvider } from "@/components/auth/auth-session-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const addNotification = useDemoStore((state) => state.addNotification);
  const reloadActiveTenant = useDemoStore((state) => state.reloadActiveTenant);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<NotificationInput>).detail;
      toast(detail.title, { description: detail.message });
      addNotification({ title: detail.title, message: detail.message, channel: detail.channel ?? "BROWSER" });
    };
    window.addEventListener("flukex:notification", handleNotification);
    return () => window.removeEventListener("flukex:notification", handleNotification);
  }, [addNotification]);

  useEffect(() => services.realtime.subscribe((event: RealtimeEvent) => {
    if (event.tenantId !== useDemoStore.getState().activeTenantId) return;
    reloadActiveTenant();
    if (event.type === "ORDER_CREATED") toast.success("มีออเดอร์ใหม่เข้ามา", { description: "ข้อมูลจอครัวและบาร์อัปเดตแล้ว" });
  }), [reloadActiveTenant]);

  return (
    <AuthSessionProvider>
      {children}
      <Toaster richColors closeButton position="top-right" toastOptions={{ duration: 4200 }} />
    </AuthSessionProvider>
  );
}
