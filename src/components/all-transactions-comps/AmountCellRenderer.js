import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

const AmountCellRenderer = (params) => {
  const isCredit = params.data.type === 'CREDIT';
  return (
    <div className={`flex items-center gap-2 font-semibold ${
      isCredit ? 'text-green-600' : 'text-red-600'
    }`}>
      {isCredit ? (
        <ArrowUpRight className="w-4 h-4" />
      ) : (
        <ArrowDownRight className="w-4 h-4" />
      )}
      {isCredit ? '+' : '-'}{formatCurrency(params.value)}
    </div>
  );
};

export default AmountCellRenderer;
