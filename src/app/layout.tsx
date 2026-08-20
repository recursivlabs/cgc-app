import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "../fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
});

const anton = localFont({
  src: "../fonts/Anton.woff2",
  variable: "--font-anton",
  display: "swap",
  adjustFontFallback: "Arial",
});
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://commongroundcampus.com"),
  title: {
    default: "Common Ground Campus — Dialogue over division",
    template: "%s | Common Ground Campus",
  },
  description:
    "We help campuses and communities host events where people talk with each other, not past each other. Bring Common Ground Campus to your school.",
  openGraph: {
    title: "Common Ground Campus",
    description: "Dialogue over division. Bring an event to your campus.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${anton.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
