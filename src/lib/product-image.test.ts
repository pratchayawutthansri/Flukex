import { describe, expect, it } from "vitest";
import { PRODUCT_IMAGE_MAX_SOURCE_BYTES, validateProductImageFile } from "./product-image";

describe("product image validation", () => {
  it("accepts supported image formats within the size limit", () => {
    expect(validateProductImageFile({ type: "image/jpeg", size: 500_000 })).toBeNull();
    expect(validateProductImageFile({ type: "image/png", size: 1_000_000 })).toBeNull();
    expect(validateProductImageFile({ type: "image/webp", size: 200_000 })).toBeNull();
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(validateProductImageFile({ type: "image/svg+xml", size: 1_000 })).toContain("JPG");
    expect(validateProductImageFile({ type: "image/png", size: 0 })).toContain("ว่างเปล่า");
    expect(validateProductImageFile({ type: "image/png", size: PRODUCT_IMAGE_MAX_SOURCE_BYTES + 1 })).toContain("5 MB");
  });
});
