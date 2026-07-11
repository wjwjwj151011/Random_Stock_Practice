import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Stock } from '../types';

interface StockChartProps {
  stock: Stock;
  sharesHeld?: number;
}

export default function StockChart({ stock, sharesHeld = 0 }: StockChartProps) {
  // Map history to recharts data format
  const chartData = useMemo(() => {
    return stock.history.map((price, index) => ({
      index,
      time: `T-${stock.history.length - 1 - index}`,
      price
    }));
  }, [stock.history]);

  const isUp = stock.price >= stock.prevPrice;
  const strokeColor = isUp ? '#e11d48' : '#2563eb'; // Tailwind rose-600 vs blue-600
  const fillColor = isUp ? 'url(#colorUp)' : 'url(#colorDown)';

  // Format currency in Korean Won (KRW)
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  const minPrice = Math.min(...stock.history) * 0.98;
  const maxPrice = Math.max(...stock.history) * 1.02;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full" id="stock-chart-card">
      <div className="flex items-center justify-between mb-6" id="stock-chart-header">
        <div>
          <div className="flex items-center gap-2 mb-1" id="stock-ticker-badge-row">
            <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-md bg-slate-100 text-slate-600 uppercase">
              {stock.ticker}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {stock.category}
            </span>
            {sharesHeld > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-teal-50 text-teal-600 border border-teal-100/50 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                보유 중: {sharesHeld.toLocaleString()}주
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight" id="stock-chart-name">
            {stock.name}
          </h2>
        </div>

        <div className="text-right" id="stock-chart-price-summary">
          <div className="text-2xl font-mono font-bold tracking-tight text-slate-900" id="stock-current-price">
            {formatKRW(stock.price)}
          </div>
          <div className={`text-xs font-semibold flex items-center justify-end gap-1 mt-0.5 ${isUp ? 'text-rose-600' : 'text-blue-600'}`} id="stock-change-percent">
            <span>{isUp ? '▲' : '▼'}</span>
            <span>
              {(((stock.price - stock.prevPrice) / stock.prevPrice) * 100).toFixed(2)}%
            </span>
            <span className="text-slate-400 font-normal ml-1">
              ({formatKRW(Math.abs(stock.price - stock.prevPrice))})
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[280px] w-full" id="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e11d48" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              orientation="right" 
              tickFormatter={(v) => formatKRW(v).replace('₩', '')}
              stroke="#94a3b8"
              fontSize={11}
              fontFamily="JetBrains Mono, monospace"
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              formatter={(value: any) => [formatKRW(value), '주가']}
              labelFormatter={() => stock.name}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '8px 12px',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={fillColor}
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center" id="chart-footer">
        <div>{stock.description}</div>
        <div className="font-mono text-[10px] text-slate-400">실시간 3초 간격 업데이트</div>
      </div>
    </div>
  );
}
