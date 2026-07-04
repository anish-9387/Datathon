"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Brain, BarChart3, AlertTriangle, Zap } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { PredictionCard } from "@/components/ai/PredictionCard"
import { SHAPExplanation } from "@/components/ai/SHAPExplanation"
import { FeatureImportance } from "@/components/ai/FeatureImportance"
import { ChartWrapper } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { KPISkeleton, ChartSkeleton, CardSkeleton } from "@/components/ui/skeleton"
import { useApi, postApi } from "@/hooks/useApi"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

interface ForecastItem {
  id: number
  date: string
  probability: number
  type: string
  confidence: "high" | "medium" | "low"
  district: string | null
  station: string | null
  explanation: string | null
  model: string
}

interface ForecastResponse {
  forecast: ForecastItem[]
  modelInfo: { name: string; source: string }
}

interface District {
  id: number
  name: string
}

interface LivePrediction {
  date: string
  district: string | null
  type: string | null
  probability: number
  prediction: string
  confidence: "high" | "medium" | "low"
  shap: Record<string, number>
  topFactors: Array<{ feature: string; value: unknown; impact: number }>
}

const CRIME_TYPES = ["Theft", "Robbery", "Burglary", "Assault", "Narcotics", "Cyber Crime"]

export default function ForecastingPage() {
  const [district, setDistrict] = useState("")
  const { data: districts } = useApi<District[]>("/api/districts")
  const forecastUrl = district ? `/api/forecast?district=${encodeURIComponent(district)}` : "/api/forecast"
  const { data, error, loading, refresh } = useApi<ForecastResponse>(forecastUrl)

  // Live "predict now" form state
  const [form, setForm] = useState({ district: "Bengaluru Urban", crimeType: "Theft" })
  const [predicting, setPredicting] = useState(false)
  const [predictError, setPredictError] = useState<string | null>(null)
  const [live, setLive] = useState<LivePrediction | null>(null)

  const forecast = useMemo(() => data?.forecast ?? [], [data])

  const stats = useMemo(() => {
    if (forecast.length === 0) return null
    const avg = forecast.reduce((a, f) => a + f.probability, 0) / forecast.length
    const typeCounts = forecast.reduce<Record<string, number>>((acc, f) => {
      acc[f.type] = (acc[f.type] ?? 0) + 1
      return acc
    }, {})
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    return {
      avg,
      highConfidence: forecast.filter((f) => f.confidence === "high").length,
      topType,
      riskLevel: avg >= 70 ? "High" : avg >= 45 ? "Elevated" : "Moderate",
    }
  }, [forecast])

  const chartData = useMemo(() => {
    const byDate = new Map<string, { total: number; count: number }>()
    for (const f of forecast) {
      const entry = byDate.get(f.date) ?? { total: 0, count: 0 }
      entry.total += f.probability
      entry.count += 1
      byDate.set(f.date, entry)
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count }]) => ({
        date: new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        probability: Math.round((total / count) * 10) / 10,
      }))
  }, [forecast])

  const districtOptions = (districts ?? []).map((d) => ({ value: d.name, label: d.name }))

  const handlePredict = async () => {
    setPredicting(true)
    setPredictError(null)
    try {
      const result = await postApi<LivePrediction>("/api/forecast", {
        district: form.district,
        crimeType: form.crimeType,
      })
      setLive(result)
    } catch (e) {
      setLive(null)
      setPredictError(e instanceof Error ? e.message : "Prediction failed")
    } finally {
      setPredicting(false)
    }
  }

  const shapValues = useMemo(() => {
    if (!live) return []
    return live.topFactors.map((f) => ({
      feature: f.feature,
      value: typeof f.value === "number" || typeof f.value === "string" ? f.value : String(f.value ?? "—"),
      impact: f.impact,
    }))
  }, [live])

  const featureImportances = useMemo(() => {
    if (!live) return []
    const entries = Object.entries(live.shap)
    const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 1e-6)
    return entries
      .map(([name, v]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        importance: Math.round((Math.abs(v) / maxAbs) * 1000) / 10,
      }))
      .sort((a, b) => b.importance - a.importance)
  }, [live])

  return (
    <AppShell>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Crime Forecasting</h1>
            <p className="text-sm text-muted-foreground">AI-powered crime probability predictions from the XGBoost model</p>
          </div>
          <Select
            options={districtOptions}
            placeholder="All districts"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-48"
          />
        </motion.div>

        {error ? (
          <Card>
            <EmptyState
              icon={<AlertTriangle className="w-8 h-8 text-accent-rose" />}
              title="Failed to load forecast"
              description={error}
              action={{ label: "Retry", onClick: refresh }}
            />
          </Card>
        ) : loading ? (
          <>
            <KPISkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          </>
        ) : forecast.length === 0 ? (
          <Card>
            <EmptyState
              title="No stored predictions"
              description={district ? `No forecast entries found for ${district}. Try another district.` : "No forecast entries available."}
            />
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Avg Probability", value: `${stats!.avg.toFixed(1)}%`, icon: TrendingUp, color: "from-primary to-blue-500" },
                { label: "High Confidence", value: stats!.highConfidence.toString(), icon: Brain, color: "from-emerald-500 to-emerald-600" },
                { label: "Top Crime Type", value: stats!.topType, icon: BarChart3, color: "from-amber-500 to-amber-600" },
                { label: "Risk Level", value: stats!.riskLevel, icon: TrendingUp, color: "from-rose-500 to-rose-600" },
              ].map((kpi, idx) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Card className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                        <kpi.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground truncate">{kpi.value}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <ChartWrapper title="Probability Trend" subtitle="Average predicted probability by date" height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: "rgba(13,27,42,0.95)", border: "1px solid rgba(27,58,92,0.6)", borderRadius: 8, fontSize: 13 }} />
                      <Area type="monotone" dataKey="probability" stroke="#3b82f6" strokeWidth={2} fill="url(#forecastGrad)" name="Avg Probability %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartWrapper>
              </motion.div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...forecast]
                  .sort((a, b) => b.probability - a.probability)
                  .slice(0, 4)
                  .map((p, idx) => (
                    <PredictionCard key={p.id} prediction={p} index={idx} />
                  ))}
              </div>
            </div>
          </>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent-cyan flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Predict Now</h3>
                <p className="text-xs text-muted-foreground">Run a live prediction against the ML model (may take a few seconds)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Select
                label="District"
                options={districtOptions.length > 0 ? districtOptions : [{ value: form.district, label: form.district }]}
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
              />
              <Select
                label="Crime Type"
                options={CRIME_TYPES.map((t) => ({ value: t, label: t }))}
                value={form.crimeType}
                onChange={(e) => setForm({ ...form, crimeType: e.target.value })}
              />
              <Button onClick={handlePredict} loading={predicting} className="w-full md:w-auto">
                <Zap className="w-4 h-4" />
                {predicting ? "Running model..." : "Predict"}
              </Button>
            </div>
            {predictError && (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-lg bg-accent-rose/5 border border-accent-rose/20 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-accent-rose">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {predictError}
                </div>
                <Button size="sm" variant="outline" onClick={handlePredict}>Retry</Button>
              </div>
            )}
          </Card>
        </motion.div>

        {live ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PredictionCard
                prediction={{
                  date: live.date,
                  probability: live.probability,
                  type: live.type ?? "Any",
                  confidence: live.confidence,
                  district: live.district,
                }}
                index={0}
              />
              <Card className="p-5 lg:col-span-3">
                <h3 className="text-sm font-semibold text-foreground mb-2">Model Verdict</h3>
                <p className="text-2xl font-bold text-foreground capitalize mb-1">{live.prediction.replace(/-/g, " ")}</p>
                <p className="text-sm text-muted-foreground">
                  The model estimates a {live.probability}% probability of {live.type ?? "crime"} incidents in {live.district ?? "the selected area"} on {new Date(live.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ({live.confidence} confidence). SHAP values below show which features pushed the prediction up or down.
                </p>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SHAPExplanation
                values={shapValues}
                prediction={live.probability}
                subtitle={`${live.type ?? "Crime"} · ${live.district ?? "All districts"} · ${live.date}`}
              />
              <FeatureImportance features={featureImportances} />
            </div>
          </div>
        ) : (
          !predicting && (
            <Card>
              <EmptyState
                icon={<Brain className="w-8 h-8 text-primary" />}
                title="Run a live prediction"
                description="Pick a district and crime type above to get a live model prediction with SHAP explanations and feature importance."
              />
            </Card>
          )
        )}
      </div>
    </AppShell>
  )
}
