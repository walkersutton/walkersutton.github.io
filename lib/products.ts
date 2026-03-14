import { stripe } from "./stripe";
import productsMetadata from "@/data/products.json";
import { getInventory } from "./inventory";

export interface Product {
  id: string; // Stripe Product ID
  slug: string; // URL friendly name
  name: string;
  price: number; // in cents
  description: string;
  details: string[];
  image: string;
  hoverImage?: string;
  images: string[];
  createdAt: string; // ISO date string for sorting
  priority?: number; // Lower number = higher priority
  inventory?: number; // Optional building-time inventory
}

interface ProductMetadata {
  slug: string;
  details?: string[];
  hoverImage?: string;
  extraImages?: string[];
  createdAt?: string;
  priority?: number;
}

export const PRODUCT_METADATA: Record<string, ProductMetadata> = productsMetadata as Record<string, ProductMetadata>;

export async function getProductById(id: string): Promise<Product | undefined> {
  const meta = PRODUCT_METADATA[id];
  if (!meta && !id.startsWith("prod_")) return undefined;

  try {
    const stripeProduct = await stripe.products.retrieve(id);
    if (!stripeProduct.active) return undefined;

    const price = await stripe.prices.retrieve(stripeProduct.default_price as string);
    const inventory = await getInventory(stripeProduct.id, meta?.slug);

    return {
      id: stripeProduct.id,
      slug: meta?.slug || stripeProduct.id,
      name: stripeProduct.name,
      price: price.unit_amount || 0,
      description: stripeProduct.description || "",
      details: meta?.details || [],
      image: stripeProduct.images[0],
      hoverImage: meta?.hoverImage ? `/images/${meta.hoverImage}` : undefined,
      images: [
        stripeProduct.images[0],
        ...(meta?.extraImages?.map((img) => `/images/${img}`) || []),
      ],
      createdAt: meta?.createdAt || new Date(stripeProduct.created * 1000).toISOString(),
      priority: meta?.priority,
      inventory,
    };
  } catch (e) {
    console.error(`Failed to fetch product ${id}:`, e);
    return undefined;
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  let id = Object.keys(PRODUCT_METADATA).find((key) => PRODUCT_METADATA[key].slug === slug);
  if (!id) {
    if (slug.startsWith("prod_")) {
      id = slug;
    } else {
      return undefined;
    }
  }
  return getProductById(id);
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const stripeProducts = await stripe.products.list({ active: true });
    const products = await Promise.all(
      stripeProducts.data.map(async (p) => {
        return await getProductById(p.id);
      })
    );

    const filteredProducts = products.filter((p) => p !== undefined) as Product[];

    return filteredProducts.sort((a, b) => {
      // Priority (lower value first)
      if (a.priority !== undefined && b.priority === undefined) return -1;
      if (a.priority === undefined && b.priority !== undefined) return 1;
      if (a.priority !== undefined && b.priority !== undefined && a.priority !== b.priority) {
        return a.priority - b.priority;
      }

      // Final fallback to createdAt
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (e) {
    console.error("Failed to fetch all products:", e);
    return [];
  }
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPriceNoCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
