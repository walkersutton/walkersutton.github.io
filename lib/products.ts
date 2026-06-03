import { stripe } from "./stripe";
import type Stripe from "stripe";

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
  showOnGoods?: boolean;
}

function isMissingStripeResource(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { raw?: { code?: unknown } };
  return candidate.raw?.code === "resource_missing";
}

function parseBoolean(value: string | undefined): boolean {
  return ["1", "true", "yes"].includes(value?.toLowerCase() ?? "");
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
    }
  } catch {
    // Fall back to a lightweight delimited format for Stripe metadata.
  }

  return value
    .split(/\r?\n|\||,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeImagePath(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }

  return `/images/${value}`;
}

function uniqueImages(images: string[]): string[] {
  return Array.from(new Set(images.filter(Boolean)));
}

function slugifyProductName(name: string, fallback: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

function getDefaultPriceId(product: Stripe.Product): string | undefined {
  if (!product.default_price) return undefined;
  return typeof product.default_price === "string" ? product.default_price : product.default_price.id;
}

async function buildProduct(stripeProduct: Stripe.Product): Promise<Product | undefined> {
  if (!stripeProduct.active) return undefined;

  const defaultPriceId = getDefaultPriceId(stripeProduct);
  if (!defaultPriceId) return undefined;

  const price = await stripe.prices.retrieve(defaultPriceId);
  const metadata = stripeProduct.metadata ?? {};
  const priority = parseNumber(metadata.priority);
  const image = stripeProduct.images[0] ?? "";
  const extraImages = parseList(metadata.extraImages).map(normalizeImagePath);
  const images = uniqueImages([...stripeProduct.images, ...extraImages]);
  const hoverImage = metadata.hoverImage ? normalizeImagePath(metadata.hoverImage) : undefined;

  return {
    id: stripeProduct.id,
    slug: slugifyProductName(metadata.slug || stripeProduct.name, stripeProduct.id),
    name: stripeProduct.name,
    price: price.unit_amount || 0,
    description: stripeProduct.description || "",
    details: parseList(metadata.details),
    image,
    hoverImage,
    images,
    createdAt: metadata.createdAt || new Date(stripeProduct.created * 1000).toISOString(),
    priority,
    inventory: parseNumber(metadata.inventory) ?? 0,
    showOnGoods: parseBoolean(metadata.showOnGoods),
  };
}

async function buildProductSafely(stripeProduct: Stripe.Product): Promise<Product | undefined> {
  try {
    return await buildProduct(stripeProduct);
  } catch (e) {
    if (!isMissingStripeResource(e)) {
      console.error(`Failed to fetch product ${stripeProduct.id}:`, e);
    }
    return undefined;
  }
}

function sortProducts(products: Product[]): Product[] {
  return products.sort((a, b) => {
    if (a.priority !== undefined && b.priority === undefined) return -1;
    if (a.priority === undefined && b.priority !== undefined) return 1;
    if (a.priority !== undefined && b.priority !== undefined && a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!id.startsWith("prod_")) return undefined;

  try {
    const stripeProduct = await stripe.products.retrieve(id);
    return buildProduct(stripeProduct);
  } catch (e) {
    if (!isMissingStripeResource(e)) {
      console.error(`Failed to fetch product ${id}:`, e);
    }
    return undefined;
  }
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (slug.startsWith("prod_")) {
    return getProductById(slug);
  }

  const products = await getAllProducts();
  return products.find((product) => product.slug === slug);
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const stripeProducts = await stripe.products.list({ active: true, limit: 100 });
    const products = await Promise.all(
      stripeProducts.data.map(async (p) => {
        return await buildProductSafely(p);
      })
    );

    const filteredProducts = products.filter((p) => p !== undefined) as Product[];

    return sortProducts(filteredProducts);
  } catch (e) {
    console.error("Failed to fetch all products:", e);
    return [];
  }
}

export async function getGoodsProducts(): Promise<Product[]> {
  const products = await getAllProducts();
  return products.filter((product) => product.showOnGoods);
}

export async function getGoodsProduct(slug: string): Promise<Product | undefined> {
  const product = await getProduct(slug);
  return product?.showOnGoods ? product : undefined;
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
