"use server";

import { cookies, draftMode, headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL, isoUint8Array } from "@simplewebauthn/server/helpers";
import {
  CHALLENGE_COOKIE,
  CHALLENGE_COOKIE_OPTIONS,
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  getSession,
  readChallenge,
  signChallenge,
  signToken,
  verifyPassword,
  type Session,
} from "@/lib/admin-auth";
import {
  FRESH_SESSION_MS,
  deviceName,
  passkeysFor,
  passwordSignInAllowed,
  providerName,
  relyingParty,
  siteRpID,
} from "@/lib/passkeys";
import { SITE_CONFIG } from "@/lib/config";
import {
  addPasskey,
  bumpSessionEpoch,
  getAuthState,
  recordPasskeyUse,
  removePasskey,
  setLiveEnabled,
  setBannerEnabled,
  setBannerText,
  setBannerLink,
  setLatestOverride,
  setActiveTripName,
  setYouTubeChannelId,
  setBlueskyHandle,
  setInstagramAccounts,
  setLatestTemplates,
  getLiveReportEntries,
  addLiveReportEntry,
  updateLiveReportEntry,
  removeLiveReportEntry,
  restoreLiveReportEntries,
  setLiveReportEntries,
  setMapShareFeedUrl,
  setMapShareStartDate,
  setSiteLinks,
} from "@/lib/live-state";
import type { LiveReportEntry } from "@/lib/live-state";
import {
  archiveReportEntry,
  findMissingEntryIds,
  forgetAllArchivedEntries,
  forgetArchivedEntry,
  readArchivedEntries,
} from "@/lib/report-archive";
import { isAllowedHref, isLinkVisibility, type SiteLink } from "@/lib/links";
import { isValidTimeZone } from "@/lib/report-time";
import { refreshSocialLatest } from "@/lib/social-latest";
import type { InstagramAccount } from "@/lib/social-latest";
import { DEFAULT_LATEST_TEMPLATES, type LatestTemplateKey, type LatestTemplates } from "@/lib/latest-templates";
import type { SaveResult } from "./types";

async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

// Every other action only needs to know the caller is signed in.
async function assertAuth() {
  await requireSession();
}

async function startSession(epoch: number) {
  (await cookies()).set(SESSION_COOKIE, signToken(epoch), SESSION_COOKIE_OPTIONS);
}

async function currentRelyingParty() {
  return relyingParty((await headers()).get("host"));
}

/** Reads and spends the pending challenge: each one is good for one try. */
async function takeChallenge(purpose: "auth" | "reg"): Promise<string | null> {
  const store = await cookies();
  const challenge = readChallenge(store.get(CHALLENGE_COOKIE)?.value, purpose);
  store.delete({ name: CHALLENGE_COOKIE, path: CHALLENGE_COOKIE_OPTIONS.path });
  return challenge;
}

export async function login(_prev: { error?: string }, formData: FormData) {
  const { passkeys, sessionEpoch, degraded } = await getAuthState();
  // Checked before the password itself, so with passkeys set up a guess
  // learns nothing — not even whether it was right.
  if (!passwordSignInAllowed(passkeysFor(passkeys, siteRpID()).length, degraded)) {
    return { error: "Password sign-in is off. Use your passkey." };
  }
  const password = (formData.get("password") as string | null) ?? "";
  if (!verifyPassword(password)) {
    return { error: "Wrong password." };
  }
  await startSession(sessionEpoch);
  redirect("/admin");
}

type Failure = { ok: false; error: string };

export async function startPasskeySignIn(): Promise<
  { ok: true; options: PublicKeyCredentialRequestOptionsJSON } | Failure
> {
  const rp = await currentRelyingParty();
  if (!rp) return { ok: false, error: "Passkeys don't work on this address." };
  // No allowCredentials: passkeys are discoverable, so the browser offers
  // whichever ones it holds for this domain without us listing them.
  const options = await generateAuthenticationOptions({ rpID: rp.rpID, userVerification: "required" });
  (await cookies()).set(CHALLENGE_COOKIE, signChallenge("auth", options.challenge), CHALLENGE_COOKIE_OPTIONS);
  return { ok: true, options };
}

export async function finishPasskeySignIn(
  response: AuthenticationResponseJSON,
): Promise<{ ok: true } | Failure> {
  const challenge = await takeChallenge("auth");
  if (!challenge) return { ok: false, error: "That took too long. Try again." };
  const rp = await currentRelyingParty();
  if (!rp) return { ok: false, error: "Passkeys don't work on this address." };

  const { passkeys, sessionEpoch } = await getAuthState();
  const passkey = passkeysFor(passkeys, rp.rpID).find((p) => p.id === response.id);
  if (!passkey) return { ok: false, error: "That passkey isn't registered here." };

  let verified = false;
  let newCounter = passkey.counter;
  try {
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: rp.origins,
      expectedRPID: rp.rpID,
      credential: {
        id: passkey.id,
        publicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports,
      },
      requireUserVerification: true,
    });
    verified = result.verified;
    newCounter = result.authenticationInfo.newCounter;
  } catch (error) {
    console.error("finishPasskeySignIn: verification failed", error);
  }
  if (!verified) return { ok: false, error: "Couldn't verify that passkey." };

  try {
    await recordPasskeyUse(passkey.id, newCounter);
  } catch (error) {
    // Not worth refusing a valid sign-in over.
    console.error("finishPasskeySignIn: could not record use", error);
  }
  await startSession(sessionEpoch);
  return { ok: true };
}

export async function startPasskeyRegistration(): Promise<
  { ok: true; options: PublicKeyCredentialCreationOptionsJSON } | Failure
> {
  const session = await requireSession();
  const rp = await currentRelyingParty();
  if (!rp) return { ok: false, error: `Passkeys can only be added on ${siteRpID()}.` };

  const { passkeys } = await getAuthState();
  const existing = passkeysFor(passkeys, rp.rpID);
  if (existing.length > 0 && Date.now() - session.issuedAt > FRESH_SESSION_MS) {
    return { ok: false, error: "For safety, sign out and back in before adding another passkey." };
  }

  const options = await generateRegistrationOptions({
    rpName: siteRpID(),
    rpID: rp.rpID,
    userName: "admin",
    userDisplayName: `${SITE_CONFIG.title} (admin)`,
    // One stable user, so every passkey belongs to the same account.
    userID: isoUint8Array.fromUTF8String("admin"),
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
  });
  (await cookies()).set(CHALLENGE_COOKIE, signChallenge("reg", options.challenge), CHALLENGE_COOKIE_OPTIONS);
  return { ok: true, options };
}

export async function finishPasskeyRegistration(
  response: RegistrationResponseJSON,
): Promise<{ ok: true } | Failure> {
  await requireSession();
  const challenge = await takeChallenge("reg");
  if (!challenge) return { ok: false, error: "That took too long. Try again." };
  const rp = await currentRelyingParty();
  if (!rp) return { ok: false, error: `Passkeys can only be added on ${siteRpID()}.` };

  try {
    const result = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: rp.origins,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
    });
    if (!result.verified) return { ok: false, error: "Couldn't verify the new passkey." };

    const { credential, aaguid, credentialBackedUp } = result.registrationInfo;
    await addPasskey({
      id: credential.id,
      publicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? response.response.transports,
      rpID: rp.rpID,
      provider: providerName(aaguid),
      device: deviceName((await headers()).get("user-agent")),
      backedUp: credentialBackedUp,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("finishPasskeyRegistration: failed", error);
    return { ok: false, error: "Couldn't save the new passkey." };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Bumps the session epoch, then re-signs this browser so it stays in. */
async function revokeOtherSessions() {
  const epoch = await bumpSessionEpoch();
  await startSession(epoch);
}

export async function deletePasskey(id: string): Promise<{ ok: true } | Failure> {
  await requireSession();
  try {
    await removePasskey(id);
    // Whatever signed in with it shouldn't outlive it.
    await revokeOtherSessions();
  } catch (error) {
    console.error("deletePasskey: failed", error);
    return { ok: false, error: "Couldn't remove that passkey." };
  }
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function signOutOtherSessions(): Promise<{ ok: true } | Failure> {
  await requireSession();
  try {
    await revokeOtherSessions();
  } catch (error) {
    console.error("signOutOtherSessions: failed", error);
    return { ok: false, error: "Couldn't sign out other sessions." };
  }
  revalidatePath("/admin/security");
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  // Delete with the same path the cookie was written at: the browser keys
  // cookies by (name, domain, path), so a bare delete() emits an expiry for
  // path "/" and leaves the real /admin cookie untouched. Only one expiry can
  // be queued per cookie name here — the response cookie store is keyed by
  // name — so it has to be the one that matches SESSION_COOKIE_OPTIONS.
  store.delete({ name: SESSION_COOKIE, path: SESSION_COOKIE_OPTIONS.path });
  redirect("/admin");
}

/**
 * Garmin's MapShare *page* is share.garmin.com/<name>, but the KML the map
 * needs is share.garmin.com/Feed/Share/<name>. Copying the link on a phone
 * gives you the former, so accept it and convert rather than rejecting it.
 */
function toFeedUrl(url: URL): URL {
  if (!url.hostname.endsWith("garmin.com")) return url;
  if (/^\/Feed\/Share\//i.test(url.pathname)) return url;

  const name = url.pathname.split("/").filter(Boolean).pop();
  if (!name) return url;

  const feed = new URL(url.toString());
  feed.pathname = `/Feed/Share/${name}`;
  return feed;
}

export async function saveMapShareSettings(
  _prev: { error?: string; saved?: string },
  formData: FormData,
): Promise<{ error?: string; saved?: string }> {
  await assertAuth();
  const raw = (formData.get("feedUrl") as string | null)?.trim() ?? "";
  const startDate = (formData.get("startDate") as string | null)?.trim() ?? "";

  // Empty clears it and falls back to the rolling window.
  if (startDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return { error: "Trip start must be a date, e.g. 2026-08-04." };
    }
    const parsedDate = new Date(`${startDate}T00:00:00Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: "That trip start date does not exist." };
    }
    // A start in the future means the feed's window has not opened yet and
    // Garmin returns nothing, which looks exactly like a broken feed.
    if (parsedDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return { error: "Trip start is in the future, so the feed would return no points." };
    }
  }

  let feedUrl = "";
  if (raw) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      return { error: "That is not a valid URL. It should start with https://" };
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { error: "That is not an http(s) URL." };
    }
    feedUrl = toFeedUrl(parsed).toString();
  }

  try {
    await setMapShareFeedUrl(feedUrl);
    await setMapShareStartDate(startDate);
  } catch (error) {
    return { error: (error as Error).message || "Could not save." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/mapshare");
  return {
    saved: [
      feedUrl ? `Feed: ${feedUrl}` : "Feed cleared — using the deployment environment.",
      startDate ? `Trip start: ${startDate}` : "Trip start cleared — using a rolling 7-day window.",
    ].join(" · "),
  };
}

export async function setLive(enabled: boolean) {
  await assertAuth();
  await setLiveEnabled(enabled);
  revalidatePath("/", "layout");
}

export async function setDraftPreview(enabled: boolean) {
  await assertAuth();
  const draft = await draftMode();
  if (enabled) draft.enable();
  else draft.disable();
  revalidatePath("/", "layout");
}

export async function setBanner(enabled: boolean) {
  await assertAuth();
  await setBannerEnabled(enabled);
  revalidatePath("/", "layout");
}

// These three report what was stored rather than returning void: an empty field
// used to be a silent no-op that left the old value on screen, which is
// indistinguishable from a save that failed.
export async function saveBannerText(_prev: SaveResult, formData: FormData): Promise<SaveResult> {
  await assertAuth();
  const text = (formData.get("bannerText") as string | null)?.trim() ?? "";
  if (!text) return { error: "Banner text can't be empty." };
  await setBannerText(text);
  revalidatePath("/", "layout");
  return { saved: text };
}

export async function saveBannerLink(_prev: SaveResult, formData: FormData): Promise<SaveResult> {
  await assertAuth();
  const link = (formData.get("bannerLink") as string | null)?.trim() ?? "";
  if (!link) return { error: "Banner link can't be empty." };
  await setBannerLink(link);
  revalidatePath("/", "layout");
  return { saved: link };
}

export async function saveActiveTripName(
  _prev: SaveResult,
  formData: FormData,
): Promise<SaveResult> {
  await assertAuth();
  const name = (formData.get("activeTripName") as string | null)?.trim() ?? "";
  if (!name) return { error: "Trip name can't be empty." };
  await setActiveTripName(name);
  revalidatePath("/", "layout");
  return { saved: name };
}

export async function saveLatestOverride(formData: FormData) {
  await assertAuth();
  const text = (formData.get("latestText") as string | null)?.trim() ?? "";
  const href = (formData.get("latestHref") as string | null)?.trim() ?? "";
  await setLatestOverride(text, href);
  revalidatePath("/");
}

export async function saveYouTubeChannelId(formData: FormData) {
  await assertAuth();
  const id = (formData.get("youtubeChannelId") as string | null)?.trim() ?? "";
  await setYouTubeChannelId(id);
  revalidatePath("/", "layout");
}

export async function saveBlueskyHandle(formData: FormData) {
  await assertAuth();
  const handle = (formData.get("blueskyHandle") as string | null)?.trim() ?? "";
  await setBlueskyHandle(handle);
  revalidatePath("/", "layout");
}

export async function refreshSocialLatestNow() {
  await assertAuth();
  await refreshSocialLatest();
  revalidatePath("/", "layout");
  revalidatePath("/admin/latest");
}

export async function saveInstagramAccounts(formData: FormData) {
  await assertAuth();
  const userIds = formData.getAll("userId") as string[];
  const accessTokens = formData.getAll("accessToken") as string[];
  const usernames = formData.getAll("username") as string[];
  const accounts: InstagramAccount[] = userIds
    .map((userId, i) => {
      const username = (usernames[i] ?? "").trim();
      return {
        userId: userId.trim(),
        accessToken: (accessTokens[i] ?? "").trim(),
        ...(username ? { username } : {}),
      };
    })
    .filter((account): account is InstagramAccount => Boolean(account.userId && account.accessToken));
  await setInstagramAccounts(accounts);
  revalidatePath("/", "layout");
}

// Returns the failure rather than throwing it: Next replaces a thrown server
// action error with an opaque digest in production, which reaches the editor as
// a generic message and reads as "the button did nothing".
export async function publishReportEntry(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAuth();
  const text = (formData.get("text") as string | null)?.trim() ?? "";
  const images = (formData.getAll("imageUrl") as string[])
    .map((url) => url.trim())
    .filter(Boolean);
  if (!text && images.length === 0) return { ok: false, error: "Nothing to publish." };

  // An unrecognised zone is dropped rather than stored: rendering falls back to
  // the site zone, which is the same behaviour as an entry posted before this
  // was recorded.
  const posted = (formData.get("tz") as string | null)?.trim() ?? "";
  const tz = posted && isValidTimeZone(posted) ? posted : undefined;

  const entry: LiveReportEntry = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    text,
    images,
    tz,
  };

  // Archive before the state write, not after. If the write below fails, or
  // succeeds and is then clobbered by something else, the update still exists
  // somewhere and /admin/report offers to put it back. The other order would
  // leave the only copy in whatever the state write produced.
  try {
    await archiveReportEntry(entry);
  } catch (error) {
    // A missing safety net is not a reason to refuse to publish from a tent.
    console.error("publishReportEntry: could not archive entry", error);
  }

  try {
    await addLiveReportEntry(entry);
  } catch (error) {
    console.error("publishReportEntry: failed to persist entry", error);
    return { ok: false, error: (error as Error).message || "Could not save the update." };
  }

  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
  return { ok: true };
}

export async function updateReportEntry(formData: FormData) {
  await assertAuth();
  const id = (formData.get("id") as string | null) ?? "";
  const text = (formData.get("text") as string | null)?.trim() ?? "";
  const images = (formData.getAll("imageUrl") as string[])
    .map((url) => url.trim())
    .filter(Boolean);
  if (!id || (!text && images.length === 0)) return;

  // The zone an update was posted from is editable because it can be wrong:
  // entries written before it was recorded default to the site's, and a phone
  // that hasn't caught up with the ride reports the old one.
  const rawTz = (formData.get("tz") as string | null)?.trim() ?? "";
  const tz = rawTz && isValidTimeZone(rawTz) ? rawTz : undefined;

  const saved = await updateLiveReportEntry(id, { text, images, tz });
  if (!saved) return;

  try {
    await archiveReportEntry(saved);
  } catch (error) {
    console.error("updateReportEntry: could not archive entry", error);
  }
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
}

export async function deleteReportEntry(id: string) {
  await assertAuth();
  await removeLiveReportEntry(id);
  // A deliberate delete has to reach the archive too, or the next restore would
  // bring it straight back.
  try {
    await forgetArchivedEntry(id);
  } catch (error) {
    console.error("deleteReportEntry: could not drop archived entry", error);
  }
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
}

export async function clearReportEntries() {
  await assertAuth();
  await setLiveReportEntries([]);
  try {
    await forgetAllArchivedEntries();
  } catch (error) {
    console.error("clearReportEntries: could not empty the archive", error);
  }
  revalidatePath("/trips/live/report");
  revalidatePath("/admin/report");
}

/**
 * Puts back updates the archive still holds but the report has lost. Restoring
 * only ever adds: an id already in the report is left exactly as it is.
 */
export async function restoreMissingReportEntries(): Promise<
  { ok: true; restored: number } | { ok: false; error: string }
> {
  await assertAuth();
  try {
    const missingIds = await findMissingEntryIds(await getLiveReportEntries());
    if (missingIds.length === 0) return { ok: true, restored: 0 };

    const entries = await readArchivedEntries(missingIds);
    const restored = await restoreLiveReportEntries(entries);
    revalidatePath("/trips/live/report");
    revalidatePath("/admin/report");
    return { ok: true, restored };
  } catch (error) {
    console.error("restoreMissingReportEntries: failed", error);
    return { ok: false, error: (error as Error).message || "Could not restore updates." };
  }
}

/**
 * Replaces the whole /links list — every row on that page, the trip rows
 * included. Rows arrive as parallel label/href/visibleWhen arrays, in the order
 * they appear on screen, so reordering is just a re-submit.
 */
export async function saveSiteLinks(_prev: SaveResult, formData: FormData): Promise<SaveResult> {
  await assertAuth();
  const labels = (formData.getAll("label") as string[]).map((value) => value.trim());
  const hrefs = (formData.getAll("href") as string[]).map((value) => value.trim());
  const visibilities = (formData.getAll("visibleWhen") as string[]).map((value) => value.trim());

  // A half-filled row is a row being typed, not an error worth blocking on.
  const rows: SiteLink[] = labels
    .map((label, i) => {
      const visibleWhen = visibilities[i] ?? "";
      return {
        label,
        href: hrefs[i] ?? "",
        // "always" is the absence of a condition, so it is stored as one rather
        // than written onto every ordinary row. An unrecognised value can only
        // come from a hand-made request, and means the same thing.
        ...(isLinkVisibility(visibleWhen) && visibleWhen !== "always" ? { visibleWhen } : {}),
      };
    })
    .filter((row) => row.label || row.href);

  const incomplete = rows.find((row) => !row.label || !row.href);
  if (incomplete) {
    return { error: `"${incomplete.label || incomplete.href}" needs both a label and a link.` };
  }
  const bad = rows.find((row) => !isAllowedHref(row.href));
  if (bad) {
    return { error: `${bad.href} isn't a link — use https://… or a path like /trips.` };
  }

  try {
    await setSiteLinks(rows);
  } catch (error) {
    return { error: (error as Error).message || "Could not save." };
  }

  revalidatePath("/links");
  revalidatePath("/admin/links");
  return { saved: `${rows.length} link${rows.length === 1 ? "" : "s"}` };
}

/** The photos the backfill should work through (see lib/report-photos.ts). */
export async function listReportPhotosToShrink(): Promise<
  { ok: true; photos: { url: string; size: number }[] } | { ok: false; error: string }
> {
  await assertAuth();
  try {
    const { listOversizedReportPhotos } = await import("@/lib/report-photos");
    return { ok: true, photos: await listOversizedReportPhotos() };
  } catch (error) {
    console.error("listReportPhotosToShrink: failed", error);
    return { ok: false, error: (error as Error).message || "Could not list photos." };
  }
}

/** Records one converted photo. Called once per photo, so an interrupted run
 *  keeps everything it finished. */
export async function replaceReportPhotoUrl(
  oldUrl: string,
  newUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAuth();
  try {
    const { replaceReportPhoto } = await import("@/lib/report-photos");
    await replaceReportPhoto(oldUrl, newUrl);
    revalidatePath("/trips/live/report");
    revalidatePath("/admin/report");
    return { ok: true };
  } catch (error) {
    console.error("replaceReportPhotoUrl: failed", error);
    return { ok: false, error: (error as Error).message || "Could not save the change." };
  }
}

export async function saveLatestTemplates(formData: FormData) {
  await assertAuth();
  const keys = Object.keys(DEFAULT_LATEST_TEMPLATES) as LatestTemplateKey[];
  const templates = Object.fromEntries(
    keys.map((key) => [
      key,
      {
        prefix: (formData.get(`${key}.prefix`) as string | null) ?? "",
        content: (formData.get(`${key}.content`) as string | null) ?? "",
        suffix: (formData.get(`${key}.suffix`) as string | null) ?? "",
      },
    ]),
  ) as LatestTemplates;
  await setLatestTemplates(templates);
  revalidatePath("/", "layout");
  revalidatePath("/admin/latest");
}
