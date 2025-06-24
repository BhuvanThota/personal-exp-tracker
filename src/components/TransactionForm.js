import { useState, useEffect } from 'react'

export default function TransactionForm({ onSubmit, onClose, initialData }) {
  const [formData, setFormData] = useState(
    initialData ? {
      ...initialData,
      amount: initialData.amount?.toString() || '',
      date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0],
    } : {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      type: 'DEBIT',
      category: ''
    }
  )

  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    if (formData.description.length > 2) {
      fetchSuggestions(formData.description)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [formData.description])

  const fetchSuggestions = async (query) => {
    try {
      const res = await fetch(`/api/suggestions?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSuggestions(data)
      setShowSuggestions(data.length > 0)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Capitalize first letter of every word in description before submit
    const capitalizeWords = str => str.replace(/\b\w/g, c => c.toUpperCase());
    const capitalizedFormData = {
      ...formData,
      description: capitalizeWords(formData.description || '')
    }
    
    if (initialData && initialData.id) {
      // Edit mode: call onSubmit with updated data (PUT handled in parent)
      await onSubmit({ ...capitalizedFormData, id: initialData.id })
    } else {
      // Add mode: POST as before
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capitalizedFormData)
        })

        if (res.ok) {
          const newTransaction = await res.json()
          onSubmit(newTransaction) // Pass the new transaction data
          setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: '',
            type: 'DEBIT',
            category: ''
          })
        }
      } catch (error) {
        console.error('Failed to create transaction:', error)
      }
    }
  }

  const selectSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      description: suggestion.description,
      category: suggestion.category
    }))
    setShowSuggestions(false)
  }

  // Enhanced category options based on transaction type
  const getCategoryOptions = () => {
    if (formData.type === 'CREDIT') {
      return [
        { value: '', label: 'Select category' },
        { value: 'Salary', label: 'Salary' },
        { value: 'Bonus', label: 'Bonus' },
        { value: 'Freelance', label: 'Freelance' },
        { value: 'Investment', label: 'Investment' },
        { value: 'Refund', label: 'Refund' },
        { value: 'Gift', label: 'Gift' },
        { value: 'Other', label: 'Other Income' }
      ]
    } else {
      return [
        { value: '', label: 'Select category' },
        { value: 'Food & Dining', label: 'Food & Dining' },
        { value: 'Transportation', label: 'Transportation' },
        { value: 'Shopping', label: 'Shopping' },
        { value: 'Utilities', label: 'Utilities' },
        { value: 'Health', label: 'Health' },
        { value: 'Entertainment', label: 'Entertainment' },
        { value: 'Rent', label: 'Rent' },
        { value: 'Groceries', label: 'Groceries' },
        { value: 'Education', label: 'Education' },
        { value: 'Insurance', label: 'Insurance' },
        { value: 'Other', label: 'Other Expense' }
      ]
    }
  }

  const isEditMode = initialData && initialData.id

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${
          formData.type === 'DEBIT' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}>
          {isEditMode ? 'Edit' : 'Add'} {formData.type === 'DEBIT' ? 'Expense' : 'Income'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Type Selector */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Transaction Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'DEBIT', category: '' }))}
              className={`p-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                formData.type === 'DEBIT'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  : 'border-gray-300 bg-white hover:border-gray-400 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'CREDIT', category: '' }))}
              className={`p-3 rounded-lg border-2 transition-all duration-200 font-medium ${
                formData.type === 'CREDIT'
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'border-gray-300 bg-white hover:border-gray-400 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              💰 Income
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            required
          />
        </div>

        {/* Category - Fixed to not auto-expand */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all appearance-none bg-white dark:bg-gray-700"
            required
          >
            {getCategoryOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Description + Suggestions */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {suggestion.description}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {suggestion.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₹
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full pl-8 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`flex-1 px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
              formData.type === 'DEBIT'
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            }`}
          >
            {isEditMode ? 'Update' : 'Add'} Transaction
          </button>
        </div>
      </form>
    </div>
  )
}