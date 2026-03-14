import { getAllProducts, formatPriceNoCents } from "@/lib/products";
import ProjectCard from "../components/ProjectCard";

export default async function StorePage() {
  const products = await getAllProducts();

  return (
    <main className="flex flex-col">
      <section className="flex flex-col px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product) => (
            <ProjectCard 
              key={product.id} 
              project={{
                name: product.name,
                href: `/store/${product.slug}`,
                blurb: product.description,
                image: product.image,
                price: formatPriceNoCents(product.price),
                isSoldOut: product.inventory !== undefined && product.inventory <= 0
              }} 
            />
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full flex items-center justify-center p-20 opacity-30 italic">
              Loading products...
            </div>
          )}

          {/* Special "Coming Soon" or other decorative blocks can be kept if desired */}
          {products.length % 2 !== 0 && (
             <div className="flex items-center justify-center aspect-square border-2 border-dashed border-neutral-200 dark:border-neutral-800 opacity-30 rounded-xl">
               <span className="text-sm uppercase tracking-widest font-bold text-[var(--color-text)]">More Coming Soon</span>
             </div>
          )}
        </div>
      </section>
    </main>
  );
}
