import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import FilterBar from "../components/FilterBar";
import BudgetTracker from "../components/BudgetTracker";
import BalanceChart from "../components/BalanceChart";
import DashboardHeader from "../components/DashboardHeader";
import StatsCards from "../components/StatsCards";
import QuickActions from "../components/QuickActions";

const TRANSACTION_TYPE = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
};

export default function Dashboard() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({});
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Enhanced pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [paginationLoading, setPaginationLoading] = useState(false); // Separate loading for pagination

  // Live dashboard states
  const [newlyAddedId, setNewlyAddedId] = useState(null); // Track newly added transaction
  const [recentlyUpdatedId, setRecentlyUpdatedId] = useState(null); // Track recently updated
  const [liveStats, setLiveStats] = useState({
    todayExpenses: 0,
    weekExpenses: 0,
    monthExpenses: 0
  });

  useEffect(() => {
    fetchData();
  }, []); // Only fetch on initial load

  // Separate effect for pagination changes
  useEffect(() => {
    if (currentPage > 1 || itemsPerPage !== 5) { // Skip initial load
      fetchTransactionsOnly();
    }
  }, [currentPage, itemsPerPage]);

  // Separate effect for filter changes
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      setCurrentPage(1); // Reset to first page when filters change
      fetchTransactionsOnly();
    }
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch("/api/balance"),
        fetchTransactionsData(), // Use helper function
      ]);

      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes;

      setBalance(balanceData);
      setTransactions(transactionsData.data || transactionsData.transactions || []);
      setTotalCount(transactionsData.total || transactionsData.count || 0);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(
          (transactionsData.data || transactionsData.transactions || [])
            .map((t) => t.category)
            .filter(Boolean)
        ),
      ];
      setCategories(uniqueCategories);

      // For balance history and live stats, we need all transactions - separate API call
      const allTransactionsRes = await fetch("/api/transactions?all=true");
      const allTransactionsData = await allTransactionsRes.json();
      generateBalanceHistory(allTransactionsData.data || allTransactionsData.transactions || [], balanceData.amount);
      calculateLiveStats(allTransactionsData.data || allTransactionsData.transactions || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Separate function to fetch only transactions (for pagination/filtering)
  const fetchTransactionsOnly = async () => {
    setPaginationLoading(true);
    try {
      const transactionsData = await fetchTransactionsData();
      setTransactions(transactionsData.data || transactionsData.transactions || []);
      setTotalCount(transactionsData.total || transactionsData.count || 0);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setPaginationLoading(false);
    }
  };

  // Helper function to build transaction API call
  const fetchTransactionsData = async () => {
    const queryParams = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      recent: '20', // Only get recent 20 transactions
      ...filters
    });

    const response = await fetch(`/api/transactions?${queryParams}`);
    return await response.json();
  };

  const calculateLiveStats = (transactionData) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const expenses = transactionData.filter(t => t.type === 'DEBIT');
    
    const todayExpenses = expenses
      .filter(t => {
        const txDate = new Date(t.date);
        return txDate.toDateString() === today.toDateString();
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    const weekExpenses = expenses
      .filter(t => new Date(t.date) >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthExpenses = expenses
      .filter(t => new Date(t.date) >= monthAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    setLiveStats({ todayExpenses, weekExpenses, monthExpenses });
  };

  const generateBalanceHistory = (transactions, currentBalance) => {
    // Sort transactions by date ascending (oldest first)
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Prepare a map of dateStr => transactions for that date
    const txByDate = {};
    sortedTransactions.forEach((t) => {
      const dateStr = t.date.split("T")[0];
      if (!txByDate[dateStr]) txByDate[dateStr] = [];
      txByDate[dateStr].push(t);
    });

    // Get the last 30 days (oldest to newest)
    const today = new Date();
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }

    // Calculate starting balance 30 days ago
    let startBalance = currentBalance;
    days
      .slice()
      .reverse()
      .forEach((dateStr) => {
        const txs = txByDate[dateStr] || [];
        txs.forEach((t) => {
          if (t.type === TRANSACTION_TYPE.CREDIT) startBalance -= t.amount;
          else startBalance += t.amount;
        });
      });

    // Now walk forward, applying each day's transactions
    let runningBalance = startBalance;
    const last30Days = [];
    days.forEach((dateStr) => {
      const txs = txByDate[dateStr] || [];
      txs.forEach((t) => {
        if (t.type === TRANSACTION_TYPE.CREDIT) runningBalance += t.amount;
        else runningBalance -= t.amount;
      });
      last30Days.push({ date: dateStr, balance: runningBalance });
    });

    setBalanceHistory(last30Days);
  };

  // Recent transactions for live feed (from current page)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [transactions]);

  // Clear newly added highlight after 10 seconds
  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => {
        setNewlyAddedId(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [newlyAddedId]);

  // Clear recently updated highlight after 8 seconds
  useEffect(() => {
    if (recentlyUpdatedId) {
      const timer = setTimeout(() => {
        setRecentlyUpdatedId(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [recentlyUpdatedId]);

  // Calculate income and expenses stats based on current page
  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses };
  }, [transactions]);

  // Handle items per page change without full page reload
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    // fetchTransactionsOnly will be called by useEffect
  };

  // Handle transaction submit with highlighting
  const handleTransactionSubmit = async (newTransaction) => {
    setShowForm(false);
    
    // If it's a new transaction, set the newly added ID
    if (newTransaction && newTransaction.id) {
      setNewlyAddedId(newTransaction.id);
    }
    
    await fetchData();
  };

  // Handle transaction update with highlighting
  const handleTransactionUpdate = async (updatedTransaction) => {
    if (updatedTransaction && updatedTransaction.id) {
      setRecentlyUpdatedId(updatedTransaction.id);
    }
    
    await fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400"></div>
            <div className="w-6 h-6 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium">
            Loading your financial data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-all duration-300">
      {/* Modern Header with Glass Effect */}
      <DashboardHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Takes 3 columns on large screens */}
          <div className="lg:col-span-3 space-y-8">
            {/* Filter Bar */}
            <FilterBar filters={filters} setFilters={setFilters} categories={categories} />

            {/* Stats Cards with Live Data */}
            <StatsCards 
              balance={balance} 
              stats={stats} 
              liveStats={liveStats}
              filters={filters} 
              setFilters={setFilters}
            />

            {/* Quick Actions */}
            <QuickActions onAddTransaction={() => setShowForm(true)} />

            {/* Transaction List */}
            <div id="transaction-list" className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Recent Transactions
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Latest {Math.min(totalCount, 20)} of {totalCount} total transactions
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  {/* Items per page selector (limited) */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                    
                    {/* View All Transactions Link */}
                    <Link href="/transactions">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        View All
                      </div>
                    </Link>
                  </div>
                  
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={() => setShowForm(true)}
                  >
                    + Add Transaction
                  </button>
                </div>
              </div>

              {/* Enhanced Transaction List with separate loading */}
              <TransactionList
                transactions={transactions}
                onChange={handleTransactionSubmit}
                onUpdate={handleTransactionUpdate}
                currentHighlight={-1}
                recentTransactions={recentTransactions}
                newlyAddedId={newlyAddedId}
                recentlyUpdatedId={recentlyUpdatedId}
                loading={paginationLoading} // Pass pagination loading state
              />
            </div>

            {/* Enhanced Chart Container - Remove duplicate header since BalanceChart has its own */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <BalanceChart 
                data={balanceHistory} 
                currentBalance={balance?.amount}
              />
            </div>
              

            {/* Transaction Form Modal (Add) */}
            {showForm && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
                  <TransactionForm
                    categories={categories}
                    onSubmit={handleTransactionSubmit}
                    onClose={() => setShowForm(false)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Now takes only 1 column */}
          <div className="space-y-8">
            {/* Budget Tracker */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Budget Tracker
                </h2>
              </div>
              <BudgetTracker onChange={fetchData} />
            </div>

            {/* Quick Insights Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                💡 Quick Insights
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-300">Today&apos;s Expenses</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    ₹{liveStats.todayExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-300">This Week</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    ₹{liveStats.weekExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700 dark:text-blue-300">This Month</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    ₹{liveStats.monthExpenses.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}