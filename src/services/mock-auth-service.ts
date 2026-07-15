import { DEMO_ACCOUNTS, DEMO_TENANT_ID } from "@/data/mock-data";
import type { DemoSession } from "@/domain/types";
import type {
  AuthCredentials,
  AuthService,
  MemberPasswordResetInput,
  RegistrationInput,
  TemporaryCredential,
} from "./contracts";
import { browserStorage, STORAGE_KEYS } from "./storage";

interface RegisteredUser extends RegistrationInput { id: string; tenantId: string }
type PasswordOverrides = Record<string, string>;

const wait = (duration = 350) => new Promise((resolve) => setTimeout(resolve, duration));
const TEMPORARY_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateTemporaryPassword(randomBytes?: Uint8Array) {
  const bytes = randomBytes ?? globalThis.crypto.getRandomValues(new Uint8Array(8));
  if (bytes.length < 8) throw new Error("ต้องใช้ข้อมูลสุ่มอย่างน้อย 8 ไบต์");
  const randomPart = Array.from(bytes.slice(0, 8), (value) => TEMPORARY_PASSWORD_ALPHABET[value % TEMPORARY_PASSWORD_ALPHABET.length]).join("");
  return `Fx7!${randomPart}`;
}

export class MockAuthService implements AuthService {
  async login(credentials: AuthCredentials): Promise<DemoSession> {
    await wait();
    const email = credentials.email.trim().toLowerCase();
    const passwordOverrides = browserStorage.get<PasswordOverrides>(STORAGE_KEYS.passwordOverrides, {});
    const demoAccount = DEMO_ACCOUNTS.find((item) => item.email === email);
    const account = demoAccount && (passwordOverrides[email] ?? demoAccount.password) === credentials.password ? demoAccount : undefined;
    const registered = browserStorage
      .get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, [])
      .find((item) => item.email.toLowerCase() === email && item.password === credentials.password);

    if (!account && !registered) throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบข้อมูลที่ได้รับจากผู้ดูแล");

    const session: DemoSession = {
      userId: registered?.id ?? `user_${account?.role.toLowerCase()}`,
      tenantId: registered?.tenantId ?? (account?.role === "PLATFORM_ADMIN" ? "platform_flukex" : DEMO_TENANT_ID),
      name: registered?.name ?? account?.name ?? email,
      email,
      role: account?.role ?? "OWNER",
      restaurantName: registered?.restaurantName,
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

  async resetMemberPassword(input: MemberPasswordResetInput): Promise<TemporaryCredential> {
    await wait(450);
    const adminSession = browserStorage.get<DemoSession | null>(STORAGE_KEYS.session, null);
    if (adminSession?.role !== "PLATFORM_ADMIN") throw new Error("เฉพาะผู้ดูแลแพลตฟอร์มเท่านั้นที่รีเซ็ตรหัสสมาชิกได้");

    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) throw new Error("อีเมลสมาชิกไม่ถูกต้อง");

    const demoAccount = DEMO_ACCOUNTS.find((item) => item.email === email);
    if (demoAccount?.role === "PLATFORM_ADMIN") throw new Error("ไม่สามารถรีเซ็ตรหัสผู้ดูแลแพลตฟอร์มจากรายการสมาชิกได้");

    const temporaryPassword = generateTemporaryPassword();
    if (demoAccount) {
      const overrides = browserStorage.get<PasswordOverrides>(STORAGE_KEYS.passwordOverrides, {});
      browserStorage.set(STORAGE_KEYS.passwordOverrides, { ...overrides, [email]: temporaryPassword });
    } else {
      const users = browserStorage.get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, []);
      const existingIndex = users.findIndex((user) => user.email.toLowerCase() === email);
      const registeredUser: RegisteredUser = existingIndex >= 0
        ? { ...users[existingIndex], password: temporaryPassword }
        : {
            id: `registered_${Date.now()}`,
            tenantId: input.tenantId,
            name: input.name,
            email,
            password: temporaryPassword,
            restaurantName: input.restaurantName,
          };
      const nextUsers = existingIndex >= 0
        ? users.map((user, index) => index === existingIndex ? registeredUser : user)
        : [...users, registeredUser];
      browserStorage.set(STORAGE_KEYS.registeredUsers, nextUsers);
    }

    return { email, temporaryPassword };
  }
}
