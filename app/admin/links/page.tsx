import Link from "next/link";
import { getSiteLinks } from "@/lib/live-state";
import { saveSiteLinks } from "../actions";
import LinksEditor from "./LinksEditor";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  const links = await getSiteLinks();

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--color-text-faint)", marginBottom: 16 }}>
        The rows on{" "}
        <Link
          href="/links"
          style={{ color: "var(--color-text-faint)", textUnderlineOffset: 3 }}
        >
          /links
        </Link>
        , in order. Live tracker and Trip report are added automatically while a
        trip is on, so they don&apos;t need a row here.
      </p>

      <LinksEditor links={links} action={saveSiteLinks} />
    </div>
  );
}
