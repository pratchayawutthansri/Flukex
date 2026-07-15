"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BellRing,
  Check,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coffee,
  Maximize2,
  Minimize2,
  LogOut,
  Moon,
  MoreVertical,
  QrCode,
  Radio,
  Store,
  Sun,
  Volume2,
  VolumeX,
  WifiOff,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Order, OrderItem, OrderStatus, Station } from "@/domain/types";
import { canAccessRoute, getRoleHome } from "@/config/access-control";
import { cn, formatTime } from "@/lib/utils";
import { services } from "@/services/container";
import type { RealtimeEvent } from "@/services/contracts";
import { useDemoStore } from "@/store/demo-store";

const ACTIVE_STATUSES = ["WAITING", "PREPARING", "READY"] as const;
type ActiveOrderStatus = (typeof ACTIVE_STATUSES)[number];

type StationOrder = Omit<Order, "items"> & {
  items: OrderItem[];
  stationItemTotal: number;
};

type CancelTarget = {
  orderId: string;
  orderNumber: string;
  tableName: string;
  item: OrderItem;
};

type LaneConfig = {
  status: ActiveOrderStatus;
  label: string;
  compactLabel: string;
  helper: string;
  emptyTitle: string;
  emptyDescription: string;
  markerClass: string;
  headerClass: string;
  borderClass: string;
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  WAITING: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  WAITING: "รอเริ่ม",
  PREPARING: "กำลังทำ",
  READY: "พร้อมส่งต่อ",
  SERVED: "ส่งต่อแล้ว",
  CANCELLED: "ยกเลิก",
};

const ACTION_LABELS: Record<ActiveOrderStatus, string> = {
  WAITING: "เริ่มทำ",
  PREPARING: "ทำเสร็จ",
  READY: "ส่งต่อแล้ว",
};

const LANES: LaneConfig[] = [
  {
    status: "WAITING",
    label: "รอเริ่ม",
    compactLabel: "รอเริ่ม",
    helper: "ออเดอร์ใหม่",
    emptyTitle: "พร้อมรับออเดอร์ใหม่",
    emptyDescription: "รายการใหม่จะปรากฏที่คอลัมน์นี้อัตโนมัติ",
    markerClass: "bg-amber-500",
    headerClass: "bg-amber-100 text-amber-950 dark:bg-amber-950/70 dark:text-amber-100",
    borderClass: "border-amber-300 dark:border-amber-800",
  },
  {
    status: "PREPARING",
    label: "กำลังทำ",
    compactLabel: "กำลังทำ",
    helper: "อยู่ระหว่างเตรียม",
    emptyTitle: "ยังไม่มีรายการกำลังทำ",
    emptyDescription: "กด “เริ่มทำ” จากคอลัมน์รอเริ่มเพื่อย้ายรายการ",
    markerClass: "bg-blue-500",
    headerClass: "bg-blue-100 text-blue-950 dark:bg-blue-950/70 dark:text-blue-100",
    borderClass: "border-blue-300 dark:border-blue-800",
  },
  {
    status: "READY",
    label: "พร้อมส่งต่อ",
    compactLabel: "พร้อมส่ง",
    helper: "รอพนักงานรับ",
    emptyTitle: "ยังไม่มีรายการรอส่ง",
    emptyDescription: "รายการที่ทำเสร็จแล้วจะรอส่งต่อที่นี่",
    markerClass: "bg-emerald-500",
    headerClass: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-100",
    borderClass: "border-emerald-300 dark:border-emerald-800",
  },
];

function isActiveStatus(status: OrderStatus): status is ActiveOrderStatus {
  return ACTIVE_STATUSES.some((activeStatus) => activeStatus === status);
}

function getElapsedMinutes(createdAt: string, now: number) {
  if (!now) return 0;
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60_000));
}

function formatClock(value: number) {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function TicketCard({
  ticket,
  status,
  now,
  newest,
  station,
  onAdvance,
  onCancel,
}: {
  ticket: StationOrder;
  status: ActiveOrderStatus;
  now: number;
  newest: string | null;
  station: Station;
  onAdvance: (orderId: string, item: OrderItem) => void;
  onCancel: (target: CancelTarget) => void;
}) {
  const elapsed = getElapsedMinutes(ticket.createdAt, now);
  const overdue = elapsed >= 20;
  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-[var(--kds-surface)] shadow-sm transition-[border-color,box-shadow] duration-200",
        newest === ticket.id && "order-new ring-4 ring-primary/30",
        overdue ? "border-red-500 ring-1 ring-red-500/25" : "border-[var(--kds-border)]",
      )}
      aria-label={`${ticket.orderNumber} ${ticket.tableName}`}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--kds-border)] bg-[var(--kds-surface-muted)] p-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-black tracking-tight text-[var(--kds-foreground)] sm:text-[1.75rem]">
              {ticket.orderNumber}
            </h3>
            <Badge variant={ticket.source === "QR" ? "default" : "outline"}>{ticket.source}</Badge>
            {newest === ticket.id && <Badge variant="danger">ใหม่</Badge>}
          </div>
          <p className="mt-1 break-words text-xl font-bold text-[var(--kds-foreground)]">
            {ticket.tableName}
          </p>
          <p className="mt-1 text-sm text-[var(--kds-muted)]">
            {ticket.items.length} จาก {ticket.stationItemTotal} รายการในบิล
          </p>
        </div>

        <div
          className={cn(
            "shrink-0 rounded-lg border px-3 py-2 text-right",
            overdue
              ? "border-red-600 bg-red-600 text-white"
              : "border-[var(--kds-border)] bg-[var(--kds-surface)] text-[var(--kds-foreground)]",
          )}
        >
          <p className="flex items-center justify-end gap-1 text-xs font-semibold">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {overdue ? "เกินเวลา" : "ผ่านไป"}
          </p>
          <strong className="block text-xl font-black tabular-nums">{now ? `${elapsed} นาที` : "—"}</strong>
          <time className="block text-xs opacity-80" dateTime={ticket.createdAt}>
            รับเมื่อ {formatTime(ticket.createdAt)}
          </time>
        </div>
      </header>

      <ul className="divide-y divide-[var(--kds-border)]">
        {ticket.items.map((item) => (
          <li key={item.id} className="p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="break-words text-lg font-bold leading-snug text-[var(--kds-foreground)] sm:text-xl">
                  <span className="mr-2 inline-block text-2xl font-black text-[var(--kds-foreground)]">
                    {item.quantity}×
                  </span>
                  {item.productName}
                </p>
                {item.modifiers.length > 0 && (
                  <p className="mt-1 break-words text-base text-[var(--kds-muted)]">
                    เพิ่ม: {item.modifiers.map((modifier) => modifier.name).join(", ")}
                  </p>
                )}
                {item.note && (
                  <p className="mt-2 break-words rounded-lg border border-amber-400/60 bg-amber-100 p-2.5 text-base font-bold text-amber-950 dark:border-amber-700 dark:bg-amber-950/60 dark:text-amber-100">
                    หมายเหตุ: {item.note}
                  </p>
                )}
              </div>

              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`ตัวเลือกสำหรับ ${item.productName}`}
                    title="ตัวเลือกรายการ"
                    className="shrink-0 touch-manipulation"
                  >
                    <MoreVertical aria-hidden="true" />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-50 min-w-48 rounded-lg border bg-card p-1.5 text-foreground shadow-xl"
                  >
                    <DropdownMenu.Item
                      onSelect={() =>
                        onCancel({
                          orderId: ticket.id,
                          orderNumber: ticket.orderNumber,
                          tableName: ticket.tableName,
                          item,
                        })
                      }
                      className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold text-destructive outline-none hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950 dark:focus:bg-red-950"
                    >
                      <XCircle className="size-4" aria-hidden="true" />
                      ยกเลิกรายการ
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            <Button
              type="button"
              size="lg"
              className={cn(
                "mt-3 min-h-14 w-full touch-manipulation text-lg",
                status === "WAITING" && "bg-amber-500 text-amber-950 hover:bg-amber-400",
                status === "PREPARING" && "bg-blue-600 text-white hover:bg-blue-700",
                status === "READY" && "bg-emerald-600 text-white hover:bg-emerald-700",
              )}
              onClick={() => onAdvance(ticket.id, item)}
            >
              {status === "WAITING" ? (
                station === "KITCHEN" ? <ChefHat aria-hidden="true" /> : <Coffee aria-hidden="true" />
              ) : status === "PREPARING" ? (
                <Check aria-hidden="true" />
              ) : (
                <BellRing aria-hidden="true" />
              )}
              {ACTION_LABELS[status]}
            </Button>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Lane({
  config,
  tickets,
  now,
  newest,
  station,
  mobileLane,
  laneRef,
  onAdvance,
  onCancel,
}: {
  config: LaneConfig;
  tickets: StationOrder[];
  now: number;
  newest: string | null;
  station: Station;
  mobileLane: ActiveOrderStatus;
  laneRef: (element: HTMLElement | null) => void;
  onAdvance: (orderId: string, item: OrderItem) => void;
  onCancel: (target: CancelTarget) => void;
}) {
  const itemCount = tickets.reduce((sum, ticket) => sum + ticket.items.length, 0);
  const oldest = tickets.reduce(
    (maximum, ticket) => Math.max(maximum, getElapsedMinutes(ticket.createdAt, now)),
    0,
  );
  const visibleOnCompact = mobileLane === config.status;

  return (
    <section
      ref={laneRef}
      id={`kds-panel-${config.status.toLowerCase()}`}
      aria-labelledby={`kds-heading-${config.status.toLowerCase()}`}
      tabIndex={-1}
      className={cn(
        "min-w-0 flex-col overflow-hidden rounded-2xl border bg-[var(--kds-surface)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 lg:flex",
        config.borderClass,
        visibleOnCompact ? "flex" : "hidden",
      )}
    >
      <header className={cn("flex items-center justify-between gap-3 border-b px-4 py-3", config.headerClass, config.borderClass)}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-white", config.markerClass)}>
            {config.status === "WAITING" ? (
              <Clock3 className="size-5" aria-hidden="true" />
            ) : config.status === "PREPARING" ? (
              station === "KITCHEN" ? <ChefHat className="size-5" aria-hidden="true" /> : <Coffee className="size-5" aria-hidden="true" />
            ) : (
              <BellRing className="size-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h2 id={`kds-heading-${config.status.toLowerCase()}`} className="text-xl font-black leading-tight sm:text-2xl">{config.label}</h2>
            <p className="truncate text-xs font-medium opacity-75">{config.helper}</p>
          </div>
        </div>
        <div className="text-right">
          <strong className="block text-3xl font-black tabular-nums">{itemCount}</strong>
          <span className="block text-xs font-semibold">รายการ</span>
        </div>
      </header>

      <div className="flex min-h-72 flex-1 flex-col gap-3 bg-[var(--kds-canvas)]/55 p-3 sm:grid sm:grid-cols-2 sm:content-start lg:flex lg:p-3">
        {tickets.length > 0 ? (
          <>
            <p className="col-span-full flex items-center justify-between rounded-lg border border-[var(--kds-border)] bg-[var(--kds-surface)] px-3 py-2 text-sm text-[var(--kds-muted)] lg:flex">
              <span>{tickets.length} บิลในสถานะนี้</span>
              <span className="font-semibold tabular-nums">รอนานสุด {now ? `${oldest} นาที` : "—"}</span>
            </p>
            {tickets.map((ticket) => (
              <TicketCard
                key={`${ticket.id}:${config.status}`}
                ticket={ticket}
                status={config.status}
                now={now}
                newest={newest}
                station={station}
                onAdvance={onAdvance}
                onCancel={onCancel}
              />
            ))}
          </>
        ) : (
          <div className="col-span-full grid min-h-64 place-items-center rounded-xl border border-[var(--kds-border)] bg-[var(--kds-surface)] p-6 text-center lg:min-h-[24rem]">
            <div>
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--kds-surface-muted)] text-[var(--kds-muted)]">
                {config.status === "WAITING" ? (
                  <Clock3 className="size-7" aria-hidden="true" />
                ) : config.status === "PREPARING" ? (
                  station === "KITCHEN" ? <ChefHat className="size-7" aria-hidden="true" /> : <Coffee className="size-7" aria-hidden="true" />
                ) : (
                  <BellRing className="size-7" aria-hidden="true" />
                )}
              </span>
              <h3 className="mt-4 text-lg font-bold text-[var(--kds-foreground)]">{config.emptyTitle}</h3>
              <p className="mx-auto mt-1 max-w-64 text-sm leading-relaxed text-[var(--kds-muted)]">
                {config.emptyDescription}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function KdsDisplay({ station }: { station: Station }) {
  const router = useRouter();
  const { session, signOut } = useAuthSession();
  const orders = useDemoStore((state) => state.orders);
  const restaurant = useDemoStore((state) => state.restaurants[0]);
  const firstTable = useDemoStore((state) => state.tables[0]);
  const update = useDemoStore((state) => state.updateOrderStatus);
  const qrHref = restaurant && firstTable ? `/order/${restaurant.slug}/table/${firstTable.token}` : "/dashboard/tables";
  const [dark, setDark] = useState(true);
  const [sound, setSound] = useState(true);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [now, setNow] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [newest, setNewest] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [mobileLane, setMobileLane] = useState<ActiveOrderStatus>("WAITING");
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const laneRefs = useRef<Partial<Record<ActiveOrderStatus, HTMLElement | null>>>({});

  const stationName = station === "KITCHEN" ? "จอครัว" : "จอบาร์";
  const StationIcon = station === "KITCHEN" ? ChefHat : Coffee;
  const OtherStationIcon = station === "KITCHEN" ? Coffee : ChefHat;
  const otherStationHref = station === "KITCHEN" ? "/bar" : "/kitchen";
  const otherStationLabel = station === "KITCHEN" ? "ไปจอบาร์" : "ไปจอครัว";
  const currentStationHref = station === "KITCHEN" ? "/kitchen" : "/bar";
  const homeHref = session ? getRoleHome(session.role) : "/login";
  const canReturnHome = homeHref !== currentStationHref;
  const canSwitchStation = Boolean(session && canAccessRoute(session.role, otherStationHref));
  const canCreateDemoOrder = Boolean(session && ["OWNER", "MANAGER"].includes(session.role));

  const logout = async () => {
    await signOut();
    router.replace("/login");
  };

  useEffect(() => {
    const preferenceTimer = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem("flukex-pos:kds-theme");
      const storedSound = window.localStorage.getItem("flukex-pos:kds-sound");
      if (storedTheme === "light") setDark(false);
      if (storedTheme === "dark") setDark(true);
      if (storedSound === "off") setSound(false);
      if (storedSound === "on") setSound(true);
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(preferenceTimer);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    window.localStorage.setItem("flukex-pos:kds-theme", dark ? "dark" : "light");
    window.localStorage.setItem("flukex-pos:kds-sound", sound ? "on" : "off");
  }, [dark, preferencesReady, sound]);

  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateTimer = window.setTimeout(() => setLastUpdate(Date.now()), 0);
    return () => window.clearTimeout(updateTimer);
  }, [orders]);

  useEffect(() => {
    const syncOnlineState = () => setOnline(window.navigator.onLine);
    syncOnlineState();
    window.addEventListener("online", syncOnlineState);
    window.addEventListener("offline", syncOnlineState);
    return () => {
      window.removeEventListener("online", syncOnlineState);
      window.removeEventListener("offline", syncOnlineState);
    };
  }, []);

  useEffect(() => {
    const syncFullscreenState = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    let highlightTimer: number | undefined;
    const unsubscribe = services.realtime.subscribe((event: RealtimeEvent) => {
      if (event.type !== "ORDER_CREATED") return;
      const payload = event.payload as Partial<Order>;
      if (!payload.id || !Array.isArray(payload.items)) return;
      if (!payload.items.some((item) => item.station === station)) return;

      window.clearTimeout(highlightTimer);
      setNewest(payload.id);
      setLastUpdate(Date.now());
      setLiveMessage(`มีออเดอร์ใหม่เข้า${station === "KITCHEN" ? "ครัว" : "บาร์"}`);
      highlightTimer = window.setTimeout(() => setNewest(null), 5_000);

      if (sound) {
        void services.notifications.notify({
          title: `ออเดอร์ใหม่เข้า${station === "KITCHEN" ? "ครัว" : "บาร์"}`,
          message: "ตรวจสอบรายการที่มีป้ายใหม่",
          audible: true,
        });
      }
    });

    return () => {
      unsubscribe();
      window.clearTimeout(highlightTimer);
    };
  }, [sound, station]);

  const activeOrders = useMemo<StationOrder[]>(
    () =>
      orders
        .map((order) => {
          const stationItems = order.items.filter((item) => item.station === station);
          return {
            ...order,
            items: stationItems.filter((item) => isActiveStatus(item.status)),
            stationItemTotal: stationItems.length,
          };
        })
        .filter((order) => order.items.length > 0)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders, station],
  );

  const ticketsByStatus = useMemo(() => {
    const tickets: Record<ActiveOrderStatus, StationOrder[]> = {
      WAITING: [],
      PREPARING: [],
      READY: [],
    };

    for (const status of ACTIVE_STATUSES) {
      tickets[status] = activeOrders
        .map((order) => ({
          ...order,
          items: order.items.filter((item) => item.status === status),
        }))
        .filter((order) => order.items.length > 0);
    }

    return tickets;
  }, [activeOrders]);

  const totalItems = activeOrders.reduce((sum, order) => sum + order.items.length, 0);
  const oldestMinutes = activeOrders.reduce(
    (maximum, order) => Math.max(maximum, getElapsedMinutes(order.createdAt, now)),
    0,
  );

  const focusLane = (status: ActiveOrderStatus) => {
    setMobileLane(status);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => laneRefs.current[status]?.focus({ preventScroll: true }));
    });
  };

  const advance = (orderId: string, item: OrderItem) => {
    const next = NEXT_STATUS[item.status];
    if (!next) return;

    update(orderId, item.id, next);
    setLastUpdate(Date.now());
    setLiveMessage(`${item.productName} เปลี่ยนเป็น ${STATUS_LABELS[next]}`);

    if (isActiveStatus(next)) focusLane(next);
    else if (isActiveStatus(item.status)) focusLane(item.status);

    toast.success(`${item.productName}: ${STATUS_LABELS[next]}`, {
      duration: 6_000,
      action: {
        label: "ย้อนกลับ",
        onClick: () => {
          update(orderId, item.id, item.status);
          setLiveMessage(`ย้อนกลับ ${item.productName} เป็น ${STATUS_LABELS[item.status]}`);
          if (isActiveStatus(item.status)) focusLane(item.status);
        },
      },
    });
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const { orderId, item } = cancelTarget;
    update(orderId, item.id, "CANCELLED");
    setLiveMessage(`ยกเลิก ${item.productName} แล้ว`);
    setLastUpdate(Date.now());
    setCancelTarget(null);
    toast.success(`ยกเลิก ${item.productName} แล้ว`, {
      duration: 6_000,
      action: {
        label: "ย้อนกลับ",
        onClick: () => {
          update(orderId, item.id, item.status);
          setLiveMessage(`คืน ${item.productName} กลับเป็น ${STATUS_LABELS[item.status]}`);
          if (isActiveStatus(item.status)) focusLane(item.status);
        },
      },
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      toast.error("อุปกรณ์นี้ไม่รองรับโหมดเต็มจอ");
    }
  };

  return (
    <main
      id="main-content"
      className={cn(
        "kds-theme min-h-dvh overscroll-contain bg-[var(--kds-canvas)] text-[var(--kds-foreground)] transition-colors duration-200 [&_a]:touch-manipulation [&_button]:touch-manipulation",
        dark && "dark",
      )}
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </p>

      <header className="sticky top-0 z-30 border-b border-[var(--kds-border)] bg-[var(--kds-surface)]/95 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex min-h-20 items-center justify-between gap-2 px-3 py-2 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {canReturnHome ? (
              <Button variant="ghost" size="icon" asChild>
                <Link href={homeHref} aria-label="กลับหน้าหลักของฉัน" title="กลับหน้าหลักของฉัน">
                  <ArrowLeft aria-hidden="true" />
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ">
                <LogOut aria-hidden="true" />
              </Button>
            )}
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <StationIcon aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black sm:text-2xl">{stationName}</h1>
              <p className="truncate text-xs text-[var(--kds-muted)] sm:text-sm">บิสโทร · สาขาสุขุมวิท</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {canSwitchStation && (
              <Button variant="ghost" size="icon" asChild className="lg:hidden">
                <Link href={otherStationHref} aria-label={otherStationLabel} title={otherStationLabel}>
                  <OtherStationIcon aria-hidden="true" />
                </Link>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSound((value) => !value)}
              aria-label={sound ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
              aria-pressed={sound}
              title={sound ? "ปิดเสียงแจ้งเตือน" : "เปิดเสียงแจ้งเตือน"}
            >
              {sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setDark((value) => !value)}
              aria-label={dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
              aria-pressed={dark}
              title={dark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
            >
              {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex"
              onClick={() => void toggleFullscreen()}
              aria-label={fullscreen ? "ออกจากโหมดเต็มจอ" : "เปิดโหมดเต็มจอ"}
              aria-pressed={fullscreen}
              title={fullscreen ? "ออกจากโหมดเต็มจอ" : "เปิดโหมดเต็มจอ"}
            >
              {fullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
            </Button>
            {canSwitchStation && (
              <Button variant="outline" className="hidden lg:inline-flex" asChild>
                <Link href={otherStationHref}>
                  <OtherStationIcon aria-hidden="true" />
                  {otherStationLabel}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pt-4">
        <section
          aria-label="สถานะจอปฏิบัติงาน"
          className="flex flex-col gap-3 rounded-xl border border-[var(--kds-border)] bg-[var(--kds-surface)] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-xl",
                online
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
              )}
            >
              {online ? <Radio aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
            </span>
            <div className="min-w-0">
              <p className="font-bold">{online ? "เชื่อมต่อแล้ว · พร้อมรับออเดอร์" : "ออฟไลน์ · ตรวจสอบเครือข่าย"}</p>
              <p className="text-sm text-[var(--kds-muted)]">
                {activeOrders.length} บิล · {totalItems} รายการ
                {activeOrders.length > 0 ? ` · รอนานสุด ${now ? `${oldestMinutes} นาที` : "—"}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="mr-auto sm:mr-2 sm:text-right">
              <time className="block text-xl font-black tabular-nums" dateTime={now ? new Date(now).toISOString() : undefined}>
                {formatClock(now)}
              </time>
              <p className="text-xs text-[var(--kds-muted)]">อัปเดตล่าสุด {formatClock(lastUpdate)}</p>
            </div>
            {activeOrders.length === 0 && canCreateDemoOrder && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pos">
                    <Store aria-hidden="true" />
                    สร้างออเดอร์ทดลอง
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href={qrHref}>
                    <QrCode aria-hidden="true" />
                    {firstTable ? "เปิด QR" : "เพิ่มโต๊ะและ QR"}
                  </Link>
                </Button>
              </>
            )}
          </div>
        </section>

        <div className="sticky top-20 z-20 mt-3 grid grid-cols-3 gap-1 rounded-xl border border-[var(--kds-border)] bg-[var(--kds-surface)] p-1 shadow-sm lg:hidden" role="group" aria-label="เลือกสถานะรายการ">
          {LANES.map((lane) => {
            const selected = mobileLane === lane.status;
            const count = ticketsByStatus[lane.status].reduce((sum, ticket) => sum + ticket.items.length, 0);
            return (
              <button
                key={lane.status}
                type="button"
                aria-label={`${lane.label} ${count}`}
                aria-pressed={selected}
                aria-controls={`kds-panel-${lane.status.toLowerCase()}`}
                onClick={() => setMobileLane(lane.status)}
                className={cn(
                  "flex min-h-14 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-bold transition-[background,color,box-shadow] duration-200",
                  selected
                    ? cn(lane.headerClass, "shadow-sm")
                    : "text-[var(--kds-muted)] hover:bg-[var(--kds-surface-muted)] hover:text-[var(--kds-foreground)]",
                )}
              >
                {lane.status === "WAITING" ? (
                  <Clock3 className="size-4 shrink-0" aria-hidden="true" />
                ) : lane.status === "PREPARING" ? (
                  station === "KITCHEN" ? <ChefHat className="size-4 shrink-0" aria-hidden="true" /> : <Coffee className="size-4 shrink-0" aria-hidden="true" />
                ) : (
                  <BellRing className="size-4 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{lane.compactLabel}</span>
                <span className="tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        {activeOrders.length === 0 && (
          <section className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100" aria-label="จอพร้อมรับออเดอร์">
            <CheckCircle2 className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div>
              <h2 className="font-bold">{station === "KITCHEN" ? "ครัว" : "บาร์"}พร้อมรับออเดอร์ใหม่</h2>
              <p className="text-sm opacity-80">โครงสร้างจอจะคงเดิม และรายการใหม่จะเข้าสถานะ “รอเริ่ม” โดยอัตโนมัติ</p>
            </div>
          </section>
        )}

        <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-3 lg:items-start">
          {LANES.map((lane) => (
            <Lane
              key={lane.status}
              config={lane}
              tickets={ticketsByStatus[lane.status]}
              now={now}
              newest={newest}
              station={station}
              mobileLane={mobileLane}
              laneRef={(element) => {
                laneRefs.current[lane.status] = element;
              }}
              onAdvance={advance}
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      </div>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยกเลิกรายการนี้?</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `${cancelTarget.orderNumber} · ${cancelTarget.tableName} · ${cancelTarget.item.quantity}× ${cancelTarget.item.productName}`
                : "ตรวจสอบรายการก่อนยืนยัน"}
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100">
            รายการจะออกจากจอปฏิบัติงานทันที แต่สามารถกด “ย้อนกลับ” จากการแจ้งเตือนได้
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              กลับไปตรวจสอบ
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              <XCircle aria-hidden="true" />
              ยืนยันยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
