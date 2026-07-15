"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText, Upload, Search, RefreshCw, AlertTriangle, Sparkles, ArrowRight } from "lucide-react"
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
  const [caseQuery, setCaseQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [selectedCrimeNo, setSelectedCrimeNo] = useState<string | null>(null)
  const [firText, setFirText] = useState("")
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
      <div className="flex flex-col" style={{ gap: "2rem" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent-cyan flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">FIR Summarizer</h1>
              <p className="text-sm text-muted-foreground/60">AI-powered FIR analysis with keyword extraction and related-case lookup</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-6">
            <Tabs defaultValue="case">
              <TabsList className="mb-6">
                <TabsTrigger value="case">
                  <Search className="w-4 h-4" />
                  Pick a Case
                </TabsTrigger>
                <TabsTrigger value="text">
                  <Upload className="w-4 h-4" />
                  Paste FIR Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="case">
                <div className="space-y-4">
                  <Input
                    label="Search cases"
                    placeholder='Search by brief facts, e.g. "chain snatching"...'
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
                    <div className="flex items-center gap-3 text-sm text-muted-foreground py-6">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading cases...
                    </div>
                  ) : (cases?.data ?? []).length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 text-muted/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No cases matched your search.</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
                      {(cases?.data ?? []).map((c, idx) => (
                        <motion.button
                          key={c.crimeNo}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => handlePickCase(c.crimeNo)}
                          disabled={summarizing}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border transition-all disabled:opacity-60 group",
                            selectedCrimeNo === c.crimeNo
                              ? "bg-primary/10 border-primary/30 shadow-sm"
                              : "bg-surface border-card-border hover:border-primary/20 hover:shadow-sm hover:bg-card-hover"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-foreground font-mono">{c.crimeNo}</span>
                            {c.crimeType && <Badge variant="default" size="sm">{c.crimeType}</Badge>}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {c.district ?? "—"}{c.date ? ` · ${new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                            </span>
                          </div>
                          <p className="text-xs text-muted line-clamp-2">{c.briefFacts ?? "No brief facts recorded."}</p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Select a case to generate its AI summary with keyword extraction and related-case matching.
                  </p>
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
                      className="w-full h-44 px-4 py-3 bg-surface border border-card-border rounded-xl text-sm text-foreground placeholder:text-muted outline-none focus:border-primary/30 transition-colors resize-none"
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
        </motion.div>

        {summarizing ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
                <div className="relative">
                  <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  <div className="absolute inset-0 w-8 h-8 rounded-full bg-primary/10 animate-ping" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Analyzing FIR</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Extracting keywords, key phrases, and searching the corpus for related cases.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Processing
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.3s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            </Card>
          </motion.div>
        ) : summaryError ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <EmptyState
                icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
                title="Summarization failed"
                description={summaryError}
                action={lastRequest ? { label: "Retry", onClick: () => runSummarize(lastRequest) } : undefined}
              />
            </Card>
          </motion.div>
        ) : !summary ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-8">
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Ready to Analyze</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    Pick a case from the database or paste FIR text. The AI will generate a structured summary with keywords, key phrases, and related cases.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Analysis Complete</span>
              <Badge variant="success" size="sm">
                {summary.keywords.length} keywords · {summary.keyPhrases.length} phrases{summary.related.length > 0 ? ` · ${summary.related.length} related cases` : ""}
              </Badge>
            </div>
            <FIRSummary data={summary} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
