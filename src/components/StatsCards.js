import { useState, useEffect } from "react";
import { IndianRupee, ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, Activity } from "lucide-react";

const AnimatedCounter = ({ value, prefix = '₹', duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = value;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span>{prefix}{displayValue.toLocaleString()}</span>;
};

export default function StatsCards({ balance, stats, liveStats = {} }) {
  const [pulseEffect, setPulseEffect] = useState(false);

  // Create pulse effect for live updates
  useEffect(() => {
    if (liveStats.todayExpenses > 0) {
      setPulseEffect(true);
      const timer = setTimeout(() => setPulseEffect(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [liveStats.todayExpenses]);

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="md:col-span-1 group">
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-2xl shadow-xl p-6 lg:p-8 text-white relative overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <IndianRupee className="p-1 w-8 h-8 text-white/80" />
                <div className="text-sm text-white/80 font-medium">
                  Current Balance
                </div>
              </div>
              <div className="text-3xl lg:text-4xl font-bold mb-2">
                <AnimatedCounter value={balance?.amount || 0} />
              </div>
              <div className="text-white/80">Available funds</div>
              <div className="flex items-center text-white/60 text-xs mt-2">
                <Activity className="w-3 h-3 mr-1" />
                Live sync active
              </div>
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
              <AnimatedCounter value={stats.income || 0} />
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
              <AnimatedCounter value={stats.expenses || 0} />
            </div>
            <div className="text-red-600 dark:text-red-400 font-medium">
              Expenses
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center ${pulseEffect ? 'animate-pulse' : ''}`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
              TODAY
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            <AnimatedCounter value={liveStats.todayExpenses || 0} />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Today&apos;s Spending</div>
          {pulseEffect && (
            <div className="text-xs mt-2 flex items-center text-red-500">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              Live update
            </div>
          )}
        </div>

        {/* Week Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              7 DAYS
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            <AnimatedCounter value={liveStats.weekExpenses || 0} />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
        </div>

        {/* Month Expenses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
              30 DAYS
            </span>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            <AnimatedCounter value={liveStats.monthExpenses || 0} />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
        </div>
      </div>
    </div>
  );
}