"use client";

import { useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createId } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { PageHeader } from "./page-header";

export function CategoryManager() {
  const categories = useDemoStore((state) => state.categories);
  const products = useDemoStore((state) => state.products);
  const activeTenantId = useDemoStore((state) => state.activeTenantId);
  const saveCategory = useDemoStore((state) => state.saveCategory);
  const removeCategory = useDemoStore((state) => state.removeCategory);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#dc2626");

  const addCategory = (event: React.FormEvent) => {
    event.preventDefault();
    const now = new Date().toISOString();
    saveCategory({
      id: createId("cat"),
      tenantId: activeTenantId,
      name,
      color,
      sortOrder: categories.length + 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    setOpen(false);
    setName("");
  };

  return (
    <>
      <PageHeader
        title="หมวดหมู่สินค้า"
        description="จัดกลุ่มเมนูเพื่อให้ค้นหาเร็วทั้ง POS และ QR Ordering"
        actions={<Button onClick={() => setOpen(true)}><Plus />เพิ่มหมวดหมู่</Button>}
      />
      <div className="space-y-3">
        {categories.length ? categories.map((category) => (
          <Card key={category.id} className="flex items-center gap-4 p-4">
            <GripVertical className="size-5 text-muted-foreground" aria-hidden="true" />
            <span className="size-4 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{category.name}</p>
              <p className="text-xs text-muted-foreground">{products.filter((product) => product.categoryId === category.id).length} สินค้า</p>
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={category.isActive} onChange={() => saveCategory({ ...category, isActive: !category.isActive, updatedAt: new Date().toISOString() })} />
              แสดง
            </label>
            <Button variant="ghost" size="icon" aria-label={`ลบ ${category.name}`} onClick={() => { if (confirm(`ลบหมวด ${category.name}?`)) removeCategory(category.id); }}><Trash2 /></Button>
          </Card>
        )) : (
          <Card className="p-8 text-center">
            <Badge variant="secondary">เริ่มต้นร้าน</Badge>
            <h2 className="mt-3 text-lg font-bold">ยังไม่มีหมวดหมู่สินค้า</h2>
            <p className="mt-1 text-sm text-muted-foreground">เพิ่มหมวดหมู่แรกก่อนสร้างรายการอาหาร</p>
            <Button className="mt-5" onClick={() => setOpen(true)}><Plus />เพิ่มหมวดหมู่แรก</Button>
          </Card>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มหมวดหมู่</DialogTitle>
            <DialogDescription>หมวดใหม่จะแสดงใน POS และ QR Ordering ทันที</DialogDescription>
          </DialogHeader>
          <form onSubmit={addCategory} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="category-name">ชื่อหมวดหมู่</Label><Input id="category-name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="category-color">สีประจำหมวด</Label><Input id="category-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="p-1" /></div>
            <DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>ยกเลิก</Button><Button type="submit">เพิ่มหมวดหมู่</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
