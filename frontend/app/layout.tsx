import type { Metadata } from "next";
import { Nunito, Outfit } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Bloomie - Your Little World for a Healthier Life",
  description:
    "A living wellness companion that turns your health data into a personalized 3D garden. Sleep affects the sky. Activity brings butterflies. Your wellness grows your world.",
  keywords: ["wellness", "health tracking", "garden", "mindfulness", "wellness companion", "AI health"],
};

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}

export default RootLayout;
