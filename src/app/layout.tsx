import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSiteUrl, SEO } from "@/lib/seo/site";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.defaultDescription,
  applicationName: SEO.siteName,
  keywords: [...SEO.keywords],
  authors: [
    { name: SEO.practitioner, url: `${siteUrl}/about` },
    { name: SEO.siteName, url: siteUrl },
  ],
  creator: SEO.practitioner,
  publisher: SEO.siteName,
  category: "Health & Wellness",
  classification: "Somatic Coaching, Embodied Spirituality, Mytho-Shamanic Practice",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
    type: "website",
    locale: SEO.locale,
    siteName: SEO.siteName,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description: SEO.defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.svg"],
  },
  other: {
    "theme-color": "#0A3D33",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0A3D33" },
    { media: "(prefers-color-scheme: dark)", color: "#062822" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-3 focus:left-3 focus:rounded-full focus:bg-gold focus:text-forest-deep focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
