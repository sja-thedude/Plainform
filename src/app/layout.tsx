import type { Metadata, Viewport } from "next";
import {
  Fraunces,
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
  Noto_Sans,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
} from "next/font/google";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz"] });
const sans = Noto_Sans({ variable: "--font-latin", subsets: ["latin", "latin-ext"] });
const naskh = Noto_Naskh_Arabic({ variable: "--font-naskh", subsets: ["arabic"], preload: false });
const nastaliq = Noto_Nastaliq_Urdu({ variable: "--font-nastaliq", subsets: ["arabic"], preload: false });
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"], preload: false });
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  preload: false,
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

const description =
  "Photograph any official form and get every field explained in plain words, in your own language. Visa, hospital, rental and bank forms. Nothing is stored.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Plainform: understand any form before you sign it",
  description,
  openGraph: {
    title: "Plainform",
    description,
    type: "website",
    siteName: "Plainform",
  },
  twitter: { card: "summary_large_image", title: "Plainform", description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#131412" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${fraunces.variable} ${sans.variable} ${naskh.variable} ${nastaliq.variable} ${bengali.variable} ${devanagari.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
