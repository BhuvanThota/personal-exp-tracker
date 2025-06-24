import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2, Calendar, Tag, Activity, Sparkles, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import TransactionForm from './TransactionForm';

export default function TransactionList({ 
  transactions = [], 
  onChange, 
  onUpdate,
  currentHighlight = -1, 
  recentTransactions = [],
  newlyAddedId = null,
  recentlyUpdatedId = null,
  loading = false // Add loading prop
}) {
  const [editTx, setEditTx] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [deleteTx, setDeleteTx] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  const handleEditClick = (tx) => {
    setEditTx(tx);
    setShowEdit(true);
  };

  const handleDeleteClick = (tx) => {
    setDeleteTx(tx);
    setShowDelete(true);
  };

  const handleEditSave = async (updatedTx) => {
    try {
      const response = await fetch(`/api/transactions/${updatedTx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTx),
      });

      if (!response.ok) throw new Error('Failed to update transaction');

      setShowEdit(false);
      setEditTx(null);
      
      // Call onUpdate to trigger highlighting
      if (onUpdate) onUpdate(updatedTx);
      if (onChange) onChange();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const response = await fetch(`/api/transactions/${deleteTx.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete transaction');

      setShowDelete(false);
      setDeleteTx(null);
      if (onChange) onChange();
    } catch (err) {
      console.error(err);
    }
  };

  // Determine transaction highlight status
  const getTransactionHighlight = (transaction) => {
    if (newlyAddedId && transaction.id === newlyAddedId) {
      return 'newly-added';
    }
    if (recentlyUpdatedId && transaction.id === recentlyUpdatedId) {
      return 'recently-updated';
    }
    if (currentHighlight !== -1 && recentTransactions.length > 0) {
      const highlightedTx = recentTransactions[currentHighlight];
      if (highlightedTx && highlightedTx.id === transaction.id) {
        return 'cycling';
      }
    }
    return 'normal';
  };

  // Get highlight styles based on type
  const getHighlightStyles = (highlightType) => {
    switch (highlightType) {
      case 'newly-added':
        return {
          container: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-600 shadow-lg ring-2 ring-green-200 dark:ring-green-800 animate-pulse',
          indicator: 'bg-gradient-to-r from-green-500 to-emerald-500',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
        };
      case 'recently-updated':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-600 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800',
          indicator: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
        };
      case 'cycling':
        return {
          container: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-300 dark:border-purple-600 shadow-md ring-1 ring-purple-200 dark:ring-purple-800',
          indicator: 'bg-gradient-to-r from-purple-500 to-pink-500',
          badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
        };
      default:
        return {
          container: 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600',
          indicator: '',
          badge: ''
        };
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Income': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'Food & Dining': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      'Utilities': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      'Shopping': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      'Transportation': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
      'Veggies/Grocery': 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
      'Online': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
      'Rent': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Entertainment': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      'Health': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
      'Salary': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      'Bonus': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      'Refund': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      'Family': 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Loading overlay for pagination */}
      {loading && (
        <div className="relative">
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Loading...</span>
            </div>
          </div>
        </div>
      )}

      {transactions.map((tx, i) => {
        const highlightType = getTransactionHighlight(tx);
        const styles = getHighlightStyles(highlightType);
        const isHighlighted = highlightType !== 'normal';
        
        return (
          <div
            key={tx.id || i}
            className={`group relative rounded-2xl shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden ${styles.container}`}
          >
            {/* Highlight indicator bar */}
            {isHighlighted && (
              <div className={`absolute top-0 left-0 right-0 h-1 ${styles.indicator} ${highlightType === 'newly-added' ? 'animate-pulse' : ''}`}></div>
            )}

            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="p-4 space-y-3">
                {/* Header with icon and amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        tx.type === 'CREDIT'
                          ? isHighlighted 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-400 shadow-lg' 
                            : 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40'
                          : isHighlighted
                            ? 'bg-gradient-to-br from-red-400 to-rose-400 shadow-lg'
                            : 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? (
                        <ArrowUpRight className={`w-6 h-6 ${isHighlighted ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                      ) : (
                        <ArrowDownRight className={`w-6 h-6 ${isHighlighted ? 'text-white' : 'text-red-600 dark:text-red-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-base leading-tight truncate transition-colors duration-300 ${
                        isHighlighted ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
                      }`}>
                        {tx.description}
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-lg transition-colors duration-300 ${
                      tx.type === 'CREDIT'
                        ? isHighlighted ? 'text-green-700 dark:text-green-300' : 'text-green-600 dark:text-green-400'
                        : isHighlighted ? 'text-red-700 dark:text-red-300' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                </div>

                {/* Details with highlight badges */}
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tx.category)}`}>
                      {tx.category || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</span>
                  </div>
                  {/* Status badges */}
                  {highlightType === 'newly-added' && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                      <Sparkles className="w-3 h-3" />
                      NEW
                    </div>
                  )}
                  {highlightType === 'recently-updated' && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                      <Clock className="w-3 h-3" />
                      UPDATED
                    </div>
                  )}
                  {highlightType === 'cycling' && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                      <Activity className="w-3 h-3 animate-pulse" />
                      LIVE
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium"
                    onClick={() => handleEditClick(tx)}
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
                    onClick={() => handleDeleteClick(tx)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                      tx.type === 'CREDIT'
                        ? isHighlighted 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-400 shadow-lg' 
                          : 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40'
                        : isHighlighted
                          ? 'bg-gradient-to-br from-red-400 to-rose-400 shadow-lg'
                          : 'bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? (
                      <ArrowUpRight className={`w-7 h-7 ${isHighlighted ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                    ) : (
                      <ArrowDownRight className={`w-7 h-7 ${isHighlighted ? 'text-white' : 'text-red-600 dark:text-red-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-lg mb-1 transition-colors duration-300 ${
                      isHighlighted ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {tx.description}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(tx.category)}`}>
                        {tx.category || 'N/A'}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{tx.date ? new Date(tx.date).toLocaleDateString() : ''}</span>
                      </div>
                      {/* Status badges for desktop */}
                      {highlightType === 'newly-added' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                          <Sparkles className="w-3 h-3" />
                          NEWLY ADDED
                        </div>
                      )}
                      {highlightType === 'recently-updated' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                          <Clock className="w-3 h-3" />
                          RECENTLY UPDATED
                        </div>
                      )}
                      {highlightType === 'cycling' && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles.badge}`}>
                          <Activity className="w-3 h-3 animate-pulse" />
                          LIVE HIGHLIGHT
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`font-bold text-xl transition-colors duration-300 ${
                      tx.type === 'CREDIT'
                        ? isHighlighted ? 'text-green-700 dark:text-green-300' : 'text-green-600 dark:text-green-400'
                        : isHighlighted ? 'text-red-700 dark:text-red-300' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                      title="Edit Transaction"
                      onClick={() => handleEditClick(tx)}
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      className="p-2.5 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                      title="Delete Transaction"
                      onClick={() => handleDeleteClick(tx)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <ArrowUpRight className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Add your first transaction to get started!</p>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && editTx && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            <TransactionForm
              initialData={editTx}
              onSubmit={handleEditSave}
              onClose={() => setShowEdit(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && deleteTx && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Delete Transaction</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Are you sure you want to delete this transaction?
              </p>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4">
                <div className="font-medium text-gray-900 dark:text-white mb-1">{deleteTx.description}</div>
                <div className={`font-semibold ${deleteTx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {deleteTx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(deleteTx.amount)}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
                onClick={() => { setShowDelete(false); setDeleteTx(null); }}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}