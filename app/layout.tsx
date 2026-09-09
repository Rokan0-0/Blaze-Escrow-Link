import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://blaze-escrow-link.vercel.app"),
  title: {
    default: "Blaze Escrow-Link | P2P Social Commerce Trust Engine",
    template: "%s | Blaze Escrow-Link",
  },
  description: "Micro-escrow engine built natively around Ecobank Blaze. Buy and sell safely on WhatsApp, Instagram, and campus markets with full financial protection.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Blaze Escrow",
  },
  openGraph: {
    title: "Blaze Escrow-Link | P2P Social Commerce Trust Engine",
    description: "Micro-escrow engine built natively around Ecobank Blaze. Buy and sell safely on WhatsApp, Instagram, and campus markets with full financial protection.",
    url: "https://blaze-escrow-link.vercel.app",
    siteName: "Blaze Escrow-Link",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Blaze Escrow-Link - P2P Social Commerce Trust Engine",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blaze Escrow-Link | P2P Social Commerce Trust Engine",
    description: "Micro-escrow engine built natively around Ecobank Blaze. Buy and sell safely on WhatsApp, Instagram, and campus markets.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#006B3F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-slate-900 selection:bg-[#006B3F] selection:text-white">
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}
