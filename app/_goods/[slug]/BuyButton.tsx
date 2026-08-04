"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l1 12H5z" />
      <path d="M9 8V6a3 3 0 016 0v2" />
    </svg>
  );
}

export function StockStatus({ product }: { product: Product }) {
  const isSoldOut = product.inventory !== undefined && product.inventory <= 0;
  return (
    <div className="pd-stock" data-soldout={isSoldOut} style={{ margin: "26px 0 16px" }}>
      {isSoldOut ? "Sold out" : "In stock"}
    </div>
  );
}

export default function BuyButton({ product }: { product: Product }) {
  const [justAdded, setJustAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();

  const isSoldOut = product.inventory !== undefined && product.inventory <= 0;

  const handleAdd = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    addItem(
      { id: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image, description: product.description },
      product.inventory
    );
    setIsLoading(false);
    setJustAdded(true);
  };

  if (justAdded) {
    return (
      <Link href="/goods/bag" className="btn-ghost" style={{ display: "inline-flex" }}>
        View bag →
      </Link>
    );
  }

  return (
    <button
      className="btn-primary"
      onClick={handleAdd}
      disabled={isSoldOut || isLoading}
    >
      {isLoading ? (
        "Adding…"
      ) : isSoldOut ? (
        "Sold out"
      ) : (
        <><BagIcon /> Add to bag</>
      )}
    </button>
  );
}
