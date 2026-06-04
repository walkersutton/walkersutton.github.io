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
    <div className="bag-items">
      {items.map((item) => (
        <div key={item.id} className="bag-item">
          {/* Thumbnail */}
          <div
            className="shop-img cursor-zoom-in"
            style={{ width: 92, height: 92, borderRadius: 6, flexShrink: 0, position: "relative" }}
            onClick={() => item.image && onImageZoom(item.image)}
          >
            {item.image && (
              <Image src={item.image} alt={item.name} fill className="object-cover" style={{ borderRadius: 6 }} />
            )}
          </div>

          {/* Info + controls */}
          <div>
            <Link href={`/goods/${item.slug}`}>
              <div className="bag-item-name hover:underline" style={{ textDecorationColor: "var(--accent)" }}>
                {item.name}
              </div>
            </Link>
            {item.description && (
              <div className="bag-item-detail">{item.description}</div>
            )}
            <div className="bag-item-controls">
              <span className="qty">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>–</button>
                <span className="qty-n">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.maxStock)} disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}>+</button>
              </span>
              <button className="bag-remove" onClick={() => updateQuantity(item.id, 0)}>Remove</button>
            </div>
          </div>

          {/* Price */}
          <div className="bag-item-price">{formatPrice(item.price * item.quantity)}</div>
        </div>
      ))}
    </div>
  );
}
