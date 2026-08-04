/**
 * One-shot migration: pull every imgur-hosted image referenced in content/ into
 * our own Vercel Blob store and rewrite the markdown to use <Img>.
 *
 *   pnpm migrate:imgur --dry   # report only, no uploads, no writes
 *   pnpm migrate:imgur
 *
 * Rewrites `<img className="img-wide" src="https://i.imgur.com/x.png" alt="y" />`
 * into `<Img src="<blob>" alt="y" />` (plus `tall` for the img-tall variant), so
 * migrated images pick up the lazy-loading and figure handling in ProseImage.
 *
 * Uploads happen first and files are only written once every fetch+upload has
 * succeeded, so a mid-run failure can't leave content pointing at nothing.
 */
import { put } from "@vercel/blob";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { KB, processImage, slugify } from "./lib/image.mts";

const CONTENT = "content";
const WIDTH = 1600;
const QUALITY = 82;

// Captures: 1=img-wide|img-tall, 2=src, 3=alt
const IMG_TAG =
  /<img\s+className="(img-wide|img-tall)"\s+src="(https?:\/\/[^"]*imgur\.com\/[^"]+)"\s+alt="([^"]*)"\s*\/>/g;

interface Ref {
  file: string;
  tag: string;
  variant: string;
  url: string;
  alt: string;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (/\.mdx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

async function collect(): Promise<Ref[]> {
  const refs: Ref[] = [];
  for (const file of await walk(CONTENT)) {
    const src = await readFile(file, "utf8");
    for (const m of src.matchAll(IMG_TAG)) {
      refs.push({
        file,
        tag: m[0],
        variant: m[1],
        url: m[2],
        alt: m[3],
      });
    }
  }
  return refs;
}

/**
 * Imgur serves a small grey "image removed" placeholder for purged uploads
 * instead of 404ing, so verify we got real bytes and not the tombstone.
 */
async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  if (/removed/i.test(new URL(res.url).pathname)) {
    throw new Error(`${url} → redirected to imgur's removed placeholder`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 2048) {
    throw new Error(`${url} → suspiciously small (${buf.byteLength}B)`);
  }
  return buf;
}

async function main() {
  const dry = process.argv.includes("--dry");
  if (!dry && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN missing — expected it in .env.local");
    process.exitCode = 1;
    return;
  }

  const refs = await collect();
  if (refs.length === 0) {
    console.log("no imgur references found");
    return;
  }

  const byUrl = new Map<string, Ref[]>();
  for (const ref of refs) {
    const list = byUrl.get(ref.url) ?? [];
    list.push(ref);
    byUrl.set(ref.url, list);
  }
  console.log(
    `${refs.length} references, ${byUrl.size} unique images, ` +
      `${new Set(refs.map((r) => r.file)).size} files\n`,
  );

  // Phase 1 — fetch, process, upload. Nothing on disk is touched yet.
  const resolved = new Map<string, string>();
  for (const [url, uses] of byUrl) {
    const first = uses[0];
    const post = basename(first.file).replace(/\.mdx?$/, "");
    const buf = await fetchImage(url);
    const { body, ext } = await processImage(buf, extname(url).toLowerCase(), {
      width: WIDTH,
      quality: QUALITY,
    });
    const pathname = `posts/${post}/${slugify(first.alt)}${ext}`;
    const size = `${KB(buf.byteLength)} → ${KB(body.byteLength)}`;
    const seen = uses.length > 1 ? `  (×${uses.length})` : "";

    if (dry) {
      console.log(`  ${basename(url)}  ${size}  → ${pathname}${seen}`);
      resolved.set(url, `https://blob.example/${pathname}`);
      continue;
    }

    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
    });
    console.log(`  ${basename(url)}  ${size}  → ${pathname}${seen}`);
    resolved.set(url, blob.url);
  }

  // Phase 2 — rewrite content, now that every URL resolved successfully.
  if (dry) {
    console.log("\ndry run — no files written");
    return;
  }

  const files = new Set(refs.map((r) => r.file));
  for (const file of files) {
    let src = await readFile(file, "utf8");
    for (const ref of refs.filter((r) => r.file === file)) {
      const attrs = [`src="${resolved.get(ref.url)}"`, `alt="${ref.alt}"`];
      if (ref.variant === "img-tall") attrs.push("tall");
      src = src.replace(ref.tag, `<Img ${attrs.join(" ")} />`);
    }
    await writeFile(file, src);
    console.log(`  rewrote ${file}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
