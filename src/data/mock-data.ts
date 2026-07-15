import type {
  Branch,
  Category,
  DemoUser,
  NotificationLog,
  Order,
  Product,
  Restaurant,
  RestaurantTable,
} from "@/domain/types";

const CREATED_AT = "2026-07-01T08:00:00.000Z";
const TENANT_ID = "tenant_sawasdee_bistro";

export interface DemoData {
  users: DemoUser[];
  restaurants: Restaurant[];
  branches: Branch[];
  categories: Category[];
  products: Product[];
  tables: RestaurantTable[];
  orders: Order[];
  notifications: NotificationLog[];
}

const entityDates = { createdAt: CREATED_AT, updatedAt: CREATED_AT };

export const TENANT_DEMO_ACCOUNTS = [
  { email: "owner@demo.com", password: "demo1234", role: "OWNER", name: "คุณมินตรา (เจ้าของร้าน)" },
  { email: "manager@demo.com", password: "demo1234", role: "MANAGER", name: "คุณเมย์ (ผู้จัดการร้าน)" },
  { email: "cashier@demo.com", password: "demo1234", role: "CASHIER", name: "คุณปาล์ม (แคชเชียร์)" },
  { email: "kitchen@demo.com", password: "demo1234", role: "KITCHEN", name: "เชฟนนท์ (ครัว)" },
  { email: "bar@demo.com", password: "demo1234", role: "BAR", name: "คุณบีม (บาร์)" },
] as const;

export const PLATFORM_ADMIN_ACCOUNT = {
  email: "admin@flukex.demo",
  password: "demo1234",
  role: "PLATFORM_ADMIN",
  name: "Flukex Platform Admin",
} as const;

export const DEMO_ACCOUNTS = [...TENANT_DEMO_ACCOUNTS, PLATFORM_ADMIN_ACCOUNT] as const;

export const createDefaultDemoData = (): DemoData => ({
  users: TENANT_DEMO_ACCOUNTS.map((account, index) => ({
    id: `user_${index + 1}`,
    tenantId: TENANT_ID,
    name: account.name,
    email: account.email,
    role: account.role,
    branchIds: ["branch_sukhumvit"],
    ...entityDates,
  })),
  restaurants: [
    {
      id: "restaurant_sawasdee",
      tenantId: TENANT_ID,
      name: "สวัสดี บิสโทร",
      slug: "demo-restaurant",
      phone: "02-123-4567",
      address: "88 ถนนสุขุมวิท กรุงเทพฯ 10110",
      taxId: "0105567123456",
      ...entityDates,
    },
  ],
  branches: [
    {
      id: "branch_sukhumvit",
      tenantId: TENANT_ID,
      restaurantId: "restaurant_sawasdee",
      name: "สาขาสุขุมวิท",
      code: "BKK-01",
      address: "88 ถนนสุขุมวิท กรุงเทพฯ",
      isActive: true,
      ...entityDates,
    },
    {
      id: "branch_silom",
      tenantId: TENANT_ID,
      restaurantId: "restaurant_sawasdee",
      name: "สาขาสีลม (ตัวอย่าง)",
      code: "BKK-02",
      address: "12 ถนนสีลม กรุงเทพฯ",
      isActive: false,
      ...entityDates,
    },
  ],
  categories: [
    { id: "cat_recommended", tenantId: TENANT_ID, name: "เมนูแนะนำ", color: "#dc2626", sortOrder: 1, isActive: true, ...entityDates },
    { id: "cat_main", tenantId: TENANT_ID, name: "อาหารจานหลัก", color: "#ea580c", sortOrder: 2, isActive: true, ...entityDates },
    { id: "cat_snack", tenantId: TENANT_ID, name: "ของทานเล่น", color: "#ca8a04", sortOrder: 3, isActive: true, ...entityDates },
    { id: "cat_drink", tenantId: TENANT_ID, name: "เครื่องดื่ม", color: "#0891b2", sortOrder: 4, isActive: true, ...entityDates },
  ],
  products: [
    {
      id: "product_krapao",
      tenantId: TENANT_ID,
      categoryId: "cat_recommended",
      name: "กะเพราเนื้อวากิวไข่ดาว",
      description: "เนื้อวากิวผัดกะเพราหอม ๆ เสิร์ฟพร้อมไข่ดาวกรอบ",
      price: 189,
      imageUrl: "/products/krapao.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [
        { id: "mod_egg", name: "เพิ่มไข่ดาว", price: 15 },
        { id: "mod_rice", name: "เพิ่มข้าว", price: 20 },
        { id: "mod_spicy", name: "เผ็ดมาก", price: 0 },
      ],
      ...entityDates,
    },
    {
      id: "product_tomyum",
      tenantId: TENANT_ID,
      categoryId: "cat_recommended",
      name: "ต้มยำกุ้งน้ำข้น",
      description: "กุ้งแม่น้ำและสมุนไพรไทย รสเข้มข้นกลมกล่อม",
      price: 259,
      imageUrl: "/products/tomyum.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [{ id: "mod_rice_bowl", name: "ข้าวสวย", price: 25 }],
      ...entityDates,
    },
    {
      id: "product_padthai",
      tenantId: TENANT_ID,
      categoryId: "cat_main",
      name: "ผัดไทยกุ้งสด",
      description: "เส้นจันท์เหนียวนุ่ม ซอสผัดไทยสูตรของร้าน",
      price: 169,
      imageUrl: "/products/padthai.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [{ id: "mod_prawn", name: "เพิ่มกุ้ง", price: 60 }],
      ...entityDates,
    },
    {
      id: "product_green_curry",
      tenantId: TENANT_ID,
      categoryId: "cat_main",
      name: "แกงเขียวหวานไก่",
      description: "พริกแกงโขลกสด กะทิหอม เสิร์ฟพร้อมข้าว",
      price: 149,
      imageUrl: "/products/green-curry.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [],
      ...entityDates,
    },
    {
      id: "product_wings",
      tenantId: TENANT_ID,
      categoryId: "cat_snack",
      name: "ปีกไก่ทอดสมุนไพร",
      description: "ปีกไก่หมักทอดกรอบ พร้อมสมุนไพรไทย",
      price: 129,
      imageUrl: "/products/wings.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [],
      ...entityDates,
    },
    {
      id: "product_thai_tea",
      tenantId: TENANT_ID,
      categoryId: "cat_drink",
      name: "ชาไทยครีมสด",
      description: "ชาไทยเข้มข้น หวานน้อย หอมครีมสด",
      price: 85,
      imageUrl: "/products/thai-tea.svg",
      station: "BAR",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [
        { id: "mod_less_sweet", name: "หวานน้อย", price: 0 },
        { id: "mod_no_sweet", name: "ไม่หวาน", price: 0 },
      ],
      ...entityDates,
    },
    {
      id: "product_lime_soda",
      tenantId: TENANT_ID,
      categoryId: "cat_drink",
      name: "มะนาวโซดา",
      description: "มะนาวสด เปรี้ยวซ่า สดชื่น",
      price: 79,
      imageUrl: "/products/lime-soda.svg",
      station: "BAR",
      isAvailable: true,
      isSoldOut: false,
      modifiers: [],
      ...entityDates,
    },
    {
      id: "product_mango",
      tenantId: TENANT_ID,
      categoryId: "cat_recommended",
      name: "ข้าวเหนียวมะม่วง",
      description: "มะม่วงน้ำดอกไม้ ข้าวเหนียวมูนกะทิสด",
      price: 139,
      imageUrl: "/products/mango.svg",
      station: "KITCHEN",
      isAvailable: true,
      isSoldOut: true,
      modifiers: [],
      ...entityDates,
    },
  ],
  tables: Array.from({ length: 8 }, (_, index) => ({
    id: `table_${String(index + 1).padStart(2, "0")}`,
    tenantId: TENANT_ID,
    branchId: "branch_sukhumvit",
    name: `โต๊ะ ${String(index + 1).padStart(2, "0")}`,
    token: `table-${String(index + 1).padStart(2, "0")}`,
    seats: index % 3 === 0 ? 4 : 2,
    status: index === 1 ? "OCCUPIED" : index === 3 ? "BILL_REQUESTED" : index === 6 ? "CLEANING" : "AVAILABLE",
    ...entityDates,
  })),
  orders: [
    {
      id: "order_1042",
      tenantId: TENANT_ID,
      branchId: "branch_sukhumvit",
      tableId: "table_02",
      tableName: "โต๊ะ 02",
      orderNumber: "#1042",
      source: "QR",
      status: "PREPARING",
      items: [
        { id: "item_1", productId: "product_krapao", productName: "กะเพราเนื้อวากิวไข่ดาว", station: "KITCHEN", quantity: 2, unitPrice: 189, modifiers: [], note: "ไม่ใส่ถั่วฝักยาว", status: "PREPARING" },
        { id: "item_2", productId: "product_thai_tea", productName: "ชาไทยครีมสด", station: "BAR", quantity: 2, unitPrice: 85, modifiers: [{ id: "mod_less_sweet", name: "หวานน้อย", price: 0 }], status: "READY" },
      ],
      totals: { subtotal: 548, discount: 0, serviceCharge: 54.8, vat: 42.2, grandTotal: 645 },
      createdAt: "2026-07-15T05:18:00.000Z",
      updatedAt: "2026-07-15T05:22:00.000Z",
    },
    {
      id: "order_1041",
      tenantId: TENANT_ID,
      branchId: "branch_sukhumvit",
      tableId: "table_04",
      tableName: "โต๊ะ 04",
      orderNumber: "#1041",
      source: "POS",
      status: "READY",
      items: [
        { id: "item_3", productId: "product_tomyum", productName: "ต้มยำกุ้งน้ำข้น", station: "KITCHEN", quantity: 1, unitPrice: 259, modifiers: [], status: "READY" },
        { id: "item_4", productId: "product_lime_soda", productName: "มะนาวโซดา", station: "BAR", quantity: 1, unitPrice: 79, modifiers: [], status: "SERVED" },
      ],
      totals: { subtotal: 338, discount: 0, serviceCharge: 33.8, vat: 26.03, grandTotal: 397.83 },
      createdAt: "2026-07-15T05:05:00.000Z",
      updatedAt: "2026-07-15T05:20:00.000Z",
    },
    {
      id: "order_1040",
      tenantId: TENANT_ID,
      branchId: "branch_sukhumvit",
      tableId: "table_01",
      tableName: "โต๊ะ 01",
      orderNumber: "#1040",
      source: "POS",
      status: "SERVED",
      items: [{ id: "item_5", productId: "product_padthai", productName: "ผัดไทยกุ้งสด", station: "KITCHEN", quantity: 2, unitPrice: 169, modifiers: [], status: "SERVED" }],
      totals: { subtotal: 338, discount: 33.8, serviceCharge: 30.42, vat: 23.42, grandTotal: 358.04 },
      paymentMethod: "CASH",
      paidAt: "2026-07-15T04:52:00.000Z",
      createdAt: "2026-07-15T04:30:00.000Z",
      updatedAt: "2026-07-15T04:52:00.000Z",
    },
  ],
  notifications: [
    { id: "notification_1", tenantId: TENANT_ID, title: "ออเดอร์ใหม่", message: "โต๊ะ 02 ส่งออเดอร์ #1042 ผ่าน QR", channel: "BROWSER", createdAt: "2026-07-15T05:18:00.000Z", read: false },
    { id: "notification_2", tenantId: TENANT_ID, title: "เรียกพนักงาน", message: "โต๊ะ 04 ต้องการชำระเงิน", channel: "BROWSER", createdAt: "2026-07-15T05:10:00.000Z", read: true },
  ],
});

export const DEMO_TENANT_ID = TENANT_ID;
