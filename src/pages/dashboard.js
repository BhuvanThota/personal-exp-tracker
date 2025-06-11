import { useState, useEffect, useMemo } from "react";

import TransactionForm from "../components/TransactionForm";
import TransactionList from "../components/TransactionList";
import FilterBar from "../components/FilterBar";
import BudgetTracker from "../components/BudgetTracker";
import BalanceChart from "../components/BalanceChart";
import DashboardHeader from "../components/DashboardHeader";
import StatsCards from "../components/StatsCards";

const TRANSACTION_TYPE = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
};

export default function Home() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({});
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  // Local pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch("/api/balance"),
        fetch("/api/transactions"),
      ]);

      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes.json();

      setBalance(balanceData);
      setTransactions(transactionsData.data);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(
          transactionsData.data.map((t) => t.category).filter(Boolean)
        ),
      ];
      setCategories(uniqueCategories);

      // Generate balance history (simplified - last 30 days)
      generateBalanceHistory(transactionsData.data, balanceData.amount);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
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

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (t) => new Date(t.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(
        (t) => new Date(t.date) <= new Date(filters.dateTo)
      );
    }
    if (filters.category) {
      filtered = filtered.filter((t) => t.category === filters.category);
    }
    if (filters.type) {
      filtered = filtered.filter(
        (t) =>
          t.type === TRANSACTION_TYPE[filters.type] || t.type === filters.type
      );
    }
    if (filters.search) {
      filtered = filtered.filter((t) =>
        t.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    return filtered;

  }, [transactions, filters]);

  // Compute total pages for local pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

   // Calculate income and expenses stats based on filtered transactions
   const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "CREDIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === "DEBIT")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses };
  }, [filteredTransactions]);

  // Reset page when filters or transactions change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, transactions]);

  const handleTransactionSubmit = () => {
    setShowForm(false);
    fetchData();
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Filter Bar */}
            <FilterBar filters={filters} setFilters={setFilters} categories={categories} />

            {/* Stats Cards */}
            <StatsCards balance={balance} stats={stats} filters={filters} setFilters={setFilters}/>

            {/* Transaction List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Transactions
                </h2>
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  onClick={() => setShowForm(true)}
                >
                  + Add
                </button>
              </div>
              <TransactionList
                transactions={paginatedTransactions}
                onChange={handleTransactionSubmit}
              />
              {/* Local Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  {/* First Page Button */}
                  <button
                    className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-white disabled:opacity-50"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    &laquo;
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 1 && page <= currentPage + 1)
                        return true;
                      return false;
                    })
                    .map((page, index, arr) => {
                      const prev = arr[index - 1];
                      const showEllipsis = prev && page - prev > 1;

                      return (
                        <div key={page}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-500 dark:text-gray-300">
                              ...
                            </span>
                          )}
                          <button
                            className={`px-3 py-2 text-sm rounded ${
                              page === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-white"
                            }`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}

                  {/* Last Page Button */}
                  <button
                    className="px-3 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200 dark:text-white dark:bg-white disabled:opacity-50"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    &raquo;
                  </button>
                </div>
              )}
            </div>

            {/* Transaction Form Modal (Add) */}
            {showForm && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                  <TransactionForm
                    categories={categories}
                    onSubmit={handleTransactionSubmit}
                    onClose={() => setShowForm(false)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Balance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2 dark:text-gray-200">
                Balance Trend (30 days)
              </h2>
              <BalanceChart data={balanceHistory} />
            </div>

            {/* Budget Tracker */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-2 dark:text-gray-200">
                Budgets
              </h2>
              <BudgetTracker onChange={fetchData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
