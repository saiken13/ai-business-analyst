/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"

export default function DeleteButton({ datasetId }: { datasetId: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setError(null)
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/datasets/${datasetId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete dataset")
      }

      // Redirect to home page after successful deletion
      startTransition(() => {
        router.push("/")
        router.refresh()
      })
    } catch (e: any) {
      setError(e.message)
      setIsDeleting(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-6 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete Dataset
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting || isPending}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isPending}
          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting || isPending ? "Deleting..." : "Confirm Delete"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>}
      <p className="text-xs text-gray-500 text-right">This action cannot be undone</p>
    </div>
  )
}
