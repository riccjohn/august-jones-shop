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
const DESCRIPTION = 'Hand-made, one-of-a-kind upcycled sports fashion. Streetwear vests, hoodies, sweatpants, and jackets created from upcycled sports wear by a solo female-owned brand.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "upcycled fashion",
    "sustainable streetwear",
    "NFL upcycling",
    "NBA upcycling",
    "MLB upcycling",
    "NHL upcycling",
    "reworked sportswear",
    "thrift flips",
    "female-owned business",
    "hand-made fashion",
  ],
  authors: [{ name: "August Jones" }],
  creator: "August Jones",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: TITLE,
    description: DESCRIPTION,
    siteName: "August Jones",
    url: "https://www.augustjones.shop",
    images: [
      {
        url: "/metadata/august-jones-og-placeholder.jpg",
        width: 1200,
        height: 630,
        alt: "Upcycled sports jersey streetwear by August Jones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@augustjonesshop",
    images: ["/metadata/august-jones-og-placeholder.jpg"],
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "August Jones",
            url: "https://www.augustjones.shop",
            sameAs: [
              "https://www.instagram.com/augustjonesshop",
              "https://www.etsy.com/shop/TheAugustJonesShop",
            ],
            logo: "https://www.augustjones.shop/logos/August_Jones_Logo.svg",
          })}
        </script>
      </body>
    </html>
  );
}
