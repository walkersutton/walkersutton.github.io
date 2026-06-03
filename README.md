# walkersutton.github.io

## Garmin MapShare tracker

The `/trips` page reads from `app/api/mapshare`, which fetches and parses a Garmin inReach MapShare KML feed server-side.

Set one of these environment variables in local/dev/Vercel:

```bash
GARMIN_MAPSHARE_KML_URL="https://share.garmin.com/feed/share/YOUR_MAPSHARE_NAME"
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
