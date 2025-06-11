import { IndianRupee, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "../lib/utils";

export default function StatsCards({ balance, stats}) {

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        {/* Balance Card */}
        <div className="md:col-span-1 group">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <IndianRupee className="p-1 w-8 h-8 text-white/80" />
                <div className="text-sm text-white/80 font-medium">
                  Current Balance
                </div>
              </div>
              <div className="text-4xl font-bold mb-2">
                {formatCurrency(balance?.amount)}
              </div>
              <div className="text-white/80">Available funds</div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full"></div>
          </div>
        </div>

        {/* Income Card */}
        <div className="group">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(stats.income)}
            </div>
            <div className="text-green-600 dark:text-green-400 font-medium">
              Income
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="group">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(stats.expenses)}
            </div>
            <div className="text-red-600 dark:text-red-400 font-medium">
              Expenses
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
