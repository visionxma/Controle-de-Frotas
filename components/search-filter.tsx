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
    <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-lg border">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 sm:h-9"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      {filters.map((filter) => (
        <Select key={filter.label} value={filter.value} onValueChange={filter.onChange}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasActiveFilters && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters} className="whitespace-nowrap bg-transparent h-10 sm:h-9">
          <X className="h-4 w-4 mr-2" />
          Limpar
        </Button>
      )}
      </div>
    </div>
  )
}
