import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteFooter } from "../src/components/SiteFooter";
import { VariantPreviewSelector } from "../src/components/VariantPreviewSelector";
import "./globals.css";

export const metadata: Metadata = {
  title: "Condensed Health",
  description: "Online health concierge for labs, results, referrals, and next steps",
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
        <Suspense fallback={null}>
          <VariantPreviewSelector />
        </Suspense>
      </body>
    </html>
  );
}
