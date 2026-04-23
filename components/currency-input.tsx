"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

function formatBRL(value: number): string {
  if (!value) return ""
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseBRL(raw: string): number {
  if (!raw.trim()) return 0
  // Remove pontos de milhar, troca vírgula decimal por ponto inglês
  const cleaned = raw.replace(/\./g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : Math.round(num * 100) / 100
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = "Ex: 1.500,00",
  className,
  id,
  required,
  disabled,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [rawInput, setRawInput] = useState("")

  const handleFocus = () => {
    setIsFocused(true)
    // Se já existe um valor no pai, mostra formatado pro usuário editar
    // (ex: 3500 → "3.500,00"); caso contrário começa vazio.
    setRawInput(value > 0 ? formatBRL(value) : "")
  }

  const handleBlur = () => {
    setIsFocused(false)
    setRawInput("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Aceita apenas dígitos, vírgula e ponto
    const val = e.target.value.replace(/[^0-9.,]/g, "")
    setRawInput(val)
    // Propaga o valor a cada tecla para que o pai veja o estado atual
    // mesmo se o usuário clicar em "Salvar" sem tirar o foco do campo.
    onChange(parseBRL(val))
  }

  // Quando focado: mostra o que o usuário está digitando
  // Quando não focado: mostra o valor formatado (ou vazio se zero)
  const displayValue = isFocused ? rawInput : (value > 0 ? formatBRL(value) : "")

  return (
    <div
      className={cn(
        "flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <span className="text-muted-foreground font-semibold mr-2 select-none shrink-0">R$</span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        required={required}
        disabled={disabled}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/40 min-w-0 font-medium"
      />
    </div>
  )
}
