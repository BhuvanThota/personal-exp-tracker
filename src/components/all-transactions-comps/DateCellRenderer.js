import { Calendar } from "lucide-react";

const DateCellRenderer = (params) => {
  return (
    <div className="flex items-center gap-2 text-gray-600">
      <Calendar className="w-4 h-4" />
      {params.value ? new Date(params.value).toLocaleDateString() : ''}
    </div>
  );
};

export default DateCellRenderer;
