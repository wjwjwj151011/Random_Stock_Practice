import { useMemo } from 'react';
import { Stock, PortfolioItem } from '../types';

interface PortfolioSummaryProps {
  stocks: Stock[];
  portfolio: PortfolioItem[];
  cash: number;
  initialCapital: number;
  onSelectStock: (id: string) => void;
  savings?: number;
  loan?: number;
  onGoToBank?: () => void;
}

export default function PortfolioSummary({
  stocks,
  portfolio,
  cash,
  initialCapital,
  onSelectStock,
  savings = 0,
  loan = 0,
  onGoToBank
}: PortfolioSummaryProps) {
  // Format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate stock valuations
  const stockDetails = useMemo(() => {
    return portfolio
      .map((item) => {
        const stock = stocks.find((s) => s.id === item.stockId);
        if (!stock || item.shares <= 0) return null;

        const currentValuation = item.shares * stock.price;
        const totalCost = item.shares * item.avgBuyPrice;
        const profitLoss = currentValuation - totalCost;
        const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

        return {
          ...item,
          stock,
          currentValuation,
          totalCost,
          profitLoss,
          profitLossPercent
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [portfolio, stocks]);

  const totalStockValuation = useMemo(() => {
    return stockDetails.reduce((sum, item) => sum + item.currentValuation, 0);
  }, [stockDetails]);

  const totalPortfolioValue = cash + totalStockValuation + savings - loan;
  const overallProfitLoss = totalPortfolioValue - initialCapital;
  const overallReturnPercent = (overallProfitLoss / initialCapital) * 100;

  // Compute allocation percentages for the visual bar
  const allocations = useMemo(() => {
    const grossAssets = cash + totalStockValuation + savings;
    if (grossAssets === 0) return [];
    const cashPercent = (cash / grossAssets) * 100;
    const savingsPercent = (savings / grossAssets) * 100;
    const stockAllocations = stockDetails.map((item) => ({
      name: item.stock.name,
      color: item.stock.category === 'Tech' ? 'bg-indigo-500' :
             item.stock.category === 'Bio' ? 'bg-teal-500' :
             item.stock.category === 'Energy' ? 'bg-amber-500' :
             item.stock.category === 'Consumer' ? 'bg-emerald-500' :
             'bg-fuchsia-500',
      percent: (item.currentValuation / grossAssets) * 100
    }));

    return [
      { name: '예수금 (Cash)', color: 'bg-slate-300 dark:bg-slate-700', percent: cashPercent },
      ...(savings > 0 ? [{ name: '은행 예금 (Savings)', color: 'bg-emerald-500', percent: savingsPercent }] : []),
      ...stockAllocations
    ].filter((item) => item.percent > 0.5); // filter out tiny values
  }, [cash, stockDetails, savings, totalStockValuation]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full transition-all duration-200" id="portfolio-summary-card">
      <div className="mb-3.5" id="portfolio-summary-header">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">내 자산 현황</h3>

        {/* Total asset metric */}
        <div className="grid grid-cols-2 gap-3 mb-3" id="portfolio-primary-metrics">
          <div className="bg-slate-50/50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100/50 dark:border-slate-850">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">총 평가 자산</span>
            <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight block">
              {formatKRW(totalPortfolioValue)}
            </span>
          </div>

          <div className="bg-slate-50/50 dark:bg-slate-950/60 rounded-xl p-2.5 border border-slate-100/50 dark:border-slate-850">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">총 투자 수익률</span>
            <span className={`font-mono text-base font-bold tracking-tight block ${overallProfitLoss >= 0 ? 'text-rose-600 dark:text-rose-450' : 'text-blue-600 dark:text-blue-400'}`}>
              {overallProfitLoss >= 0 ? '+' : ''}
              {overallReturnPercent.toFixed(2)}%
            </span>
            <span className={`text-[9px] font-medium block mt-0.5 ${overallProfitLoss >= 0 ? 'text-rose-500 dark:text-rose-400' : 'text-blue-500 dark:text-blue-405'}`}>
              {formatKRW(overallProfitLoss)}
            </span>
          </div>
        </div>

        {/* Cash vs Stock vs Bank details */}
        <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-800 pb-3" id="portfolio-detail-metrics">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>보유 예수금</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatKRW(cash)}</span>
            </div>
            <div className="flex justify-between">
              <span>주식 평가액</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatKRW(totalStockValuation)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>은행 예치금</span>
                <span className="font-mono">+{formatKRW(savings)}</span>
              </div>
            )}
            {loan > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                <span>은행 대출금</span>
                <span className="font-mono">-{formatKRW(loan)}</span>
              </div>
            )}
          </div>
          <div className="border-l border-slate-100 dark:border-slate-800 pl-3 space-y-1">
            <div className="flex justify-between">
              <span>총 매수 금액</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {formatKRW(stockDetails.reduce((sum, item) => sum + item.totalCost, 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>최초 투자 원금</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatKRW(initialCapital)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation visualizer */}
      <div className="mb-3.5" id="portfolio-allocation">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">자산 구성비</span>
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex" id="allocation-bar-container">
          {allocations.map((item, index) => (
            <div
              key={index}
              className={`${item.color} h-full transition-all duration-300`}
              style={{ width: `${item.percent}%` }}
              title={`${item.name}: ${item.percent.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2" id="allocation-legend">
          {allocations.map((item, index) => (
            <div key={index} className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="font-medium truncate max-w-[70px]">{item.name}</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{item.percent.toFixed(0)}%</span>
            </div>
          ))}
          {allocations.length === 0 && (
            <span className="text-[9px] text-slate-400 dark:text-slate-500">보유 자산이 없습니다.</span>
          )}
        </div>
      </div>

      {/* Holdings List */}
      <div className="flex-1 overflow-hidden flex flex-col" id="holdings-list-section">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">보유 종목 현황</span>
        <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-50 dark:divide-slate-800/40 max-h-[180px]" id="holdings-scroll-container">
          {stockDetails.map((item) => (
            <div
              key={item.stockId}
              onClick={() => onSelectStock(item.stockId)}
              className="p-2 text-left hover:bg-slate-50/50 dark:hover:bg-slate-950/40 transition-colors cursor-pointer flex justify-between items-center"
              id={`portfolio-row-${item.stockId}`}
            >
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200">{item.stock.name}</span>
                  <span className="text-[8px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-950 px-0.5 py-0.2 rounded">
                    {item.stock.ticker}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {item.shares.toLocaleString()} 주 · 평단 {formatKRW(item.avgBuyPrice)}
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-100">
                  {formatKRW(item.currentValuation)}
                </div>
                <div className={`text-[9px] font-bold mt-0.5 ${item.profitLoss >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {item.profitLoss >= 0 ? '+' : ''}
                  {item.profitLossPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}

          {stockDetails.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400 font-medium">
              보유 중인 주식이 없습니다. 종목을 선택해 첫 거래를 시작해 보세요!
            </div>
          )}
        </div>
      </div>

      {/* Go to Bank Quick Action Button */}
      {onGoToBank && (
        <button
          onClick={onGoToBank}
          className="mt-3 w-full py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-[10px] rounded-lg shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
          id="quick-go-to-bank-btn"
        >
          🏦 은행 이동 (예금 · 대출) &rarr;
        </button>
      )}
    </div>
  );
}
