import { Redis } from "@upstash/redis";

const INVENTORY_PREFIX = "inventory:";

export async function getInventory(productId: string, productSlug?: string): Promise<number> {
  // Bypassing Redis for now to avoid build-time dynamic rendering issues
  // Since the store isn't actively being used for inventory management.
  return 1;
  
  /* 
  try {
    const redis = getRedis();

    // 1. Try slug key first
    if (productSlug) {
      const slugKey = `${INVENTORY_PREFIX}${productSlug}`;
      const inventoryBySlug = await redis.get<number>(slugKey);
      if (inventoryBySlug !== null) {
        return Number(inventoryBySlug);
      }
    }

    // 2. Fallback to ID key
    const idKey = `${INVENTORY_PREFIX}${productId}`;
    const inventoryById = await redis.get<number>(idKey);
    return inventoryById !== null ? Number(inventoryById) : 0;
  } catch (e) {
    console.error("Redis error:", e);
    return 0;
  }
  */
}

export async function hasStock(productId: string, productSlug?: string): Promise<boolean> {
  const inventory = await getInventory(productId, productSlug);
  return inventory > 0;
}
