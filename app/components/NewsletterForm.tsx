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
    } catch (err) {
      console.error("Newsletter error:", err);
      setStatus("error");
    }
  };

  const isSuccess = status === "success";
  const isLoading = status === "loading";
  const isDone = isSuccess || isLoading;

  return (
    <div className="w-full max-w-[300px] mx-auto sm:mx-0 sm:w-[300px]">
      <style>{`
        @keyframes newsletter-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes newsletter-check {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "inline-flex",
          alignItems: "stretch",
          border: isSuccess
            ? "1px solid var(--color-border)"
            : "1px solid var(--color-text)",
          background: "transparent",
          boxShadow:
            isDone || pressed
              ? "none"
              : hovered
                ? "1px 1px 0 0 var(--color-text)"
                : "3px 3px 0 0 var(--color-text)",
          transform:
            pressed || isDone
              ? "translate(3px, 3px)"
              : hovered
                ? "translate(2px, 2px)"
                : "none",
          transition:
            "box-shadow 0.15s ease, transform 0.15s ease, border-color 0.25s ease",
          width: "100%",
          maxWidth: 300,
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
          disabled={isDone}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            background: "transparent",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: isSuccess ? "var(--color-text-variant)" : "var(--color-text)",
            outline: "none",
            padding: "10px 12px",
            transition: "color 0.25s ease",
          }}
        />
        <div
          style={{
            width: 1,
            background: isSuccess ? "var(--color-border)" : "var(--color-text)",
            flexShrink: 0,
            transition: "background 0.25s ease",
          }}
        />
        <button
          type="submit"
          disabled={isDone}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            width: 124,
            border: 0,
            background: "transparent",
            padding: "10px 14px",
            cursor: isDone ? "default" : "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--color-text)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "color 0.25s ease",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
        >
          {isSuccess ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                animation: "newsletter-check 0.25s ease both",
              }}
            >
              Subscribed
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3.5 8.5l3 3 6-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : isLoading ? (
            <span
              aria-label="Subscribing"
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: "2px solid var(--color-border)",
                borderTopColor: "var(--color-text)",
                animation: "newsletter-spin 0.6s linear infinite",
              }}
            />
          ) : (
            "Subscribe"
          )}
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
