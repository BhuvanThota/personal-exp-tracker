import { useState } from 'react'
import { ChevronDown, Download, FileText, TrendingUp } from 'lucide-react'

export default function FilterBar({ onFilter, categories }) {
  // Export logic for CSV and JSON
  const handleExport = async (format = 'csv') => {
    try {
      const response = await fetch(`/api/export?format=${format}`)
      if (format === 'csv') {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'transactions.csv'
        a.click()
        window.URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'transactions.json'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }
  const [collapsed, setCollapsed] = useState(true)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: '',
    type: '',
    search: ''
  })

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      category: '',
      type: '',
      search: ''
    }
    setFilters(clearedFilters)
    onFilter(clearedFilters)
  }

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow rounded-2xl border">

      <div className="flex justify-between items-center w-full mb-2 gap-4 flex-wrap">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-expanded={!collapsed}
            aria-controls="filter-bar-form"
            className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800"
          >
            <span>{collapsed ? 'Show Filters' : 'Hide Filters'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
            />
          </button>
        </div>
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Download className="w-4 h-4" />
            <span className="sm:inline">CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <FileText className="w-4 h-4" />
            <span className="sm:inline">JSON</span>
          </button>
          <a href="/reports" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
            Reports
            <TrendingUp className="w-4 h-4" />
          </a>
        </div>
      </div>


      <div
        id="filter-bar-form"
        className={`transition-all duration-500 ease-in-out overflow-hidden ${collapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'mt-4 max-h-[1000px] opacity-100'}`}
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            >
              <option value="">All Types</option>
              <option value="CREDIT">Income</option>
              <option value="DEBIT">Expense</option>
            </select>
          </div>

          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search description..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Apply & Clear Buttons */}
          <div className="sm:col-span-2 lg:col-span-2 flex gap-2 items-end">
            <button
              type="button"
              onClick={() => {
                onFilter(filters);
                window.location.reload();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
