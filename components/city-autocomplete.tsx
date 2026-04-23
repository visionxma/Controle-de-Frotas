"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface City {
  nome: string
  estado: string
  id: number
}

interface CityAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelectCity?: (city: { nome: string; estado: string }) => void
  placeholder?: string
  className?: string
  error?: string
  formatValue?: (city: City) => string
}

export function CityAutocomplete({
  value,
  onChange,
  onSelectCity,
  placeholder,
  className,
  error,
  formatValue,
}: CityAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value)
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cacheRef = useRef<Map<string, City[]>>(new Map())
  const lastQueryRef = useRef<string>("")

  useEffect(() => {
    setSearchTerm(value)
  }, [value])

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

  const searchCities = async (name: string) => {
    const query = name.trim()
    if (query.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const cached = cacheRef.current.get(query.toLowerCase())
    if (cached) {
      setSuggestions(cached)
      setIsOpen(cached.length > 0)
      return
    }

    setIsLoading(true)
    lastQueryRef.current = query
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cptec/v1/cidade/${encodeURIComponent(query)}`)
      if (lastQueryRef.current !== query) return
      if (response.ok) {
        const data = await response.json()
        const list: City[] = Array.isArray(data) ? data.slice(0, 30) : []
        cacheRef.current.set(query.toLowerCase(), list)
        setSuggestions(list)
        setIsOpen(list.length > 0)
      } else {
        setSuggestions([])
      }
    } catch (err) {
      console.error("Error fetching cities:", err)
      setSuggestions([])
    } finally {
      if (lastQueryRef.current === query) setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchTerm(val)
    onChange(val)

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => searchCities(val), 250)
  }

  const handleFocus = () => {
    if (suggestions.length > 0) setIsOpen(true)
  }

  const handleSelect = (city: City) => {
    const formatted = formatValue ? formatValue(city) : `${city.nome} - ${city.estado}`
    setSearchTerm(formatted)
    onChange(formatted)
    onSelectCity?.({ nome: city.nome, estado: city.estado })
    setIsOpen(false)
  }

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || "Comece a digitar a cidade..."}
          autoComplete="off"
          className={cn(
            "pr-10 h-11 transition-all duration-300 rounded-sm italic font-medium",
            error ? "border-red-500 bg-red-50/5" : "border-border/40 focus-visible:ring-primary/20",
            className,
          )}
        />
        <div className="absolute right-3 top-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground/40" />
          )}
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-border/60 rounded-sm shadow-2xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((city) => (
            <button
              key={city.id}
              type="button"
              className="w-full px-4 py-3 text-left text-sm hover:bg-primary/5 hover:text-primary transition-colors flex items-center gap-3 border-b border-border/10 last:border-none"
              onClick={() => handleSelect(city)}
            >
              <MapPin className="h-3.5 w-3.5 opacity-50" />
              <div className="flex flex-col">
                <span className="font-black uppercase tracking-tight text-[11px]">{city.nome}</span>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{city.estado}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
