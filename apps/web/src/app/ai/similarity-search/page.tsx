"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { SimilarityResult, type SimilarityMatch } from "@/components/ai/SimilarityResult"
import { EmptyState } from "@/components/ui/empty-state"

const mockResults: SimilarityMatch[] = [
  { id: "1", firNumber: "FIR2025-0892", similarity: 94.2, date: "2025-04-12", type: "Burglary", location: "Koramangala", act: "IPC", section: "457", description: "House break-in during daytime, forced entry through rear window, stolen electronics worth ₹2.5L" },
  { id: "2", firNumber: "FIR2025-0765", similarity: 87.6, date: "2025-03-28", type: "Burglary", location: "Indiranagar", act: "IPC", section: "457", description: "House break-in, rear window forced open, jewelry stolen during family vacation" },
  { id: "3", firNumber: "FIR2025-0654", similarity: 82.1, date: "2025-03-15", type: "Theft", location: "Jayanagar", act: "IPC", section: "379", description: "Unlocked balcony entry, cash and mobile phones stolen while residents were asleep" },
  { id: "4", firNumber: "FIR2025-0543", similarity: 76.8, date: "2025-02-28", type: "Burglary", location: "Whitefield", act: "IPC", section: "454", description: "Lurking house-trespassing, rear window entry, documents and valuables stolen" },
  { id: "5", firNumber: "FIR2025-0432", similarity: 71.3, date: "2025-02-10", type: "Burglary", location: "Malleshwaram", act: "IPC", section: "457", description: "House break-in, rear window forced open, electronics and cash stolen" },
  { id: "6", firNumber: "FIR2025-0321", similarity: 65.8, date: "2025-01-22", type: "Theft", location: "RT Nagar", act: "IPC", section: "380", description: "Theft in dwelling house, entry through unlocked door during daytime" },
]

export default function SimilaritySearchPage() {
  const [searchParams, setSearchParams] = useState({
    act: "",
    section: "",
    description: "",
    location: "",
    type: "",
  })
  const [results, setResults] = useState<SimilarityMatch[] | null>(null)
  const [searching, setSearching] = useState(false)

  const handleSearch = () => {
    if (!searchParams.description && !searchParams.act) return
    setSearching(true)
    setTimeout(() => {
      setResults(mockResults)
      setSearching(false)
    }, 1200)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Crime Similarity Search</h1>
          <p className="text-sm text-muted-foreground">Find similar cases using act, section, description, MO, and location</p>
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
                    placeholder="Describe the crime modus operandi..."
                    value={searchParams.description}
                    onChange={(e) => setSearchParams({ ...searchParams, description: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} loading={searching}>
                  <Search className="w-4 h-4" />
                  Search Similar
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="advanced">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input label="Act (e.g., IPC)" placeholder="IPC" value={searchParams.act} onChange={(e) => setSearchParams({ ...searchParams, act: e.target.value })} />
                <Input label="Section" placeholder="457" value={searchParams.section} onChange={(e) => setSearchParams({ ...searchParams, section: e.target.value })} />
                <Select
                  label="Crime Type"
                  placeholder="All types"
                  options={[
                    { value: "theft", label: "Theft" },
                    { value: "burglary", label: "Burglary" },
                    { value: "assault", label: "Assault" },
                    { value: "cybercrime", label: "Cybercrime" },
                    { value: "fraud", label: "Fraud" },
                    { value: "robbery", label: "Robbery" },
                  ]}
                  value={searchParams.type}
                  onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Input
                    label="Location"
                    placeholder="e.g., Koramangala"
                    value={searchParams.location}
                    onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                  />
                </div>
                <Button onClick={handleSearch} loading={searching}>
                  <Filter className="w-4 h-4" />
                  Search
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {!results ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-primary" />}
            title="Search for similar cases"
            description="Enter crime details to find matching cases from the database using AI-powered similarity analysis."
          />
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SimilarityResult results={results} />
          </motion.div>
        )}
      </div>
    </AppShell>
  )
}
