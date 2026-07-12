import React, { useState, useEffect, useRef } from 'react';
import { NewsItem, Stock } from '../types';

interface NewsFeedProps {
  news: NewsItem[];
  stocks: Stock[];
  onSelectStock: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NewsFeed({ news, stocks, onSelectStock, onMarkAllAsRead }: NewsFeedProps) {
  const [filter, setFilter] = useState<'ALL' | 'STOCK' | 'GLOBAL'>('ALL');
  const [viewMode, setViewMode] = useState<'CARD' | 'LIST'>('CARD');
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Find stock info for a given ID
  const getStockInfo = (id: string | null) => {
    if (!id) return null;
    return stocks.find((s) => s.id === id);
  };

  // Filter news based on active tab
  const filteredNews = news.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'STOCK') return item.impactStockId !== null;
    if (filter === 'GLOBAL') return item.impactStockId === null;
    return true;
  });

  // When news list changes (e.g. a new flash arrives), bring focus to the newest
  const newestNewsId = filteredNews[0]?.id;
  useEffect(() => {
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [newestNewsId]);

  // Keep index within bounds if filters change
  useEffect(() => {
    if (activeIndex >= filteredNews.length) {
      setActiveIndex(Math.max(0, filteredNews.length - 1));
    }
  }, [filteredNews.length]);

  // Handle slide indicator sync on manual scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollPosition = container.scrollLeft;
    const cardWidth = container.clientWidth;
    if (cardWidth > 0) {
      const index = Math.round(scrollPosition / cardWidth);
      if (index !== activeIndex && index >= 0 && index < filteredNews.length) {
        setActiveIndex(index);
      }
    }
  };

  // Click handler for next/prev
  const goToIndex = (index: number) => {
    if (index < 0 || index >= filteredNews.length) return;
    setActiveIndex(index);
    if (scrollRef.current) {
      const container = scrollRef.current;
      const card = container.children[index] as HTMLElement;
      if (card) {
        container.scrollTo({
          left: card.offsetLeft - container.offsetLeft,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full transition-all duration-200" id="news-feed-card">
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800" id="news-feed-header">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
            📰 실시간 뉴스 속보
            {news.some((n) => !n.read) && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </h3>
          <div className="flex gap-2 items-center" id="news-view-mode-toggle">
            <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[9px] font-bold">
              <button
                onClick={() => setViewMode('CARD')}
                className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'CARD'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                카드형
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'LIST'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                리스트형
              </button>
            </div>
            <button
              onClick={onMarkAllAsRead}
              className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              모두 읽음
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 bg-slate-50 dark:bg-slate-950/40 p-1 rounded-xl" id="news-filter-tabs">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex-1 py-0.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            전체 ({news.length})
          </button>
          <button
            onClick={() => setFilter('STOCK')}
            className={`flex-1 py-0.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'STOCK'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            종목 호재/악재
          </button>
          <button
            onClick={() => setFilter('GLOBAL')}
            className={`flex-1 py-0.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'GLOBAL'
                ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            거시 경제
          </button>
        </div>
      </div>

      {viewMode === 'CARD' ? (
        <div className="flex-1 flex flex-col justify-between p-3.5" id="news-card-mode">
          {filteredNews.length > 0 ? (
            <>
              {/* Outer horizontal scroll snaps */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-x-auto snap-x snap-mandatory flex scrollbar-none items-center touch-pan-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                id="news-snap-container"
              >
                {filteredNews.map((item, idx) => {
                  const impactedStock = getStockInfo(item.impactStockId);
                  const isPositive = item.type === 'positive';
                  const isNegative = item.type === 'negative';

                  return (
                    <div
                      key={item.id}
                      className="min-w-full snap-start px-0.5"
                      id={`news-card-${item.id}`}
                    >
                      <div
                        onClick={() => impactedStock && onSelectStock(impactedStock.id)}
                        className={`p-3.5 rounded-2xl transition-all duration-300 border cursor-pointer h-full flex flex-col justify-between ${
                          idx === activeIndex
                            ? 'shadow-md border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20'
                            : 'opacity-40 border-slate-100 dark:border-slate-900/60'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-lg ${
                              isPositive ? 'bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-405 border border-rose-100 dark:border-rose-900/40' :
                              isNegative ? 'bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40' :
                              'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850'
                            }`}>
                              {isPositive ? '🔥 호재 (UP)' : isNegative ? '❄️ 악재 (DOWN)' : '📰 일반'}
                            </span>
                            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100/80 dark:bg-slate-950 px-1.5 py-0.2 rounded-full">
                              {item.time}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-snug mb-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            {item.title}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                            {item.content}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800">
                          {impactedStock ? (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400">
                                🎯 {impactedStock.name} 차트 보기
                              </span>
                              <span className={`font-mono font-bold ${
                                isPositive ? 'text-rose-600 dark:text-rose-455' : isNegative ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'
                              }`}>
                                예상 영향: {isPositive ? '+' : ''}{item.impactPercent}%
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">글로벌 거시 경제</span>
                              <span className={`font-mono font-bold ${
                                isPositive ? 'text-rose-500' : isNegative ? 'text-blue-500' : 'text-slate-500'
                              }`}>
                                시장 영향 ({isPositive ? '+' : ''}{item.impactPercent}%)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slider Navigation Bar */}
              <div className="flex justify-between items-center mt-3 px-1" id="news-slider-nav">
                <button
                  disabled={activeIndex === 0}
                  onClick={() => goToIndex(activeIndex - 1)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                    activeIndex === 0
                      ? 'text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95'
                  }`}
                  title="이전 속보"
                >
                  ◀
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="text-slate-900 dark:text-slate-200 font-extrabold">{activeIndex + 1}</span> / {filteredNews.length}
                  </span>
                  {/* Indicator progress line */}
                  <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-slate-800 dark:bg-slate-300 transition-all duration-300 rounded-full"
                      style={{ width: `${((activeIndex + 1) / (filteredNews.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  disabled={activeIndex === filteredNews.length - 1}
                  onClick={() => goToIndex(activeIndex + 1)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                    activeIndex === filteredNews.length - 1
                      ? 'text-slate-300 dark:text-slate-700 border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 cursor-not-allowed'
                      : 'text-slate-600 dark:text-slate-350 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 active:scale-95'
                  }`}
                  title="다음 속보"
                >
                  ▶
                </button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-[11px] text-slate-400 dark:text-slate-500 font-medium flex-1 flex items-center justify-center">
              해당 조건의 소식이 아직 없습니다...
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40 p-1 max-h-[380px] lg:max-h-none" id="news-list-container">
          {filteredNews.map((item) => {
            const impactedStock = getStockInfo(item.impactStockId);
            const isPositive = item.type === 'positive';
            const isNegative = item.type === 'negative';

            return (
              <div
                key={item.id}
                onClick={() => impactedStock && onSelectStock(impactedStock.id)}
                className={`p-2.5 transition-all duration-200 cursor-pointer ${
                  !item.read
                    ? 'bg-amber-50/20 dark:bg-amber-955/10 hover:bg-slate-50/40 dark:hover:bg-slate-950/30 font-medium border-l-2 border-amber-400 dark:border-amber-500 pl-2'
                    : 'hover:bg-slate-50/20 dark:hover:bg-slate-950/20 pl-2.5 border-l-2 border-transparent'
                }`}
                id={`news-item-${item.id}`}
                title={impactedStock ? `${impactedStock.name} 차트 보기` : '글로벌 뉴스'}
              >
                <div className="flex justify-between items-start gap-3 mb-1">
                  <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                    isPositive ? 'bg-rose-50 dark:bg-rose-955/25 text-rose-600 dark:text-rose-405 border border-rose-100 dark:border-rose-900/40' :
                    isNegative ? 'bg-blue-50 dark:bg-blue-955/25 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40' :
                    'bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-850'
                  }`}>
                    {isPositive ? '호재 (UP)' : isNegative ? '악재 (DOWN)' : '일반 (NEWS)'}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                    {item.time}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-0.5">
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                  {item.content}
                </p>

                {impactedStock ? (
                  <div className="flex justify-between items-center" id="news-item-impact">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                      🎯 {impactedStock.name} 포커스
                    </span>
                    <span className={`font-mono text-[10px] font-bold ${
                      isPositive ? 'text-rose-600' : isNegative ? 'text-blue-600' : 'text-slate-500'
                    }`}>
                      예상 변동: {isPositive ? '+' : ''}{item.impactPercent}%
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-[9px] text-slate-450 dark:text-slate-500">
                    <span>글로벌 거시 경제 기사</span>
                    <span className={`font-mono font-bold ${
                      isPositive ? 'text-rose-500' : isNegative ? 'text-blue-500' : 'text-slate-500'
                    }`}>
                      시장 전반 영향 ({isPositive ? '+' : ''}{item.impactPercent}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {filteredNews.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 font-medium">
              해당 조건의 소식이 아직 없습니다...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
