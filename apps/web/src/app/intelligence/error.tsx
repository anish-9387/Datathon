"use client"

import { AppShell } from "@/components/layout/AppShell"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertTriangle } from "lucide-react"

export default function IntelligenceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <AppShell>
      <EmptyState
        icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
        title="Failed to load intelligence data"
        description="An error occurred while loading the intelligence page. Please try again."
        action={{ label: "Retry", onClick: reset }}
      />
    </AppShell>
  )
}
