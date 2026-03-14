import { Redis } from "@upstash/redis";

const INVENTORY_PREFIX = "inventory:";

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (!redisInstance) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Redis env vars are not set");
    }
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisInstance;
}

export async function getInventory(productId: string, productSlug?: string): Promise<number> {
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
}

export async function hasStock(productId: string, productSlug?: string): Promise<boolean> {
  const inventory = await getInventory(productId, productSlug);
  return inventory > 0;
}
