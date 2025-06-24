import { Eye, Edit3, Trash2 } from "lucide-react";

const ActionsCellRenderer = (params) => {
  const { onEdit, onDelete, onView } = params.context;
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onView(params.data)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => onEdit(params.data)}
        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        title="Edit Transaction"
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(params.data)}
        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete Transaction"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ActionsCellRenderer;
