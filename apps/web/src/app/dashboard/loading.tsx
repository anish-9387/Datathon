import { AppShell } from "@/components/layout/AppShell"
import { KPISkeleton, ChartSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <KPISkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    </AppShell>
  )
}
