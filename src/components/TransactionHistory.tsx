import { Transaction } from '../types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onClear: () => void;
}

export default function TransactionHistory({ transactions, onClear }: TransactionHistoryProps) {
  // Format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full" id="transaction-history-card">
      <div className="flex justify-between items-center mb-4" id="transaction-header">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
          📜 최근 거래 내역
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            {transactions.length}
          </span>
        </h3>
        {transactions.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            내역 비우기
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[180px] border border-slate-100 rounded-xl divide-y divide-slate-50" id="transactions-scroll-container">
        {transactions.map((tx) => {
          const isBuy = tx.type === 'BUY';
          return (
            <div key={tx.id} className="p-3 flex items-center justify-between text-xs" id={`tx-row-${tx.id}`}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                    isBuy ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {isBuy ? '매수' : '매도'}
                  </span>
                  <span className="font-bold text-slate-800">{tx.stockName}</span>
                  <span className="font-mono text-[10px] text-slate-400">({tx.ticker})</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {tx.shares.toLocaleString()}주 · 주당 {formatKRW(tx.price)}
                </div>
              </div>

              <div className="text-right">
                <span className={`font-mono font-bold ${isBuy ? 'text-slate-800' : 'text-slate-800'}`}>
                  {isBuy ? '-' : '+'}{formatKRW(tx.total)}
                </span>
                <span className="font-mono block text-[9px] text-slate-400 mt-0.5">{tx.timestamp}</span>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-400 font-medium">
            체결된 매매 거래 내역이 아직 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
