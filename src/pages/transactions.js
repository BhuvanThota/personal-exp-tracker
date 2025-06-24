import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG-Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import Link from "next/link";
import { 
  ArrowLeft, 
  Download, 
  Search, 
  RefreshCw, 
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Eye
} from "lucide-react";

import DashboardHeader from "../components/DashboardHeader";
import TransactionForm from "../components/TransactionForm";
import { formatCurrency } from "../lib/utils";

export default function AllTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    type: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [viewTx, setViewTx] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Categories for filter dropdown
  const [categories, setCategories] = useState([]);

  // Simple, clean cell renderers
  const DateCellRenderer = (params) => {
    if (!params.value) return '';
    return new Date(params.value).toLocaleDateString();
  };

  const AmountCellRenderer = (params) => {
    if (!params.value) return '';
    const isCredit = params.data.type === 'CREDIT';
    return (
      <span className={`font-semibold ${
        isCredit 
          ? 'text-green-600' 
          : 'text-red-600'
      }`}>
        {isCredit ? '+' : '-'}{formatCurrency(params.value)}
      </span>
    );
  };

  const TypeCellRenderer = (params) => {
    const isCredit = params.value === 'CREDIT';
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${
        isCredit 
          ? 'bg-green-900 text-green-200' 
          : 'bg-red-900 text-red-200'
      }`}>
        {isCredit ? 'Income' : 'Expense'}
      </span>
    );
  };

  const CategoryCellRenderer = (params) => {
    if (!params.value) return 'N/A';
    return (
      <span className="px-2 py-1 text-xs bg-blue-900 text-blue-200 rounded">
        {params.value}
      </span>
    );
  };

  const ActionsCellRenderer = (params) => {
    return (
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => handleView(params.data)}
          className="text-blue-400 hover:text-blue-300"
          title="View"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(params.data)}
          className="text-green-400 hover:text-green-300"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDeleteClick(params.data)}
          className="text-red-400 hover:text-red-300"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Clean AG-Grid column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'date',
      headerName: 'Date',
      width: 150,
      cellRenderer: DateCellRenderer,
      sortable: true,
      filter: true,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 200,
      sortable: true,
      filter: true,
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 140,
      cellRenderer: CategoryCellRenderer,
      sortable: true,
      filter: true,
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 120,
      cellRenderer: TypeCellRenderer,
      sortable: true,
      filter: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 160,
      cellRenderer: AmountCellRenderer,
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Actions',
      width: 130,
      cellRenderer: ActionsCellRenderer,
      sortable: false,
      filter: false,
      pinned: 'right',
    }
  ], []);

  // AG-Grid default column properties
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  // Action handlers
  function handleEdit(transaction) {
    setEditTx(transaction);
    setShowForm(true);
  }

  function handleDeleteClick(transaction) {
    setDeleteCandidate(transaction);
    setShowDeleteModal(true);
  }

  function handleView(transaction) {
    setViewTx(transaction);
    setShowViewModal(true);
  }

  // Fetch functions
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions?all=true');
      const data = await response.json();
      const uniqueCategories = [...new Set(
        (data.data || [])
          .map(t => t.category)
          .filter(Boolean)
      )];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
      });

      const response = await fetch(`/api/transactions?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched transactions:', data); // Debug log

      setTransactions(data.data || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Effects
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async () => {
    if (!deleteCandidate) return;

    try {
      const response = await fetch(`/api/transactions/${deleteCandidate.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      setShowDeleteModal(false);
      setDeleteCandidate(null);
      await fetchTransactions();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const handleFormSubmit = async () => {
    try {
      setShowForm(false);
      setEditTx(null);
      await fetchTransactions();
      await fetchCategories();
    } catch (error) {
      console.error('Form submit failed:', error);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const queryParams = new URLSearchParams({
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
      });

      const response = await fetch(`/api/export?${queryParams}`);
      
      if (!response.ok) throw new Error('Export failed');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Page change handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: '',
      type: '',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  }, []);

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <DashboardHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Transactions</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete transaction history with advanced filtering and search
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="CREDIT">Income</option>
                <option value="DEBIT">Expense</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </button>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">From:</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">To:</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Table Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Transaction History
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {totalCount} total transactions found
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* AG-Grid Table */}
          <div className="h-[600px] w-full">
            <div className="ag-theme-alpine-dark h-full w-full">
              <AgGridReact
                rowData={transactions}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={false}
                loading={loading}
                animateRows={true}
                rowHeight={60}
                headerHeight={50}
                suppressLoadingOverlay={false}
                getRowStyle={(params) => {
                  if (params.data.type === 'CREDIT') {
                    return { backgroundColor: 'hsla(120, 44.60%, 78.00%, 0.61)', fontWeight: 'semi-bold' };
                  }
                  return null;
                }}
              />
            </div>
          </div>

          {/* Manual Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} transactions
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-auto">
            <TransactionForm
              initialData={editTx}
              categories={categories}
              onSubmit={handleFormSubmit}
              onClose={() => {
                setShowForm(false);
                setEditTx(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteCandidate && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Delete Transaction
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-4">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {deleteCandidate.description}
                </div>
                <div className={`font-semibold ${
                  deleteCandidate.type === 'CREDIT' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {deleteCandidate.type === 'CREDIT' ? '+' : '-'}
                  {formatCurrency(deleteCandidate.amount)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {deleteCandidate.category} • {new Date(deleteCandidate.date).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteCandidate(null);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
              >
                Delete Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction Modal */}
      {showViewModal && viewTx && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Transaction Details
                </h3>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewTx(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    viewTx.type === 'CREDIT'
                      ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40'
                      : 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40'
                  }`}>
                    {viewTx.type === 'CREDIT' ? (
                      <ArrowUpRight className="w-8 h-8 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-8 h-8 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    viewTx.type === 'CREDIT' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {viewTx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(viewTx.amount)}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {viewTx.description}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {viewTx.type === 'CREDIT' ? 'Income' : 'Expense'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {viewTx.category || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date
                    </label>
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(viewTx.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewTx(null);
                      handleEdit(viewTx);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Edit Transaction
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setViewTx(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}