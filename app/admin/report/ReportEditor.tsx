"use client";

import { useRef, useState } from "react";
import { publishReportEntry } from "../actions";
import { BTN } from "../styles";
import AutoGrowTextarea from "./AutoGrowTextarea";
import PhotoField from "./PhotoField";
import { uploadReportImages } from "./upload-images";

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
      <AutoGrowTextarea
        value={text}
        onChange={setText}
        placeholder="What happened today…"
        ariaLabel="Update text"
        minRows={4}
      />

      <PhotoField
        files={files}
        onChange={setFiles}
        inputRef={fileRef}
        label="Add photos"
        countNoun="selected"
      />

      {error && (
        <div style={{ fontSize: 13, color: "var(--accent-red, #c0392b)", marginTop: 10 }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          type="submit"
          disabled={busy}
          style={{ ...BTN(false), opacity: busy ? 0.5 : 1, width: "100%", maxWidth: 260 }}
        >
          {busy ? "Publishing…" : "Publish update"}
        </button>
      </div>
    </form>
  );
}
