import { useState } from 'react';
import { ChevronDown, Filter, Calendar, Tag, Search, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function FilterBar({ filters, setFilters, categories }) {
  const [collapsed, setCollapsed] = useState(true);

  const handleFilterChange = (key, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      type: '',
      search: ''
    });
    setCollapsed(true);
  };

  // Check if any filter is active
  const hasFilters =
    filters?.dateFrom ||
    filters?.dateTo ||
    filters?.category ||
    filters?.type ||
    filters?.search;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filter Transactions
          </h2>
        </div>
        
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
        >
          <span>{collapsed ? 'Show Filters' : 'Hide Filters'}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Filter Form */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          collapsed ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              From Date
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              To Date
            </label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Category
            </label>
            <select
              id="category"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Transaction Type
            </label>
            <select
              id="type"
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="CREDIT">Income</option>
              <option value="DEBIT">Expense</option>
            </select>
          </div>

          {/* Search */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="search" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Search Description
            </label>
            <input
              type="text"
              id="search"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Clear Button */}
          {hasFilters && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={clearAllFilters}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Applied Filters Display */}
      {hasFilters && (
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-200">
              <Filter className="w-4 h-4" />
              Active Filters
            </h3>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded-full text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors duration-200"
            >
              <XCircle className="w-3 h-3" />
              Clear
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.dateFrom && (
              <span className="flex items-center gap-1 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                <Calendar className="w-3 h-3" /> From: {filters.dateFrom}
              </span>
            )}
            {filters.dateTo && (
              <span className="flex items-center gap-1 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs font-medium">
                <Calendar className="w-3 h-3" /> To: {filters.dateTo}
              </span>
            )}
            {filters.category && (
              <span className="flex items-center gap-1 bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-100 px-2 py-1 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3" /> {filters.category}
              </span>
            )}
            {filters.type && (
              <span className="flex items-center gap-1 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-100 px-2 py-1 rounded-full text-xs font-medium">
                {filters.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} 
                {filters.type === 'CREDIT' ? 'Income' : 'Expense'}
              </span>
            )}
            {filters.search && (
              <span className="flex items-center gap-1 bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100 px-2 py-1 rounded-full text-xs font-medium">
                <Search className="w-3 h-3" /> &quot;{filters.search}&quot;
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}