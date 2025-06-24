import { Tag } from "lucide-react";

const CategoryCellRenderer = (params) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Food & Dining': 'bg-orange-100 text-orange-700 border-orange-200',
      'Transportation': 'bg-blue-100 text-blue-700 border-blue-200',
      'Shopping': 'bg-purple-100 text-purple-700 border-purple-200',
      'Utilities': 'bg-green-100 text-green-700 border-green-200',
      'Entertainment': 'bg-pink-100 text-pink-700 border-pink-200',
      'Health': 'bg-teal-100 text-teal-700 border-teal-200',
      'Salary': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Bonus': 'bg-lime-100 text-lime-700 border-lime-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(params.value)}`}>
      <Tag className="w-3 h-3 mr-1" />
      {params.value || 'N/A'}
    </span>
  );
};

export default CategoryCellRenderer;
