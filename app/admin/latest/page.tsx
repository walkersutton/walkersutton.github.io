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
  getLatestFallback,
  getLatestPostCandidate,
  getLatestProjectCandidate,
  getLatestTripCandidate,
  type LatestFallback,
} from "@/lib/latest";
import {
  LATEST_TEMPLATE_LABELS,
  type LatestTemplateKey,
} from "@/lib/latest-templates";
import InstagramAccountsEditor from "../InstagramAccountsEditor";
import Thumb from "./Thumb";

export const dynamic = "force-dynamic";

type FeedItem = LatestFallback & {
  key: string;
  source: string;
  account?: string;
  external: boolean;
};

// Posts cached before thumbnails were recorded can still show one: a YouTube
// still is derivable from the video id alone.
function youTubeThumbnail(href: string): string | undefined {
  const id = href.match(/youtube\.com\/watch\?v=([\w-]+)/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminLatestPage() {
  const [
    latestOverride,
    socialLatestPosts,
    youtubeChannelId,
    blueskyHandle,
    instagramAccounts,
    latestTemplates,
    homeAuto,
  ] = await Promise.all([
    getLatestOverride(),
    getSocialLatestPosts(),
    getYouTubeChannelId(),
    getBlueskyHandle(),
    getInstagramAccounts(),
    getLatestTemplates(),
    getLatestFallback(),
  ]);

  const usernameByUserId = new Map(
    instagramAccounts.map((account) => [account.userId, account.username ?? account.userId]),
  );

  const siteItems: [string, LatestFallback | null][] = [
    ["Project", getLatestProjectCandidate(latestTemplates)],
    ["Trip report", getLatestTripCandidate(latestTemplates)],
    ["Post", getLatestPostCandidate(latestTemplates)],
  ];

  const items: FeedItem[] = [
    ...socialLatestPosts.map((post) => ({
      ...post,
      thumbnail: post.thumbnail ?? youTubeThumbnail(post.href),
      key: `${post.platform}-${post.account}`,
      source: post.platform,
      account: usernameByUserId.get(post.account) ?? post.account,
      external: true,
    })),
    ...siteItems.flatMap(([source, item]) =>
      item ? [{ ...item, key: source, source, external: false }] : [],
    ),
  ].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));

  // Mirrors the home page: the override wins outright, otherwise the newest of
  // the automatic candidates.
  const homeHref = latestOverride ? null : homeAuto?.href;

  const sourceCount =
    (youtubeChannelId ? 1 : 0) + (blueskyHandle ? 1 : 0) + instagramAccounts.length;
  const sourceSummary = [
    youtubeChannelId && "YouTube",
    blueskyHandle && "Bluesky",
    instagramAccounts.length &&
      `${instagramAccounts.length} Instagram account${instagramAccounts.length === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <h1 className="adm-page-title">Latest</h1>
      <p className="adm-page-sub">
        The &ldquo;latest&rdquo; line on the home page and where it pulls from.
      </p>

      <section className="adm-section">
        <div className="adm-section-head">
          <h2 className="adm-section-title">Newest from each source</h2>
          <form action={refreshSocialLatestNow}>
            <button type="submit" className="adm-btn" data-variant="quiet">
              Refresh now
            </button>
          </form>
        </div>
        <div className="adm-card">
          {items.length ? (
            items.map((item) => (
              <div key={item.key} className="adm-media">
                <a
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  className="adm-media-thumb"
                  tabIndex={-1}
                  aria-hidden
                >
                  <Thumb src={item.thumbnail} label={item.source} />
                </a>
                <div className="adm-media-body">
                  <div className="adm-media-meta">
                    <span className="adm-media-source">{item.source}</span>
                    {item.account && <span>{item.account}</span>}
                    <span>{formatDate(item.publishedAt)}</span>
                    {item.href === homeHref && (
                      <span className="adm-pill" data-tone="ok">
                        On home page
                      </span>
                    )}
                  </div>
                  <a
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noreferrer" : undefined}
                    className="adm-media-title"
                  >
                    {item.title || item.href}
                  </a>
                  {item.description && <p className="adm-media-desc">{item.description}</p>}
                  <p className="adm-media-line">
                    Shows as <q>{item.text}</q>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="adm-empty">
              Nothing cached yet — runs daily via /api/cron/refresh-latest, or use Refresh now.
            </p>
          )}
        </div>
      </section>

      <section className="adm-section">
        <h2 className="adm-section-title">Override</h2>
        <form action={saveLatestOverride} className="adm-card">
          <div className="adm-row">
            <div className="adm-row-text" style={{ flexBasis: "100%" }}>
              <span className="adm-row-hint">
                {latestOverride
                  ? "Overriding the home page right now. Clear both fields to go back to automatic."
                  : "Pin a specific line to the home page. Leave blank to use the newest item above."}
              </span>
            </div>
            <input
              name="latestText"
              placeholder="Text"
              aria-label="Override text"
              defaultValue={latestOverride?.text ?? ""}
              className="adm-input"
              style={{ flex: "1 1 220px", width: "auto" }}
            />
            <input
              name="latestHref"
              placeholder="Link URL"
              aria-label="Override link"
              defaultValue={latestOverride?.href ?? ""}
              className="adm-input"
              style={{ flex: "1 1 220px", width: "auto" }}
            />
            <button type="submit" className="adm-btn">
              Save
            </button>
          </div>
        </form>
      </section>

      <section className="adm-section">
        <h2 className="adm-section-title">Settings</h2>
        <div className="adm-card">
          <details className="adm-disclosure">
            <summary>
              <span className="adm-row-text">
                <span className="adm-row-label">Sources</span>
                <span className="adm-row-hint">
                  {sourceCount ? sourceSummary : "None connected"}
                </span>
              </span>
            </summary>
            <div className="adm-disclosure-body">
              <form action={saveYouTubeChannelId} className="adm-row">
                <span className="adm-row-label" style={{ minWidth: 80 }}>
                  YouTube
                </span>
                <input
                  name="youtubeChannelId"
                  placeholder="Channel ID (UC…)"
                  aria-label="YouTube channel ID"
                  defaultValue={youtubeChannelId ?? ""}
                  className="adm-input"
                  style={{ flex: 1, width: "auto" }}
                />
                <button type="submit" className="adm-btn">
                  Save
                </button>
              </form>
              <form action={saveBlueskyHandle} className="adm-row">
                <span className="adm-row-label" style={{ minWidth: 80 }}>
                  Bluesky
                </span>
                <input
                  name="blueskyHandle"
                  placeholder="handle.bsky.social"
                  aria-label="Bluesky handle"
                  defaultValue={blueskyHandle ?? ""}
                  className="adm-input"
                  style={{ flex: 1, width: "auto" }}
                />
                <button type="submit" className="adm-btn">
                  Save
                </button>
              </form>
              <div className="adm-row" style={{ paddingBottom: 0 }}>
                <span className="adm-row-label">Instagram</span>
              </div>
              <InstagramAccountsEditor action={saveInstagramAccounts} accounts={instagramAccounts} />
            </div>
          </details>

          <details className="adm-disclosure">
            <summary>
              <span className="adm-row-text">
                <span className="adm-row-label">Text templates</span>
                <span className="adm-row-hint">
                  How each kind of item is worded on the home page
                </span>
              </span>
            </summary>
            <form action={saveLatestTemplates} className="adm-disclosure-body">
              <p className="adm-row-hint" style={{ padding: "12px 16px 0", margin: 0 }}>
                prefix + content + suffix — use {"{title}"} in content where the item&apos;s own
                name should go.
              </p>
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Channel</th>
                    <th>Prefix</th>
                    <th>Content</th>
                    <th>Suffix</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(LATEST_TEMPLATE_LABELS) as LatestTemplateKey[]).map((key) => (
                    <tr key={key}>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        {LATEST_TEMPLATE_LABELS[key]}
                      </td>
                      <td data-label="Prefix">
                        <input
                          name={`${key}.prefix`}
                          aria-label={`${LATEST_TEMPLATE_LABELS[key]} prefix`}
                          defaultValue={latestTemplates[key].prefix}
                          className="adm-input"
                        />
                      </td>
                      <td data-label="Content">
                        <input
                          name={`${key}.content`}
                          aria-label={`${LATEST_TEMPLATE_LABELS[key]} content`}
                          defaultValue={latestTemplates[key].content}
                          className="adm-input"
                        />
                      </td>
                      <td data-label="Suffix">
                        <input
                          name={`${key}.suffix`}
                          aria-label={`${LATEST_TEMPLATE_LABELS[key]} suffix`}
                          defaultValue={latestTemplates[key].suffix}
                          className="adm-input"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="adm-card-foot" style={{ justifyContent: "flex-end" }}>
                <button type="submit" className="adm-btn" data-variant="primary">
                  Save templates
                </button>
              </div>
            </form>
          </details>
        </div>
      </section>
    </div>
  );
}
