import { DollarSign, TrendingUp, Target, BarChart3, Plus, Download, Settings, PieChart } from 'lucide-react';
import Link from 'next/link';

export default function QuickActions({ onAddTransaction }) {
  const handleExport = async () => {
    try {
      const response = await fetch('/api/export?format=csv');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
        <div className="flex items-center text-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs font-medium">READY</span>
        </div>
      </div>
      
      {/* Primary Actions - Optimized for sidebar width */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Add Transaction */}
        <button 
          onClick={onAddTransaction}
          className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:scale-105"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 group-hover:text-blue-900 dark:group-hover:text-blue-200 text-center">Add Transaction</span>
        </button>

        {/* View Reports */}
        <Link href="/reports">
          <div className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-200 border border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg hover:scale-105 cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-green-800 dark:text-green-300 group-hover:text-green-900 dark:group-hover:text-green-200 text-center">View Reports</span>
          </div>
        </Link>

        {/* Set Budget */}
        <button className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200 border border-purple-200/50 dark:border-purple-800/50 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg hover:scale-105">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <Target className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 group-hover:text-purple-900 dark:group-hover:text-purple-200 text-center">Set Budget</span>
        </button>

        {/* Export Data */}
        <button 
          onClick={handleExport}
          className="group flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl hover:from-orange-100 hover:to-red-100 dark:hover:from-orange-900/30 dark:hover:to-red-900/30 transition-all duration-200 border border-orange-200/50 dark:border-orange-800/50 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-lg hover:scale-105"
        >
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200 shadow-lg">
            <Download className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-orange-800 dark:text-orange-300 group-hover:text-orange-900 dark:group-hover:text-orange-200 text-center">Export Data</span>
        </button>
      </div>

      {/* Secondary Actions - More compact for sidebar */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Link href="/analytics">
            <div className="group flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">Analytics</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Detailed insights</div>
              </div>
            </div>
          </Link>

          <Link href="/categories">
            <div className="group flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <PieChart className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">Categories</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Manage tags</div>
              </div>
            </div>
          </Link>

          <Link href="/settings">
            <div className="group flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">Settings</span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Preferences</div>
              </div>
            </div>
          </Link>

          <button 
            onClick={onAddTransaction}
            className="group flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 w-full"
          >
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
              <DollarSign className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">Quick Add</span>
              <div className="text-xs text-gray-500 dark:text-gray-400">Fast entry</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}