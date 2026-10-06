import Link from "next/link";
import { draftMode } from "next/headers";
import {
  getLiveEnabled,
  getBannerEnabled,
  getBannerText,
  getBannerLink,
  getActiveTripName,
  getAuthState,
} from "@/lib/live-state";
import { passkeysFor, siteRpID } from "@/lib/passkeys";
import {
  setLive,
  setBanner,
  setDraftPreview,
  saveBannerText,
  saveBannerLink,
  saveActiveTripName,
} from "./actions";
import TextSettingRow from "./TextSettingRow";
import ToggleRow from "./ToggleRow";

export const dynamic = "force-dynamic";

export default async function AdminGeneralPage() {
  const [
    isLive,
    isBannerEnabled,
    bannerText,
    bannerLink,
    activeTripName,
    { isEnabled: showDrafts },
    { passkeys },
  ] = await Promise.all([
    getLiveEnabled(),
    getBannerEnabled(),
    getBannerText(),
    getBannerLink(),
    getActiveTripName(),
    draftMode(),
    getAuthState(),
  ]);
  // Until there's a passkey for the live site, the password is still the way in.
  const needsPasskey =
    process.env.NODE_ENV !== "development" && passkeysFor(passkeys, siteRpID()).length === 0;

  return (
    <div>
      <h1 className="adm-page-title">General</h1>
      <p className="adm-page-sub">
        Site-wide switches. Changes go live as soon as you make them.
      </p>

      {needsPasskey && (
        <div className="adm-callout">
          <div className="adm-row-text">
            <span className="adm-row-label">Sign in with a passkey</span>
            <span className="adm-row-hint">
              Use Face ID or Touch ID instead of the password. The password turns off once you add one.
            </span>
          </div>
          <Link href="/admin/security" className="adm-btn" data-variant="primary">
            Add a passkey
          </Link>
        </div>
      )}

      <div className="adm-grid">
        <section className="adm-section">
          <h2 className="adm-section-title">Trip</h2>
          <div className="adm-card">
            <ToggleRow
              label="On a trip"
              hint="Puts the live map on the home page and shows trip links on /links"
              checked={isLive}
              action={setLive}
            />
            <TextSettingRow
              label="Active trip"
              name="activeTripName"
              value={activeTripName}
              action={saveActiveTripName}
            />
          </div>
        </section>

        <section className="adm-section">
          <h2 className="adm-section-title">Banner</h2>
          <div className="adm-card">
            <ToggleRow
              label="Show banner"
              hint="The strip across the top of every page"
              checked={isBannerEnabled}
              action={setBanner}
            />
            <TextSettingRow
              label="Text"
              name="bannerText"
              value={bannerText}
              action={saveBannerText}
            />
            <TextSettingRow
              label="Link"
              name="bannerLink"
              value={bannerLink}
              action={saveBannerLink}
              placeholder="/trips or https://…"
            />
          </div>
        </section>

        <section className="adm-section">
          <h2 className="adm-section-title">Preview</h2>
          <div className="adm-card">
            <ToggleRow
              label="Show drafts"
              hint="Only in this browser"
              checked={showDrafts}
              action={setDraftPreview}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
