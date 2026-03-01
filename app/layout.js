import { Geist } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ThemeInitializer from "./components/ThemeInitializer";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${playfair.variable} antialiased`}>
        <ThemeInitializer />
        <Navbar />
        <SpeedInsights />
        <main className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
          {children}
        </main>
      </body>
    </html>
  );
}
