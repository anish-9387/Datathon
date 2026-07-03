"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import {
  Search, Bell, ChevronDown, Settings, Shield, Command
} from "lucide-react"
import { cn } from "@/lib/utils"

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/district": "District Analytics",
  "/dashboard/police-station": "Police Station Drill-down",
  "/intelligence/crime-dna": "Crime DNA",
  "/intelligence/mo-clustering": "MO Clustering",
  "/intelligence/crime-evolution": "Crime Evolution",
  "/intelligence/repeat-mo": "Repeat MO Detection",
  "/intelligence/graph": "Network Graph",
  "/intelligence/gangs": "Gang Detection",
  "/intelligence/criminals": "Criminal Scoring",
  "/ai/forecasting": "Forecasting",
  "/ai/hotspot-detection": "Hotspot Detection",
  "/ai/anomaly-detection": "Anomaly Detection",
  "/ai/similarity-search": "Similarity Search",
  "/ai/assistant": "AI Investigation Assistant",
  "/ai/fir-summarizer": "FIR Summarizer",
}

export function Header({ onCmdK }: { onCmdK: () => void }) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((_, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/")
    return { name: breadcrumbMap[path] || segments[i], path }
  })

  return (
    <header className="sticky top-0 z-30 glass-card rounded-none border-b border-white/5 border-t-0">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.path} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted/50">/</span>}
                <span className={cn(idx === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {crumb.name}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCmdK}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-muted-foreground text-xs hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-mono">Ctrl+K</kbd>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-rose animate-pulse" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card rounded-xl shadow-2xl shadow-primary/5 border border-white/10 animate-scale-in overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {[
                    { title: "Anomaly Detected", desc: "Unusual crime pattern in Koramangala", time: "2 min ago", color: "text-accent-rose" },
                    { title: "MO Match Found", desc: "85% similarity with previous burglary case", time: "15 min ago", color: "text-accent-cyan" },
                    { title: "Forecast Updated", desc: "High probability of theft in your area tomorrow", time: "1 hour ago", color: "text-accent-amber" },
                    { title: "New Case Assigned", desc: "FIR #2025-1042 assigned to your team", time: "3 hours ago", color: "text-primary" },
                  ].map((notif, i) => (
                    <div key={i} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", notif.color.replace("text-", "bg-"))} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{notif.desc}</p>
                          <p className="text-[11px] text-muted mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center text-xs font-bold text-white">
                SP
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">Superintendent</p>
                <p className="text-[11px] text-muted-foreground">Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl shadow-2xl border border-white/10 animate-scale-in overflow-hidden">
                {[
                  { label: "Profile", icon: Shield },
                  { label: "Settings", icon: Settings },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-white/5 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-white/5">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-rose hover:bg-accent-rose/5 transition-colors">
                    <LogOutIcon className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
