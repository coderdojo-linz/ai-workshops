import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoderDojo AI Workshops",
  description: "The AI-powered coding platform for CoderDojo workshops",
  icons: {
    icon: "/favicon.ico",           // default favicon
    apple: "/apple-icon.png",       // Apple touch icon
    other: [
      { rel: "icon", url: "/icon0.svg", type: "image/svg+xml" },
      { rel: "icon", url: "/icon1.png", type: "image/png" }
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    title: "CD AI",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
