import type { Metadata } from "next";
import Script from "next/script";
import { sfProDisplay, sfProText } from "./fonts";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};



import { CartProvider } from "@/context/CartContext";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HideOnTrips from "./components/HideOnTrips";
import LiveBannerWrapper from "./trips/LiveBannerWrapper";
import { getLiveEnabled, getBannerText } from "@/lib/live-state";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isLive = await getLiveEnabled();
  const bannerText = await getBannerText();

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
        className={`bg-[var(--color-bg)] text-[var(--color-text)] antialiased overflow-x-hidden px-4 md:px-8 md:overflow-x-visible min-h-screen flex flex-col`}
      >
        <CartProvider>
          {isLive && (
            <div className="-mx-4 md:-mx-8" style={{ position: "relative", zIndex: 60 }}>
              <LiveBannerWrapper text={bannerText} />
            </div>
          )}
          <HideOnTrips>
            <Header />
          </HideOnTrips>
          <div className="flex-grow">{children}</div>
          <HideOnTrips>
            <Footer />
          </HideOnTrips>
        </CartProvider>
      </body>
    </html>
  );
}
