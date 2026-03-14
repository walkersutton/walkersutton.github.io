import { notFound } from "next/navigation";
import BuyButton, { StockStatus } from "./BuyButton";
import ProductGallery from "./ProductGallery";
import { Metadata } from "next";
import { getAllProducts, getProduct, formatPriceNoCents } from "@/lib/products";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="w-full">
      {/* Mobile Header */}
      <div className="flex justify-between items-baseline md:hidden py-4 px-6 sticky top-0 z-20 bg-[var(--color-bg)] border-b border-neutral-800 dark:border-neutral-200">
        <h1 className="text-lg font-bold tracking-wider uppercase">{product.name}</h1>
        <p className="text-lg font-medium tracking-wide">{formatPriceNoCents(product.price)}</p>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Scrollable Gallery */}
        <div className="w-full md:w-1/2">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Sticky Product Info */}
        <div className="w-full md:w-1/2 p-6 md:sticky md:top-24 md:self-start">
          <div className="mb-auto pb-12">
            {/* Desktop Header */}
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold tracking-wider uppercase mb-4">{product.name}</h1>
              <p className="text-xl font-medium tracking-wide mb-8">
                {formatPriceNoCents(product.price)}
              </p>
            </div>

            <p className="text-md leading-relaxed mb-4 max-w-md opacity-80">{product.description}</p>
            
            <ul className="list-disc list-inside mb-8 text-sm opacity-70">
              {product.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>

            <StockStatus product={product} />

            <div className="max-w-xs mx-auto md:mx-0 mt-6">
              <BuyButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
