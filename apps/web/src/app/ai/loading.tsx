import { AppShell } from "@/components/layout/AppShell"
import { ChartSkeleton, CardSkeleton } from "@/components/ui/skeleton"

export default function AILoading() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    </AppShell>
  )
}
