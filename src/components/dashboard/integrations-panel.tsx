"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Bot,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Plug,
  Send,
  ShieldCheck,
  Trash2,
  Webhook,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { canUseFeature } from "@/config/plans";
import type { NotificationLog, PlanId } from "@/domain/types";
import { formatDateTime } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";

type SimulatedIntegration = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  feature?: "lineIntegrationEnabled" | "externalWebhookEnabled";
  channel: NotificationLog["channel"];
};

const simulatedIntegrations: SimulatedIntegration[] = [
  {
    id: "browser",
    name: "Browser Toast + Sound",
    description: "แจ้งเตือนภายในเบราว์เซอร์และเล่นเสียงบนอุปกรณ์ที่เปิดระบบ",
    icon: Bell,
    channel: "BROWSER",
  },
  {
    id: "line",
    name: "LINE Messaging",
    description: "อยู่ระหว่างเตรียม LINE Messaging API adapter",
    icon: MessageCircle,
    feature: "lineIntegrationEnabled",
    channel: "LINE_MOCK",
  },
  {
    id: "telegram",
    name: "Telegram Bot",
    description: "อยู่ระหว่างเตรียม Telegram Bot adapter",
    icon: Send,
    feature: "externalWebhookEnabled",
    channel: "TELEGRAM_MOCK",
  },
];

interface DiscordStatus {
  configured: boolean;
  managedByEnvironment: boolean;
}

async function readApiResponse(response: Response) {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  if (!response.ok) throw new Error(body?.message ?? "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
  return body;
}

function DiscordIntegrationCard({ plan }: { plan: PlanId }) {
  const allowed = canUseFeature(plan, "externalWebhookEnabled");
  const [status, setStatus] = useState<DiscordStatus | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"save" | "test" | "delete" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/integrations/discord", { cache: "no-store" })
      .then(async (response) => {
        const body = await readApiResponse(response) as DiscordStatus;
        if (active) setStatus(body);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "อ่านสถานะ Discord ไม่สำเร็จ");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setError("");
    setSuccess("");
    if (!webhookUrl.trim()) {
      setError("กรุณากรอก Discord Webhook URL");
      return;
    }
    setAction("save");
    try {
      const response = await fetch("/api/integrations/discord", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const body = await readApiResponse(response) as DiscordStatus;
      setStatus(body);
      setWebhookUrl("");
      setShowSecret(false);
      setSuccess("บันทึก Webhook แบบเข้ารหัสเรียบร้อยแล้ว");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "บันทึก Webhook ไม่สำเร็จ");
    } finally {
      setAction(null);
    }
  };

  const test = async () => {
    setError("");
    setSuccess("");
    setAction("test");
    try {
      await readApiResponse(await fetch("/api/integrations/discord", { method: "POST" }));
      setSuccess("Discord ได้รับข้อความทดสอบแล้ว");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ส่งข้อความทดสอบไม่สำเร็จ");
    } finally {
      setAction(null);
    }
  };

  const disconnect = async () => {
    setError("");
    setSuccess("");
    setAction("delete");
    try {
      await readApiResponse(await fetch("/api/integrations/discord", { method: "DELETE" }));
      setStatus({ configured: false, managedByEnvironment: false });
      setSuccess("ยกเลิกการเชื่อมต่อ Discord แล้ว");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ยกเลิกการเชื่อมต่อไม่สำเร็จ");
    } finally {
      setAction(null);
    }
  };

  const configured = status?.configured ?? false;
  return (
    <Card className="overflow-hidden border-indigo-200 xl:col-span-2">
      <div className="border-b bg-indigo-50/60 p-5 dark:bg-indigo-950/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
              <Webhook aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold">Discord Webhook</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                ส่ง Notification ของร้านไปยัง Discord ผ่านเซิร์ฟเวอร์
              </p>
            </div>
          </div>
          {loading ? (
            <Badge variant="secondary"><LoaderCircle className="size-3 animate-spin" />กำลังตรวจสอบ</Badge>
          ) : configured ? (
            <Badge variant="success"><CheckCircle2 className="size-3" />เชื่อมต่อแล้ว</Badge>
          ) : (
            <Badge variant="secondary">ยังไม่เชื่อมต่อ</Badge>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        {!allowed && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <LockKeyhole className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Discord Webhook ใช้ได้ในแผน Professional</p>
              <p className="mt-1 text-xs">อัปเกรดแพ็กเกจก่อนบันทึกและทดสอบการเชื่อมต่อ</p>
            </div>
          </div>
        )}

        {status?.managedByEnvironment ? (
          <div className="flex gap-3 rounded-xl border bg-muted/60 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">จัดการจาก Environment Variable</p>
              <p className="mt-1 text-xs text-muted-foreground">
                เซิร์ฟเวอร์ใช้ค่า DISCORD_WEBHOOK_URL และจะไม่อนุญาตให้แก้จากหน้าเว็บ
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="discord-webhook-url">
              Discord Webhook URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="discord-webhook-url"
                type={showSecret ? "text" : "password"}
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                autoComplete="off"
                spellCheck={false}
                disabled={!allowed || Boolean(action)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={showSecret ? "ซ่อน Webhook URL" : "แสดง Webhook URL"}
                aria-pressed={showSecret}
                onClick={() => setShowSecret((current) => !current)}
                disabled={!webhookUrl}
              >
                {showSecret ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              ระบบรับเฉพาะ URL จาก discord.com จากนั้นเข้ารหัส AES-256-GCM ก่อนบันทึก
              และจะไม่แสดง URL กลับมาบน Browser อีก
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            {success}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          {!status?.managedByEnvironment && (
            <Button type="button" onClick={save} disabled={!allowed || Boolean(action)}>
              {action === "save" && <LoaderCircle className="animate-spin" />}
              {configured ? "เปลี่ยน Webhook" : "บันทึก Webhook"}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={test}
            disabled={!allowed || !configured || Boolean(action)}
          >
            {action === "test" && <LoaderCircle className="animate-spin" />}
            ส่งข้อความทดสอบ
          </Button>
          {configured && !status?.managedByEnvironment && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive sm:ml-auto"
              onClick={disconnect}
              disabled={Boolean(action)}
            >
              {action === "delete" ? <LoaderCircle className="animate-spin" /> : <Trash2 />}
              ยกเลิกการเชื่อมต่อ
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export function IntegrationsPanel() {
  const plan = useDemoStore((state) => state.planId);
  const logs = useDemoStore((state) => state.notifications);
  const [selected, setSelected] = useState<SimulatedIntegration | null>(null);
  const [connected, setConnected] = useState(["browser"]);

  const toggleSimulation = (item: SimulatedIntegration) => {
    const next = connected.includes(item.id)
      ? connected.filter((id) => id !== item.id)
      : [...connected, item.id];
    setConnected(next);
    void services.notifications.notify({
      title: `${next.includes(item.id) ? "เปิด" : "ปิด"} ${item.name}`,
      message: "อัปเดตสถานะ Connector แล้ว",
      channel: item.channel,
    });
    setSelected(null);
  };

  return (
    <>
      <PageHeader
        title="Integration และการแจ้งเตือน"
        description="เชื่อม Discord Webhook แบบ server-side และตรวจสอบเหตุการณ์แจ้งเตือนของร้าน"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DiscordIntegrationCard plan={plan} />
        {simulatedIntegrations.map((item) => {
          const allowed = !item.feature || canUseFeature(plan, item.feature);
          const active = connected.includes(item.id);
          return (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                  <item.icon aria-hidden="true" />
                </span>
                {active
                  ? <Badge variant="success"><CheckCircle2 className="size-3" />เปิด</Badge>
                  : <Badge variant="secondary">ปิด</Badge>}
              </div>
              <h2 className="mt-4 font-bold">{item.name}</h2>
              <p className="mt-1 min-h-12 text-xs text-muted-foreground">{item.description}</p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                disabled={!allowed}
                onClick={() => setSelected(item)}
              >
                {allowed ? <><Plug />ตั้งค่า</> : <><LockKeyhole />Professional</>}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-bold">Notification log</h2>
          <p className="text-xs text-muted-foreground">เหตุการณ์ล่าสุดที่บริการ Notification บันทึกไว้</p>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {logs.length ? logs.map((log) => (
            <div key={log.id} className="flex items-start justify-between gap-4 border-b p-4 last:border-0">
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                  <Bot className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold">{log.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{log.message}</p>
                  <Badge variant="outline" className="mt-2">{log.channel}</Badge>
                </div>
              </div>
              <time className="shrink-0 text-[10px] text-muted-foreground">
                {formatDateTime(log.createdAt)}
              </time>
            </div>
          )) : (
            <p className="p-10 text-center text-sm text-muted-foreground">ยังไม่มี log</p>
          )}
        </div>
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>
              Connector นี้ยังไม่เปิดใช้งานและยังไม่รองรับ API key หรือ token
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted p-5">
            <p className="text-sm font-bold">การทำงานของ Connector</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• อัปเดตสถานะใน UI</li>
              <li>• เพิ่มรายการใน Notification log</li>
              <li>• แสดง Toast ภายใน Browser</li>
              <li>• ไม่ส่งข้อมูลออกนอกระบบ</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>ยกเลิก</Button>
            {selected && (
              <Button onClick={() => toggleSimulation(selected)}>
                {connected.includes(selected.id) ? "ปิด Connector" : "เปิด Connector"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
