import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import AnalyzeButton from "./AnalyzeButton"
import DeleteButton from "./DeleteButton"
import { BarChart3, Database, TrendingUp, AlertCircle } from "lucide-react"
import DataVisualization from "./DataVisualization"

function tryParseJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

type ColumnStat = {
  name: string
  type: string
  missingPct: number
  min?: number | null
  max?: number | null
  mean?: number | null
}

export default async function DatasetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) notFound()
  if (!id) notFound()

  const dataset = await prisma.dataset.findFirst({
    where: {
      id,
      user: { email: session.user.email },
    },
    select: {
      id: true,
      name: true,
      status: true,
      filePath: true,
      createdAt: true,
    },
  })

  if (!dataset) notFound()

  // Get only the most recent insight per category
  const allInsights = await prisma.insight.findMany({
    where: { datasetId: dataset.id },
    orderBy: { createdAt: "desc" },
  })

  // Keep only the newest insight for each category
  const seenCategories = new Set<string>()
  const insights = allInsights.filter((insight) => {
    if (seenCategories.has(insight.category)) return false
    seenCategories.add(insight.category)
    return true
  })

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      ANALYZING: "bg-blue-100 text-blue-800 border-blue-200 animate-pulse",
      READY: "bg-green-100 text-green-800 border-green-200",
      FAILED: "bg-red-100 text-red-800 border-red-200",
    }
    return styles[status as keyof typeof styles] || styles.PENDING
  }

  // Extract profile data for charts
  const profileInsight = insights.find((i) => i.category === "profile")
  const profileData = profileInsight ? tryParseJson(profileInsight.text) : null
  const columns = profileData?.columns || []

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(dataset.status)}`}>
                  {dataset.status}
                </span>
                <span className="text-sm text-gray-500">
                  Created {new Date(dataset.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AnalyzeButton datasetId={dataset.id} status={dataset.status} />
              <DeleteButton datasetId={dataset.id} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {insights.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Click <b>Analyze dataset</b> to start analyzing your data
            </p>
          </div>
        ) : (
          <>
            {insights.map((i) => {
              const parsed = tryParseJson(i.text)

              return (
                <div key={i.id}>
                  {/* Preview Section */}
                  {parsed && i.category === "preview" && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          Dataset Preview
                        </h2>
                      </div>
                      <div className="p-6 space-y-4">
                        <p className="text-gray-700">{parsed.summary}</p>
                        <div className="flex gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Rows:</span>
                            <span className="text-gray-600">~{parsed.rowCountApprox}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Columns:</span>
                            <span className="text-gray-600">{parsed.columnCount}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">Delimiter:</span>
                            <span className="text-gray-600">{parsed.delimiter}</span>
                          </div>
                        </div>
                        <div className="overflow-auto border border-gray-200 rounded-lg">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                {parsed.headers.map((h: string) => (
                                  <th key={h} className="text-left p-3 border-b font-semibold text-gray-900">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {parsed.sampleRows.map((row: string[], idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                  {row.map((cell: string, j: number) => (
                                    <td key={j} className="p-3 border-b text-gray-700">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Section */}
                  {parsed && i.category === "profile" && (
                    <div className="space-y-6">
                      {/* Statistics Table */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-6 py-4">
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Column Statistics
                          </h2>
                        </div>
                        <div className="p-6">
                          <div className="overflow-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-3 border-b font-semibold text-gray-900">Column</th>
                                  <th className="text-left p-3 border-b font-semibold text-gray-900">Type</th>
                                  <th className="text-left p-3 border-b font-semibold text-gray-900">Missing %</th>
                                  <th className="text-left p-3 border-b font-semibold text-gray-900">Min</th>
                                  <th className="text-left p-3 border-b font-semibold text-gray-900">Max</th>
                                  <th className="text-left p-3 border-b font-semibold text-gray-900">Mean</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parsed.columns?.map((col: ColumnStat, idx: number) => (
                                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 border-b font-medium text-gray-900">{col.name}</td>
                                    <td className="p-3 border-b">
                                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${col.type === 'number' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {col.type}
                                      </span>
                                    </td>
                                    <td className="p-3 border-b">
                                      <span className={col.missingPct > 10 ? "text-red-600 font-medium" : "text-gray-700"}>
                                        {col.missingPct.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="p-3 border-b text-gray-700">
                                      {col.min !== null && col.min !== undefined
                                        ? typeof col.min === "number"
                                          ? col.min.toFixed(2)
                                          : col.min
                                        : "—"}
                                    </td>
                                    <td className="p-3 border-b text-gray-700">
                                      {col.max !== null && col.max !== undefined
                                        ? typeof col.max === "number"
                                          ? col.max.toFixed(2)
                                          : col.max
                                        : "—"}
                                    </td>
                                    <td className="p-3 border-b text-gray-700">
                                      {col.mean !== null && col.mean !== undefined
                                        ? typeof col.mean === "number"
                                          ? col.mean.toFixed(2)
                                          : col.mean
                                        : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Data Visualizations */}
                      {columns.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                              <BarChart3 className="w-5 h-5" />
                              Data Visualizations
                            </h2>
                          </div>
                          <div className="p-6">
                            <DataVisualization columns={columns} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Insights Section */}
                  {parsed && i.category === "ai_insight" && (
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-purple-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          AI-Generated Insights
                        </h2>
                      </div>
                      <div className="p-6">
                        <div className="prose prose-sm max-w-none text-gray-700">
                          {parsed.insights?.map((insight: string, idx: number) => (
                            <p key={idx} className="mb-3 flex items-start gap-2">
                              <span className="text-purple-600 font-bold">•</span>
                              <span>{insight}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Section */}
                  {i.category === "error" && (
                    <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-red-900 mb-1">Analysis Error</h3>
                          <pre className="text-sm text-red-700 whitespace-pre-wrap">{i.text}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </main>
  )
}
