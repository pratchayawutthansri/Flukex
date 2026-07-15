export const PRODUCT_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const PRODUCT_IMAGE_MAX_SOURCE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_MAX_DATA_URL_LENGTH = 1_200_000;

const ALLOWED_IMAGE_TYPES = new Set(PRODUCT_IMAGE_ACCEPT.split(","));

export function validateProductImageFile(file: Pick<File, "type" | "size">) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "รองรับเฉพาะไฟล์ JPG, PNG หรือ WebP เท่านั้น";
  }
  if (file.size > PRODUCT_IMAGE_MAX_SOURCE_BYTES) {
    return "ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB";
  }
  if (file.size === 0) {
    return "ไฟล์รูปว่างเปล่า กรุณาเลือกไฟล์ใหม่";
  }
  return null;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("ไฟล์นี้ไม่ใช่รูปภาพที่เปิดได้"));
    image.src = source;
  });
}

export async function createOptimizedProductImage(file: File) {
  const validationError = validateProductImageFile(file);
  if (validationError) throw new Error(validationError);

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 1_400;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการย่อรูป กรุณาลองใหม่");

  context.drawImage(image, 0, 0, width, height);
  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const result = canvas.toDataURL("image/webp", quality);
    if (result.length <= PRODUCT_IMAGE_MAX_DATA_URL_LENGTH) return result;
  }

  throw new Error("รูปยังมีขนาดใหญ่เกินไปหลังย่อ กรุณาเลือกรูปที่เล็กลง");
}
