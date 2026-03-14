"use client";

import { useState, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { SUPPORTED_COUNTRIES } from "@/lib/shipping";
import { AddressElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeAddressElementChangeEvent } from "@stripe/stripe-js";
import Button from "@/app/components/ui/Button";

interface CheckoutFormProps {
  onAddressChange?: (country: string) => void;
  sectionHeaderClass?: string;
}

export default function CheckoutForm({
  onAddressChange,
  sectionHeaderClass = "text-sm uppercase tracking-[0.2em] font-semibold",
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { items } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, email: e.target.value }));
  };

  const handleAddressChange = (event: StripeAddressElementChangeEvent) => {
    if (event.complete) {
      const addr = event.value.address;
      setFormData((prev) => ({
        ...prev,
        name: event.value.name,
        address: addr.line1,
        apartment: addr.line2 || "",
        city: addr.city,
        state: addr.state,
        zip: addr.postal_code,
        country: addr.country,
      }));
      if (onAddressChange) {
        onAddressChange(addr.country);
      }
    } else if (event.value.address.country !== formData.country) {
      setFormData((prev) => ({ ...prev, country: event.value.address.country }));
      if (onAddressChange) {
        onAddressChange(event.value.address.country);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setError(null);

    const addressElement = elements.getElement("address");
    if (!addressElement) {
      setError("Address element not found");
      return;
    }

    if (!isValidEmail(formData.email)) {
      emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setError("Please enter a valid email address");
      return;
    }

    const { complete, value } = await addressElement.getValue();

    if (!complete) {
      setError("Please complete your shipping address");
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    try {
      setSubmitting(true);
      
      const { supabase } = await import("@/lib/supabase");
      
      const { data, error: funcError } = await supabase.functions.invoke("checkout", {
        body: {
          items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
          email: formData.email,
          shippingAddress: {
            name: value.name,
            address: value.address.line1,
            apartment: value.address.line2,
            city: value.address.city,
            state: value.address.state,
            zip: value.address.postal_code,
            country: value.address.country,
          },
        },
      });

      if (funcError) {
        throw new Error(funcError.message || "Checkout failed");
      }

      if (!data?.url) {
        throw new Error("No checkout URL returned from function");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-12 w-full uppercase">
      {/* Contact Info */}
      <section ref={emailRef}>
        <h2 className={`${sectionHeaderClass} mb-6`}>Contact Information</h2>
        <div className="flex flex-col gap-4">
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            placeholder="EMAIL ADDRESS"
            value={formData.email}
            onChange={handleEmailChange}
            className="w-full border border-neutral-800 dark:border-neutral-200 p-4 text-sm focus:outline-none transition-all bg-[var(--color-bg)] uppercase tracking-wider placeholder:opacity-20"
          />
        </div>
      </section>

      {/* Shipping Address */}
      <section ref={addressRef}>
        <h2 className={`${sectionHeaderClass} mb-6`}>Shipping Address</h2>
        <div className="flex flex-col gap-4">
          <AddressElement
            options={{
              mode: "shipping",
              allowedCountries: SUPPORTED_COUNTRIES.map((c) => c.code),
              fields: {
                phone: "never",
              },
            }}
            onChange={handleAddressChange}
          />
        </div>
      </section>

      {error && <p className="text-red-500 text-sm text-center uppercase tracking-wider">{error}</p>}
      
      <Button type="submit" loading={submitting} form="checkout-form">
        Proceed to Checkout
      </Button>
    </form>
  );
}
