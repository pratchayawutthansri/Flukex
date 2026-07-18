import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
  normalizeDiscordWebhookUrl,
} from "./discord-webhook";

const PROVIDER = "DISCORD";

function getEncryptionSecret() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!secret) throw new Error("ยังไม่ได้ตั้งค่า INTEGRATION_ENCRYPTION_KEY บนเซิร์ฟเวอร์");
  return secret;
}

export async function getDiscordWebhook(
  serviceClient: SupabaseClient,
  tenantId: string,
): Promise<{ url: string; source: "environment" | "database" } | null> {
  const environmentUrl = process.env.DISCORD_WEBHOOK_URL;
  if (environmentUrl) {
    return { url: normalizeDiscordWebhookUrl(environmentUrl), source: "environment" };
  }

  const { data, error } = await serviceClient
    .from("tenant_integrations")
    .select("encrypted_secret")
    .eq("tenant_id", tenantId)
    .eq("provider", PROVIDER)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.encrypted_secret) return null;

  return {
    url: normalizeDiscordWebhookUrl(
      decryptIntegrationSecret(data.encrypted_secret as string, getEncryptionSecret()),
    ),
    source: "database",
  };
}

export async function saveDiscordWebhook(
  serviceClient: SupabaseClient,
  input: { tenantId: string; userId: string; webhookUrl: string },
) {
  if (process.env.DISCORD_WEBHOOK_URL) {
    throw new Error("Webhook ถูกกำหนดจาก Environment Variable จึงแก้จากหน้าเว็บไม่ได้");
  }

  const normalized = normalizeDiscordWebhookUrl(input.webhookUrl);
  const encryptedSecret = encryptIntegrationSecret(normalized, getEncryptionSecret());
  const { error } = await serviceClient.from("tenant_integrations").upsert({
    tenant_id: input.tenantId,
    provider: PROVIDER,
    encrypted_secret: encryptedSecret,
    created_by: input.userId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "tenant_id,provider" });
  if (error) throw new Error(error.message);
}

export async function removeDiscordWebhook(serviceClient: SupabaseClient, tenantId: string) {
  if (process.env.DISCORD_WEBHOOK_URL) {
    throw new Error("Webhook ถูกกำหนดจาก Environment Variable กรุณาลบจากระบบ Hosting");
  }
  const { error } = await serviceClient
    .from("tenant_integrations")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("provider", PROVIDER);
  if (error) throw new Error(error.message);
}
