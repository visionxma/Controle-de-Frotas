"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Satellite,
  ExternalLink,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Plug,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react"

interface Integration {
  id: string
  name: string
  description: string
  url: string
  status: "active" | "available" | "coming_soon"
  // Cor do tema da marca (opcional)
  accent?: string
}

const INTEGRATIONS: Integration[] = [
  {
    id: "buscarsat",
    name: "BuscarSat",
    description: "Rastreamento veicular Softruck. Acompanhe posição em tempo real, histórico de rotas e alertas.",
    url: "https://buscarsat.softruck.com/access/login",
    status: "active",
    accent: "from-blue-500 to-cyan-500",
  },
]

const LAST_PANEL_KEY = "tracking:last-panel"

export default function TrackingPage() {
  const [selected, setSelected] = useState<Integration | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const savedId = localStorage.getItem(LAST_PANEL_KEY)
      if (savedId) {
        const found = INTEGRATIONS.find(
          (i) => i.id === savedId && i.status === "active",
        )
        if (found) setSelected(found)
      }
    } catch {}
    setHydrated(true)
  }, [])

  const handleSelect = (integration: Integration) => {
    try {
      localStorage.setItem(LAST_PANEL_KEY, integration.id)
    } catch {}
    setSelected(integration)
  }

  const handleBack = () => {
    try {
      localStorage.removeItem(LAST_PANEL_KEY)
    } catch {}
    setSelected(null)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {!hydrated ? null : selected ? (
          <IntegrationFrame integration={selected} onBack={handleBack} />
        ) : (
          <IntegrationGrid
            integrations={INTEGRATIONS}
            onSelect={handleSelect}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function IntegrationGrid({
  integrations,
  onSelect,
}: {
  integrations: Integration[]
  onSelect: (i: Integration) => void
}) {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 border border-primary/20">
              <Satellite className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Rastreamento
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base font-medium">
            Integre plataformas de rastreamento veicular ao seu sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className="relative overflow-hidden border-2 hover:border-primary/40 transition-all duration-300 group cursor-pointer shadow-md hover:shadow-xl"
            onClick={() =>
              integration.status === "active" && onSelect(integration)
            }
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${integration.accent ?? "from-primary to-primary/50"}`}
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted border group-hover:scale-110 transition-transform">
                    <Plug className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    {integration.status === "active" && (
                      <Badge className="mt-1 bg-green-500/10 text-green-600 border-green-500/30 text-[9px] font-black uppercase">
                        Conectado
                      </Badge>
                    )}
                    {integration.status === "available" && (
                      <Badge className="mt-1 bg-amber-500/10 text-amber-600 border-amber-500/30 text-[9px] font-black uppercase">
                        Disponível
                      </Badge>
                    )}
                    {integration.status === "coming_soon" && (
                      <Badge className="mt-1 bg-muted text-muted-foreground border-border text-[9px] font-black uppercase">
                        Em breve
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed mb-4 min-h-[60px]">
                {integration.description}
              </CardDescription>
              <Button
                className="w-full font-bold"
                disabled={integration.status !== "active"}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(integration)
                }}
              >
                <Satellite className="h-4 w-4 mr-2" />
                Abrir painel
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-8">
        Precisa de outra integração?{" "}
        <a
          href="https://wa.me/559998468091"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-bold hover:underline"
        >
          Solicite aqui
        </a>
      </p>
    </div>
  )
}

function IntegrationFrame({
  integration,
  onBack,
}: {
  integration: Integration
  onBack: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [blocked, setBlocked] = useState(false)
  // Zoom default 0.8 faz o conteúdo do BuscarSat caber na largura do container
  // sem precisar scrollar horizontalmente (o site é desktop-first, 1280px+).
  const [zoom, setZoom] = useState(0.8)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Se o iframe não disparar `onLoad` em 6 segundos, assumimos que foi bloqueado
  // por X-Frame-Options/CSP e mostramos o fallback com link externo.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setBlocked(true)
    }, 6000)
    return () => clearTimeout(timer)
  }, [loading])

  const zoomIn = () => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))
  const zoomReset = () => setZoom(0.8)
  // Largura/altura compensadas: iframe renderiza maior que o container e é
  // escalado para caber. 1/0.8 = 125%, então o iframe tem 125% e scale 0.8
  // resulta em 100% visual sem barra horizontal.
  const compensated = `${(100 / zoom).toFixed(2)}%`

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-10">
      {/* Header da integração */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="rounded-lg shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 border border-primary/20 shrink-0">
              <Plug className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{integration.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {integration.url}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Controles de zoom */}
          <div className="hidden sm:flex items-center gap-0.5 border rounded-md p-0.5 bg-background/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={zoom <= 0.5}
              className="h-7 w-7 p-0"
              title="Diminuir zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <button
              onClick={zoomReset}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground px-2 min-w-[42px] text-center"
              title="Restaurar zoom (80%)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={zoom >= 1.5}
              className="h-7 w-7 p-0"
              title="Aumentar zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomReset}
              className="h-7 w-7 p-0"
              title="Restaurar padrão"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(integration.url, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Abrir em nova aba</span>
          </Button>
        </div>
      </div>

      {/* Conteúdo do iframe — overflow-hidden para esconder o excesso
          gerado pelo scale compensado, evitando scroll horizontal na página */}
      <div className="flex-1 relative bg-muted/30 overflow-hidden">
        {loading && !blocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Carregando {integration.name}...
            </p>
          </div>
        )}

        {blocked && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
            <Card className="max-w-md w-full border-2 border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="pt-6 space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500/40">
                    <AlertTriangle className="h-7 w-7 text-amber-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-amber-900 dark:text-amber-100 mb-2">
                    Não foi possível embutir
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200/90 leading-relaxed">
                    A {integration.name} bloqueia exibição dentro de outros sites por segurança.
                    Clique abaixo para abrir o painel em uma nova aba.
                  </p>
                </div>
                <Button
                  className="w-full font-bold"
                  onClick={() =>
                    window.open(integration.url, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir {integration.name}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={onBack}
                >
                  Voltar
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={integration.url}
          title={integration.name}
          onLoad={() => setLoading(false)}
          className="border-0 block"
          style={{
            width: compensated,
            height: compensated,
            transform: `scale(${zoom})`,
            transformOrigin: "0 0",
          }}
          // sandbox deixa scripts/forms funcionarem mas isola o contexto
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-storage-access-by-user-activation"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
