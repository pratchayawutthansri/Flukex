import type { RealtimeChannel } from "@supabase/supabase-js";
import type { RealtimeEvent, RealtimeService } from "./contracts";
import { createBrowserSupabaseClient } from "./supabase/supabase-client";

const REALTIME_BROADCAST_EVENT = "flukex-event";

const CHANNEL_NAME = "flukex-pos-demo";

export class BrowserRealtimeService implements RealtimeService {
  private channel: BroadcastChannel | null = null;

  private getChannel() {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
    this.channel ??= new BroadcastChannel(CHANNEL_NAME);
    return this.channel;
  }

  publish<T>(event: RealtimeEvent<T>) {
    this.getChannel()?.postMessage(event);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("flukex:realtime", { detail: event }));
  }

  subscribe(listener: (event: RealtimeEvent) => void) {
    const channel = this.getChannel();
    const channelHandler = (event: MessageEvent<RealtimeEvent>) => listener(event.data);
    const localHandler = (event: Event) => listener((event as CustomEvent<RealtimeEvent>).detail);
    channel?.addEventListener("message", channelHandler);
    if (typeof window !== "undefined") window.addEventListener("flukex:realtime", localHandler);
    return () => {
      channel?.removeEventListener("message", channelHandler);
      if (typeof window !== "undefined") window.removeEventListener("flukex:realtime", localHandler);
    };
  }
}

// Scopes events to a per-tenant broadcast channel ("tenant-{tenantId}"), authorized by
// the Realtime Authorization RLS policies on realtime.messages in
// supabase/migrations/0009_realtime_authorization.sql. Preserves the same RealtimeEvent
// shape/API as BrowserRealtimeService above, so KDS/POS/QR components don't change.
export class SupabaseRealtimeService implements RealtimeService {
  private client = createBrowserSupabaseClient();
  private tenantIdPromise: Promise<string | null> | null = null;
  private channelPromise: Promise<RealtimeChannel | null> | null = null;
  private readonly listeners = new Set<(event: RealtimeEvent) => void>();

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

  private async getChannel(): Promise<RealtimeChannel | null> {
    this.channelPromise ??= (async () => {
      const tenantId = await this.resolveTenantId();
      if (!tenantId) return null;
      const channel = this.client.channel(`tenant-${tenantId}`);
      channel.on("broadcast", { event: REALTIME_BROADCAST_EVENT }, ({ payload }) => {
        for (const listener of this.listeners) listener(payload as RealtimeEvent);
      });
      return new Promise<RealtimeChannel>((resolve) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") resolve(channel);
        });
      });
    })();
    return this.channelPromise;
  }

  publish<T>(event: RealtimeEvent<T>) {
    void this.getChannel().then((channel) => {
      channel?.send({ type: "broadcast", event: REALTIME_BROADCAST_EVENT, payload: event });
    });
  }

  subscribe(listener: (event: RealtimeEvent) => void) {
    this.listeners.add(listener);
    void this.getChannel();
    return () => {
      this.listeners.delete(listener);
    };
  }
}
