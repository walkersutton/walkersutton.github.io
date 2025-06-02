import type { Metadata } from "next";
import Script from "next/script";
import { hanken, lexend } from "./fonts";
import "./globals.css";
import Link from "next/link";
import socials from "@/data/chronicallyOnline.json";

export const metadata: Metadata = {
  title: "Walker Sutton",
  description: "69696969696969696969",
};

function Socials({ socials }: { socials: Array<Record<string, string>> }) {
  return (
    <div className="flex flex-row gap-5 underline">
      {socials.map((social) => {
        const { name, href } = social;
        return !name.startsWith("hide") ? (
          <Link href={href} key={name}>
            {name}
          </Link>
        ) : null;
      })}
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${hanken.className}`}>
      <Script
        async
        data-goatcounter="https://walker.goatcounter.com/count"
        src="//gc.zgo.at/count.js"
      />
      {/* TODO see if preconnect actually helps. might need to change href to src above */}
      {/* <link rel="preconnect" href="//walker.goatcounter.com" /> */}
      <body
        className={`bg-[var(--color-bg)] text-[var(--color-text)] antialiased mx-auto max-w-[650px] overflow-x-hidden px-6 py-12 md:overflow-x-visible md:py-16`}
      >
        <header className="mb-15">
          <h1 className={`${lexend.className} text-xl mb-2`}>Walker Sutton</h1>
          <Socials socials={socials} />
        </header>
        {children}
      </body>
    </html>
  );
}
