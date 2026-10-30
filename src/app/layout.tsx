import type { Metadata, Viewport } from "next";
import {
  Noto_Naskh_Arabic,
  Noto_Nastaliq_Urdu,
  Noto_Sans,
  Noto_Sans_Bengali,
  Noto_Sans_Devanagari,
} from "next/font/google";
import "./globals.css";

const sans = Noto_Sans({ variable: "--font-latin", subsets: ["latin", "latin-ext"] });
const naskh = Noto_Naskh_Arabic({ variable: "--font-naskh", subsets: ["arabic"], preload: false });
const nastaliq = Noto_Nastaliq_Urdu({ variable: "--font-nastaliq", subsets: ["arabic"], preload: false });
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"], preload: false });
const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Plainform: any form, in plain words",
  description:
    "Upload or photograph an official form and get every field explained in plain language, in your own language. Nothing is stored.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${naskh.variable} ${nastaliq.variable} ${bengali.variable} ${devanagari.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
