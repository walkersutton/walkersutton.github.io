import type { Metadata } from "next";
import Script from "next/script";
import GoatCounterRouteTracker from "./components/GoatCounterRouteTracker";
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
  // og:image itself comes from app/opengraph-image.tsx; these tags are what make
  // crawlers use it instead of scraping the first image on the page.
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.title,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
  },
};



import { CartProvider } from "@/context/CartContext";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HideOnTrips from "./components/HideOnTrips";
import Banner from "./components/Banner";
import { getBannerEnabled, getBannerText, getBannerLink, getLiveEnabled } from "@/lib/live-state";
import { getAllTripSlugs } from "@/lib/trips";
import { draftMode } from "next/headers";

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [bannerEnabled, bannerText, bannerLink, isLive, { isEnabled: includeDrafts }] =
    await Promise.all([
      getBannerEnabled(),
      getBannerText(),
      getBannerLink(),
      getLiveEnabled(),
      draftMode(),
    ]);
  const hasTrips = getAllTripSlugs({ includeDrafts }).length > 0;

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
      {/* count.js only fires on document load; this reports next/link navigations. */}
      <GoatCounterRouteTracker />
      <body
        className={`bg-[var(--color-bg)] text-[var(--color-text)] antialiased overflow-x-hidden px-4 md:px-8 md:overflow-x-visible min-h-screen flex flex-col`}
      >
        <CartProvider>
          {bannerEnabled && (
            <div className="-mx-4 md:-mx-8" style={{ position: "relative", zIndex: 60 }}>
              <Banner text={bannerText} href={bannerLink} />
            </div>
          )}
          <Header homeGlass={isLive} showTrips={hasTrips} />
          <div className="flex-grow">{children}</div>
          <HideOnTrips>
            <Footer />
          </HideOnTrips>
        </CartProvider>
      </body>
    </html>
  );
}
