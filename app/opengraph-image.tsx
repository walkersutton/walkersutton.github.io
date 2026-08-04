import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import { SITE_CONFIG } from "@/lib/config";

export const alt = SITE_CONFIG.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Social cards can't respond to prefers-color-scheme, so this pins the light
// theme's --color-bg / --color-text from globals.css.
const BG = "#f6f4ee";
const FG = "#1c1a15";

// The header logo from app/components/Header.tsx. Only the skull: the crossbones
// sit at scale(0) until :hover, so the resting mark is the skull alone.
const skullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 115">
<path d="M50 6 C25 6 5 26 5 51 C5 68 14 82 27 89.5 L27 111 L35 111 L65 111 L73 111 L73 89.5 C86 82 95 68 95 51 C95 26 75 6 50 6Z" fill="${FG}"/>
<ellipse cx="33" cy="53" rx="10" ry="10" fill="${BG}"/>
<ellipse cx="67" cy="53" rx="10" ry="10" fill="${BG}"/>
</svg>`;

// Header proportions, scaled up: skull is 19×22 beside 21px text with a 9px gap.
const FONT_SIZE = 120;
const SKULL_HEIGHT = Math.round(FONT_SIZE * (22 / 21));
const SKULL_WIDTH = Math.round(SKULL_HEIGHT * (100 / 115));
const GAP = Math.round(FONT_SIZE * (9 / 21));

export default async function Image() {
  // Not the same file the site loads: satori's opentype.js chokes on SF Pro's
  // GSUB table ("lookupType: 7 - substFormat: 1 is not yet supported"), so this
  // is an ASCII subset with GSUB/GPOS dropped. Regenerate with:
  //   pyftsubset app/_fonts/SF-Pro-Display-Bold-Web.otf --unicodes=U+0020-007E \
  //     --drop-tables+=GSUB,GPOS --no-hinting --desubroutinize \
  //     --output-file=app/_fonts/SF-Pro-Display-Bold-OG.otf
  const font = await readFile(
    join(process.cwd(), "app/_fonts/SF-Pro-Display-Bold-OG.otf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: GAP,
          background: BG,
        }}
      >
        <img
          width={SKULL_WIDTH}
          height={SKULL_HEIGHT}
          alt=""
          src={`data:image/svg+xml;base64,${Buffer.from(skullSvg).toString("base64")}`}
        />
        <div
          style={{
            fontFamily: "SF Pro Display",
            fontSize: FONT_SIZE,
            letterSpacing: "-0.02em",
            color: FG,
          }}
        >
          {SITE_CONFIG.title}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "SF Pro Display",
          data: font,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
