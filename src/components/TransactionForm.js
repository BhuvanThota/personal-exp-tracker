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
          onSubmit()
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

  const bgColor =
    formData.type === 'DEBIT'
      ? 'bg-red-50 border-red-200'
      : 'bg-green-50 border-green-200'

  const headingColor =
    formData.type === 'DEBIT'
      ? 'text-red-600'
      : 'text-green-600'

  const buttonColor =
    formData.type === 'DEBIT'
      ? 'bg-red-500 hover:bg-red-600'
      : 'bg-green-500 hover:bg-green-600'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md rounded-2xl p-6 border ${bgColor} dark:bg-gray-900`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${headingColor}`}>
            Add {formData.type === 'DEBIT' ? 'Expense' : 'Income'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
            >
              <option value="DEBIT">Expense</option>
              <option value="CREDIT">Income</option>
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Category</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Select category</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Transportation">Transportation</option>
              <option value="Shopping">Shopping</option>
              <option value="Utilities">Utilities</option>
              <option value="Health">Health</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Description + Suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description..."
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
            {showSuggestions && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{suggestion.description}</div>
                    <div className="text-sm text-gray-500">{suggestion.category}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
              placeholder="0.00"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-md ${buttonColor} dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white`}
            >
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
