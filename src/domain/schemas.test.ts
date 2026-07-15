import { describe, expect, it } from "vitest";
import { registrationSchema } from "./schemas";

const validRegistration = {
  name: "เจ้าของร้าน",
  email: "owner@example.com",
  password: "secure123",
  confirmPassword: "secure123",
  restaurantName: "ร้านทดสอบ",
};

describe("registration schema", () => {
  it("accepts matching passwords", () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects a mismatched password confirmation", () => {
    const result = registrationSchema.safeParse({ ...validRegistration, confirmPassword: "different123" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]).toMatchObject({ path: ["confirmPassword"], message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" });
  });
});
