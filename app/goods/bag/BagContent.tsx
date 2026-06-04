"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getShippingPrice } from "@/lib/shipping";
import CartItemList from "./CartItemList";
import OrderSummary from "./OrderSummary";
import CheckoutForm from "./CheckoutForm";
import ImageZoom from "./ImageZoom";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

export default function BagContent() {
  const { items, updateQuantity, totalPrice, isHydrated, itemCount } =
    useCart();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [shippingCountry, setShippingCountry] = useState("US");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDarkMode(isDark);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  if (!isHydrated) {
    return <div className="w-full min-h-[70vh]" />;
  }

  const shippingCost = getShippingPrice(shippingCountry, itemCount);

  const stripeTheme = isDarkMode
    ? {
        colorText: "#fff",
        colorBackground: "#111",
        colorTextPlaceholder: "#555",
        colorPrimary: "#fff",
        colorDanger: "#e05252",
        borderColor: "rgba(255,255,255,0.12)",
      }
    : {
        colorText: "#000",
        colorBackground: "#f2f2f2",
        colorTextPlaceholder: "#999",
        colorPrimary: "#000",
        colorDanger: "#d94040",
        borderColor: "rgba(0,0,0,0.12)",
      };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full max-w-[1080px] mx-auto">
        <p className="text-[17px] mb-6" style={{ color: "var(--color-text-variant)" }}>
          Your bag is empty.
        </p>
        <Link
          href="/goods"
          className="no-underline hover:underline"
          style={{ color: "var(--accent)", textUnderlineOffset: 4 }}
        >
          Browse goods →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1080px] mx-auto">
      <div className="bag-head">
        <h1>Your bag</h1>
        <span className="bag-head-count">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
      </div>

      <div className="bag-grid">
        {/* Left: items + summary */}
        <div>
          <CartItemList
            items={items}
            updateQuantity={updateQuantity}
            onImageZoom={setZoomedImage}
          />
          <OrderSummary
            totalPrice={totalPrice}
            shippingCost={shippingCost}
            shippingCountry={shippingCountry}
          />
        </div>

        {/* Right: checkout card */}
        <div className="checkout-card">
          <p className="checkout-card-heading">Checkout</p>
          <Elements
            stripe={stripePromise}
            options={{
              appearance: {
                theme: "none" as any,
                variables: {
                  colorPrimary: stripeTheme.colorPrimary,
                  colorBackground: stripeTheme.colorBackground,
                  colorText: stripeTheme.colorText,
                  colorTextPlaceholder: stripeTheme.colorTextPlaceholder,
                  colorDanger: stripeTheme.colorDanger,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                  spacingUnit: "4px",
                  borderRadius: "4px",
                },
                rules: {
                  ".Input": {
                    border: `1px solid ${stripeTheme.borderColor}`,
                    boxShadow: "none",
                    padding: "13px 15px",
                    fontSize: "14.5px",
                    color: stripeTheme.colorText,
                  },
                  ".Label": {
                    fontSize: "12px",
                    textTransform: "uppercase",
                    fontWeight: "600",
                    letterSpacing: "0.08em",
                    color: stripeTheme.colorTextPlaceholder,
                    marginBottom: "7px",
                  },
                },
              },
            }}
          >
            <CheckoutForm
              onAddressChange={setShippingCountry}
              sectionHeaderClass="checkout-card-heading"
            />
          </Elements>
        </div>
      </div>

      {zoomedImage && (
        <ImageZoom src={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
}
