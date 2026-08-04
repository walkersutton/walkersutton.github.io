"use client";

import { useRef, useState } from "react";
import { publishReportEntry } from "../actions";
import { INPUT, BTN } from "../styles";
import { REPORT_IMAGE_ACCEPT, uploadReportImages } from "./upload-images";

export default function ReportEditor() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!text.trim() && files.length === 0) return;
    setBusy(true);
    setError(null);

    try {
      const imageUrls = await uploadReportImages(files);

      const fd = new FormData();
      fd.set("text", text);
      for (const url of imageUrls) fd.append("imageUrl", url);
      const result = await publishReportEntry(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setText("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError((err as Error).message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: 32 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened today…"
        rows={5}
        style={{ ...INPUT, width: "100%", resize: "vertical", lineHeight: 1.6 }}
      />

      <div style={{ marginTop: 12 }}>
        <input
          ref={fileRef}
          type="file"
          accept={REPORT_IMAGE_ACCEPT}
          multiple
          capture="environment"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          style={{ fontSize: 12, color: "var(--color-text-variant)" }}
        />
        {files.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--color-text-faint)", marginLeft: 8 }}>
            {files.length} photo{files.length !== 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: "var(--accent-red, #c0392b)", marginTop: 10 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button type="submit" disabled={busy} style={{ ...BTN(false), opacity: busy ? 0.5 : 1 }}>
          {busy ? "Publishing…" : "Publish update"}
        </button>
      </div>
    </form>
  );
}
