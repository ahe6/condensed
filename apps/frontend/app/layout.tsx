import type { Metadata } from "next";
import { SiteFooter } from "../src/components/SiteFooter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Condensed Health",
  description: "Health testing, products, and next steps",
  icons: {
    icon: "/brand/logo-mark.svg",
    shortcut: "/brand/logo-mark.svg",
    apple: "/brand/logo-mark.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
