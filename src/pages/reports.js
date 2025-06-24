import { useState, useEffect, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { formatCurrency } from '../lib/utils'
import DashboardHeader from '../components/DashboardHeader'
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

export default function Reports() {
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [dailyTrend, setDailyTrend] = useState([])
  const [loading, setLoading] = useState(true)
    
  useEffect(() => {
    fetchReports()
  }, [])
  
  const fetchReports = async () => {
    setLoading(true)
    try {
      const [monthlyRes, categoryRes, dailyRes] = await Promise.all([
        fetch('/api/reports/monthly-summary'),
        fetch('/api/reports/category-breakdown'),
        fetch('/api/reports/daily-trend')
      ])
      
      const monthly = await monthlyRes.json()
      const category = await categoryRes.json()
      const daily = await dailyRes.json()
      
      setMonthlySummary(monthly)
      setCategoryData(category)
      setDailyTrend(daily)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  // Enhanced insights calculations
  const insights = useMemo(() => {
    if (!categoryData.length || !monthlySummary) return null

    const expenseCategories = categoryData.filter(cat => cat.debit > 0)
    const incomeCategories = categoryData.filter(cat => cat.credit > 0)
    
    // Find highest spending category
    const highestSpending = expenseCategories.reduce((max, cat) => 
      cat.debit > max.debit ? cat : max, expenseCategories[0] || { name: 'None', debit: 0 }
    )
    
    // Find highest income source
    const highestIncome = incomeCategories.reduce((max, cat) => 
      cat.credit > max.credit ? cat : max, incomeCategories[0] || { name: 'None', credit: 0 }
    )
    
    // Calculate savings rate
    const savingsRate = monthlySummary.income > 0 ? 
      ((monthlySummary.income - monthlySummary.expenses) / monthlySummary.income * 100) : 0
    
    // Daily average spending
    const dailyAvgSpending = monthlySummary.expenses / 30
    
    // Find spending trends
    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.debit, 0)
    const spendingDistribution = expenseCategories.map(cat => ({
      ...cat,
      percentage: (cat.debit / totalExpenses * 100).toFixed(1)
    })).sort((a, b) => b.debit - a.debit)

    return {
      highestSpending,
      highestIncome,
      savingsRate,
      dailyAvgSpending,
      spendingDistribution,
      isHealthy: savingsRate >= 20,
      totalExpenses,
      totalIncome: monthlySummary.income
    }
  }, [categoryData, monthlySummary])

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{entry.name}:</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-all duration-300">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Reports</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive insights into your spending patterns and financial health
              </p>
            </div>
          </div>
        </div>

        {/* Financial Health Score */}
        {insights && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Financial Health Score</h2>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  insights.isHealthy 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {insights.isHealthy ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span className="font-medium">{insights.isHealthy ? 'Healthy' : 'Needs Attention'}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {insights.savingsRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {insights.savingsRate >= 20 ? 'Excellent!' : insights.savingsRate >= 10 ? 'Good' : 'Improve'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formatCurrency(insights.dailyAvgSpending)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Daily Average</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Spending</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {monthlySummary?.transactionCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">This month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                    {insights.spendingDistribution.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Summary Cards */}
        {monthlySummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(monthlySummary.income)}
                  </div>
                </div>
              </div>
              {insights && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Top source: <span className="font-medium text-gray-900 dark:text-white">{insights.highestIncome.name}</span>
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                    {formatCurrency(insights.highestIncome.credit)}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(monthlySummary.expenses)}
                  </div>
                </div>
              </div>
              {insights && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Highest: <span className="font-medium text-gray-900 dark:text-white">{insights.highestSpending.name}</span>
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    {formatCurrency(insights.highestSpending.debit)}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  monthlySummary.net >= 0 
                    ? 'bg-blue-100 dark:bg-blue-900/30' 
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  <DollarSign className={`w-6 h-6 ${
                    monthlySummary.net >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`} />
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Income</div>
                  <div className={`text-2xl font-bold ${
                    monthlySummary.net >= 0 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {formatCurrency(monthlySummary.net)}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {monthlySummary.net >= 0 ? 'Saving' : 'Deficit'}: 
                  <span className={`font-medium ml-1 ${
                    monthlySummary.net >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {insights ? `${insights.savingsRate.toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights Section */}
        {insights && (
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Smart Insights & Recommendations
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spending Analysis */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">💸 Where Your Money Goes</h3>
                  <div className="space-y-3">
                    {insights.spendingDistribution.slice(0, 4).map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: COLORS[index] }}
                          ></div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {formatCurrency(category.debit)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {category.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">💡 Recommendations</h3>
                  <div className="space-y-3">
                    {insights.savingsRate < 10 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                              Increase Your Savings Rate
                            </div>
                            <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                              Aim for at least 20% savings rate. Consider reducing {insights.highestSpending.name} expenses.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {insights.dailyAvgSpending > 1000 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <TrendingDown className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Track Daily Spending
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              Your daily average is {formatCurrency(insights.dailyAvgSpending)}. Set daily limits to control spending.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {insights.isHealthy && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-green-800 dark:text-green-200">
                              Great Job!
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                              You&apos;re maintaining a healthy savings rate. Consider investing your surplus.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Spending by Category
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'currentColor' }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'currentColor' }}
                  className="text-gray-600 dark:text-gray-400"
                  tickFormatter={(value) => {
                    if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`
                    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
                    return `₹${value}`
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="debit" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
                <Bar dataKey="credit" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Expense Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.filter(cat => cat.debit > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="debit"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Daily Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Daily Spending Trend (Last 30 Days)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={dailyTrend}>
              <defs>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'currentColor' }}
                className="text-gray-600 dark:text-gray-400"
                tickFormatter={(value) => {
                  if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`
                  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`
                  return `₹${value}`
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="debit" 
                stroke="#EF4444" 
                fillOpacity={1} 
                fill="url(#expenseGradient)" 
                name="Expenses"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="credit" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#incomeGradient)" 
                name="Income"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}