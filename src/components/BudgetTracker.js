import { useState, useEffect } from 'react'
import { formatCurrency } from '../lib/utils'

const categoryColors = {
  'Food & Dining': {
    from: 'from-blue-50',
    to: 'to-indigo-50',
    border: 'border-blue-200',
    darkFrom: 'dark:from-blue-900/20',
    darkTo: 'dark:to-indigo-900/20',
    darkBorder: 'dark:border-blue-800',
    bgBar: 'bg-blue-200',
    darkBgBar: 'dark:bg-blue-800',
    fillBar: 'bg-blue-600',
    text: 'text-blue-800',
    darkText: 'dark:text-blue-300',
    textAmount: 'text-blue-600',
    darkTextAmount: 'dark:text-blue-400',
  },
  Transportation: {
    from: 'from-green-50',
    to: 'to-emerald-50',
    border: 'border-green-200',
    darkFrom: 'dark:from-green-900/20',
    darkTo: 'dark:to-emerald-900/20',
    darkBorder: 'dark:border-green-800',
    bgBar: 'bg-green-200',
    darkBgBar: 'dark:bg-green-800',
    fillBar: 'bg-green-600',
    text: 'text-green-800',
    darkText: 'dark:text-green-300',
    textAmount: 'text-green-600',
    darkTextAmount: 'dark:text-green-400',
  },
  default: {
    from: 'from-gray-50',
    to: 'to-gray-100',
    border: 'border-gray-200',
    darkFrom: 'dark:from-gray-800/20',
    darkTo: 'dark:to-gray-700/20',
    darkBorder: 'dark:border-gray-600',
    bgBar: 'bg-gray-300',
    darkBgBar: 'dark:bg-gray-700',
    fillBar: 'bg-gray-500',
    text: 'text-gray-800',
    darkText: 'dark:text-gray-300',
    textAmount: 'text-gray-600',
    darkTextAmount: 'dark:text-gray-400',
  },
}

export default function BudgetTracker() {
  const [budgets, setBudgets] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly',
  })

  useEffect(() => {
    fetchBudgets()
  }, []);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets')
      const data = await res.json()
      setBudgets(data)
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBudget),
      })

      if (res.ok) {
        setNewBudget({ category: '', amount: '', period: 'monthly' })
        setShowForm(false)
        fetchBudgets()
      }
    } catch (error) {
      console.error('Failed to create budget:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2 dark:text-gray-200 dark:text-gray-200">
        <h2 className="text-lg font-semibold">Budget Tracker</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-600"
        >
          {showForm ? 'Cancel' : '+ Add Budget'}
        </button>
      </div>

      {showForm && (
        <div className="p-4 border rounded-xl bg-gray-50 dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Category"
              value={newBudget.category}
              onChange={(e) => setNewBudget((prev) => ({ ...prev, category: e.target.value }))}
              className="flex-1 p-2 border rounded-md text-sm"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={newBudget.amount}
              onChange={(e) => setNewBudget((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-32 p-2 border rounded-md text-sm"
              required
            />
            <select
              value={newBudget.period}
              onChange={(e) => setNewBudget((prev) => ({ ...prev, period: e.target.value }))}
              className="w-28 p-2 border rounded-md text-sm"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {budgets.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No budgets set yet</p>
      ) : (
        budgets.map((budget) => {
          const percentage = Math.min((budget.spent / budget.amount) * 100, 100)
          const isOverBudget = budget.spent > budget.amount
          const colors = categoryColors[budget.category] || categoryColors.default

          return (
            <div
              key={budget.id}
              className={`p-4 bg-gradient-to-r ${colors.from} ${colors.to} ${colors.darkFrom} ${colors.darkTo} rounded-xl border ${colors.border} ${colors.darkBorder}`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${colors.text} ${colors.darkText}`}>
                  {budget.category}
                </span>
                <span className={`text-sm ${colors.textAmount} ${colors.darkTextAmount}`}>
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              <div className={`w-full ${colors.bgBar} ${colors.darkBgBar} rounded-full h-2`}>
                <div
                  className={`${colors.fillBar} h-2 rounded-full`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {percentage.toFixed(1)}% used
                {isOverBudget && (
                  <span className="text-red-600 ml-2">
                    Over by {formatCurrency(budget.spent - budget.amount)}
                  </span>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
