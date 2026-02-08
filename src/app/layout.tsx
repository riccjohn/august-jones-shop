import type { Metadata } from "next";
import { Bebas_Neue, Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "August Jones | Renewed Fashion",
  description:
    "Hand-made, one-of-a-kind upcycled sports fashion. Streetwear hoodies, sweatpants, and jackets created from upcycled NFL jerseys by a solo female-owned brand.",
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
    title: "August Jones | Renewed Fashion",
    description: "Hand-made, one-of-a-kind upcycled sports fashion.",
    siteName: "August Jones",
  },
  twitter: {
    card: "summary_large_image",
    title: "August Jones | Renewed Fashion",
    description: "Hand-made, one-of-a-kind upcycled sports fashion.",
    creator: "@augustjonesshop",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
