import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationInput, NotificationService } from "./contracts";

function playBrowserAlert() {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.setValueAtTime(740, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.18);
  gain.gain.setValueAtTime(0.08, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
  oscillator.addEventListener("ended", () => void context.close());
}

export class BrowserNotificationService implements NotificationService {
  async notify(input: NotificationInput) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("flukex:notification", { detail: input }));
    if (input.audible) playBrowserAlert();
  }
}

// Persists to notification_logs, shows the browser toast/audio, and requests
// server-side Discord delivery when that tenant has configured a webhook.
export class SupabaseNotificationService extends BrowserNotificationService implements NotificationService {
  private tenantIdPromise: Promise<string | null> | null = null;

  constructor(private readonly client: SupabaseClient) {
    super();
  }

  private async resolveTenantId(): Promise<string | null> {
    this.tenantIdPromise ??= (async () => {
      const { data: userData } = await this.client.auth.getUser();
      if (!userData.user) return null;
      const { data } = await this.client
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      return (data?.tenant_id as string | undefined) ?? null;
    })();
    return this.tenantIdPromise;
  }

  async notify(input: NotificationInput) {
    await super.notify(input);
    const tenantId = await this.resolveTenantId();
    if (!tenantId) return;
    await this.client.from("notification_logs").insert({
      tenant_id: tenantId,
      title: input.title,
      message: input.message,
      channel: input.channel ?? "BROWSER",
    });
    if (!input.channel || input.channel === "BROWSER") {
      void fetch("/api/integrations/discord/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.title, message: input.message }),
      }).catch(() => undefined);
    }
  }
}

export class MockDiscordNotificationService extends BrowserNotificationService {}
export class MockLineNotificationService extends BrowserNotificationService {}
export class MockTelegramNotificationService extends BrowserNotificationService {}

export class LineMessagingNotificationService implements NotificationService {
  async notify(): Promise<void> { throw new Error("LINE Messaging API is disabled in demo mode"); }
}
export class TelegramBotNotificationService implements NotificationService {
  async notify(): Promise<void> { throw new Error("Telegram Bot API is disabled in demo mode"); }
}
