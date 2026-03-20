"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"

interface SearchFilterProps {
  searchValue: string
  onSearchChange: (value: string) => void
  placeholder?: string
  filters?: {
    label: string
    value: string
    options: { label: string; value: string }[]
    onChange: (value: string) => void
  }[]
  onClearFilters?: () => void
}

export function SearchFilter({
  searchValue,
  onSearchChange,
  placeholder = "Pesquisar...",
  filters = [],
  onClearFilters,
}: SearchFilterProps) {
  const hasActiveFilters = searchValue || filters.some((filter) => filter.value)

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 dark:bg-black/20 p-4 rounded-3xl border border-border/40 backdrop-blur-md">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-11 bg-background border-border/60 rounded-2xl focus-visible:ring-primary/20 shadow-sm"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {filters.map((filter) => (
          <div key={filter.label} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-2xl border border-border/60 shadow-sm min-w-[140px]">
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="border-0 bg-transparent p-0 h-auto focus:ring-0 text-xs font-bold w-full">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos ({filter.label})</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        {hasActiveFilters && onClearFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters} 
            className="text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 rounded-2xl text-xs font-bold h-11 px-4"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  )
}
