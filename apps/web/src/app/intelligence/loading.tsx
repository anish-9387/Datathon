import { AppShell } from "@/components/layout/AppShell"
import { ChartSkeleton, CardSkeleton } from "@/components/ui/skeleton"

export default function IntelligenceLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </AppShell>
  )
}
