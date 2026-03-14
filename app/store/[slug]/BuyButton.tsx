"use client";

import { useState } from "react";
import Button from "@/app/components/ui/Button";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Product } from "@/lib/products";

interface BuyButtonProps {
  product: Product;
}

export function StockStatus({ product }: BuyButtonProps) {
  const isOutOfStock = product.inventory !== undefined && product.inventory <= 0;

  return (
    <p className={`uppercase text-sm font-bold tracking-widest ${isOutOfStock ? "text-red-500" : ""}`}>
      {isOutOfStock ? "Out of Stock" : "In Stock"}
    </p>
  );
}

export default function BuyButton({ product }: BuyButtonProps) {
  const [justAdded, setJustAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addItem } = useCart();
  
  const handleAddToCart = async () => {
    setIsLoading(true);
    // Slight delay for feedback
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
    }, product.inventory);
    
    setIsLoading(false);
    setJustAdded(true);
  };

  if (justAdded) {
    return (
      <Link href="/store/bag" className="block w-full">
        <Button variant="secondary" className="w-full">
          PROCEED TO CHECKOUT
        </Button>
      </Link>
    );
  }

  const isOutOfStock = product.inventory !== undefined && product.inventory <= 0;

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleAddToCart}
        loading={isLoading}
        className="w-full"
        disabled={isOutOfStock}
      >
        {isOutOfStock ? "SOLD OUT" : "Add to Bag"}
      </Button>
    </div>
  );
}
