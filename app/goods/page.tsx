import Link from "next/link";
import Image from "next/image";
import { getGoodsProducts, formatPriceNoCents } from "@/lib/products";
import PageContainer from "../components/PageContainer";
import SectionBar from "../components/SectionBar";

export default async function GoodsPage() {
  const products = await getGoodsProducts();

  return (
    <PageContainer>
      {/* <SectionBar title="Goods" spacing="lg" /> */}

      {products.length === 0 ? (
        <p
          className="py-20 text-center"
          style={{ color: "var(--color-text-faint)" }}
        >
          Nothing here yet.
        </p>
      ) : (
        <div className="shop-grid">
          {products.map((product) => {
            const isSoldOut =
              product.inventory !== undefined && product.inventory <= 0;
            const details = product.details?.slice(0, 3).join(" · ") ?? "";

            return (
              <Link
                key={product.id}
                href={`/goods/${product.slug}`}
                className="shop-card"
                data-soldout={isSoldOut}
              >
                <div className="shop-img" style={{ position: "relative" }}>
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  {isSoldOut && (
                    <span className="shop-sold-badge">Sold out</span>
                  )}
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
