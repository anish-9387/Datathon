"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Shield, Eye, EyeOff, AlertCircle, Fingerprint } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("admin@karnatakapolice.gov.in")
  const [password, setPassword] = useState("Password@123")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.ok) {
        router.push("/dashboard")
      } else {
        setError("Invalid email or password")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-dot opacity-30" />

      <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 -right-32 w-[400px] h-[400px] bg-accent-cyan/5 rounded-full blur-[100px]" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/4 w-px h-20 bg-gradient-to-b from-primary/20 to-transparent" />
        <div className="absolute bottom-20 right-1/3 w-px h-32 bg-gradient-to-t from-accent-cyan/20 to-transparent" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative w-full max-w-sm px-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={mounted ? { scale: 1 } : {}}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent-cyan shadow-lg shadow-primary/20 mb-5"
          >
            <Shield className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Karnataka Police</h1>
          <p className="text-sm text-muted-foreground/60 mt-1">Crime Intelligence Platform</p>
        </div>

        <div className="rounded-2xl bg-background border border-white/[0.06] shadow-xl shadow-black/20 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-accent-rose/8 border border-accent-rose/15 text-sm text-accent-rose"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
            <div>
              <Input
                id="email"
                type="email"
                label="Email Address"
                placeholder="admin@karnatakapolice.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground/40 hover:text-foreground/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? (
                "Authenticating..."
              ) : (
                <span className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
          <p className="text-center text-[11px] text-muted-foreground/40 mt-6 leading-relaxed">
            Authorized personnel only.<br />All access is monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
