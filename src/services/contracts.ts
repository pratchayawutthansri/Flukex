import type {
  Branch,
  Category,
  DemoSession,
  DemoUser,
  NotificationLog,
  Order,
  PlanId,
  Product,
  Restaurant,
  RestaurantTable,
  StaffJoinRequest,
  StaffRole,
} from "@/domain/types";

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegistrationInput extends AuthCredentials {
  name: string;
  restaurantName: string;
}

export interface StaffAccessRequestInput extends RegistrationInput {
  approverEmail: string;
}

export interface StaffAccessRequestReceipt {
  id: string;
  applicantEmail: string;
  restaurantName: string;
  status: StaffJoinRequest["status"];
}

export interface StaffAccessDecisionInput {
  requestId: string;
  role: StaffRole;
  branchIds: string[];
}

export interface MemberPasswordResetInput {
  email: string;
  name: string;
  tenantId: string;
  restaurantName: string;
}

export interface TemporaryCredential {
  email: string;
  temporaryPassword: string;
}

export interface AuthService {
  login(credentials: AuthCredentials): Promise<DemoSession>;
  register(input: RegistrationInput): Promise<DemoSession>;
  logout(): Promise<void>;
  getSession(): Promise<DemoSession | null>;
  resetPassword(email: string): Promise<void>;
  resetMemberPassword(input: MemberPasswordResetInput): Promise<TemporaryCredential>;
}

export interface StaffAccessService {
  request(input: StaffAccessRequestInput): Promise<StaffAccessRequestReceipt>;
  listPending(): Promise<StaffJoinRequest[]>;
  approve(input: StaffAccessDecisionInput): Promise<DemoUser>;
  reject(requestId: string): Promise<void>;
}

export interface Repository<T extends { id: string }> {
  list(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  remove(id: string): Promise<void>;
}

export type ProductRepository = Repository<Product>;
export type OrderRepository = Repository<Order>;
export type RestaurantRepository = Repository<Restaurant>;
export type UserRepository = Repository<DemoUser>;
export type BranchRepository = Repository<Branch>;
export type CategoryRepository = Repository<Category>;
export type TableRepository = Repository<RestaurantTable>;

export interface SubscriptionRepository {
  getCurrentPlan(): Promise<PlanId>;
  selectPlan(planId: PlanId): Promise<void>;
}

export interface RealtimeEvent<T = unknown> {
  type: "ORDER_CREATED" | "ORDER_UPDATED" | "TABLE_UPDATED" | "STAFF_CALLED" | "BILL_REQUESTED";
  tenantId: string;
  payload: T;
  occurredAt: string;
}

export interface RealtimeService {
  publish<T>(event: RealtimeEvent<T>): void;
  subscribe(listener: (event: RealtimeEvent) => void): () => void;
}

export interface NotificationInput {
  title: string;
  message: string;
  channel?: NotificationLog["channel"];
  audible?: boolean;
}

export interface NotificationService {
  notify(input: NotificationInput): Promise<void>;
}

export interface ServiceContainer {
  auth: AuthService;
  staffAccess: StaffAccessService;
  products: ProductRepository;
  orders: OrderRepository;
  restaurants: RestaurantRepository;
  branches: BranchRepository;
  categories: CategoryRepository;
  tables: TableRepository;
  users: UserRepository;
  subscriptions: SubscriptionRepository;
  realtime: RealtimeService;
  notifications: NotificationService;
}
