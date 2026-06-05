import localFont from "next/font/local";

export const sfProDisplay = localFont({
  src: "./_fonts/SF-Pro-Display-Bold-Web.otf",
  weight: "700",
  style: "normal",
  variable: "--font-sf-pro-display",
});

export const sfProText = localFont({
  src: [
    { path: "./_fonts/SF-Pro-Text-Regular-Web.otf", weight: "400", style: "normal" },
    {
      path: "./_fonts/SF-Pro-Text-RegularItalic-Web.otf",
      weight: "400",
      style: "italic",
    },
    { path: "./_fonts/SF-Pro-Text-Medium-Web.otf", weight: "500", style: "normal" },
    { path: "./_fonts/SF-Pro-Text-Bold-Web.otf", weight: "700", style: "normal" },
    {
      path: "./_fonts/SF-Pro-Text-BoldItalic-Web.otf",
      weight: "700",
      style: "italic",
    },
  ],
  preload: false,
  variable: "--font-sf-pro-text",
});
