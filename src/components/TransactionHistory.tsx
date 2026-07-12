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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full transition-all duration-200" id="transaction-history-card">
      <div className="flex justify-between items-center mb-4" id="transaction-header">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
          📜 최근 거래 내역
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
            {transactions.length}
          </span>
        </h3>
        {transactions.length > 0 && (
          <button
            onClick={onClear}
            className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            내역 비우기
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[180px] border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-50 dark:divide-slate-800/40" id="transactions-scroll-container">
        {transactions.map((tx) => {
          const isBuy = tx.type === 'BUY';
          const isSell = tx.type === 'SELL';
          const isDeposit = tx.type === 'DEPOSIT';
          const isWithdraw = tx.type === 'WITHDRAW';
          const isBorrow = tx.type === 'BORROW';
          const isRepay = tx.type === 'REPAY';

          let badgeText = '';
          let badgeStyles = '';
          let titleText = tx.stockName;
          let subText = '';
          let isNegativeSign = false;

          if (isBuy || isSell) {
            badgeText = isBuy ? '매수' : '매도';
            badgeStyles = isBuy
              ? 'bg-rose-50 dark:bg-rose-955/25 text-rose-600 dark:text-rose-405 border border-rose-100 dark:border-rose-900/40'
              : 'bg-blue-50 dark:bg-blue-955/25 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
            subText = `${tx.shares.toLocaleString()}주 · 주당 ${formatKRW(tx.price)}`;
            isNegativeSign = isBuy;
          } else if (isDeposit) {
            badgeText = '예금';
            badgeStyles = 'bg-emerald-50 dark:bg-emerald-955/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
            titleText = '은행 예치';
            subText = '중앙은행 저축 계좌';
            isNegativeSign = true;
          } else if (isWithdraw) {
            badgeText = '출금';
            badgeStyles = 'bg-purple-50 dark:bg-purple-955/25 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40';
            titleText = '예금 인출';
            subText = '중앙은행 저축 계좌';
            isNegativeSign = false;
          } else if (isBorrow) {
            badgeText = '대출';
            badgeStyles = 'bg-amber-50 dark:bg-amber-955/25 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
            titleText = '대출 실행';
            subText = '중앙은행 신용 대출';
            isNegativeSign = false;
          } else if (isRepay) {
            badgeText = '상환';
            badgeStyles = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
            titleText = '대출 상환';
            subText = '대출 원리금 일부 상환';
            isNegativeSign = true;
          }

          return (
            <div key={tx.id} className="p-3 flex items-center justify-between text-xs" id={`tx-row-${tx.id}`}>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${badgeStyles}`}>
                    {badgeText}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-150">{titleText}</span>
                  {(isBuy || isSell) && (
                    <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">({tx.ticker})</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-550">
                  {subText}
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                  {isNegativeSign ? '-' : '+'}{formatKRW(tx.total)}
                </span>
                <span className="font-mono block text-[9px] text-slate-400 dark:text-slate-550 mt-0.5">{tx.timestamp}</span>
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            체결된 매매 거래 내역이 아직 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
