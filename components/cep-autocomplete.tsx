"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Loader2, Search, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { fetchCEP, formatCEP } from "@/lib/utils-validation"

export interface CepData {
  cep: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
}

interface CepAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onResolved?: (data: CepData) => void
  onNotFound?: () => void
  placeholder?: string
  className?: string
  error?: string
  id?: string
}

export function CepAutocomplete({
  value,
  onChange,
  onResolved,
  onNotFound,
  placeholder,
  className,
  error,
  id,
}: CepAutocompleteProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [resolved, setResolved] = useState<CepData | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCepRef = useRef<string>("")

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const lookup = async (clean: string) => {
    if (clean.length !== 8) return
    if (lastCepRef.current === clean) return
    lastCepRef.current = clean
    setIsLoading(true)
    const data = await fetchCEP(clean)
    setIsLoading(false)
    if (lastCepRef.current !== clean) return
    if (data) {
      const result: CepData = {
        cep: clean,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      }
      setResolved(result)
      setIsOpen(true)
      onResolved?.(result)
    } else {
      setResolved(null)
      setIsOpen(false)
      onNotFound?.()
    }
  }

  const handleChange = (raw: string) => {
    const formatted = formatCEP(raw)
    onChange(formatted)
    const clean = formatted.replace(/\D/g, "")
    if (clean.length < 8) {
      setResolved(null)
      setIsOpen(false)
      lastCepRef.current = ""
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      return
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => lookup(clean), 200)
  }

  const handleFocus = () => {
    if (resolved) setIsOpen(true)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder || "00000-000"}
          inputMode="numeric"
          autoComplete="off"
          maxLength={9}
          className={cn(
            "pr-10 h-11 transition-all duration-300 rounded-sm",
            error
              ? "border-red-500 bg-red-50/5 focus-visible:ring-red-500"
              : resolved
                ? "border-emerald-500/40 bg-emerald-500/5 focus-visible:ring-emerald-500"
                : "border-border/40 focus-visible:ring-primary/20",
            className,
          )}
        />
        <div className="absolute right-3 top-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : resolved ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground/30" />
          )}
        </div>
      </div>

      {isOpen && resolved && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-border/60 rounded-sm shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 flex items-start gap-3">
            <MapPin className="h-3.5 w-3.5 opacity-50 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-black uppercase tracking-tight text-[11px] truncate">
                {[resolved.street, resolved.neighborhood].filter(Boolean).join(", ") || "Endereço localizado"}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                {[resolved.city, resolved.state].filter(Boolean).join(" - ")}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
