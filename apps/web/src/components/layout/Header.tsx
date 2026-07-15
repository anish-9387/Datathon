"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { useApi } from "@/hooks/useApi"

interface NotificationItem {
  id: number
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/district": "Districts",
  "/dashboard/police-station": "Police Stations",
  "/intelligence/crime-dna": "Crime DNA",
  "/intelligence/mo-clustering": "MO Clustering",
  "/intelligence/crime-evolution": "Crime Evolution",
  "/intelligence/repeat-mo": "Repeat MO",
  "/intelligence/socio-economic": "Socio-Economic",
  "/intelligence/graph": "Graph View",
  "/intelligence/gangs": "Gangs",
  "/intelligence/criminals": "Criminals",
  "/ai/forecasting": "Forecasting",
  "/ai/hotspot-detection": "Hotspots",
  "/ai/anomaly-detection": "Anomalies",
  "/ai/similarity-search": "Similarity Search",
  "/ai/assistant": "AI Assistant",
  "/ai/fir-summarizer": "FIR Summarizer",
}

export function Header() {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const { data: notifications, refresh } = useApi<{ notifications: NotificationItem[]; unread: number }>("/api/notifications")

  useEffect(() => {
    if (showNotifications && !notifications) refresh()
  }, [showNotifications, notifications, refresh])

  const unreadCount = notifications?.unread ?? 0
  const items = notifications?.notifications ?? []

  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((_, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/")
    return { name: breadcrumbMap[path] || segments[i], path }
  })

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" })
      refresh()
    } catch {
      // silent
    }
  }

  const typeColor: Record<string, string> = {
    anomaly: "bg-accent-rose",
    match: "bg-accent-cyan",
    forecast: "bg-accent-amber",
    case: "bg-primary",
  }

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-card-border">
      <div className="flex items-center justify-between h-14 px-6">
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              {idx > 0 && (
                <span className="text-muted-foreground text-xs">/</span>
              )}
              <span className={cn(
                idx === breadcrumbs.length - 1
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}>
                {crumb.name}
              </span>
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl hover:bg-card-hover text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-accent-rose text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-card border border-card-border shadow-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-card-border">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
                    ) : (
                      items.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-4 border-b border-card-border hover:bg-card-hover transition-colors cursor-pointer",
                            !notif.read && "bg-primary/[0.02]"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", typeColor[notif.type] ?? "bg-muted")} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{notif.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-card-hover transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                SP
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">Admin</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-card border border-card-border shadow-xl overflow-hidden"
                >
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-accent-rose hover:bg-accent-rose/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
