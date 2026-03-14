import localFont from "next/font/local";

export const sfProDisplay = localFont({
  src: [
    { path: "./_fonts/SF-Pro-Display-Regular.otf", weight: "400", style: "normal" },
    { path: "./_fonts/SF-Pro-Display-Bold.otf", weight: "700", style: "normal" },
    { path: "./_fonts/SF-Pro-Display-Black.otf", weight: "900", style: "normal" },
  ],
  variable: "--font-sf-pro-display",
});

export const sfProText = localFont({
  src: [
    { path: "./_fonts/SF-Pro-Text-Regular.otf", weight: "400", style: "normal" },
    { path: "./_fonts/SF-Pro-Text-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "./_fonts/SF-Pro-Text-Medium.otf", weight: "500", style: "normal" },
    { path: "./_fonts/SF-Pro-Text-Bold.otf", weight: "700", style: "normal" },
    { path: "./_fonts/SF-Pro-Text-BoldItalic.otf", weight: "700", style: "italic" },
  ],
  variable: "--font-sf-pro-text",
});
