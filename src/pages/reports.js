import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { formatCurrency } from '../lib/utils'
import Link from 'next/link'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function Reports() {
  const [monthlySummary, setMonthlySummary] = useState(null)
  const [categoryData, setCategoryData] = useState([])
  const [dailyTrend, setDailyTrend] = useState([])
  
  useEffect(() => {
    fetchReports()
  }, [])
  
  const fetchReports = async () => {
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
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Reports</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</Link>
        </div>
        
        {/* Monthly Summary Cards */}
        {monthlySummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Income</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(monthlySummary.income)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(monthlySummary.expenses)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Net Income</div>
              <div className={`text-2xl font-bold ${
                monthlySummary.net >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(monthlySummary.net)}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm font-medium text-gray-500">Transactions</div>
              <div className="text-2xl font-bold text-blue-600">
                {monthlySummary.transactionCount}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="debit" fill="#EF4444" name="Expenses" />
                <Bar dataKey="credit" fill="#10B981" name="Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Category Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-4">Expense Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData.filter(cat => cat.debit > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="debit"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Daily Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Daily Spending Trend (Last 30 Days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="debit" stroke="#EF4444" name="Expenses" />
              <Line type="monotone" dataKey="credit" stroke="#10B981" name="Income" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
