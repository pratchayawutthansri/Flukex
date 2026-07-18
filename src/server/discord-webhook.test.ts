import { describe, expect, it } from "vitest";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
  normalizeDiscordWebhookUrl,
} from "./discord-webhook";

describe("Discord webhook security", () => {
  it("accepts only official Discord webhook URLs", () => {
    expect(normalizeDiscordWebhookUrl("https://discord.com/api/webhooks/123456/token_ABC-xyz"))
      .toBe("https://discord.com/api/webhooks/123456/token_ABC-xyz");
    expect(() => normalizeDiscordWebhookUrl("https://example.com/api/webhooks/123/token"))
      .toThrow("discord.com");
    expect(() => normalizeDiscordWebhookUrl("http://discord.com/api/webhooks/123/token"))
      .toThrow("discord.com");
    expect(() => normalizeDiscordWebhookUrl("https://discord.com/api/webhooks/123/token?redirect=x"))
      .toThrow("discord.com");
  });

  it("encrypts the webhook without retaining plaintext", () => {
    const key = "this-is-a-production-style-encryption-key";
    const webhook = "https://discord.com/api/webhooks/123456/token_ABC-xyz";
    const encrypted = encryptIntegrationSecret(webhook, key);
    expect(encrypted).not.toContain(webhook);
    expect(decryptIntegrationSecret(encrypted, key)).toBe(webhook);
  });

  it("rejects weak encryption keys", () => {
    expect(() => encryptIntegrationSecret("secret", "too-short")).toThrow("32");
  });
});
