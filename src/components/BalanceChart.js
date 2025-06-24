import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts'
import { formatCurrency } from '../lib/utils'
import { useState, useMemo } from 'react'

export default function BalanceChart({ data }) {
  const [timeRange, setTimeRange] = useState('30d')
  const [chartType, setChartType] = useState('area')
  const [showGrid, setShowGrid] = useState(true)

  const timeRanges = [
    { value: '7d', label: '7 Days', days: 7 },
    { value: '30d', label: '30 Days', days: 30 },
    { value: '6m', label: '6 Months', days: 180 },
    // { value: '1y', label: '1 Year', days: 365 },
    // { value: '5y', label: '5 Years', days: 1825 },
  ]

  // Format date based on time range
  const formatDateForRange = (dateStr, range) => {
    const date = new Date(dateStr)
    
    switch (range) {
      case '7d':
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      case '30d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case '6m':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      case '1y':
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      case '5y':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      default:
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const selectedRange = timeRanges.find(range => range.value === timeRange)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - selectedRange.days)
    
    return data
      .filter(item => new Date(item.date) >= cutoffDate)
      .map((item, index, array) => ({
        ...item,
        formattedDate: formatDateForRange(item.date, timeRange),
        change: index > 0 ? item.balance - array[index - 1].balance : 0,
        changePercent: index > 0 ? ((item.balance - array[index - 1].balance) / array[index - 1].balance * 100) : 0
      }))
  }, [data, timeRange])

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null
    
    const balances = filteredData.map(d => d.balance)
    const min = Math.min(...balances)
    const max = Math.max(...balances)
    const avg = balances.reduce((sum, val) => sum + val, 0) / balances.length
    const start = balances[0]
    const end = balances[balances.length - 1]
    const totalChange = end - start
    const percentChange = (totalChange / start) * 100
    
    return { min, max, avg, start, end, totalChange, percentChange }
  }, [filteredData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Balance:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.balance)}
              </span>
            </div>
            {data.change !== 0 && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  data.change > 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-500">Change:</span>
                <span className={`text-xs font-semibold ${
                  data.change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {data.change > 0 ? '+' : ''}{formatCurrency(data.change)}
                  {data.changePercent !== 0 && (
                    <span className="ml-1">
                      ({data.changePercent > 0 ? '+' : ''}{data.changePercent.toFixed(1)}%)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No balance data available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add some transactions to see your balance history</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Balance History
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track your financial journey over time
          </p>
        </div>
        
        {/* Chart Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType(chartType === 'area' ? 'line' : 'area')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={`Switch to ${chartType === 'area' ? 'line' : 'area'} chart`}
          >
            {chartType === 'area' ? (
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3v18h18v-2H5V3H3z" />
                <path d="M7 12l3-3 3 3 4-4v8H7v-4z" opacity="0.3" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
            }`}
            title="Toggle grid"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {timeRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              timeRange === range.value
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-xl">
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.end)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Change</div>
            <div className={`text-sm font-bold ${
              stats.totalChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {stats.totalChange >= 0 ? '+' : ''}{formatCurrency(stats.totalChange)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Peak</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.max)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Low</div>
            <div className="text-sm font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.min)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative h-80">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent dark:from-gray-800/30 pointer-events-none rounded-lg"></div>
        
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 20, bottom: 30 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#E5E7EB" 
                  className="dark:stroke-gray-600" 
                  opacity={0.4}
                />
              )}
              
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                className="dark:fill-gray-400"
                interval="preserveStartEnd"
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                className="dark:fill-gray-400"
                tickFormatter={(value) => {
                  if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`
                  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
                  return `₹${value}`
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Average line reference */}
              {stats && (
                <ReferenceLine 
                  y={stats.avg} 
                  stroke="#F59E0B" 
                  strokeDasharray="5 5" 
                  strokeOpacity={0.7}
                />
              )}
              
              <Area
                type="monotone"
                dataKey="balance"
                stroke="url(#strokeGradient)"
                strokeWidth={3}
                fill="url(#balanceGradient)"
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: '#3B82F6', 
                  strokeWidth: 3,
                  fill: '#fff',
                  style: { 
                    filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3))',
                    cursor: 'pointer'
                  }
                }}
              />
            </AreaChart>
          ) : (
            <LineChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#E5E7EB" 
                  className="dark:stroke-gray-600" 
                  opacity={0.4}
                />
              )}
              
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                className="dark:fill-gray-400"
                interval="preserveStartEnd"
              />
              
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                className="dark:fill-gray-400"
                tickFormatter={(value) => {
                  if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`
                  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
                  return `₹${value}`
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Average line reference */}
              {stats && (
                <ReferenceLine 
                  y={stats.avg} 
                  stroke="#F59E0B" 
                  strokeDasharray="5 5" 
                  strokeOpacity={0.7}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="balance"
                stroke="url(#strokeGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ 
                  r: 6, 
                  stroke: '#3B82F6', 
                  strokeWidth: 3,
                  fill: '#fff',
                  style: { 
                    filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3))',
                    cursor: 'pointer'
                  }
                }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
        
        {/* Trend indicator */}
        {stats && (
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
              stats.totalChange >= 0 
                ? 'bg-green-100/80 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                : 'bg-red-100/80 dark:bg-red-900/50 text-red-700 dark:text-red-300'
            }`}>
              <svg className={`w-3 h-3 ${stats.totalChange >= 0 ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              {stats.percentChange >= 0 ? '+' : ''}{stats.percentChange.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  )
}