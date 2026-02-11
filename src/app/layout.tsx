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

const TITLE = "August Jones | Renewed Fashion";
const DESCRIPTION =
  "Hand-made, one-of-a-kind upcycled sports fashion. Streetwear vests, hoodies, sweatpants, and jackets created from upcycled sports wear by a solo female-owned brand.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.augustjones.shop"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    // Core product/service (most specific → general)
    "upcycled sports fashion",
    "reworked sportswear",
    "recycled jerseys",
    "vintage sportswear",

    // Sports leagues & teams
    "NFL upcycling",
    "NBA upcycling",
    "MLB upcycling",
    "NHL upcycling",
    "Wisconsin Badgers",

    // Product categories
    "sustainable streetwear",
    "one-of-a-kind apparel",
    "hand-made fashion",

    // Location (local SEO)
    "Madison WI",
    "Wisconsin",

    // Brand values/differentiators
    "female-owned business",
    "eco-friendly fashion",
    "thrift flips",
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
        url: "/images/social_02-1200.jpg",
        width: 1200,
        height: 628,
        alt: "Upcycled sports jersey streetwear by August Jones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@augustjonesshop",
    images: ["/images/social_02-1200.jpg"],
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
            "@type": "LocalBusiness",
            "@id": "https://www.augustjones.shop/#localbusiness",
            name: "August Jones",
            description: DESCRIPTION,
            url: "https://www.augustjones.shop",
            email: "hello@augustjones.shop",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Madison",
              addressRegion: "WI",
              addressCountry: "US",
            },
            geo: {
              "@type": "GeoCoordinates",
              latitude: "43.0731",
              longitude: "-89.4012",
            },
            logo: "https://www.augustjones.shop/logos/August_Jones_Logo.svg",
            image: "https://www.augustjones.shop/images/social_02-1200.jpg",
            sameAs: [
              "https://www.instagram.com/augustjonesshop",
              "https://www.etsy.com/shop/TheAugustJonesShop",
            ],
            priceRange: "$$",
          })}
        </script>
      </body>
    </html>
  );
}
