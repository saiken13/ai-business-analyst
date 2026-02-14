/* eslint-disable @next/next/no-html-link-for-pages */
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Database, Plus, BarChart3, LogOut } from "lucide-react"

export const runtime = "nodejs"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl">
              <BarChart3 className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Business Analyst</h1>
            <p className="text-gray-600">
              Upload datasets and get instant AI-powered insights
            </p>
          </div>
          <div className="space-y-3">
            <a
              href="/api/auth/signin"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Sign in with GitHub
            </a>
          </div>
        </div>
      </main>
    )
  }

  const datasets = await prisma.dataset.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ANALYZING: "bg-blue-100 text-blue-800 border-blue-200 animate-pulse",
      READY: "bg-green-100 text-green-800 border-green-200",
      FAILED: "bg-red-100 text-red-800 border-red-200",
    }
    return styles[status as keyof typeof styles] || styles.PENDING
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Datasets</h1>
                <p className="text-sm text-gray-500">
                  {session.user.email}
                </p>
              </div>
            </div>
            <a
              href="/api/auth/signout"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </a>
          </header>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/datasets/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Dataset
          </Link>
        </div>

        {datasets.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No datasets yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first dataset to get started with AI-powered analysis
            </p>
            <Link
              href="/datasets/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Create Dataset
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {datasets.map((d) => (
              <Link
                key={d.id}
                href={`/datasets/${d.id}`}
                className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Database className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(d.status)}`}
                    >
                      {d.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {d.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
