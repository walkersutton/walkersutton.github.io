# walkersutton.github.io

## Garmin MapShare tracker

The `/trips` page reads from `app/api/mapshare`, which fetches and parses a Garmin inReach MapShare KML feed server-side.

For local previews without a Garmin feed, the API falls back to `public/trips/dummy-mapshare.kml`. To force the sample data while a feed is configured, open `/trips?sample=1` or set `TRIPS_USE_DUMMY_KML=true`.

Set via dotenvx (see [Environment](#environment)):

```bash
npx dotenvx set GARMIN_MAPSHARE_KML_URL 'https://share.garmin.com/feed/share/YOUR_MAPSHARE_NAME'
```

`GARMIN_KML_FEED_URL` is also supported as a fallback name. If your MapShare feed URL includes an access token or password query string, include the full URL in the environment variable.

[walkersutton.com](https://walkersutton.com)

# Deploy

```sh
pnpm build
pnpm run deploy
```

## Development

```sh
pnpm dev
pnpm build
pnpm start
```

## Environment

env vars are encrypted with [dotenvx](https://dotenvx.com) and committed in `.env`. the private key lives in `.env.keys` — gitignored, never commit it — and is mirrored to Vercel as `DOTENV_PRIVATE_KEY`.

```sh
npx dotenvx set SOME_KEY 'value'   # encrypts into .env
npx dotenvx get SOME_KEY           # decrypt one value
```

`dev` / `build` / `img` all run through `dotenvx run --overload`, so `.env` wins over anything the platform injects. without `--overload`, Vercel's project env would silently take precedence.

Marketplace-managed vars (`DATABASE_URL`, `POSTGRES_*`) and `VERCEL_OIDC_TOKEN` stay in Vercel — they rotate upstream.

## Post images (Vercel Blob)

images live in the `walker-blob` store, not in the repo. `pnpm img` resizes, uploads, and copies the `<Img>` snippet to your clipboard — paste straight into the mdx.

```sh
pnpm img photo.jpg --alt "camp at anderson pass"
#   photo.jpg  3315KB → 393KB
#   <Img src="https://<store>.public.blob.vercel-storage.com/posts/photo-a3f9.webp" alt="camp at anderson pass" />
```

takes globs, so `pnpm img *.jpg --dir trips` works. a single `--alt`/`--caption` applies to the whole batch; repeat the flag to give each file its own, positionally.

point it at a folder and it does the whole thing in one shot — every image inside, in natural filename order, alt text derived from each filename, wrapped in a single `<Gallery>`:

```sh
pnpm img ~/Desktop/olympics --dir trips
#   camp-at-anderson-pass.jpg  3315KB → 393KB
#   the-pass-at-sunrise.jpg    2871KB → 341KB
#   <Gallery>
#     <Img src="…" alt="camp at anderson pass" />
#     <Img src="…" alt="the pass at sunrise" />
#   </Gallery>
```

so naming the files descriptively before upload is all the alt-text work there is. names that are just a camera counter (`IMG_2481`, `PXL_20240612…`, `DSC01`) get `alt=""` and a reminder line listing them — a literal "img 2481" alt is worse than none. `--alt` still wins where you pass it, and `--no-gallery` gives separate `<Img>`s instead.

| flag | default | what |
| --- | --- | --- |
| `--alt <text>` | filename | alt text (repeatable, one per file) |
| `--caption <text>` | — | renders a `<figcaption>` under the image (repeatable) |
| `--gallery` | on for a folder | emit one `<Gallery>` for the batch instead of separate `<Img>`s |
| `--no-gallery` | — | separate `<Img>`s even when a folder was passed |
| `--cols <n>` | file count, max 3 | gallery columns |
| `--ratio <r>` | `auto` | gallery thumbnail shape — `auto` keeps full height, or crop to `4/3`, `1/1`, … |
| `--dir <name>` | `posts` | blob folder |
| `--w <px>` | `1600` | max width |
| `--quality <n>` | `82` | webp quality |
| `--tall` | off | portrait framing (`.img-tall`, capped at 70vh) |
| `--still <url>` | — | poster frame for gif/mp4 |
| `--raw` | off | upload as-is, no resize/convert |
| `--dry` | off | process + report, don't upload |

- stills → webp. gifs stay animated, just downscaled. mp4/webm pass through untouched (no transcoding).
- heic converts via `sips` first — the bundled libvips has no heif decoder.
- exif orientation is honored before metadata gets stripped.

`<Img>` is registered in `app/components/ContentPageLayout.tsx` (posts + projects) and `app/trips/[slug]/page.tsx` (trip reports), and markdown `![]()` routes through it too. gifs/mp4 delegate to `ProjectImage` for hover-to-play.

### galleries

`--gallery` wraps the batch in a `<Gallery>` — images side by side instead of one full-width column, each clickable into a lightbox with its caption, arrow keys / swipe, and prev-next through the group.

```sh
pnpm img a.jpg b.jpg c.jpg --gallery --caption "morning" --caption "the pass" --caption "camp"
#   <Gallery>
#     <Img src="…" alt="" caption="morning" />
#     <Img src="…" alt="" caption="the pass" />
#     <Img src="…" alt="" caption="camp" />
#   </Gallery>
```

thumbnails keep each image's full height by default (ragged bottoms, nothing cropped). `<Gallery cols="2" ratio="4/3">` overrides the layout — a ratio crops every thumbnail to that shape for an even row. a `caption` on the `<Gallery>` itself captions the group. children are used instead of an `images={[…]}` prop because next-mdx-remote strips JS expressions from mdx (`blockJS`), so props can only carry strings.

### poking at the store

```sh
npx vercel blob list
npx vercel blob del "posts/some-post/image-abc123.webp"
npx vercel blob get-store          # name, access mode, size
```

store is **public** access — blob URLs are plain CDN links, no signing. don't put anything private in there.

### keeping data transfer down

the free tier includes 10GB/month of blob data transfer, and every byte a
visitor downloads from a blob URL counts. two things keep it in check:

- photos posted from `/admin/report` are downscaled to 1600px webp in the
  browser before upload, so a 4MB camera original becomes ~200KB. `pnpm img`
  does the same for post images.
- uploads are written with a one-year edge cache. blob URLs are immutable
  (random suffix per file), so the store only serves a file again when some
  region's cache expires.

photos uploaded before that was in place are still full size. **Shrink old
photos** at the bottom of `/admin/report` re-encodes them and repoints the live
state at the smaller copies — it works from a phone, runs a few photos per
request so nothing times out, and is safe to stop and resume. the originals are
left in the store, so putting an old URL back undoes a conversion.

### imgur migration

one-shot, already run: all 17 imgur images are on blob now. kept around in case an old draft still has imgur links.

```sh
pnpm migrate:imgur --dry   # report only
pnpm migrate:imgur
```

dedupes by URL, bails if imgur serves its "removed" placeholder instead of the real image, and only rewrites the mdx once every upload has succeeded.

## Stripe product images

- max 8 images
- you can get stripe to host them all if you just upload the image through the UI as the primary image and then hit a

```
stripe products retrieve prod_ididididdid --live
{
    "id": "prod_idididi",
    ...m
    "images": [
        "https://files.stripe.com/links/id",
        "https://files.stripe.com/links/id",
        "https://files.stripe.com/links/id",
        (max 8, so i hear)
    ],
    ...
```

to get the URL. WARNING - updating primary image through the UI erases pre-existing images[] metadata

- update with:

```

stripe products update prod_idididd --live \
 --api-key here \
 -d "images[0]"="https://files.stripe.com/links/img" \
 -d "images[1]"="https://files.stripe.com/links/img" \
 -d "images[2]"="https://files.stripe.com/links/img" \

```

```

```
