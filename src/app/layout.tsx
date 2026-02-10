import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: "400", // Only weight available (appears bold by design)
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const TITLE = 'August Jones | Renewed Fashion'
const DESCRIPTION = 'Hand-made, one-of-a-kind upcycled sports fashion. Streetwear hoodies, sweatpants, and jackets created from upcycled NFL jerseys by a solo female-owned brand.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "upcycled fashion",
    "sustainable streetwear",
    "NFL jersey upcycling",
    "female-owned business",
    "hand-made clothing",
  ],
  authors: [{ name: "August Jones" }],
  creator: "August Jones",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "August Jones",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@augustjonesshop",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsToken = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
      >
        {children}
        {analyticsToken && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${analyticsToken}"}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
