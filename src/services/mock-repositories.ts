import type { Branch, Category, DemoUser, Order, PlanId, Product, Restaurant, RestaurantTable } from "@/domain/types";
import type {
  BranchRepository,
  CategoryRepository,
  OrderRepository,
  ProductRepository,
  Repository,
  RestaurantRepository,
  SubscriptionRepository,
  TableRepository,
  UserRepository,
} from "./contracts";
import { browserStorage, STORAGE_KEYS } from "./storage";

export class MockRepository<T extends { id: string }> implements Repository<T> {
  constructor(private readonly key: string, private readonly defaults: () => T[]) {}

  async list() {
    return browserStorage.get<T[]>(`${STORAGE_KEYS.repositoryPrefix}${this.key}`, this.defaults());
  }

  async getById(id: string) {
    return (await this.list()).find((entity) => entity.id === id) ?? null;
  }

  async save(entity: T) {
    const entities = await this.list();
    const next = entities.some((item) => item.id === entity.id)
      ? entities.map((item) => (item.id === entity.id ? entity : item))
      : [entity, ...entities];
    browserStorage.set(`${STORAGE_KEYS.repositoryPrefix}${this.key}`, next);
    return entity;
  }

  async remove(id: string) {
    browserStorage.set(`${STORAGE_KEYS.repositoryPrefix}${this.key}`, (await this.list()).filter((entity) => entity.id !== id));
  }
}

export class MockProductRepository extends MockRepository<Product> implements ProductRepository {}
export class MockOrderRepository extends MockRepository<Order> implements OrderRepository {}
export class MockRestaurantRepository extends MockRepository<Restaurant> implements RestaurantRepository {}
export class MockBranchRepository extends MockRepository<Branch> implements BranchRepository {}
export class MockCategoryRepository extends MockRepository<Category> implements CategoryRepository {}
export class MockTableRepository extends MockRepository<RestaurantTable> implements TableRepository {}
export class MockUserRepository extends MockRepository<DemoUser> implements UserRepository {}

export class MockSubscriptionRepository implements SubscriptionRepository {
  async getCurrentPlan() {
    return browserStorage.get<PlanId>(STORAGE_KEYS.subscription, "starter");
  }
  async selectPlan(planId: PlanId) {
    browserStorage.set(STORAGE_KEYS.subscription, planId);
  }
}
