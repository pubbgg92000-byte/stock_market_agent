import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Market Agent",
  description: "AI-first stock intelligence dashboard with watchlists and Telegram alerts."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
