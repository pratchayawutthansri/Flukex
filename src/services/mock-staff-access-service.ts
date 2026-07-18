import { getAssignableEmployeeRoles } from "@/config/employee-permissions";
import { createDefaultDemoData, DEMO_ACCOUNTS, DEMO_TENANT_ID } from "@/data/mock-data";
import type { DemoSession, DemoUser, StaffJoinRequest, StaffRole, UserRole } from "@/domain/types";
import { createId } from "@/lib/utils";
import type {
  StaffAccessDecisionInput,
  StaffAccessRequestInput,
  StaffAccessRequestReceipt,
  StaffAccessService,
} from "./contracts";
import type { RegisteredUser } from "./mock-auth-service";
import { browserStorage, STORAGE_KEYS } from "./storage";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("th-TH");
}

function requireManagerSession() {
  const session = browserStorage.get<DemoSession | null>(STORAGE_KEYS.session, null);
  if (!session || (session.role !== "OWNER" && session.role !== "MANAGER")) {
    throw new Error("เฉพาะเจ้าของร้านหรือผู้จัดการเท่านั้นที่จัดการคำขอพนักงานได้");
  }
  return session;
}

function findMockTenant(input: StaffAccessRequestInput, users: RegisteredUser[]) {
  const restaurantName = normalize(input.restaurantName);
  const approverEmail = normalize(input.approverEmail);
  const defaultRestaurant = createDefaultDemoData().restaurants[0];
  const demoApprover = DEMO_ACCOUNTS.find((account) => (
    normalize(account.email) === approverEmail
    && (account.role === "OWNER" || account.role === "MANAGER")
  ));
  if (demoApprover && defaultRestaurant && normalize(defaultRestaurant.name) === restaurantName) {
    return DEMO_TENANT_ID;
  }

  const registeredApprover = users.find((user) => (
    normalize(user.email) === approverEmail
    && user.status !== "PENDING"
    && user.status !== "REJECTED"
    && (user.role === undefined || user.role === "OWNER" || user.role === "MANAGER")
    && normalize(user.restaurantName) === restaurantName
    && Boolean(user.tenantId)
  ));
  return registeredApprover?.tenantId;
}

export class MockStaffAccessService implements StaffAccessService {
  async request(input: StaffAccessRequestInput): Promise<StaffAccessRequestReceipt> {
    const normalizedEmail = normalize(input.email);
    const users = browserStorage.get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, []);
    const existing = users.find((user) => normalize(user.email) === normalizedEmail);
    const isDemoAccount = DEMO_ACCOUNTS.some((account) => normalize(account.email) === normalizedEmail);
    if (isDemoAccount || (existing && existing.status !== "REJECTED")) {
      throw new Error("อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบหรือติดต่อผู้ดูแลร้าน");
    }

    const tenantId = findMockTenant(input, users);
    if (!tenantId) {
      throw new Error("ไม่พบร้านที่ตรงกับชื่อร้านและอีเมลผู้อนุมัติ กรุณาตรวจสอบข้อมูลกับเจ้าของร้าน");
    }

    const now = new Date().toISOString();
    const applicantUserId = existing?.id ?? createId("registered");
    const registeredUser: RegisteredUser = {
      id: applicantUserId,
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
      restaurantName: input.restaurantName.trim(),
      status: "PENDING",
    };
    browserStorage.set(
      STORAGE_KEYS.registeredUsers,
      existing
        ? users.map((user) => user.id === existing.id ? registeredUser : user)
        : [...users, registeredUser],
    );

    const request: StaffJoinRequest = {
      id: createId("staff-request"),
      tenantId,
      applicantUserId,
      applicantName: input.name.trim(),
      applicantEmail: normalizedEmail,
      restaurantName: input.restaurantName.trim(),
      approverEmail: normalize(input.approverEmail),
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };
    const requests = browserStorage.get<StaffJoinRequest[]>(STORAGE_KEYS.staffJoinRequests, []);
    browserStorage.set(STORAGE_KEYS.staffJoinRequests, [request, ...requests]);

    return {
      id: request.id,
      applicantEmail: request.applicantEmail,
      restaurantName: request.restaurantName,
      status: request.status,
    };
  }

  async listPending(): Promise<StaffJoinRequest[]> {
    const session = requireManagerSession();
    return browserStorage
      .get<StaffJoinRequest[]>(STORAGE_KEYS.staffJoinRequests, [])
      .filter((request) => request.tenantId === session.tenantId && request.status === "PENDING")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async approve(input: StaffAccessDecisionInput): Promise<DemoUser> {
    const session = requireManagerSession();
    const requests = browserStorage.get<StaffJoinRequest[]>(STORAGE_KEYS.staffJoinRequests, []);
    const request = requests.find((item) => item.id === input.requestId);
    if (!request || request.tenantId !== session.tenantId || request.status !== "PENDING") {
      throw new Error("ไม่พบคำขอที่รออนุมัติ");
    }
    const actorRole = session.role as UserRole;
    if (!getAssignableEmployeeRoles(actorRole).includes(input.role)) {
      throw new Error("คุณไม่มีสิทธิ์กำหนดบทบาทนี้");
    }

    const users = browserStorage.get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, []);
    const registered = users.find((user) => user.id === request.applicantUserId);
    if (!registered) throw new Error("ไม่พบบัญชีผู้สมัคร");

    const now = new Date().toISOString();
    browserStorage.set(
      STORAGE_KEYS.registeredUsers,
      users.map((user) => user.id === registered.id
        ? { ...user, tenantId: session.tenantId, role: input.role, status: "ACTIVE" }
        : user),
    );
    browserStorage.set(
      STORAGE_KEYS.staffJoinRequests,
      requests.map((item) => item.id === request.id
        ? { ...item, status: "APPROVED", reviewedAt: now, reviewedBy: session.email, updatedAt: now }
        : item),
    );

    return {
      id: registered.id,
      tenantId: session.tenantId,
      name: request.applicantName,
      email: request.applicantEmail,
      role: input.role as StaffRole,
      branchIds: input.branchIds,
      createdAt: request.createdAt,
      updatedAt: now,
    };
  }

  async reject(requestId: string): Promise<void> {
    const session = requireManagerSession();
    const requests = browserStorage.get<StaffJoinRequest[]>(STORAGE_KEYS.staffJoinRequests, []);
    const request = requests.find((item) => item.id === requestId);
    if (!request || request.tenantId !== session.tenantId || request.status !== "PENDING") {
      throw new Error("ไม่พบคำขอที่รออนุมัติ");
    }
    const now = new Date().toISOString();
    browserStorage.set(
      STORAGE_KEYS.staffJoinRequests,
      requests.map((item) => item.id === request.id
        ? { ...item, status: "REJECTED", reviewedAt: now, reviewedBy: session.email, updatedAt: now }
        : item),
    );
    const users = browserStorage.get<RegisteredUser[]>(STORAGE_KEYS.registeredUsers, []);
    browserStorage.set(
      STORAGE_KEYS.registeredUsers,
      users.map((user) => user.id === request.applicantUserId ? { ...user, status: "REJECTED" } : user),
    );
  }
}
