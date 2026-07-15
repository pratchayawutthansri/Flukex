import type { RealtimeEvent, RealtimeService } from "./contracts";

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

// Production adapter contract placeholder. It intentionally does not import Supabase.
export class SupabaseRealtimeService implements RealtimeService {
  publish(): void { throw new Error("Supabase Realtime is not enabled in demo mode"); }
  subscribe(): () => void { throw new Error("Supabase Realtime is not enabled in demo mode"); }
}
