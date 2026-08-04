"use client";

import { useRef, useState } from "react";
import { SITE_CONFIG } from "@/lib/config";
import type { LiveReportEntry } from "@/lib/live-state";
import { updateReportEntry, deleteReportEntry } from "../actions";
import { INPUT, BTN } from "../styles";
import { REPORT_IMAGE_ACCEPT, uploadReportImages } from "./upload-images";

const TEXT_LINK: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  fontSize: 12,
  color: "var(--color-text-faint)",
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

function fmtEntryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: SITE_CONFIG.timeZone,
  }).format(d);
}

export default function ReportEntryItem({ entry }: { entry: LiveReportEntry }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.text);
  const [images, setImages] = useState(entry.images);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setText(entry.text);
    setImages(entry.images);
    setNewFiles([]);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    if (busy) return;
    setEditing(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!text.trim() && images.length === 0 && newFiles.length === 0) {
      setError("An update needs text or at least one photo.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const uploaded = await uploadReportImages(newFiles);

      const fd = new FormData();
      fd.set("id", entry.id);
      fd.set("text", text);
      for (const url of [...images, ...uploaded]) fd.append("imageUrl", url);
      await updateReportEntry(fd);

      setNewFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      setEditing(false);
    } catch (err) {
      setError((err as Error).message || "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ borderBottom: "1px solid var(--color-border-faint)", paddingBottom: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)" }}>
          {fmtEntryDate(entry.date)}
        </span>
        {!editing && (
          <span style={{ display: "flex", gap: 14 }}>
            <button type="button" onClick={startEditing} style={TEXT_LINK}>
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteReportEntry(entry.id)}
              style={TEXT_LINK}
            >
              Delete
            </button>
          </span>
        )}
      </div>

      {editing ? (
        <form onSubmit={onSave}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            style={{ ...INPUT, width: "100%", resize: "vertical", lineHeight: 1.6 }}
          />

          {images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {images.map((src) => (
                <div key={src} style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{ height: 72, width: 72, objectFit: "cover", borderRadius: 4 }}
                  />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImages(images.filter((url) => url !== src))}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      height: 20,
                      width: 20,
                      borderRadius: "50%",
                      border: "none",
                      background: "var(--color-text)",
                      color: "var(--color-bg)",
                      fontSize: 12,
                      lineHeight: 1,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <input
              ref={fileRef}
              type="file"
              accept={REPORT_IMAGE_ACCEPT}
              multiple
              onChange={(e) => setNewFiles(Array.from(e.target.files ?? []))}
              style={{ fontSize: 12, color: "var(--color-text-variant)" }}
            />
            {newFiles.length > 0 && (
              <span style={{ fontSize: 12, color: "var(--color-text-faint)", marginLeft: 8 }}>
                {newFiles.length} photo{newFiles.length !== 1 ? "s" : ""} to add
              </span>
            )}
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "var(--accent-red, #c0392b)", marginTop: 10 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center" }}>
            <button
              type="submit"
              disabled={busy}
              style={{ ...BTN(false), opacity: busy ? 0.5 : 1 }}
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={cancelEditing} disabled={busy} style={TEXT_LINK}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {entry.text && (
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--color-text-variant)",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {entry.text}
            </p>
          )}
          {entry.images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {entry.images.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  style={{ height: 72, width: 72, objectFit: "cover", borderRadius: 4 }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
