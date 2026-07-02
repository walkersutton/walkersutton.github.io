import { notFound } from "next/navigation";
import BuyButton from "./BuyButton";
import ProductGallery from "./ProductGallery";
import PageContainer from "@/app/components/PageContainer";
import { Metadata } from "next";
import { getGoodsProduct, getGoodsProducts, formatPriceNoCents } from "@/lib/products";
import { SITE_CONFIG } from "@/lib/config";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getGoodsProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getGoodsProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return { title: product.name, description: product.description };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getGoodsProduct(slug);
  if (!product) notFound();

  const isSoldOut = product.inventory !== undefined && product.inventory <= 0;

  return (
    <PageContainer as="div">
      <div className="pd-split">
        {/* Gallery */}
        <div className="pd-gallery">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Sticky info panel */}
        <div className="pd-info">
          <h1 className="pd-name">{product.name}</h1>
          <div className="pd-price">{formatPriceNoCents(product.price)}</div>

          {product.description && (
            <p className="pd-desc">{product.description}</p>
          )}

          {product.details && product.details.length > 0 && (
            <ul className="pd-details">
              {product.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}

          <div
            className="pd-stock"
            data-soldout={isSoldOut}
            style={{ margin: "26px 0 16px" }}
          >
            {isSoldOut ? "Sold out" : "In stock"}
          </div>

          <BuyButton product={product} />

          <p className="pd-reassure">
            Ships in 3–5 days from {SITE_CONFIG.city} · Free returns within 30 days
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
