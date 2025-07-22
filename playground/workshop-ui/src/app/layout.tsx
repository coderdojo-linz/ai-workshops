import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My App",
  description: "A clean starting point",
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
