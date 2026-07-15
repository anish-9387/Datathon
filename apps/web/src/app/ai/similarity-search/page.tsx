"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, RefreshCw, AlertTriangle } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SimilarityResult, type SimilarityMatch } from "@/components/ai/SimilarityResult"
import { EmptyState } from "@/components/ui/empty-state"
import { useApi, postApi } from "@/hooks/useApi"

interface SimilarityResponse {
  results: SimilarityMatch[]
  total: number
  corpusSize: number
}

interface District {
  id: number
  name: string
}

const CRIME_TYPES = ["Theft", "Robbery", "Burglary", "Assault", "Narcotics", "Cyber Crime"]

export default function SimilaritySearchPage() {
  const { data: districts } = useApi<District[]>("/api/districts")
  const [searchParams, setSearchParams] = useState({
    description: "",
    district: "",
    type: "",
    topK: "10",
  })
  const [response, setResponse] = useState<SimilarityResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchParams.description.trim() || searching) return
    setSearching(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        query: searchParams.description.trim(),
        topK: parseInt(searchParams.topK, 10) || 10,
      }
      if (searchParams.district) body.district = searchParams.district
      if (searchParams.type) body.crimeType = searchParams.type
      const res = await postApi<SimilarityResponse>("/api/ai/similarity", body)
      setResponse(res)
    } catch (e) {
      setResponse(null)
      setError(e instanceof Error ? e.message : "Similarity search failed")
    } finally {
      setSearching(false)
    }
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Crime Similarity Search</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">Semantic search over FIR narratives using sentence embeddings</p>
        </motion.div>

        <Card className="p-5">
          <Tabs defaultValue="basic">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Search</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    label="Case Description or MO"
                    placeholder='e.g. "gold chain snatching by motorcycle riders"'
                    value={searchParams.description}
                    onChange={(e) => setSearchParams({ ...searchParams, description: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} loading={searching} disabled={!searchParams.description.trim()}>
                  <Search className="w-4 h-4" />
                  Search Similar
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="advanced">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Select
                  label="District"
                  placeholder="All districts"
                  options={(districts ?? []).map((d) => ({ value: d.name, label: d.name }))}
                  value={searchParams.district}
                  onChange={(e) => setSearchParams({ ...searchParams, district: e.target.value })}
                />
                <Select
                  label="Crime Type"
                  placeholder="All types"
                  options={CRIME_TYPES.map((t) => ({ value: t, label: t }))}
                  value={searchParams.type}
                  onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                />
                <Select
                  label="Results"
                  options={[
                    { value: "5", label: "Top 5" },
                    { value: "10", label: "Top 10" },
                    { value: "20", label: "Top 20" },
                  ]}
                  value={searchParams.topK}
                  onChange={(e) => setSearchParams({ ...searchParams, topK: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    label="Case Description or MO"
                    placeholder="Describe the crime modus operandi..."
                    value={searchParams.description}
                    onChange={(e) => setSearchParams({ ...searchParams, description: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} loading={searching} disabled={!searchParams.description.trim()}>
                  <Filter className="w-4 h-4" />
                  Search
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {searching ? (
          <Card className="p-5">
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">Computing semantic embeddings...</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                The model is encoding your query and comparing it against every FIR narrative in the corpus. This can take 10-30 seconds.
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
              title="Search failed"
              description={error}
              action={{ label: "Retry", onClick: handleSearch }}
            />
          </Card>
        ) : !response ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-primary" />}
            title="Search for similar cases"
            description="Describe a modus operandi to find semantically matching cases from the FIR database. Try: gold chain snatching by motorcycle riders."
          />
        ) : response.results.length === 0 ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-primary" />}
            title="No matches found"
            description="No similar cases matched your filters. Try broadening the district or crime type."
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SimilarityResult results={response.results} corpusSize={response.corpusSize} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
