"use client";

import { useState } from "react";
import Button from "@/app/components/ui/Button";
import { supabase } from "@/lib/supabase";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const { error } = await supabase.functions.invoke("add-newsletter", {
        body: {
          email_address: email,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("success");
    } catch (err) {
      console.error("Newsletter error:", err);
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto md:mx-0 flex flex-col gap-2 w-full max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="your@email.address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === "loading" || status === "success"}
          className={`bg-transparent px-4 flex-grow focus:outline-none border border-[var(--color-text)] placeholder:text-[var(--color-text-variant)] disabled:opacity-50 text-xs uppercase tracking-wider h-10 transition-all ${
            status === "success" ? "line-through opacity-100! text-[var(--color-text-variant)]" : ""
          }`}
        />
        <Button
          type="submit"
          loading={status === "loading"}
          disabled={status === "success"}
          fullWidth={false}
          className={`border uppercase border-[var(--color-text)] transition-all px-8 h-10 py-0 flex items-center justify-center hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] ${
            status === "success"
              ? "!bg-[var(--color-text)] !text-[var(--color-bg)] disabled:opacity-100"
              : ""
          }`}
          variant="secondary"
        >
          {status === "success" ? "We'll be in touch" : "Subscribe"}
        </Button>
      </form>
    </div>
  );
}
