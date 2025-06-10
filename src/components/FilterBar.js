import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function FilterBar({ onFilter, categories }) {
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
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        aria-expanded={!collapsed}
        aria-controls="filter-bar-form"
        className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
      >
        <span>{collapsed ? 'Show Filters' : 'Hide Filters'}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
        />
      </button>

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

          {/* Clear Button */}
          <div className="sm:col-span-2 lg:col-span-1 flex items-end">
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
