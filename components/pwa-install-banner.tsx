"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, X, Smartphone, Monitor } from "lucide-react"
import { usePWAInstall } from "@/hooks/use-pwa-install"

export function PWAInstallBanner() {
  const { isInstallable, installApp, dismissInstall } = usePWAInstall()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Verificar se foi dispensado anteriormente
    const wasDismissed = localStorage.getItem("pwa-install-dismissed") === "true"
    setIsDismissed(wasDismissed)

    // Detectar se é mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  const handleInstall = async () => {
    const success = await installApp()
    if (success) {
      setIsDismissed(true)
    }
  }

  const handleDismiss = () => {
    dismissInstall()
    setIsDismissed(true)
  }

  if (!isInstallable || isDismissed) {
    return null
  }

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
          {isMobile ? <Smartphone className="h-5 w-5 text-primary" /> : <Monitor className="h-5 w-5 text-primary" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Instalar Controle de Frotas</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isMobile
              ? "Adicione o app à sua tela inicial para acesso rápido"
              : "Instale o app no seu computador para melhor experiência"}
          </p>

          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1 h-8 text-xs">
              <Download className="h-3 w-3 mr-1" />
              Instalar
            </Button>
            <Button onClick={handleDismiss} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
