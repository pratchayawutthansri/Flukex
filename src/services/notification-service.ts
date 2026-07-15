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

export class MockDiscordNotificationService extends BrowserNotificationService {}
export class MockLineNotificationService extends BrowserNotificationService {}
export class MockTelegramNotificationService extends BrowserNotificationService {}

export class DiscordWebhookNotificationService implements NotificationService {
  async notify(): Promise<void> { throw new Error("Discord webhook is disabled in demo mode"); }
}
export class LineMessagingNotificationService implements NotificationService {
  async notify(): Promise<void> { throw new Error("LINE Messaging API is disabled in demo mode"); }
}
export class TelegramBotNotificationService implements NotificationService {
  async notify(): Promise<void> { throw new Error("Telegram Bot API is disabled in demo mode"); }
}
