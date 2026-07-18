import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"),
});

const registrationFields = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อ"),
  email: z.email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  restaurantName: z.string().min(2, "กรุณากรอกชื่อร้าน"),
});

function passwordsMatch<T extends z.infer<typeof registrationFields>>(schema: z.ZodType<T>) {
  return schema.refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    path: ["confirmPassword"],
  });
}

export const registrationSchema = passwordsMatch(registrationFields);

export const staffRegistrationSchema = passwordsMatch(registrationFields.extend({
  approverEmail: z.email("กรุณากรอกอีเมลเจ้าของร้านหรือผู้จัดการให้ถูกต้อง"),
}));

export const staffJoinDecisionSchema = z.object({
  requestId: z.string().min(1),
  role: z.enum(["MANAGER", "CASHIER", "KITCHEN", "BAR"]),
  branchIds: z.array(z.string().min(1)),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(2),
  price: z.coerce.number().nonnegative(),
  categoryId: z.string().min(1),
  station: z.enum(["KITCHEN", "BAR"]),
});

export const tableSchema = z.object({
  name: z.string().min(1),
  seats: z.coerce.number().int().min(1).max(30),
});
