import React, { useState, useEffect } from 'react';
import { Stock, PortfolioItem } from '../types';

interface StockListProps {
  stocks: Stock[];
  portfolio: PortfolioItem[];
  selectedStockId: string;
  onSelectStock: (id: string) => void;
}

export default function StockList({ stocks, portfolio, selectedStockId, onSelectStock }: StockListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('stock_game_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Keep favorites in sync with localStorage
  useEffect(() => {
    localStorage.setItem('stock_game_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  const toggleFavorite = (e: React.MouseEvent, stockId: string) => {
    e.stopPropagation(); // prevent row click selection
    setFavorites(prev => 
      prev.includes(stockId) ? prev.filter(id => id !== stockId) : [...prev, stockId]
    );
  };

  // Filter stocks based on search term, category and favorites
  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = 
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      stock.ticker.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeCategory === 'ALL') return true;
    if (activeCategory === 'FAV') return favorites.includes(stock.id);
    return stock.category === activeCategory;
  });

  const categories = ['ALL', 'FAV', 'Tech', 'Bio', 'Energy', 'Consumer', 'Crypto'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full transition-all duration-200" id="stock-list-card">
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800" id="stock-list-header">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-between mb-2">
          <span>시장 종목 리스트</span>
          <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">총 {filteredStocks.length}개 종목</span>
        </h3>

        {/* Search input */}
        <div className="relative mb-2.5" id="stock-search-container">
          <input
            type="text"
            placeholder="종목명 또는 티커 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[11px] pl-7 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100"
            id="stock-search-input"
          />
          <span className="absolute left-2.5 top-2 text-[10px] text-slate-400 dark:text-slate-500">🔍</span>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-[9px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filtering pills */}
        <div className="flex gap-1 overflow-x-auto pb-0.5 -mx-1 scrollbar-none" id="stock-category-pills">
          {categories.map((cat) => {
            const isCatActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2 py-0.5 text-[9px] font-bold rounded-md whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isCatActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? '전체' : cat === 'FAV' ? '★ 관심' : cat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40 max-h-[380px] lg:max-h-none" id="stock-list-container">
        {filteredStocks.map((stock) => {
          const isSelected = stock.id === selectedStockId;
          const isUp = stock.price >= stock.prevPrice;
          const pctChange = ((stock.price - stock.prevPrice) / stock.prevPrice) * 100;
          const isFav = favorites.includes(stock.id);
          const heldItem = portfolio.find((item) => item.stockId === stock.id);
          const heldShares = heldItem ? heldItem.shares : 0;

          return (
            <button
              key={stock.id}
              onClick={() => onSelectStock(stock.id)}
              className={`w-full p-2.5 text-left transition-all duration-200 flex items-center justify-between focus:outline-none cursor-pointer ${
                isSelected 
                  ? 'bg-slate-50/80 dark:bg-slate-950/60 border-l-4 border-slate-800 dark:border-slate-100 pl-2' 
                  : 'hover:bg-slate-50/40 dark:hover:bg-slate-950/10 pl-2.5 border-l-4 border-transparent'
              }`}
              id={`stock-row-${stock.id}`}
            >
              <div className="flex items-center gap-2">
                {/* Favorite Star Icon */}
                <span 
                  onClick={(e) => toggleFavorite(e, stock.id)}
                  className={`text-xs cursor-pointer transition-transform duration-100 active:scale-125 hover:text-amber-500 ${
                    isFav ? 'text-amber-400 font-bold' : 'text-slate-300 dark:text-slate-700'
                  }`}
                  title="관심종목 토글"
                >
                  ★
                </span>

                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shadow-xs ${
                    stock.category === 'Tech' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' :
                    stock.category === 'Bio' ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' :
                    stock.category === 'Energy' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                    stock.category === 'Consumer' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                    'bg-fuchsia-50 dark:bg-fuchsia-950/40 text-fuchsia-600 dark:text-fuchsia-400'
                  }`}
                >
                  {stock.ticker.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 tracking-tight">
                      {stock.name}
                    </span>
                    <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500">
                      {stock.ticker}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {stock.category}
                    </span>
                    {heldShares > 0 && (
                      <span className="text-[9px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-1 py-0.2 rounded" id={`stock-held-badge-${stock.id}`}>
                        {heldShares.toLocaleString()}주 보유
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                  {formatKRW(stock.price)}
                </div>
                <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 mt-0.5 ${
                  isUp ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  <span>{isUp ? '▲' : '▼'}</span>
                  <span>{pctChange.toFixed(2)}%</span>
                </div>
              </div>
            </button>
          );
        })}

        {filteredStocks.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400 font-medium">
            조건에 부합하는 종목이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
