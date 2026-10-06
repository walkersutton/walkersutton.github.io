"use client";

import { useMemo, useState } from "react";
import type { Subscriber } from "@/lib/newsletter";

type Filter = "subscribed" | "unsubscribed" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "subscribed", label: "Subscribed" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "all", label: "All" },
];

function ago(iso: string): string {
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toCsv(rows: Subscriber[]): string {
  const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((s) =>
    [
      s.email,
      s.name,
      s.createdAt,
      s.unsubscribed ? "unsubscribed" : "subscribed",
    ]
      .map(quote)
      .join(","),
  );
  return ["email,name,signed_up,status", ...lines].join("\n");
}

export default function SubscribersList({
  subscribers,
}: {
  subscribers: Subscriber[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("subscribed");
  const [copied, setCopied] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscribers.filter((s) => {
      if (filter === "subscribed" && s.unsubscribed) return false;
      if (filter === "unsubscribed" && !s.unsubscribed) return false;
      return (
        !q ||
        s.email.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
      );
    });
  }, [subscribers, query, filter]);

  async function copyEmails() {
    await navigator.clipboard.writeText(visible.map((s) => s.email).join(", "));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadCsv() {
    const url = URL.createObjectURL(
      new Blob([toCsv(visible)], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="adm-toolbar">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email or name"
          aria-label="Search subscribers"
          className="adm-input"
        />
        <div
          className="adm-segmented"
          role="group"
          aria-label="Filter by status"
        >
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-toolbar" style={{ justifyContent: "space-between" }}>
        <span className="adm-row-hint">
          {visible.length} {visible.length === 1 ? "person" : "people"}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            type="button"
            className="adm-btn"
            data-variant="quiet"
            onClick={copyEmails}
            disabled={visible.length === 0}
          >
            {copied ? "Copied" : "Copy emails"}
          </button>
          <button
            type="button"
            className="adm-btn"
            data-variant="quiet"
            onClick={downloadCsv}
            disabled={visible.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="adm-card">
        {visible.length === 0 ? (
          <p className="adm-empty">
            {subscribers.length === 0
              ? "No subscribers yet."
              : "Nobody matches that."}
          </p>
        ) : (
          <table className="adm-table" data-hover>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Signed up</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.id}>
                  <td
                    data-label="Email"
                    className="adm-wrap"
                    style={{ fontWeight: 500 }}
                  >
                    {s.email}
                  </td>
                  <td data-label="Name" className="adm-muted">
                    {s.name || "—"}
                  </td>
                  <td
                    data-label="Signed up"
                    className="adm-num"
                    title={new Date(s.createdAt).toLocaleString()}
                  >
                    {ago(s.createdAt)}
                  </td>
                  <td data-label="Status">
                    <span
                      className="adm-pill"
                      data-tone={s.unsubscribed ? undefined : "ok"}
                    >
                      {s.unsubscribed ? "Unsubscribed" : "Subscribed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
