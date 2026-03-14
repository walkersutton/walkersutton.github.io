"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function CartSummary() {
  const { itemCount, isHydrated } = useCart();
  const pathname = usePathname();

  if (!pathname?.startsWith("/store")) {
    return null;
  }

  return (
    <Link href="/store/bag" className="text-sm flex items-center group relative z-10">
      <div
        className={`cart-counter w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-full flex items-center justify-center transition-all duration-300 group-active:scale-95 ${isHydrated ? "opacity-100" : "opacity-0"}`}
      >
        <div className="w-5 h-5 bg-white dark:bg-black rounded-full flex items-center justify-center">
          <span className="text-xs text-black dark:text-white font-bold leading-none">{itemCount}</span>
        </div>
      </div>
    </Link>
  );
}
