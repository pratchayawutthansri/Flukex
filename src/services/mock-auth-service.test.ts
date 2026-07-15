import { describe, expect, it } from "vitest";
import { generateTemporaryPassword } from "./mock-auth-service";

describe("temporary member password", () => {
  it("creates a 12-character password with predictable complexity", () => {
    const password = generateTemporaryPassword(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));

    expect(password).toHaveLength(12);
    expect(password).toMatch(/^Fx7![A-Za-z2-9]{8}$/);
  });

  it("rejects insufficient random input", () => {
    expect(() => generateTemporaryPassword(new Uint8Array([1, 2, 3]))).toThrow("อย่างน้อย 8 ไบต์");
  });
});
