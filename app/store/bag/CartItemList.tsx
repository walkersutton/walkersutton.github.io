"use client";

import Link from "next/link";
import Image from "next/image";
import { CartItem } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";

interface CartItemListProps {
  items: CartItem[];
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  onImageZoom: (src: string) => void;
}

export default function CartItemList({ items, updateQuantity, onImageZoom }: CartItemListProps) {
  return (
    <div className="border-t border-neutral-800 dark:border-neutral-200">
      {items.map((item) => (
        <div key={item.id} className="flex gap-6 border-b border-neutral-800 dark:border-neutral-200 py-6">
          <div
            className="w-24 h-24 relative flex-shrink-0 cursor-zoom-in bg-neutral-100 dark:bg-neutral-900"
            onClick={() => onImageZoom(item.image)}
          >
            <Image src={item.image} alt={item.name} fill className="object-cover" />
          </div>

          <div className="flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-1">
              <div className="flex flex-col">
                <Link href={`/store/${item.slug}`}>
                  <h2 className="text-sm font-bold uppercase tracking-wide hover:opacity-60 transition-opacity">
                    {item.name}
                  </h2>
                </Link>
                {item.description && (
                  <p className="text-xs uppercase tracking-wide opacity-70 mt-1 max-w-sm">
                    {item.description}
                  </p>
                )}
              </div>
              <p className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</p>
            </div>

            <div className="mt-auto flex justify-between items-end pt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-neutral-800 dark:border-neutral-200">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center text-black dark:text-white hover:bg-neutral-800 hover:text-white dark:hover:bg-neutral-200 dark:hover:text-black transition-colors disabled:opacity-30 cursor-pointer"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item.maxStock)}
                    className="w-8 h-8 flex items-center justify-center text-black dark:text-white hover:bg-neutral-800 hover:text-white dark:hover:bg-neutral-200 dark:hover:text-black transition-colors disabled:opacity-30 cursor-pointer"
                    disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => updateQuantity(item.id, 0)}
                className="text-xs uppercase font-bold tracking-wide underline decoration-neutral-800/20 dark:decoration-neutral-200/20 underline-offset-4 hover:opacity-60 transition-all active:scale-95 cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
