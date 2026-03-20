import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallBanner } from "@/components/pwa-install-banner"
import { GlobalWatermark } from "@/components/global-watermark"
import { Suspense } from "react"
import "./globals.css"

const poppins = Poppins({ 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins"
})

export const metadata: Metadata = {
  title: "FroX - Controle de Frotas",
  description: "Sistema de controle de frotas de caminhões",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/frox.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/frox.svg", sizes: "192x192", type: "image/svg+xml" }],
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
    <html lang="pt-BR" className={poppins.variable}>
      <body className="font-poppins">
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <GlobalWatermark />
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
