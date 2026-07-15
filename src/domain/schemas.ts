import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(4, "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"),
});

export const registrationSchema = z.object({
  name: z.string().min(2, "กรุณากรอกชื่อ"),
  email: z.email("กรุณากรอกอีเมลให้ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  restaurantName: z.string().min(2, "กรุณากรอกชื่อร้าน"),
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
