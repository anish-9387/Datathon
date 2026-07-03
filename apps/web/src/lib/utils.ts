import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatNumber(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "Cr"
  if (num >= 100000) return (num / 100000).toFixed(1) + "L"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%"
  return ((value / total) * 100).toFixed(1) + "%"
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function similarityScore(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1
  return (longer.length - editDistance(longer, shorter)) / longer.length
}

function editDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    solved: "text-accent-emerald",
    "under-investigation": "text-accent-cyan",
    pending: "text-accent-amber",
    cold: "text-muted",
    critical: "text-accent-rose",
    high: "text-accent-rose",
    medium: "text-accent-amber",
    low: "text-accent-emerald",
  }
  return colors[status.toLowerCase()] || "text-muted"
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    solved: "bg-emerald-500/10 border-emerald-500/20",
    "under-investigation": "bg-cyan-500/10 border-cyan-500/20",
    pending: "bg-amber-500/10 border-amber-500/20",
    cold: "bg-zinc-500/10 border-zinc-500/20",
    critical: "bg-rose-500/10 border-rose-500/20",
    high: "bg-rose-500/10 border-rose-500/20",
    medium: "bg-amber-500/10 border-amber-500/20",
    low: "bg-emerald-500/10 border-emerald-500/20",
  }
  return colors[status.toLowerCase()] || "bg-zinc-500/10 border-zinc-500/20"
}

export function crimeTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    theft: "Shield",
    assault: "Swords",
    burglary: "DoorOpen",
    cybercrime: "Monitor",
    fraud: "FileX",
    homicide: "Skull",
    kidnapping: "UserX",
    robbery: "Banknote",
    drug: "Pill",
    vehicle_theft: "Car",
    vandalism: "Hammer",
    domestic_violence: "Heart",
    sexual_assault: "AlertTriangle",
    arson: "Flame",
    extortion: "Hand",
    human_trafficking: "Users",
    organized_crime: "Network",
    white_collar: "Briefcase",
    public_order: "Megaphone",
    other: "Circle",
  }
  return icons[type] || "Circle"
}
