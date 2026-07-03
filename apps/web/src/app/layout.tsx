import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Karnataka Police - Crime Intelligence Platform",
  description: "Advanced crime intelligence and analytics platform for Karnataka Police",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#0a0e1a] text-[#e2e8f0] antialiased">
        {children}
      </body>
    </html>
  )
}
