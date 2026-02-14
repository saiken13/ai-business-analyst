/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, Database, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewDatasetPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [rawCsv, setRawCsv] = useState("")
  const [mode, setMode] = useState<"upload" | "paste">("upload")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const fd = new FormData()
      fd.append("name", name.trim())

      if (mode === "upload") {
        if (!file) throw new Error("Please choose a CSV/TSV file.")
        fd.append("file", file)
      } else {
        if (!rawCsv.trim()) throw new Error("Please paste CSV text.")
        fd.append("rawCsv", rawCsv)
      }

      const res = await fetch("/api/datasets/create", {
        method: "POST",
        body: fd,
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error || "Failed to create dataset")

      const datasetId = body.datasetId as string | undefined
      if (!datasetId) throw new Error("Dataset created but missing datasetId")

      startTransition(() => {
        router.push(`/datasets/${datasetId}`)
        router.refresh()
      })
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Datasets
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Dataset</h1>
              <p className="text-sm text-gray-500">
                Upload a CSV/TSV file or paste your data
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Dataset Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Dataset Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="e.g., E-Commerce Sales Data"
                required
              />
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Upload Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    mode === "upload"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <Upload className="w-5 h-5" />
                  <span className="font-medium">Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("paste")}
                  className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    mode === "paste"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300 text-gray-600"
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Paste CSV</span>
                </button>
              </div>
            </div>

            {/* Upload/Paste Section */}
            {mode === "upload" ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">CSV/TSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <input
                    type="file"
                    accept=".csv,.tsv,text/csv,text/tab-separated-values"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  {file && (
                    <p className="mt-3 text-sm text-green-600 font-medium">
                      Selected: {file.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">Supports CSV and TSV files</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">Paste CSV Text</label>
                <textarea
                  value={rawCsv}
                  onChange={(e) => setRawCsv(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono min-h-[280px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder={`name,age,city
John,25,New York
Jane,30,Los Angeles
Bob,35,Chicago`}
                />
                <p className="text-xs text-gray-500">Paste your CSV data with headers in the first row</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? "Creating..." : "Create Dataset"}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
