import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DISCORD_WEBHOOK_HOSTS = new Set(["discord.com", "discordapp.com"]);
const WEBHOOK_PATH = /^\/api\/webhooks\/\d+\/[A-Za-z0-9._-]+$/;

function encryptionKey(secret: string) {
  if (secret.length < 32) {
    throw new Error("INTEGRATION_ENCRYPTION_KEY ต้องมีอย่างน้อย 32 ตัวอักษร");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function normalizeDiscordWebhookUrl(value: string) {
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("รูปแบบ Discord Webhook URL ไม่ถูกต้อง");
  }

  if (
    parsed.protocol !== "https:"
    || !DISCORD_WEBHOOK_HOSTS.has(parsed.hostname.toLowerCase())
    || !WEBHOOK_PATH.test(parsed.pathname)
    || parsed.username
    || parsed.password
    || parsed.search
    || parsed.hash
  ) {
    throw new Error("กรุณาใช้ Webhook URL จาก discord.com เท่านั้น");
  }

  return `${parsed.origin}${parsed.pathname}`;
}

export function encryptIntegrationSecret(value: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptIntegrationSecret(value: string, secret: string) {
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("ข้อมูล Webhook ที่เข้ารหัสไม่สมบูรณ์");
  const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(secret), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  input: { title: string; message: string; restaurantName?: string },
) {
  const url = normalizeDiscordWebhookUrl(webhookUrl);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Flukex POS",
      allowed_mentions: { parse: [] },
      embeds: [{
        title: input.title.slice(0, 256),
        description: input.message.slice(0, 4_096),
        color: 0xd71920,
        footer: { text: input.restaurantName ? `Flukex POS • ${input.restaurantName}` : "Flukex POS" },
        timestamp: new Date().toISOString(),
      }],
    }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(response.status === 429
      ? "Discord จำกัดจำนวนการส่งชั่วคราว กรุณารอสักครู่"
      : `Discord ตอบกลับด้วยสถานะ ${response.status}`);
  }
}
