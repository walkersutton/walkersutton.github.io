import Link from "next/link";
import Image from "next/image";
import { getGoodsProducts, formatPriceNoCents } from "@/lib/products";
import PageContainer from "../components/PageContainer";
import PageHero from "../components/PageHero";

function ToteIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 22h32l-3 33H19z" />
      <path d="M25 22v-4a7 7 0 0114 0v4" />
    </svg>
  );
}

function ShirtIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 9l-13 6 4 9 5-2v25a2 2 0 002 2h24a2 2 0 002-2V22l5 2 4-9-13-6a8 8 0 01-16 0z" />
    </svg>
  );
}

export default async function GoodsPage() {
  const products = await getGoodsProducts();

  return (
    <PageContainer>
      <PageHero>Goods.</PageHero>

      {products.length === 0 ? (
        <p className="py-20 text-center" style={{ color: "var(--color-text-faint)" }}>
          Nothing here yet.
        </p>
      ) : (
        <div className="shop-grid">
          {products.map((product) => {
            const isSoldOut = product.inventory !== undefined && product.inventory <= 0;
            const details = product.details?.slice(0, 3).join(" · ") ?? "";
            const isApparel = product.name.toLowerCase().includes("shirt") || product.name.toLowerCase().includes("tee");

            return (
              <Link
                key={product.id}
                href={`/goods/${product.slug}`}
                className="shop-card"
                data-soldout={isSoldOut}
              >
                <div className="shop-img" style={{ borderRadius: 18, aspectRatio: "1/1", marginBottom: 16, position: "relative" }}>
                  {product.image
                    ? <Image src={product.image} alt={product.name} fill className="object-cover" />
                    : isApparel ? <ShirtIcon /> : <ToteIcon />
                  }
                  {isSoldOut && <span className="shop-sold-badge">Sold out</span>}
                </div>
                <div className="shop-card-meta">
                  <span className="shop-card-name">{product.name}</span>
                  <span className="shop-card-price">
                    {isSoldOut ? "Sold out" : formatPriceNoCents(product.price)}
                  </span>
                </div>
                {details && <div className="shop-card-detail">{details}</div>}
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
