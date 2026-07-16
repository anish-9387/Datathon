"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-[#F7F2E8] text-[#2C241E] antialiased flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            {error.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-[#2C241E] text-[#F7F2E8] rounded-lg hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
