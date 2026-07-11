"use client"

import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, forwardRef, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto scrollbar-thin">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("sticky top-0 z-10", className)} {...props} />
  )
)
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  )
)
TableBody.displayName = "TableBody"

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-card-border transition-colors hover:bg-card-hover/50",
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-11 px-4 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wider bg-background",
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = "TableHead"

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("p-4 align-middle text-foreground/80", className)} {...props} />
  )
)
TableCell.displayName = "TableCell"

interface SortableHeaderProps {
  label: string
  field: string
  currentSort: { field: string; direction: "asc" | "desc" } | null
  onSort: (field: string) => void
}

function SortableHeader({ label, field, currentSort, onSort }: SortableHeaderProps) {
  const isActive = currentSort?.field === field
  return (
    <TableHead>
      <button
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors group"
        onClick={() => onSort(field)}
      >
        {label}
        {isActive ? (
          currentSort.direction === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-primary" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          )
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-muted-foreground transition-colors" />
        )}
      </button>
    </TableHead>
  )
}

function useTableSort<T extends Record<string, unknown>>(data: T[]) {
  const [sort, setSort] = useState<{ field: string; direction: "asc" | "desc" } | null>(null)

  const sorted = [...data].sort((a, b) => {
    if (!sort) return 0
    const aVal = a[sort.field]
    const bVal = b[sort.field]
    if (aVal == null || bVal == null) return 0
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sort.direction === "asc" ? cmp : -cmp
  })

  const handleSort = (field: string) => {
    setSort((prev) => {
      if (prev?.field === field) {
        return { field, direction: prev.direction === "asc" ? "desc" : "asc" }
      }
      return { field, direction: "desc" }
    })
  }

  return { sorted, sort, handleSort }
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, SortableHeader, useTableSort }
