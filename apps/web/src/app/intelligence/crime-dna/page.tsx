"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, GitBranch, FileText } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading"
import { CrimeDNAVisualizer, type DNAMatch } from "@/components/intelligence/CrimeDNAVisualizer"
import { ErrorCard } from "@/components/intelligence/ErrorCard"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi } from "@/hooks/useApi"
import { useDebounce } from "@/hooks/useDebounce"

interface CaseRecord {
  id: number
  crimeNo: string
  date: string
  crimeType: string
  district: string
  policeStation: string
  status: string
  briefFacts: string
  accused: string[]
  victims: string[]
  weapon: string | null
}

interface CasesResponse {
  data: CaseRecord[]
  total: number
}

interface DNAResponse {
  fir: string
  query: CaseRecord
  dnaSignature: string
  embeddingDim: number
  matches: DNAMatch[]
  topMatch: DNAMatch | null
}

export default function CrimeDNAPage() {
  const [query, setQuery] = useState("")
  const [selectedFir, setSelectedFir] = useState<string | null>(null)
  const debouncedQuery = useDebounce(query.trim(), 300)

  const casesUrl = `/api/cases?limit=10${debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ""}`
  const { data: cases, loading: casesLoading } = useApi<CasesResponse>(casesUrl)

  const { data: dna, error: dnaError, loading: dnaLoading, refresh: retryDna } = useApi<DNAResponse>(
    selectedFir ? `/api/crime-dna?fir=${encodeURIComponent(selectedFir)}&topK=10` : null
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Crime DNA</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">Visual fingerprint analysis for modus operandi matching</p>
        </motion.div>

        <Card className="p-5">
          <div className="flex items-end gap-4">
            <div className="flex-1 relative">
              <Input
                label="Find a case to analyze"
                placeholder="Search by crime number (e.g. 100250290202662122)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="w-4 h-4" />
              {casesLoading ? "Searching..." : `${cases?.total ?? 0} cases`}
            </div>
          </div>
          <div className="mt-4 space-y-1 max-h-[280px] overflow-y-auto">
            {(cases?.data || []).map((c) => (
              <button
                key={c.crimeNo}
                onClick={() => setSelectedFir(c.crimeNo)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors border ${
                  selectedFir === c.crimeNo
                    ? "bg-primary/10 border-primary/30"
                    : "border-transparent hover:bg-white/5"
                }`}
              >
                <FileText className="w-4 h-4 text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.crimeNo}</span>
                    <Badge variant="info" size="sm">{c.crimeType}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.policeStation}, {c.district} · {new Date(c.date).toLocaleDateString()} · {c.briefFacts}
                  </p>
                </div>
              </button>
            ))}
            {!casesLoading && (cases?.data || []).length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                No cases match that crime number.
              </p>
            )}
          </div>
        </Card>

        {!selectedFir ? (
          <EmptyState
            icon={<GitBranch className="w-8 h-8 text-primary" />}
            title="Select a case to analyze"
            description="The Crime DNA engine will embed the case's modus operandi and compare it against the full FIR corpus to find similar patterns."
          />
        ) : dnaError ? (
          <ErrorCard title="DNA analysis failed" message={dnaError} onRetry={retryDna} />
        ) : dnaLoading || !dna ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-muted-foreground animate-pulse text-center">
                Computing 384-dim MO embedding for {selectedFir} and scanning the corpus...
                <br />
                This can take up to 30 seconds on first run.
              </p>
            </div>
          </Card>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <Card className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">Query Case: {dna.query.crimeNo}</h3>
                    <Badge variant="info" size="sm">{dna.query.crimeType}</Badge>
                    <Badge variant="default" size="sm">{dna.query.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dna.query.policeStation}, {dna.query.district} · {new Date(dna.query.date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted mt-2 max-w-2xl">{dna.query.briefFacts}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {dna.query.accused.length > 0 && <span>Accused: {dna.query.accused.join(", ")}</span>}
                    {dna.query.victims.length > 0 && <span>Victims: {dna.query.victims.join(", ")}</span>}
                    {dna.query.weapon && <span>Weapon: {dna.query.weapon}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">DNA Signature</p>
                  <p className="text-xs font-mono text-foreground mt-0.5">{dna.dnaSignature}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{dna.embeddingDim}-dim embedding</p>
                </div>
              </div>
            </Card>
            <CrimeDNAVisualizer matches={dna.matches} firNumber={dna.fir} signature={dna.dnaSignature} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
