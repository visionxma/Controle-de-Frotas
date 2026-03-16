"use client"

import { useState, useEffect } from "react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      const isInstalled = isStandalone || isInWebAppiOS

      setIsInstalled(isInstalled)

      // Se já está instalado, não mostrar o banner
      if (isInstalled) {
        localStorage.setItem("pwa-installed", "true")
      }

      return isInstalled
    }

    // Verificar se o usuário já instalou anteriormente
    const wasInstalled = localStorage.getItem("pwa-installed") === "true"
    const wasDismissed = localStorage.getItem("pwa-install-dismissed") === "true"

    if (wasInstalled || checkIfInstalled()) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      localStorage.setItem("pwa-installed", "true")
    }

    if ("serviceWorker" in navigator) {
      // Service Worker available
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Verificar mudanças no display mode
    const mediaQuery = window.matchMedia("(display-mode: standalone)")
    const handleDisplayModeChange = () => {
      if (mediaQuery.matches) {
        handleAppInstalled()
      }
    }

    mediaQuery.addEventListener("change", handleDisplayModeChange)

    setTimeout(() => {
      if (!deferredPrompt && !isInstalled) {
        // PWA installation criteria not met
      }
    }, 3000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      mediaQuery.removeEventListener("change", handleDisplayModeChange)
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) {
      return false
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        localStorage.setItem("pwa-installed", "true")
        return true
      }

      return false
    } catch (error) {
      return false
    }
  }

  const dismissInstall = () => {
    setIsInstallable(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  return {
    isInstallable: isInstallable && !isInstalled,
    isInstalled,
    installApp,
    dismissInstall,
  }
}
