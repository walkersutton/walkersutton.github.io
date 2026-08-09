"use client";

import { useRef, useState } from "react";
import { SITE_CONFIG } from "@/lib/config";
import type { LiveReportEntry } from "@/lib/live-state";
import { updateReportEntry, deleteReportEntry } from "../actions";
import { BTN } from "../styles";
import AutoGrowTextarea from "./AutoGrowTextarea";
import PhotoField from "./PhotoField";
import { uploadReportImages } from "./upload-images";

// Vertical padding rather than a bare 12px word: these sit inches from Delete on
// a phone, so they need room around them.
const TEXT_LINK: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: "8px 2px",
  fontSize: 13,
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

  // Delete sits a thumb-width from Edit, and there's no undo behind it.
  function confirmDelete() {
    if (!window.confirm("Delete this update?")) return;
    void deleteReportEntry(entry.id);
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
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
          {fmtEntryDate(entry.date)}
        </span>
        {!editing && (
          <span style={{ display: "flex", gap: 20 }}>
            <button type="button" onClick={startEditing} style={TEXT_LINK}>
              Edit
            </button>
            <button type="button" onClick={confirmDelete} style={TEXT_LINK}>
              Delete
            </button>
          </span>
        )}
      </div>

      {editing ? (
        <form onSubmit={onSave}>
          <AutoGrowTextarea
            value={text}
            onChange={setText}
            ariaLabel="Update text"
            minRows={4}
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
                      top: -8,
                      right: -8,
                      height: 28,
                      width: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      borderRadius: "50%",
                      border: "none",
                      background: "var(--color-text)",
                      color: "var(--color-bg)",
                      fontSize: 16,
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

          <PhotoField
            files={newFiles}
            onChange={setNewFiles}
            inputRef={fileRef}
            label="Add photos"
            countNoun="to add"
          />

          {error && (
            <div style={{ fontSize: 13, color: "var(--accent-red, #c0392b)", marginTop: 10 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginTop: 14, alignItems: "center" }}>
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
