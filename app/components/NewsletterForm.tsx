"use client";

import { useState } from "react";

const statusCopy = {
  idle: "Occasional notes. No schedule.",
  loading: "Adding you...",
  success: "You are on the list.",
  error: "Something went wrong. Try again.",
};

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const showSubmit = email.trim().length > 0 || status !== "idle";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/add-newsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Subscription failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error("Newsletter error:", err);
      setStatus("error");
    }
  };

  return (
    <section
      className="newsletter-signup w-full max-w-[420px]"
      aria-label="Newsletter signup"
    >
      <form onSubmit={handleSubmit} className="newsletter-form">
        <input
          aria-label="Email address"
          type="email"
          placeholder="newsletter@signup.plz"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          required
          disabled={status === "loading" || status === "success"}
          className="newsletter-input"
        />
        <button
          type="submit"
          aria-hidden={!showSubmit}
          data-visible={showSubmit}
          disabled={!showSubmit || status === "loading" || status === "success"}
          tabIndex={showSubmit ? 0 : -1}
          className="newsletter-button"
        >
          {status === "loading"
            ? "Sending"
            : status === "success"
              ? "Joined"
              : "Subscribe"}
        </button>
      </form>
    </section>
  );
}
