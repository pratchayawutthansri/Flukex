import type { Branch, Restaurant, RestaurantTable } from "@/domain/types";

interface ResolveQrTableInput {
  restaurantSlug: string;
  tableToken: string;
  restaurants: Restaurant[];
  branches: Branch[];
  tables: RestaurantTable[];
}

export interface QrTableResolution {
  restaurant: Restaurant;
  table: RestaurantTable;
}

export function normalizeTableToken(token: string) {
  return token.trim();
}

export function isTableTokenAvailable(tables: RestaurantTable[], token: string, excludeTableId?: string) {
  const normalizedToken = normalizeTableToken(token);
  if (!normalizedToken) return false;

  return !tables.some((table) => (
    table.id !== excludeTableId
    && normalizeTableToken(table.token) === normalizedToken
  ));
}

export function resolveQrTable({
  restaurantSlug,
  tableToken,
  restaurants,
  branches,
  tables,
}: ResolveQrTableInput): QrTableResolution | null {
  const normalizedToken = normalizeTableToken(tableToken);
  if (!restaurantSlug || !normalizedToken) return null;

  const restaurant = restaurants.find((item) => item.slug === restaurantSlug);
  if (!restaurant) return null;

  const restaurantBranchIds = new Set(
    branches
      .filter((branch) => branch.restaurantId === restaurant.id && branch.tenantId === restaurant.tenantId)
      .map((branch) => branch.id),
  );
  const table = tables.find((item) => (
    normalizeTableToken(item.token) === normalizedToken
    && item.tenantId === restaurant.tenantId
    && restaurantBranchIds.has(item.branchId)
  ));

  return table ? { restaurant, table } : null;
}
