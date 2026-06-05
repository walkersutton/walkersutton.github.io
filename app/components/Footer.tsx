"use client";

import React, { useState } from "react";
import NewsletterForm from "./NewsletterForm";

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL = [
  { label: "Instagram", href: "https://instagram.com/bandiitb0y", icon: InstagramIcon },
  { label: "X", href: "https://x.com/walkercsutton", icon: XIcon },
];

function SocialLink({
  label,
  href,
  icon: Icon,
}: {
  label: string;
  href: string;
  icon: () => React.ReactElement;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="no-underline flex items-center"
      style={{
        color: hovered ? "var(--color-text)" : "var(--color-text-faint)",
        transition: "color 0.15s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon />
    </a>
  );
}

export default function Footer() {
  return (
    <footer
      className="w-full max-w-[1080px] mx-auto flex flex-col gap-5 pt-6 pb-8"
      style={{ borderTop: "1px solid var(--color-rule)" }}
    >
      <div className="flex items-center justify-between">
        <NewsletterForm />
        <div className="flex gap-4">
          {SOCIAL.map(({ label, href, icon }) => (
            <SocialLink key={label} label={label} href={href} icon={icon} />
          ))}
        </div>
      </div>
    </footer>
  );
}
