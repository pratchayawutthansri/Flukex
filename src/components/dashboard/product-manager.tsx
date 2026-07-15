"use client";

import Image from "next/image";
import type { ChangeEvent, FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  Edit3,
  ImageIcon,
  ImageOff,
  LoaderCircle,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuthSession } from "@/components/auth/auth-session-provider";
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
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductModifier, Station } from "@/domain/types";
import {
  createOptimizedProductImage,
  PRODUCT_IMAGE_ACCEPT,
  validateProductImageFile,
} from "@/lib/product-image";
import { createId, formatCurrency } from "@/lib/utils";
import { services } from "@/services/container";
import { useDemoStore } from "@/store/demo-store";
import { PageHeader } from "./page-header";

function createEmptyProduct(tenantId: string, categoryId: string): Product {
  const now = new Date().toISOString();
  return {
    id: createId("product"),
    tenantId,
    categoryId,
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    station: "KITCHEN",
    isAvailable: true,
    isSoldOut: false,
    modifiers: [],
    createdAt: now,
    updatedAt: now,
  };
}

function ProductArtwork({ source, alt }: { source: string; alt: string }) {
  if (!source) {
    return (
      <div className="grid size-full place-items-center bg-muted text-muted-foreground">
        <div className="text-center">
          <ImageOff className="mx-auto size-8" aria-hidden="true" />
          <p className="mt-2 text-xs font-medium">ยังไม่มีรูปอาหาร</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={source}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
      className="object-cover"
      unoptimized={source.startsWith("data:")}
    />
  );
}

export function ProductManager() {
  const { session } = useAuthSession();
  const products = useDemoStore((state) => state.products);
  const activeTenantId = useDemoStore((state) => state.activeTenantId);
  const categories = useDemoStore((state) => state.categories);
  const saveProduct = useDemoStore((state) => state.saveProduct);
  const removeProduct = useDemoStore((state) => state.removeProduct);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [editing, setEditing] = useState<Product | null>(null);
  const [newModifier, setNewModifier] = useState({ name: "", price: "0" });
  const [imageError, setImageError] = useState("");
  const [formError, setFormError] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const canManageImage = session?.role === "OWNER";

  const filtered = useMemo(
    () => products.filter((product) =>
      (category === "ALL" || product.categoryId === category)
      && `${product.name} ${product.description}`.toLowerCase().includes(search.toLowerCase()),
    ),
    [products, category, search],
  );

  const openEditor = (product: Product) => {
    setEditing({ ...product });
    setNewModifier({ name: "", price: "0" });
    setImageError("");
    setFormError("");
  };

  const update = <K extends keyof Product>(key: K, value: Product[K]) => {
    setEditing((current) => current ? { ...current, [key]: value, updatedAt: new Date().toISOString() } : current);
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !canManageImage) return;

    const validationError = validateProductImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageError("");
    setIsProcessingImage(true);
    try {
      const optimizedImage = await createOptimizedProductImage(file);
      update("imageUrl", optimizedImage);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "เตรียมรูปภาพไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const addModifier = () => {
    if (!editing || !newModifier.name.trim()) return;
    const modifier: ProductModifier = {
      id: createId("mod"),
      name: newModifier.name.trim(),
      price: Number(newModifier.price) || 0,
    };
    setEditing({ ...editing, modifiers: [...editing.modifiers, modifier] });
    setNewModifier({ name: "", price: "0" });
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    if (!editing.name.trim()) {
      setFormError("กรุณากรอกชื่อสินค้า");
      return;
    }
    if (!Number.isFinite(editing.price) || editing.price < 0) {
      setFormError("ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป");
      return;
    }

    setFormError("");
    saveProduct({ ...editing, name: editing.name.trim(), description: editing.description.trim() });
    void services.notifications.notify({
      title: "บันทึกสินค้าแล้ว",
      message: `${editing.name} ถูกอัปเดตในทุกหน้าจอ`,
    });
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="สินค้าและเมนู"
        description={`${products.length} รายการ · กำหนดรูปอาหาร Station, Modifier และสถานะการขายได้จากจุดเดียว`}
        actions={<Button disabled={!categories.length} onClick={() => openEditor(createEmptyProduct(activeTenantId, categories[0]?.id ?? ""))}><PackagePlus />เพิ่มสินค้า</Button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            className="pl-10"
            placeholder="ค้นหาชื่อหรือคำอธิบาย..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="ค้นหาสินค้า"
          />
        </div>
        <select
          className="min-h-11 cursor-pointer rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="กรองหมวดหมู่"
        >
          <option value="ALL">ทุกหมวดหมู่</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-[16/10] bg-muted">
                <ProductArtwork source={product.imageUrl} alt={product.name || "รูปสินค้า"} />
                <div className="absolute left-3 top-3 flex gap-1">
                  <Badge variant={product.station === "KITCHEN" ? "warning" : "default"}>{product.station}</Badge>
                  {product.isSoldOut && <Badge variant="danger">หมด</Badge>}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold leading-snug">{product.name}</h2>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                  </div>
                  <strong className="shrink-0 text-primary">{formatCurrency(product.price)}</strong>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={product.isAvailable}
                      onChange={() => saveProduct({ ...product, isAvailable: !product.isAvailable, updatedAt: new Date().toISOString() })}
                      className="size-4 accent-primary"
                    />
                    พร้อมขาย
                  </label>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label={`แก้ไข ${product.name}`} onClick={() => openEditor(product)}><Edit3 /></Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`ลบ ${product.name}`}
                      onClick={() => { if (confirm(`ลบ ${product.name}?`)) removeProduct(product.id); }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-xl border border-dashed bg-card p-8 text-center">
          <div>
            <ImageIcon className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 font-bold">ไม่พบสินค้า</h2>
            <p className="text-sm text-muted-foreground">ลองเปลี่ยนคำค้นหาหรือหมวดหมู่</p>
          </div>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.name ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
            <DialogDescription>ข้อมูลนี้ใช้ร่วมกันใน Admin, POS, QR Ordering และ KDS</DialogDescription>
          </DialogHeader>

          {editing && (
            <form onSubmit={save} className="space-y-5">
              <section className="rounded-xl bg-muted/45 p-4" aria-labelledby="product-image-heading">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 id="product-image-heading" className="font-bold">รูปภาพอาหาร</h3>
                    <p id="product-image-help" className="mt-0.5 text-xs text-muted-foreground">JPG, PNG หรือ WebP ไม่เกิน 5 MB · ระบบย่อเป็น WebP อัตโนมัติ</p>
                  </div>
                  <Badge variant="outline"><ShieldCheck className="size-3.5" />เฉพาะเจ้าของร้าน</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-card shadow-sm">
                    <ProductArtwork source={editing.imageUrl} alt={editing.name || "ตัวอย่างรูปอาหาร"} />
                  </div>
                  <div>
                    {canManageImage ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <label
                            htmlFor="product-image-upload"
                            className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                          >
                            <input
                              id="product-image-upload"
                              type="file"
                              accept={PRODUCT_IMAGE_ACCEPT}
                              className="sr-only"
                              onChange={handleImageChange}
                              disabled={isProcessingImage}
                              aria-describedby="product-image-help product-image-error"
                            />
                            {isProcessingImage ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                            {isProcessingImage ? "กำลังเตรียมรูป..." : editing.imageUrl ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                          </label>
                          {editing.imageUrl && (
                            <Button type="button" variant="outline" onClick={() => { update("imageUrl", ""); setImageError(""); }} disabled={isProcessingImage}>
                              <Trash2 />ลบรูป
                            </Button>
                          )}
                        </div>
                        <p className="mt-3 text-xs leading-5 text-muted-foreground">รูปที่บันทึกจะแสดงทันทีในหน้าสินค้า POS และเมนู QR ของร้าน</p>
                      </>
                    ) : (
                      <div className="rounded-lg bg-card p-3 text-sm text-muted-foreground">
                        บัญชี Manager แก้ไขข้อมูลเมนูได้ แต่การเปลี่ยนรูปสงวนไว้สำหรับ Owner
                      </div>
                    )}
                    {imageError && <p id="product-image-error" role="alert" className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{imageError}</p>}
                  </div>
                </div>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-name">ชื่อสินค้า</Label>
                  <Input id="product-name" value={editing.name} onChange={(event) => update("name", event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-price">ราคา</Label>
                  <Input id="product-price" type="number" min="0" step="0.01" value={editing.price} onChange={(event) => update("price", Number(event.target.value))} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">คำอธิบาย</Label>
                <Textarea id="product-description" value={editing.description} onChange={(event) => update("description", event.target.value)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-category">หมวดหมู่</Label>
                  <select
                    id="product-category"
                    className="min-h-11 w-full cursor-pointer rounded-lg border border-input bg-card px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editing.categoryId}
                    onChange={(event) => update("categoryId", event.target.value)}
                  >
                    {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-station">Station</Label>
                  <select
                    id="product-station"
                    className="min-h-11 w-full cursor-pointer rounded-lg border border-input bg-card px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={editing.station}
                    onChange={(event) => update("station", event.target.value as Station)}
                  >
                    <option value="KITCHEN">Kitchen</option>
                    <option value="BAR">Bar</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-5">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.isAvailable} onChange={(event) => update("isAvailable", event.target.checked)} className="size-4 accent-primary" />
                  พร้อมขาย
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={editing.isSoldOut} onChange={(event) => update("isSoldOut", event.target.checked)} className="size-4 accent-primary" />
                  สินค้าหมด
                </label>
              </div>

              <section className="rounded-xl bg-muted/45 p-4" aria-labelledby="modifier-heading">
                <Label id="modifier-heading">ตัวเลือกเพิ่มเติม (Modifier)</Label>
                <div className="mt-3 space-y-2">
                  {editing.modifiers.map((modifier) => (
                    <div key={modifier.id} className="flex min-h-11 items-center gap-2 rounded-lg bg-card px-3 text-sm shadow-sm">
                      <span className="flex-1">{modifier.name}</span>
                      <span>{formatCurrency(modifier.price)}</span>
                      <button
                        type="button"
                        aria-label={`ลบ ${modifier.name}`}
                        onClick={() => setEditing({ ...editing, modifiers: editing.modifiers.filter((item) => item.id !== modifier.id) })}
                        className="grid size-9 cursor-pointer place-items-center rounded-md transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                  <Input aria-label="ชื่อตัวเลือก" placeholder="เช่น เพิ่มไข่ดาว" value={newModifier.name} onChange={(event) => setNewModifier({ ...newModifier, name: event.target.value })} />
                  <Input aria-label="ราคาตัวเลือก" type="number" min="0" value={newModifier.price} onChange={(event) => setNewModifier({ ...newModifier, price: event.target.value })} />
                  <Button type="button" variant="outline" onClick={addModifier}><Plus />เพิ่ม</Button>
                </div>
              </section>

              {formError && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{formError}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>ยกเลิก</Button>
                <Button type="submit" disabled={isProcessingImage}>{isProcessingImage ? "กำลังเตรียมรูป..." : "บันทึกสินค้า"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
