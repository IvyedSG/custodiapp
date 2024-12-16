import type { Metadata } from "next";
import localFont from "next/font/local";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Custodia",
  description: "Lockers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <div className="relative min-h-screen">
          <BackgroundGradient />
          <main className="relative">{children}</main>
        </div>
      </body>
    </html>
  );
}

