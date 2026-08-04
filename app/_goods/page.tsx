import { getGoodsProducts, formatPriceNoCents } from "@/lib/products";
import PageContainer from "../components/PageContainer";
import GoodsCard from "./GoodsCard";

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
              <GoodsCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                image={product.image}
                price={formatPriceNoCents(product.price)}
                isSoldOut={isSoldOut}
                details={details || undefined}
              />
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
