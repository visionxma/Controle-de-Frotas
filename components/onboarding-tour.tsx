"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Truck,
  Users,
  MapPin,
  DollarSign,
  Settings,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  FileText,
  Fuel,
  Camera,
  TrendingUp,
  UserPlus,
  Wrench,
  Receipt,
  PieChart,
  Shield,
  Bell,
} from "lucide-react"

interface FeatureCard {
  icon: React.ElementType
  label: string
}

interface Step {
  id: string
  section?: string
  title: string
  description: string
  icon?: React.ElementType
  cards: FeatureCard[]
  isWelcome?: boolean
  isFinal?: boolean
}

const steps: Step[] = [
  {
    id: "welcome",
    title: "Bem-vindo!",
    description: "Tudo que você precisa para gerenciar sua frota com eficiência. Deixa a gente te mostrar como funciona.",
    cards: [],
    isWelcome: true,
  },
  {
    id: "dashboard",
    section: "Dashboard",
    title: "Visão Geral",
    description: "Acompanhe o desempenho da sua frota em tempo real com métricas completas.",
    icon: BarChart3,
    cards: [
      { icon: TrendingUp, label: "Receitas e despesas" },
      { icon: PieChart, label: "Lucro líquido" },
      { icon: FileText, label: "Relatório em PDF" },
    ],
  },
  {
    id: "trucks",
    section: "Caminhões",
    title: "Seus Veículos",
    description: "Cadastre e gerencie toda sua frota de veículos com detalhes completos.",
    icon: Truck,
    cards: [
      { icon: Plus, label: "Cadastrar veículo" },
      { icon: Fuel, label: "Controle de combustível" },
      { icon: Wrench, label: "Histórico de manutenção" },
    ],
  },
  {
    id: "drivers",
    section: "Motoristas",
    title: "Seus Motoristas",
    description: "Gerencie os motoristas da sua equipe com todas as informações necessárias.",
    icon: Users,
    cards: [
      { icon: UserPlus, label: "Adicionar motorista" },
      { icon: FileText, label: "Dados da CNH" },
      { icon: Shield, label: "Histórico completo" },
    ],
  },
  {
    id: "trips",
    section: "Viagens",
    title: "Controle de Viagens",
    description: "Registre e monitore cada viagem com rota, carga e documentação fotográfica.",
    icon: MapPin,
    cards: [
      { icon: Plus, label: "Nova viagem" },
      { icon: Camera, label: "Fotos da carga" },
      { icon: FileText, label: "Comprovantes" },
    ],
  },
  {
    id: "finance",
    section: "Financeiro",
    title: "Controle Financeiro",
    description: "Registre receitas e despesas para ter uma visão clara da saúde do seu negócio.",
    icon: DollarSign,
    cards: [
      { icon: Receipt, label: "Lançar receita" },
      { icon: TrendingUp, label: "Controlar despesas" },
      { icon: PieChart, label: "Relatórios financeiros" },
    ],
  },
  {
    id: "settings",
    section: "Configurações",
    title: "Personalize o Sistema",
    description: "Ajuste o sistema às necessidades da sua empresa e gerencie sua equipe.",
    icon: Settings,
    cards: [
      { icon: UserPlus, label: "Adicionar colaboradores" },
      { icon: Bell, label: "Preferências" },
      { icon: Shield, label: "Permissões de acesso" },
    ],
  },
  {
    id: "final",
    title: "Tudo Pronto!",
    description: "Você já conhece o sistema. Agora é só começar a cadastrar sua frota e aproveitar ao máximo.",
    cards: [],
    isFinal: true,
  },
]

export function OnboardingTour() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (
      user &&
      user.subscription_status === "active" &&
      user.onboarding_completed === false
    ) {
      // pequeno delay para não competir com o carregamento da página
      const timer = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(timer)
    }
  }, [user])

  if (!visible || !user) return null

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const featureSteps = steps.filter((s) => !s.isWelcome && !s.isFinal)
  const featureIndex = featureSteps.findIndex((s) => s.id === step.id)

  const markComplete = async () => {
    try {
      await setDoc(doc(db, "users", user.id), { onboarding_completed: true }, { merge: true })
    } catch (_) {
      // silencioso — não bloqueia a UI
    }
    setVisible(false)
  }

  const handleNext = () => {
    if (isLast) {
      markComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => setCurrentStep((prev) => prev - 1)
  const handleSkip = () => markComplete()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={undefined}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: "onboarding-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* Barra vermelha no topo */}
        <div className="h-1 w-full bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

        {/* Conteúdo */}
        <div className="px-6 pt-6 pb-5">

          {/* Step: Welcome */}
          {step.isWelcome && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/15 border border-red-600/30">
                <Truck className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <img src="/frox.svg" alt="FroX" className="h-6 w-auto mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">{step.description}</p>
              </div>
              <div className="flex gap-1.5 mt-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? "w-6 bg-red-500" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step: Final */}
          {step.isFinal && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600/15 border border-red-600/30">
                <Check className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">Pronto</p>
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">{step.description}</p>
              </div>
              <div className="flex gap-1.5 mt-1">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? "w-6 bg-red-500" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step: Feature */}
          {!step.isWelcome && !step.isFinal && step.icon && (
            <div className="flex flex-col gap-4">
              {/* Header da seção */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/15 border border-red-600/30">
                  <step.icon className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-red-500">
                    {step.section}
                  </p>
                  <h2 className="text-lg font-bold text-white leading-tight">{step.title}</h2>
                </div>
              </div>

              <p className="text-sm text-white/55 leading-relaxed -mt-1">{step.description}</p>

              {/* Cards de funcionalidades */}
              <div className="grid grid-cols-3 gap-2.5">
                {step.cards.map((card, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 rounded-xl border border-white/8 bg-white/4 p-3 text-center"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 border border-red-600/20">
                      <card.icon className="h-4 w-4 text-red-400" />
                    </div>
                    <span className="text-[11px] font-medium text-white/70 leading-tight">{card.label}</span>
                  </div>
                ))}
              </div>

              {/* Progresso */}
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? "w-6 bg-red-500" : "w-1.5 bg-white/20"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões */}
        <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
          <div>
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white/40 hover:text-white/70 hover:bg-white/6 gap-1.5 px-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </Button>
            )}
            {isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-white/30 hover:text-white/55 hover:bg-white/6 px-3 text-xs"
              >
                Pular tour
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/25">
              {currentStep + 1}/{steps.length}
            </span>
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-red-600 hover:bg-red-500 text-white gap-1.5 px-4 rounded-lg font-semibold shadow-lg shadow-red-900/30"
            >
              {isLast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Começar
                </>
              ) : step.isWelcome ? (
                <>
                  Iniciar tour
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes onboarding-slide-up {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
