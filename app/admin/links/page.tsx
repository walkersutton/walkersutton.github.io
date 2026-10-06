import Link from "next/link";
import { getSiteLinks } from "@/lib/live-state";
import { saveSiteLinks } from "../actions";
import LinksEditor from "./LinksEditor";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
  const links = await getSiteLinks();

  return (
    <div>
      <h1 className="adm-page-title">Links</h1>
      <p className="adm-page-sub">
        The rows on{" "}
        <Link
          href="/links"
          style={{ color: "inherit", textUnderlineOffset: 3 }}
        >
          /links
        </Link>
        , in order — all of them. A row set to follow the trip only appears
        while there is one, so the tracker and report links take themselves down
        when the trip ends.
      </p>

      <LinksEditor links={links} action={saveSiteLinks} />
    </div>
  );
}
