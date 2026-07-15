"use client";

import { LoaderCircle, ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { canAccessRoute, getRoleHome } from "@/config/access-control";
import { useAuthSession } from "./auth-session-provider";

function GuardStatus({ denied = false }: { denied?: boolean }) {
  const Icon = denied ? ShieldAlert : LoaderCircle;
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center bg-background px-6 text-center" aria-live="polite">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
          <Icon className={denied ? "size-6" : "size-6 animate-spin"} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-bold">{denied ? "กำลังพาไปยังพื้นที่ที่คุณมีสิทธิ์" : "กำลังตรวจสอบสิทธิ์"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Flukex จะแสดงเฉพาะข้อมูลและเครื่องมือของบทบาทนี้</p>
      </div>
    </main>
  );
}

export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, status } = useAuthSession();
  const allowed = Boolean(session && canAccessRoute(session.role, pathname));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === "authenticated" && session && !canAccessRoute(session.role, pathname)) {
      router.replace(getRoleHome(session.role));
    }
  }, [pathname, router, session, status]);

  if (status === "loading") return <GuardStatus />;
  if (!allowed) return <GuardStatus denied />;
  return children;
}
