const TypeCellRenderer = (params) => {
  const isCredit = params.value === 'CREDIT';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
      isCredit 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isCredit ? 'Income' : 'Expense'}
    </span>
  );
};

export default TypeCellRenderer;
