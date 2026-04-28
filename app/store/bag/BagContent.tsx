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

  const checkoutThemeValues = isDarkMode
    ? {
        colorText: "#f5f5f5", // neutral-100
        colorBackground: "transparent",
        colorPrimary: "#f5f5f5",
        colorDanger: "#ff4d4d",
        borderColor: "#525252", // neutral-600 (matches --color-border variant)
      }
    : {
        colorText: "#171717", // neutral-900
        colorBackground: "transparent",
        colorPrimary: "#171717",
        colorDanger: "#ff0000",
        borderColor: "#e5e5e5", // neutral-200 (matches --color-border)
      };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full">
        <h1 className="text-sm font-bold tracking-widest uppercase mb-6">
          Your Bag is empty
        </h1>
        <Link href="/store" className="nav-link hover-accent text-sm">
          Click for Store
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col py-8 px-4 md:px-0">
      <div className="flex flex-col md:flex-row flex-grow items-start gap-12">
        {/* Left Column: Cart Items & Summary */}
        <div className="w-full md:w-3/5 space-y-4">
          <h1 className="text-2xl font-bold tracking-wider uppercase mb-8">
            YOUR BAG
          </h1>

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

        {/* Right Column: Mini Checkout */}
        <div className="w-full md:w-2/5 p-6 md:p-8 bg-neutral-100 dark:bg-neutral-900 transition-colors">
          <div className="md:sticky md:top-32 space-y-8">
            <Elements
              stripe={stripePromise}
              options={{
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: checkoutThemeValues.colorPrimary,
                    colorBackground: checkoutThemeValues.colorBackground,
                    colorText: checkoutThemeValues.colorText,
                    colorDanger: checkoutThemeValues.colorDanger,
                    fontFamily:
                      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    spacingUnit: "4px",
                    borderRadius: "0px",
                  },
                  rules: {
                    ".Input": {
                      border: `1px solid ${checkoutThemeValues.borderColor}`,
                      boxShadow: "none",
                      padding: "16px",
                      fontSize: "14px",
                      textTransform: "uppercase",
                      color: checkoutThemeValues.colorText,
                    },
                    ".Label": {
                      fontSize: "14px",
                      textTransform: "uppercase",
                      fontWeight: "400",
                      letterSpacing: "0.1em",
                      color: checkoutThemeValues.colorText,
                    },
                  },
                },
              }}
            >
              <CheckoutForm onAddressChange={setShippingCountry} />
            </Elements>
          </div>
        </div>
      </div>

      {zoomedImage && (
        <ImageZoom src={zoomedImage} onClose={() => setZoomedImage(null)} />
      )}
    </div>
  );
}
