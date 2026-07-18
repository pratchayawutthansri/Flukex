"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useAuthSession } from "@/components/auth/auth-session-provider";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  canDeleteEmployee,
  canManageEmployee,
  getAssignableEmployeeRoles,
  STAFF_ROLE_LABELS,
} from "@/config/employee-permissions";
import type { DemoUser, UserRole } from "@/domain/types";
import { createId } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";

interface EmployeeFormState {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  branchIds: string[];
  createdAt?: string;
}

const EMPTY_FORM: EmployeeFormState = {
  name: "",
  email: "",
  role: "CASHIER",
  branchIds: [],
};

export function EmployeeManager() {
  const { session } = useAuthSession();
  const users = useDemoStore((state) => state.users);
  const branches = useDemoStore((state) => state.branches);
  const saveUser = useDemoStore((state) => state.saveUser);
  const removeUser = useDemoStore((state) => state.removeUser);
  const actorRole = session?.role === "MANAGER" ? "MANAGER" : "OWNER";
  const assignableRoles = getAssignableEmployeeRoles(actorRole);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DemoUser | null>(null);

  const branchNames = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch.name])),
    [branches],
  );

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      role: assignableRoles[0] ?? "CASHIER",
      branchIds: branches[0] ? [branches[0].id] : [],
    });
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (user: DemoUser) => {
    setForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchIds: user.branchIds,
      createdAt: user.createdAt,
    });
    setFormError("");
    setFormOpen(true);
  };

  const toggleBranch = (branchId: string) => {
    setForm((current) => ({
      ...current,
      branchIds: current.branchIds.includes(branchId)
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId],
    }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");
    const normalizedEmail = form.email.trim().toLowerCase();
    const duplicateEmail = users.some(
      (user) => user.id !== form.id && user.email.trim().toLowerCase() === normalizedEmail,
    );

    if (duplicateEmail) {
      setFormError("อีเมลนี้มีบัญชีอยู่ในร้านแล้ว");
      return;
    }
    if (!assignableRoles.includes(form.role)) {
      setFormError("คุณไม่มีสิทธิ์กำหนดบทบาทนี้");
      return;
    }
    if (branches.length > 0 && form.branchIds.length === 0) {
      setFormError("กรุณาเลือกอย่างน้อย 1 สาขา");
      return;
    }

    const now = new Date().toISOString();
    saveUser({
      id: form.id ?? createId("user"),
      tenantId: useDemoStore.getState().activeTenantId,
      name: form.name.trim(),
      email: normalizedEmail,
      role: form.role,
      branchIds: form.branchIds,
      createdAt: form.createdAt ?? now,
      updatedAt: now,
    });
    setFormOpen(false);
    void services.notifications.notify({
      title: form.id ? "แก้ไขพนักงานแล้ว" : "เพิ่มพนักงานแล้ว",
      message: form.id
        ? `อัปเดตข้อมูลของ ${form.name.trim()} เรียบร้อย`
        : `เพิ่ม ${form.name.trim()} ในร้านเรียบร้อย`,
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget || !session) return;
    if (!canDeleteEmployee(actorRole, deleteTarget.role, session.email, deleteTarget.email)) return;
    removeUser(deleteTarget.id);
    void services.notifications.notify({
      title: "ลบพนักงานแล้ว",
      message: `${deleteTarget.name} ถูกนำออกจากร้าน`,
    });
    setDeleteTarget(null);
  };

  return (
    <>
      <PageHeader
        title="พนักงาน"
        description="เพิ่ม แก้ไข ลบ กำหนดบทบาท และเลือกสาขาที่พนักงานเข้าถึงได้"
        actions={
          <Button onClick={openCreate} disabled={assignableRoles.length === 0}>
            <Plus />
            เพิ่มพนักงาน
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Card className="flex items-start gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">
              {actorRole === "OWNER" ? "สิทธิ์เจ้าของร้าน" : "สิทธิ์ผู้จัดการร้าน"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {actorRole === "OWNER"
                ? "จัดการผู้จัดการและทีมปฏิบัติการได้ โดยบัญชีเจ้าของร้านจะถูกป้องกัน"
                : "จัดการได้เฉพาะแคชเชียร์ พนักงานครัว และพนักงานบาร์"}
            </p>
          </div>
        </Card>
        <Card className="flex items-start gap-3 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
            <UsersRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">พนักงานไม่ต้องสมัครสร้างร้านใหม่</p>
            <p className="mt-1 text-sm text-muted-foreground">
              เจ้าของหรือผู้จัดการเพิ่มบัญชีจากหน้านี้ แล้วกำหนดบทบาทและสาขาให้
            </p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-4">พนักงาน</th>
                <th className="p-4">อีเมล</th>
                <th className="p-4">บทบาท</th>
                <th className="p-4">สาขา</th>
                <th className="p-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const manageable = canManageEmployee(actorRole, user.role);
                const deletable = session
                  ? canDeleteEmployee(actorRole, user.role, session.email, user.email)
                  : false;
                const assignedBranches = user.branchIds
                  .map((id) => branchNames.get(id))
                  .filter(Boolean);

                return (
                  <tr key={user.id} className="border-t">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                          <UserRound className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                          <strong>{user.name}</strong>
                          {session?.email.toLowerCase() === user.email.toLowerCase() && (
                            <p className="mt-0.5 text-xs text-muted-foreground">บัญชีของคุณ</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Mail className="size-4" aria-hidden="true" />
                        {user.email}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.role === "OWNER" ? "default" : "secondary"}>
                        {STAFF_ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="flex items-start gap-2">
                        <Building2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {assignedBranches.length > 0 ? assignedBranches.join(", ") : "ทุกสาขา"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`แก้ไข ${user.name}`}
                          disabled={!manageable}
                          onClick={() => openEdit(user)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          aria-label={`ลบ ${user.name}`}
                          disabled={!deletable}
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}</DialogTitle>
            <DialogDescription>
              พนักงานจะอยู่ภายใต้ร้านนี้เท่านั้น และเห็นข้อมูลตามบทบาทกับสาขาที่กำหนด
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employee-name">ชื่อพนักงาน</Label>
                <Input
                  id="employee-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee-email">อีเมลเข้าสู่ระบบ</Label>
                <Input
                  id="employee-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-role">บทบาท</Label>
              <select
                id="employee-role"
                className="min-h-11 w-full rounded-lg border bg-card px-3"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as UserRole }))}
              >
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>{STAFF_ROLE_LABELS[role]}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                ไม่อนุญาตให้เพิ่มหรือโอนสิทธิ์เจ้าของร้านจากหน้าพนักงาน
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">สาขาที่เข้าถึงได้</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {branches.map((branch) => (
                  <label
                    key={branch.id}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={form.branchIds.includes(branch.id)}
                      onChange={() => toggleBranch(branch.id)}
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm font-medium">{branch.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {formError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit">{form.id ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบพนักงาน</DialogTitle>
            <DialogDescription>
              {deleteTarget
                ? `บัญชี ${deleteTarget.name} จะถูกนำออกจากร้านและไม่ควรเข้าถึงข้อมูลร้านได้อีก`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              ยกเลิก
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              <Trash2 />
              ลบพนักงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
