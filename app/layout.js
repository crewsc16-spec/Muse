import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ThemeInitializer from "./components/ThemeInitializer";
import InstallBanner from "./components/InstallBanner";
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
  description: "Your personal mood journal and vision board",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Muse",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${playfair.variable} antialiased`}>
        <ThemeInitializer />
        <Navbar />
        <InstallBanner />
        <SpeedInsights />
        <Analytics />
        <main className="max-w-4xl mx-auto px-4 pt-16 pb-24 md:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
