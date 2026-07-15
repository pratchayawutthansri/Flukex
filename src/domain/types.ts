export type Locale = "th" | "en";
export type PlanId = "free" | "starter" | "professional";
export type UserRole = "OWNER" | "MANAGER" | "CASHIER" | "KITCHEN" | "BAR";
export type PlatformRole = "PLATFORM_ADMIN";
export type SessionRole = UserRole | PlatformRole;
export type Station = "KITCHEN" | "BAR";
export type TableStatus = "AVAILABLE" | "OCCUPIED" | "BILL_REQUESTED" | "CLEANING" | "DISABLED";
export type OrderStatus = "WAITING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
export type PaymentMethod = "CASH" | "QR" | "CARD";

export interface TenantEntity {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoUser extends TenantEntity {
  name: string;
  email: string;
  role: UserRole;
  branchIds: string[];
}

export interface DemoSession {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: SessionRole;
  restaurantName?: string;
  expiresAt: string;
}

export interface Restaurant extends TenantEntity {
  name: string;
  slug: string;
  phone: string;
  address: string;
  taxId?: string;
  logoUrl?: string;
}

export interface Branch extends TenantEntity {
  restaurantId: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
}

export interface Category extends TenantEntity {
  name: string;
  color: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ProductModifier {
  id: string;
  name: string;
  price: number;
}

export interface Product extends TenantEntity {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  station: Station;
  isAvailable: boolean;
  isSoldOut: boolean;
  modifiers: ProductModifier[];
}

export interface RestaurantTable extends TenantEntity {
  branchId: string;
  name: string;
  token: string;
  seats: number;
  status: TableStatus;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  station: Station;
  quantity: number;
  unitPrice: number;
  modifiers: ProductModifier[];
  note?: string;
  status: OrderStatus;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  vat: number;
  grandTotal: number;
}

export interface Order extends TenantEntity {
  orderNumber: string;
  branchId: string;
  tableId: string;
  tableName: string;
  source: "POS" | "QR";
  status: OrderStatus;
  items: OrderItem[];
  totals: OrderTotals;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
}

export interface NotificationLog {
  id: string;
  tenantId: string;
  title: string;
  message: string;
  channel: "BROWSER" | "DISCORD_MOCK" | "LINE_MOCK" | "TELEGRAM_MOCK";
  createdAt: string;
  read: boolean;
}

export interface UsageSnapshot {
  branches: number;
  users: number;
  tables: number;
  products: number;
  monthlyOrders: number;
}
