import type { DemoSession, UserRole } from "@/domain/types";
import type {
  AuthCredentials,
  AuthService,
  MemberPasswordResetInput,
  RegistrationInput,
  TemporaryCredential,
} from "../contracts";
import { createBrowserSupabaseClient } from "./supabase-client";

type BrowserSupabaseClient = ReturnType<typeof createBrowserSupabaseClient>;

// Platform admins have no tenant membership row; sessions use an empty tenantId sentinel.
const PLATFORM_TENANT_ID = "";

export class SupabaseAuthService implements AuthService {
  private async loadSession(client: BrowserSupabaseClient, userId: string, expiresAtSeconds?: number): Promise<DemoSession> {
    const expiresAt = new Date((expiresAtSeconds ?? Math.floor(Date.now() / 1000) + 86400) * 1000).toISOString();

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("name, email, is_platform_admin")
      .eq("id", userId)
      .single();
    if (profileError || !profile) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");

    if (profile.is_platform_admin) {
      return {
        userId,
        tenantId: PLATFORM_TENANT_ID,
        name: profile.name,
        email: profile.email,
        role: "PLATFORM_ADMIN",
        expiresAt,
      };
    }

    const { data: membership, error: membershipError } = await client
      .from("memberships")
      .select("tenant_id, role")
      .eq("user_id", userId)
      .single();
    if (membershipError || !membership) throw new Error("บัญชีนี้ยังไม่ได้เชื่อมกับร้านค้าใด");

    const { data: restaurant } = await client
      .from("restaurants")
      .select("name")
      .eq("tenant_id", membership.tenant_id)
      .single();

    return {
      userId,
      tenantId: membership.tenant_id,
      name: profile.name,
      email: profile.email,
      role: membership.role as UserRole,
      restaurantName: restaurant?.name,
      expiresAt,
    };
  }

  async login(credentials: AuthCredentials): Promise<DemoSession> {
    const client = createBrowserSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });
    if (error || !data.session || !data.user) {
      throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่ได้รับจากผู้ดูแล");
    }
    return this.loadSession(client, data.user.id, data.session.expires_at);
  }

  async register(input: RegistrationInput): Promise<DemoSession> {
    const client = createBrowserSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error) throw new Error(error.message);
    if (!data.session || !data.user) {
      // "Confirm email" is enabled in Supabase Auth settings — disable it for this
      // instant-registration flow, or add an email-confirmation step in the UI.
      throw new Error("ลงทะเบียนสำเร็จ กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ");
    }

    const { error: bootstrapError } = await client.rpc("bootstrap_tenant", {
      p_restaurant_name: input.restaurantName,
    });
    if (bootstrapError) throw new Error(bootstrapError.message);

    return this.loadSession(client, data.user.id, data.session.expires_at);
  }

  async logout(): Promise<void> {
    const client = createBrowserSupabaseClient();
    await client.auth.signOut();
  }

  async getSession(): Promise<DemoSession | null> {
    const client = createBrowserSupabaseClient();
    const { data } = await client.auth.getSession();
    if (!data.session?.user) return null;
    return this.loadSession(client, data.session.user.id, data.session.expires_at);
  }

  async resetPassword(email: string): Promise<void> {
    const client = createBrowserSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    });
    if (error) throw new Error(error.message);
  }

  async resetMemberPassword(input: MemberPasswordResetInput): Promise<TemporaryCredential> {
    const response = await fetch("/api/platform-admin/reset-member-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "ไม่สามารถรีเซ็ตรหัสผ่านได้");
    }
    return response.json();
  }
}
