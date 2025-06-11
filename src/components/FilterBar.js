import { useState } from 'react';
import { ChevronDown, Download, FileText, TrendingUp, Filter, Calendar, Tag, Search, XCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link'; // Assuming Next.js Link component for navigation

export default function FilterBar({ filters, setFilters, categories }) {
  const [collapsed, setCollapsed] = useState(true);

  // Export logic for CSV and JSON
  const handleExport = async (format = 'csv') => {
    try {
      // API call to export transactions based on current filters (optional but good for context)
      // You might want to pass current `filters` to the export API here for filtered exports
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`/api/export?format=${format}&${queryParams}`);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a); // Append to body to make it clickable in some browsers
        a.click();
        a.remove(); // Clean up
        window.URL.revokeObjectURL(url);
      } else { // format === 'json'
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); // Append to body
        a.click();
        a.remove(); // Clean up
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleFilterChange = (e, key, value) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setFilters(prevFilters => ({ ...prevFilters, [key]: value }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateFrom: '',
      dateTo: '',
      category: '',
      type: '',
      search: ''
    };
    setFilters(clearedFilters);
    // It makes sense to collapse the filter bar after clearing, for a cleaner UI
    setCollapsed(true);
  };

  const clearAllFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      category: '',
      type: '',
      search: ''
    });
  };

  // Check if any filter is active, using filters.search for the text input
  const hasFilters =
    filters?.dateFrom ||
    filters?.dateTo ||
    filters?.category ||
    filters?.type ||
    filters?.search;

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300">

      <div className="flex justify-between items-center w-full mb-2 gap-4 flex-wrap">
        <div className="flex justify-start"> {/* Align toggle to the left */}
          <button
            type="button"
            onClick={() => setCollapsed(c => !c)}
            aria-expanded={!collapsed}
            aria-controls="filter-bar-form"
            className="flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <span>{collapsed ? 'Show Filters' : 'Hide Filters'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}
            />
          </button>
        </div>
        
        {/* Export and Reports Buttons */}
        <div className="flex justify-end items-center gap-3">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>
          <Link href="/reports" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            <span className="hidden sm:inline">Go to Reports</span>
            <span className="sm:hidden">Reports</span>
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      </div>


      <div
        id="filter-bar-form"
        className={`transition-all duration-500 ease-in-out overflow-hidden ${collapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'mt-4 max-h-[1000px] opacity-100'}`}
      >
        <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" onSubmit={e => e.preventDefault()}>
          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">From Date</label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange(e, 'dateFrom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">To Date</label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo || ''} // Ensure value is controlled even if empty
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">Category</label>
            <select
              id="category"
              value={filters.category || ''} // Ensure value is controlled even if empty
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
            <label htmlFor="type" className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">Type</label>
            <select
              id="type"
              value={filters.type || ''} // Ensure value is controlled even if empty
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
            <label htmlFor="search" className="block mb-1 text-xs font-medium text-gray-700 dark:text-gray-100">Search</label>
            <input
              type="text"
              id="search"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange(e, 'search', e.target.value)}
              placeholder="Search description..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Clear Filters Button */}
          <div className="sm:col-span-2 lg:col-span-2 flex justify-end items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Applied Filters Display - Enhanced Visuals */}
      {hasFilters && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-200 dark:border-blue-800 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-800 dark:text-blue-200">
              <Filter className="w-5 h-5" />
              Applied Filters
            </h3>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <XCircle className="w-4 h-4" />
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {filters.dateFrom && (
              <span className="flex items-center gap-1 bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-3 py-1 rounded-full font-medium">
                <Calendar className="w-3 h-3" /> From: {filters.dateFrom}
              </span>
            )}
            {filters.dateTo && (
              <span className="flex items-center gap-1 bg-blue-200 dark:bg-blue-700 text-blue-900 dark:text-blue-100 px-3 py-1 rounded-full font-medium">
                <Calendar className="w-3 h-3" /> To: {filters.dateTo}
              </span>
            )}
            {filters.category && (
              <span className="flex items-center gap-1 bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 px-3 py-1 rounded-full font-medium">
                <Tag className="w-3 h-3" /> Category: {filters.category}
              </span>
            )}
            {filters.type && (
              <span className="flex items-center gap-1 bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100 px-3 py-1 rounded-full font-medium">
                {filters.type === 'CREDIT' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} Type: {filters.type}
              </span>
            )}
            {filters.search && (
              <span className="flex items-center gap-1 bg-yellow-200 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-100 px-3 py-1 rounded-full font-medium">
                <Search className="w-3 h-3" /> Search: &quot;{filters.search}&quot;
              </span>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
