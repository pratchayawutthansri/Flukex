import { DEMO_ACCOUNTS, DEMO_TENANT_ID } from "@/data/mock-data";
import type { DemoSession } from "@/domain/types";
import type { AuthCredentials, AuthService, RegistrationInput } from "./contracts";
import { browserStorage, STORAGE_KEYS } from "./storage";

interface RegisteredUser extends RegistrationInput { id: string; tenantId: string }

const wait = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration));

export class MockAuthService implements AuthService {
  async login(credentials: AuthCredentials): Promise<DemoSession> {
    await wait();
    const account = DEMO_ACCOUNTS.find((item) => item.email === credentials.email && item.password === credentials.password);
    const registered = browserStorage
      .get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, [])
      .find((item) => item.email === credentials.email && item.password === credentials.password);

    if (!account && !registered) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาใช้บัญชีเดโมที่แสดงไว้");

    const session: DemoSession = {
      userId: registered?.id ?? `user_${account?.role.toLowerCase()}`,
      tenantId: registered?.tenantId ?? (account?.role === "PLATFORM_ADMIN" ? "platform_flukex" : DEMO_TENANT_ID),
      name: registered?.name ?? account?.name ?? credentials.email,
      email: credentials.email,
      role: account?.role ?? "OWNER",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    browserStorage.set(STORAGE_KEYS.session, session);
    return session;
  }

  async register(input: RegistrationInput): Promise<DemoSession> {
    await wait(500);
    const users = browserStorage.get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, []);
    if (users.some((user) => user.email === input.email)) throw new Error("อีเมลนี้ถูกลงทะเบียนในเดโมแล้ว");
    const user = { ...input, id: `registered_${Date.now()}`, tenantId: `tenant_${Date.now()}` };
    browserStorage.set(STORAGE_KEYS.registeredUsers, [...users, user]);
    return this.login(input);
  }

  async logout() {
    browserStorage.remove(STORAGE_KEYS.session);
  }

  async getSession() {
    const session = browserStorage.get<DemoSession | null>(STORAGE_KEYS.session, null);
    if (!session || new Date(session.expiresAt).getTime() < Date.now()) return null;
    const account = DEMO_ACCOUNTS.find((item) => item.email === session.email);
    return { ...session, name: session.name || account?.name || session.email };
  }

  async resetPassword(email: string) {
    await wait(600);
    if (!email.includes("@")) throw new Error("กรุณากรอกอีเมลให้ถูกต้อง");
  }
}
