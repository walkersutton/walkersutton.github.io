import {
  getLatestOverride,
  getSocialLatestPosts,
  getYouTubeChannelId,
  getBlueskyHandle,
  getInstagramAccounts,
  getLatestTemplates,
} from "@/lib/live-state";
import {
  saveLatestOverride,
  saveYouTubeChannelId,
  saveBlueskyHandle,
  saveInstagramAccounts,
  saveLatestTemplates,
  refreshSocialLatestNow,
} from "../actions";
import {
  getLatestPostCandidate,
  getLatestProjectCandidate,
  getLatestTripCandidate,
} from "@/lib/latest";
import { LATEST_TEMPLATE_LABELS, type LatestTemplateKey } from "@/lib/latest-templates";
import InstagramAccountsEditor from "../InstagramAccountsEditor";
import { ROW, LABEL, INPUT, BTN, FIELD_GRID } from "../styles";

export const dynamic = "force-dynamic";

export default async function AdminLatestPage() {
  const latestOverride = await getLatestOverride();
  const socialLatestPosts = await getSocialLatestPosts();
  const youtubeChannelId = await getYouTubeChannelId();
  const blueskyHandle = await getBlueskyHandle();
  const instagramAccounts = await getInstagramAccounts();
  const latestTemplates = await getLatestTemplates();
  const latestProject = getLatestProjectCandidate(latestTemplates);
  const latestTrip = getLatestTripCandidate(latestTemplates);
  const latestPost = getLatestPostCandidate(latestTemplates);

  const instagramUsernameByUserId = new Map(
    instagramAccounts.map((account) => [account.userId, account.username ?? account.userId]),
  );

  const autoFetchedItems = [
    ...socialLatestPosts.map((post) => ({
      key: `${post.platform}-${post.account}`,
      label: post.platform,
      detail: instagramUsernameByUserId.get(post.account) ?? post.account,
      text: post.text,
      href: post.href,
      publishedAt: post.publishedAt,
      external: true,
    })),
    ...(
      [
        latestProject && { label: "Project", ...latestProject },
        latestTrip && { label: "Trip report", ...latestTrip },
        latestPost && { label: "Post", ...latestPost },
      ].filter((c): c is { label: string; text: string; href: string; publishedAt: string } => !!c)
    ).map((item) => ({ key: item.label, detail: null, external: false, ...item })),
  ].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  return (
    <div>
      <div style={{ ...ROW, alignItems: "flex-start", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span style={LABEL}>Auto-fetched</span>
          <form action={refreshSocialLatestNow}>
            <button type="submit" style={BTN(false)}>Force refresh</button>
          </form>
        </div>
        {autoFetchedItems.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            {autoFetchedItems.map((item) => (
              <div
                key={item.key}
                style={{
                  fontSize: 12,
                  color: "var(--color-text-faint)",
                  // Post URLs have no spaces to break at and would otherwise
                  // push the whole column past the edge of the screen.
                  overflowWrap: "anywhere",
                }}
              >
                <span style={{ color: "var(--color-text)", fontWeight: 600 }}>{item.label}</span>
                {item.detail ? ` (${item.detail})` : ""}
                {" "}
                — {item.text} →{" "}
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  style={{ color: "inherit" }}
                >
                  {item.href}
                </a>
                {item.publishedAt ? ` (${new Date(item.publishedAt).toLocaleString()})` : ""}
              </div>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
            nothing cached yet — runs daily via /api/cron/refresh-latest, or use Force refresh
          </span>
        )}
      </div>

      <form action={saveLatestOverride} style={{ padding: "14px 0", borderBottom: "1px solid var(--color-border-faint)", display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={LABEL}>Latest override</span>
        <input
          name="latestText"
          placeholder="Text (leave blank to use auto-fetched)"
          defaultValue={latestOverride?.text ?? ""}
          style={INPUT}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <input
            name="latestHref"
            placeholder="Link URL (leave blank to use auto-fetched)"
            defaultValue={latestOverride?.href ?? ""}
            style={{ ...INPUT, flex: 1 }}
          />
          <button type="submit" style={BTN(false)}>Save</button>
        </div>
      </form>

      <form action={saveYouTubeChannelId} style={ROW}>
        <span style={LABEL}>YouTube channel</span>
        <input
          name="youtubeChannelId"
          placeholder="Channel ID (UC...)"
          defaultValue={youtubeChannelId ?? ""}
          style={{ ...INPUT, flex: 1 }}
        />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <form action={saveBlueskyHandle} style={ROW}>
        <span style={LABEL}>Bluesky handle</span>
        <input
          name="blueskyHandle"
          placeholder="handle.bsky.social"
          defaultValue={blueskyHandle ?? ""}
          style={{ ...INPUT, flex: 1 }}
        />
        <button type="submit" style={BTN(false)}>Save</button>
      </form>

      <div style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={LABEL}>Instagram accounts</span>
        <InstagramAccountsEditor action={saveInstagramAccounts} accounts={instagramAccounts} />
      </div>

      <form action={saveLatestTemplates} style={{ padding: "14px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={LABEL}>Text templates</span>
        <span style={{ fontSize: 12, color: "var(--color-text-faint)" }}>
          prefix + content + suffix, per platform/channel — use {"{title}"} in content where the item&apos;s own name should be inserted
        </span>
        {/* Label above the fields rather than beside them: a label plus three
            inputs on one line has nowhere to go on a phone. */}
        {(Object.keys(LATEST_TEMPLATE_LABELS) as LatestTemplateKey[]).map((key) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ ...LABEL, minWidth: 0, fontSize: 12 }}>
              {LATEST_TEMPLATE_LABELS[key]}
            </span>
            <div style={FIELD_GRID}>
              <input
                name={`${key}.prefix`}
                placeholder="Prefix"
                defaultValue={latestTemplates[key].prefix}
                style={INPUT}
              />
              <input
                name={`${key}.content`}
                placeholder="Content"
                defaultValue={latestTemplates[key].content}
                style={INPUT}
              />
              <input
                name={`${key}.suffix`}
                placeholder="Suffix"
                defaultValue={latestTemplates[key].suffix}
                style={INPUT}
              />
            </div>
          </div>
        ))}
        <div>
          <button type="submit" style={BTN(false)}>Save</button>
        </div>
      </form>
    </div>
  );
}
