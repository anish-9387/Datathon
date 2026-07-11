import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Corvus - Crime Intelligence Platform",
  description: "Advanced crime intelligence and analytics platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#F7F2E8] text-[#2C241E] antialiased">
        {children}
      </body>
    </html>
  )
}
