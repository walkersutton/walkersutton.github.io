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
import Banner from "./components/Banner";
import { getBannerEnabled, getBannerText, getBannerLink, getLiveEnabled } from "@/lib/live-state";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [bannerEnabled, bannerText, bannerLink, isLive] = await Promise.all([
    getBannerEnabled(),
    getBannerText(),
    getBannerLink(),
    getLiveEnabled(),
  ]);

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
          {bannerEnabled && (
            <div className="-mx-4 md:-mx-8" style={{ position: "relative", zIndex: 60 }}>
              <Banner text={bannerText} href={bannerLink} />
            </div>
          )}
          <Header homeGlass={isLive} />
          <div className="flex-grow">{children}</div>
          <HideOnTrips>
            <Footer />
          </HideOnTrips>
        </CartProvider>
      </body>
    </html>
  );
}
