"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type ColumnStat = {
  name: string
  type: string
  missingPct: number
  min?: number | null
  max?: number | null
  mean?: number | null
}

export default function DataVisualization({ columns }: { columns: ColumnStat[] }) {
  const numericColumns = columns.filter((col) => col.type === "number")

  if (numericColumns.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-8">
        No numeric columns to visualize
      </div>
    )
  }

  // Group columns by value magnitude for better visualization
  // Find max value across all columns to determine grouping
  const columnRanges = numericColumns.map((col) => ({
    name: col.name,
    maxValue: Math.max(Math.abs(col.min ?? 0), Math.abs(col.max ?? 0), Math.abs(col.mean ?? 0)),
    col,
  }))

  // Group 1: Large values (>1000) - e.g., salary, revenue
  const largeValueCols = columnRanges.filter((c) => c.maxValue > 1000)
  // Group 2: Medium values (10-1000) - e.g., age, count, years
  const mediumValueCols = columnRanges.filter((c) => c.maxValue >= 10 && c.maxValue <= 1000)
  // Group 3: Small values (0-10) - e.g., ratings, binary flags
  const smallValueCols = columnRanges.filter((c) => c.maxValue < 10)

  // Prepare data for missing percentage chart
  const missingData = columns
    .filter((col) => col.missingPct > 0)
    .map((col) => ({
      name: col.name,
      missing: col.missingPct,
    }))

  const ChartSection = ({ data, title }: { data: typeof columnRanges; title: string }) => {
    if (data.length === 0) return null

    const chartData = data.map((item) => ({
      name: item.name,
      min: item.col.min ?? 0,
      max: item.col.max ?? 0,
      mean: item.col.mean ?? 0,
    }))

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-visible">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 120, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#374151" }}
              angle={0}
              textAnchor="middle"
              height={80}
              interval={0}
            />
            <YAxis tick={{ fontSize: 12, fill: "#374151" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="min" fill="#3b82f6" name="Min" radius={[4, 4, 0, 0]} />
            <Bar dataKey="max" fill="#8b5cf6" name="Max" radius={[4, 4, 0, 0]} />
            <Bar dataKey="mean" fill="#10b981" name="Mean" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Large Value Columns */}
      <ChartSection data={largeValueCols} title="High Value Columns (Salary, Revenue, etc.)" />

      {/* Medium Value Columns */}
      <ChartSection data={mediumValueCols} title="Medium Value Columns (Age, Years, Counts)" />

      {/* Small Value Columns */}
      <ChartSection data={smallValueCols} title="Small Value Columns (Ratings, Scores, Flags)" />

      {/* Missing Data Visualization */}
      {missingData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Missing Data (%)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={missingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="missing" fill="#ef4444" name="Missing %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
