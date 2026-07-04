"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText, Upload, Search, RefreshCw, AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FIRSummary, type FIRSummaryData } from "@/components/ai/FIRSummary"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi, postApi } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

interface CaseRow {
  id: number
  crimeNo: string
  crimeType: string | null
  district: string | null
  date: string | null
  briefFacts: string | null
}

interface CasesResponse {
  data: CaseRow[]
  total: number
}

const SAMPLE_FIR_TEXT =
  "On the night of 12th April, unknown persons gained entry into the complainant's residence in Koramangala by cutting the rear window grill with a metal cutter. Electronic items including a laptop and tablet along with cash totalling approximately Rs 2,50,000 were stolen while the family was away. Neighbours reported suspicious movement of two men on a motorcycle near the compound around 3:30 PM. CCTV footage from adjacent properties is being collected for analysis."

export default function FIRSummarizerPage() {
  // Case picker state
  const [caseQuery, setCaseQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCrimeNo, setSelectedCrimeNo] = useState<string | null>(null)

  // Paste-text state
  const [firText, setFirText] = useState("")

  // Shared summarize state
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [summary, setSummary] = useState<FIRSummaryData | null>(null)
  const [lastRequest, setLastRequest] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(caseQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [caseQuery])

  const casesUrl = `/api/cases?limit=10${debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ""}`
  const { data: cases, error: casesError, loading: casesLoading, refresh: refreshCases } = useApi<CasesResponse>(casesUrl)

  const runSummarize = async (body: Record<string, string>) => {
    setSummarizing(true)
    setSummaryError(null)
    setLastRequest(body)
    try {
      const result = await postApi<FIRSummaryData>("/api/ai/summarize", body)
      setSummary(result)
    } catch (e) {
      setSummary(null)
      setSummaryError(e instanceof Error ? e.message : "Summarization failed")
    } finally {
      setSummarizing(false)
    }
  }

  const handlePickCase = (crimeNo: string) => {
    setSelectedCrimeNo(crimeNo)
    runSummarize({ crimeNo })
  }

  const handleSummarizeText = () => {
    if (!firText.trim()) return
    setSelectedCrimeNo(null)
    runSummarize({ text: firText.trim() })
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">FIR Summarizer</h1>
          <p className="text-sm text-muted-foreground">AI-powered FIR analysis with keyword extraction and related-case lookup</p>
        </motion.div>

        <Card className="p-5">
          <Tabs defaultValue="case">
            <TabsList className="mb-4">
              <TabsTrigger value="case">Pick a Case</TabsTrigger>
              <TabsTrigger value="text">Paste FIR Text</TabsTrigger>
            </TabsList>

            <TabsContent value="case">
              <div className="space-y-4">
                <Input
                  label="Search cases"
                  placeholder='Search brief facts, e.g. "chain snatching"...'
                  value={caseQuery}
                  onChange={(e) => setCaseQuery(e.target.value)}
                />
                {casesError ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-accent-rose/5 border border-accent-rose/20 px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-accent-rose">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {casesError}
                    </div>
                    <Button size="sm" variant="outline" onClick={refreshCases}>Retry</Button>
                  </div>
                ) : casesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading cases...
                  </div>
                ) : (cases?.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No cases matched your search.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(cases?.data ?? []).map((c) => (
                      <button
                        key={c.crimeNo}
                        onClick={() => handlePickCase(c.crimeNo)}
                        disabled={summarizing}
                        className={cn(
                          "w-full text-left p-3 rounded-xl border transition-all disabled:opacity-60",
                          selectedCrimeNo === c.crimeNo
                            ? "bg-primary/10 border-primary/30"
                            : "bg-white/[0.02] border-white/5 hover:border-primary/20 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-foreground font-mono">{c.crimeNo}</span>
                          {c.crimeType && <Badge variant="default" size="sm">{c.crimeType}</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {c.district ?? "—"}{c.date ? ` · ${new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                          </span>
                        </div>
                        <p className="text-xs text-muted line-clamp-1">{c.briefFacts ?? "No brief facts recorded."}</p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Select a case to generate its AI summary.</p>
              </div>
            </TabsContent>

            <TabsContent value="text">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">FIR Text</label>
                  <textarea
                    value={firText}
                    onChange={(e) => setFirText(e.target.value)}
                    placeholder="Paste FIR text here for AI analysis..."
                    className="w-full h-40 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/30 transition-colors resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleSummarizeText} loading={summarizing} size="lg" disabled={!firText.trim()}>
                    <FileText className="w-4 h-4" />
                    {summarizing ? "Analyzing..." : "Summarize FIR"}
                  </Button>
                  <Button variant="outline" onClick={() => setFirText(SAMPLE_FIR_TEXT)}>
                    <Upload className="w-4 h-4" />
                    Load Sample
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {summarizing ? (
          <Card className="p-5">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Summarizing FIR...</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Extracting keywords, key phrases, and searching the corpus for related cases. This can take up to 30 seconds.
              </p>
            </div>
          </Card>
        ) : summaryError ? (
          <Card>
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
              title="Summarization failed"
              description={summaryError}
              action={lastRequest ? { label: "Retry", onClick: () => runSummarize(lastRequest) } : undefined}
            />
          </Card>
        ) : !summary ? (
          <EmptyState
            icon={<FileText className="w-8 h-8 text-primary" />}
            title="Pick a case or paste FIR text"
            description="The AI will produce a summary with keywords, key phrases, structured case details, and semantically related cases."
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <FIRSummary data={summary} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
