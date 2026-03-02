import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ThemeInitializer from "./components/ThemeInitializer";
import InstallBanner from "./components/InstallBanner";
import AutoUpdater from "./components/AutoUpdater";
import BetaBanner from "./components/BetaBanner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata = {
  title: "Muse",
  description: "Astrology, Human Design, tarot, journaling, and vision boards — your cosmic self-discovery guide.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Muse",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Muse",
    description: "Astrology, Human Design, tarot, journaling, and vision boards — your cosmic self-discovery guide.",
    url: "https://yourmuse.app",
    siteName: "Muse",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Muse",
    description: "Astrology, Human Design, tarot, journaling, and vision boards — your cosmic self-discovery guide.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${playfair.variable} antialiased`}>
        <ThemeInitializer />
        <SpeedInsights />
        <Analytics />
        <AutoUpdater />
        <BetaBanner />
        {/* Fixed full-screen shell — navbar never inside the scroll container */}
        <div className="fixed inset-0 flex flex-col overflow-hidden">
          <Navbar />
          <InstallBanner />
          <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
