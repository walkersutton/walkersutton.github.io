"use client";

import type { RefObject } from "react";
import { BTN } from "../styles";
import { REPORT_IMAGE_ACCEPT } from "./upload-images";

// Off-screen rather than display:none so the control keeps its place in the tab
// order and stays reachable by keyboard; the label is what you actually tap.
const HIDDEN_INPUT: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  opacity: 0,
  pointerEvents: "none",
};

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  label: string;
  countNoun: string;
};

/**
 * Replaces the bare file input, whose native mobile rendering is a tiny control
 * with a truncated filename beside it, with a full-size tap target.
 */
export default function PhotoField({ files, onChange, inputRef, label, countNoun }: Props) {
  function clear() {
    onChange([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div
      style={{
        marginTop: 12,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <label style={{ ...BTN(false), display: "inline-flex" }}>
        {label}
        <input
          ref={inputRef}
          type="file"
          accept={REPORT_IMAGE_ACCEPT}
          multiple
          onChange={(e) => onChange(Array.from(e.target.files ?? []))}
          style={HIDDEN_INPUT}
        />
      </label>

      {files.length > 0 && (
        <span style={{ fontSize: 13, color: "var(--color-text-faint)" }}>
          {files.length} photo{files.length !== 1 ? "s" : ""} {countNoun}
          {" · "}
          <button
            type="button"
            onClick={clear}
            style={{
              background: "none",
              border: "none",
              padding: "6px 0",
              font: "inherit",
              color: "var(--color-text-faint)",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            clear
          </button>
        </span>
      )}
    </div>
  );
}
