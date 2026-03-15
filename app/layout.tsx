import type { Metadata } from "next";
import Script from "next/script";
import { sfProDisplay, sfProText } from "./fonts";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};



import { CartProvider } from "@/context/CartContext";
import Footer from "./components/Footer";
import Header from "./components/Header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sfProDisplay.variable} ${sfProText.variable} font-sans`}
    >
      <Script
        async
        data-goatcounter="https://walker.goatcounter.com/count"
        src="//gc.zgo.at/count.js"
      />
      <body
        className={`bg-[var(--color-bg)] text-[var(--color-text)] antialiased mx-auto overflow-x-hidden px-4 md:overflow-x-visible min-h-screen flex flex-col`}
      >
        <CartProvider>
          <Header />
          <div className="flex-grow">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
