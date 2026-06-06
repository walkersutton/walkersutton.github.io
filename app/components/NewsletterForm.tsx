"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await fetch(`${apiUrl}/api/add-newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email_address: email }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Subscription failed");
      setStatus("success");
      setEmail("");
    } catch (err) {
      console.error("Newsletter error:", err);
      setStatus("error");
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "inline-flex",
          alignItems: "stretch",
          border: "1px solid var(--color-text)",
          boxShadow: pressed
            ? "none"
            : hovered
              ? "1px 1px 0 0 var(--color-text)"
              : "3px 3px 0 0 var(--color-text)",
          transform: pressed
            ? "translate(3px, 3px)"
            : hovered
              ? "translate(2px, 2px)"
              : "none",
          transition: "box-shadow 0.1s ease, transform 0.1s ease",
          width: 300,
        }}
      >
        <input
          aria-label="Email address"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          required
          disabled={status === "loading" || status === "success"}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--color-text)",
            outline: "none",
            padding: "10px 12px",
          }}
        />
        <div
          style={{ width: 1, background: "var(--color-border)", flexShrink: 0 }}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          style={{
            border: 0,
            background: "transparent",
            padding: "10px 14px",
            cursor: status === "success" ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
        >
          {status === "success"
            ? "Subscribed ✓"
            : status === "loading"
              ? "..."
              : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p
          className="mt-2 text-[12px]"
          style={{ color: "var(--color-text-faint)" }}
        >
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
