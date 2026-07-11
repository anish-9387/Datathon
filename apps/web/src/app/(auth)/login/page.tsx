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
      <div className="absolute left-0 opacity-[0.08] pointer-events-none z-0 hidden md:block" style={{ bottom: "110px" }}>
        <img
          src="/assets/golgumbaz.svg"
          alt=""
          className="h-[45vh] w-auto object-contain"
        />
      </div>

      {/* Hampi watermark (right) */}
      <div className="absolute right-0 bottom-0 opacity-[0.08] pointer-events-none z-0 hidden md:block">
        <img
          src="/assets/hampi.svg"
          alt=""
          className="h-[70vh] w-auto object-contain"
        />
      </div>

      {/* Bottom red/orange wave */}
      <div className="absolute left-0 right-0 pointer-events-none" style={{ bottom: "-10px" }}>
        <svg viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 180V80C200 40 400 60 600 50C800 40 1000 20 1200 40C1350 55 1440 70 1440 70V180H0Z" fill="#c0392b"/>
          <path d="M0 180V110C200 70 400 90 600 80C800 70 1000 50 1200 70C1350 85 1440 100 1440 100V180H0Z" fill="#e74c3c"/>
          <path d="M0 180V130C200 100 400 115 600 108C800 100 1000 85 1200 100C1350 112 1440 125 1440 125V180H0Z" fill="#f39c12" opacity="0.8"/>
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
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#e67e22]" />
            <p className="text-base text-[#8b6914] font-medium tracking-wide">
              Crime Intelligence Platform
            </p>
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#e67e22]" />
          </div>
        </div>

        {/* Login Card */}
        <div
          className="rounded-3xl backdrop-blur-sm shadow-2xl border border-white/50"
          style={{ background: "rgba(255, 255, 255, 0.9)", padding: "2.5rem" }}
        >
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
                className="w-full flex items-center justify-center gap-2.5 text-white font-semibold shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                style={{
                  height: "3.25rem",
                  borderRadius: "0.75rem",
                  background: "linear-gradient(to right, #c0392b, #e74c3c)",
                  fontSize: "1rem",
                }}
              >
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
