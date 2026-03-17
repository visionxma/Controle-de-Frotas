import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallBanner } from "@/components/pwa-install-banner"
import { Suspense } from "react"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FroX - Controle de Frotas",
  description: "Sistema de controle de frotas de caminhões",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "https://i.imgur.com/kFQqWmh.jpeg", type: "image/png" },
      { url: "https://i.imgur.com/kFQqWmh.jpeg", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "https://i.imgur.com/kFQqWmh.jpeg", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FroX - Controle de Frotas",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "FroX - Controle de Frotas",
    title: "FroX - Controle de Frotas",
    description: "Sistema de controle de frotas de caminhões",
  },
  twitter: {
    card: "summary",
    title: "FroX - Controle de Frotas",
    description: "Sistema de Controle de frotas de caminhões",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans ${geistSans.variable} ${geistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            {children}
            <Toaster />
            <PWAInstallBanner />
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
