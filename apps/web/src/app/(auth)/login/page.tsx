"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, AlertCircle, Fingerprint, Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"

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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden login-bg">
      {/* Golgumbaz watermark (left) */}
      <div className="absolute left-0 opacity-[0.06] pointer-events-none z-0 hidden lg:block" style={{ bottom: "80px" }}>
        <img
          src="/assets/golgumbaz.svg"
          alt=""
          className="h-[50vh] w-auto object-contain"
        />
      </div>

      {/* Hampi watermark (right) */}
      <div className="absolute right-0 bottom-0 opacity-[0.06] pointer-events-none z-0 hidden lg:block">
        <img
          src="/assets/hampi.svg"
          alt=""
          className="h-[75vh] w-auto object-contain"
        />
      </div>

      {/* Bottom gradient wave */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: "-2px" }}>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120V60C160 30 320 45 480 35C640 25 800 15 960 30C1120 45 1280 55 1440 40V120H0Z" fill="#7B241C" opacity="0.15"/>
          <path d="M0 120V75C160 50 320 60 480 52C640 44 800 38 960 48C1120 58 1280 65 1440 55V120H0Z" fill="#7B241C" opacity="0.1"/>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
        className="relative z-10 w-full max-w-lg px-5"
      >
        {/* Logo and Title */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={mounted ? { scale: 1 } : {}}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-block mb-4"
          >
            <img
              src="/assets/Seal_of_Karnataka.svg"
              alt="Seal of Karnataka"
              className="w-28 h-28 mx-auto"
            />
          </motion.div>
          <h1 className="text-4xl font-bold text-[#7b241c] tracking-tight">
            Corvus
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-10 bg-linear-to-r from-transparent to-[#e67e22]" />
            <p className="text-base text-[#8b6914] font-medium tracking-wide">
              Crime Intelligence Platform
            </p>
            <div className="h-px w-10 bg-linear-to-l from-transparent to-[#e67e22]" />
          </div>
        </div>

        {/* Login Card */}
        <div
          className="rounded-3xl backdrop-blur-sm shadow-2xl border border-white/50 relative overflow-hidden"
          style={{ background: "rgba(255, 255, 255, 0.92)", padding: "2.5rem" }}
        >
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-linear-to-bl from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-linear-to-tr from-accent-amber/5 to-transparent rounded-full blur-3xl pointer-events-none" />
          <form onSubmit={handleSubmit}>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600"
                style={{ marginBottom: "1.75rem" }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700" style={{ marginBottom: "0.5rem" }}>
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@karnatakapolice.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200"
                  style={{
                    paddingLeft: "3rem",
                    paddingRight: "1rem",
                    paddingTop: "0.875rem",
                    paddingBottom: "0.875rem",
                    fontSize: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "rgba(249, 250, 251, 0.5)",
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.75rem" }}>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700" style={{ marginBottom: "0.5rem" }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200"
                  style={{
                    paddingLeft: "3rem",
                    paddingRight: "3rem",
                    paddingTop: "0.875rem",
                    paddingBottom: "0.875rem",
                    fontSize: "1rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "rgba(249, 250, 251, 0.5)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div style={{ marginTop: "2rem" }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden group"
                style={{
                  height: "3.25rem",
                  borderRadius: "0.75rem",
                  background: "linear-gradient(135deg, #7B241C, #A63D2F)",
                  fontSize: "1rem",
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                {loading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-gray-400 leading-relaxed" style={{ marginTop: "1.75rem" }}>
            Authorized personnel only.<br />
            All access is monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
