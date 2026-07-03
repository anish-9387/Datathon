"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, GitBranch } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CrimeDNAVisualizer } from "@/components/intelligence/CrimeDNAVisualizer"
import { EmptyState } from "@/components/ui/empty-state"
import { mockData } from "@/lib/api"

export default function CrimeDNAPage() {
  const [firNumber, setFirNumber] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<typeof mockData.crimeDNAMatches | null>(null)

  const handleSearch = () => {
    if (!firNumber.trim()) return
    setSearching(true)
    setTimeout(() => {
      setResults(mockData.crimeDNAMatches)
      setSearching(false)
    }, 1000)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Crime DNA</h1>
          <p className="text-sm text-muted-foreground">Visual fingerprint analysis for modus operandi matching</p>
        </motion.div>

        <Card className="p-5">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Input
                label="FIR Number or Case Description"
                placeholder="Enter FIR number (e.g., FIR2025-0892) or paste case details..."
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} loading={searching} className="mb-0.5">
              <Search className="w-4 h-4" />
              Analyze DNA
            </Button>
          </div>
        </Card>

        {!results ? (
          <EmptyState
            icon={<GitBranch className="w-8 h-8 text-primary" />}
            title="Enter an FIR number to analyze"
            description="The Crime DNA engine will compare the modus operandi against the database to find similar patterns."
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CrimeDNAVisualizer matches={results} firNumber={firNumber} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
