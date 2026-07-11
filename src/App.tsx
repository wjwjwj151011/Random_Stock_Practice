import { useState, useEffect, useMemo, useRef } from 'react';
import { Stock, PortfolioItem, NewsItem, Transaction } from './types';
import { INITIAL_STOCKS, calculateNextPrice, generateRandomNews } from './data/stocks';
import Header from './components/Header';
import StockChart from './components/StockChart';
import StockList from './components/StockList';
import TradingPanel from './components/TradingPanel';
import PortfolioSummary from './components/PortfolioSummary';
import NewsFeed from './components/NewsFeed';
import TransactionHistory from './components/TransactionHistory';

const INITIAL_CAPITAL = 10000000; // 10,000,000 KRW (1천만 원)
const TARGET_GOAL = 30000000; // 30,000,000 KRW (3천만 원)

export default function App() {
  // --- Game State ---
  const [stocks, setStocks] = useState<Stock[]>(() => {
    // Attempt load from localStorage or fall back to INITIAL_STOCKS
    const saved = localStorage.getItem('stock_game_stocks');
    return saved ? JSON.parse(saved) : INITIAL_STOCKS;
  });

  const [selectedStockId, setSelectedStockId] = useState<string>('titan-tech');

  const [cash, setCash] = useState<number>(() => {
    const saved = localStorage.getItem('stock_game_cash');
    return saved ? parseFloat(saved) : INITIAL_CAPITAL;
  });

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('stock_game_portfolio');
    return saved ? JSON.parse(saved) : [];
  });

  const [news, setNews] = useState<NewsItem[]>(() => {
    const saved = localStorage.getItem('stock_game_news');
    if (saved) return JSON.parse(saved);
    
    // Initial welcome news
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    return [
      {
        id: 'welcome-news',
        title: '모의 주식 시뮬레이터 오픈! 목표는 3,000만 원',
        content: '가상 자산 1,000만 원으로 투자를 시작합니다. 실시간 뉴스와 기업 기술 분석 정보를 읽고 최고의 타이밍에 매매를 체결하여 3,000만 원을 달성하세요.',
        time: timeStr,
        impactStockId: null,
        impactPercent: 0,
        type: 'neutral',
        read: false
      }
    ];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('stock_game_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [day, setDay] = useState<number>(() => {
    const saved = localStorage.getItem('stock_game_day');
    return saved ? parseInt(saved) : 1;
  });

  const [speed, setSpeed] = useState<'PAUSED' | 'NORMAL' | 'FAST'>('NORMAL');

  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('stock_game_highscore');
    return saved ? parseFloat(saved) : INITIAL_CAPITAL;
  });

  // Goal celebration state
  const [goalCelebrated, setGoalCelebrated] = useState<boolean>(() => {
    return localStorage.getItem('stock_game_goal_celebrated') === 'true';
  });
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // --- Derived Calculations ---
  const currentStock = useMemo(() => {
    return stocks.find((s) => s.id === selectedStockId) || stocks[0];
  }, [stocks, selectedStockId]);

  const currentPortfolioItem = useMemo(() => {
    return portfolio.find((item) => item.stockId === selectedStockId);
  }, [portfolio, selectedStockId]);

  const totalStockValuation = useMemo(() => {
    return portfolio.reduce((sum, item) => {
      const stock = stocks.find((s) => s.id === item.stockId);
      return sum + (stock ? item.shares * stock.price : 0);
    }, 0);
  }, [portfolio, stocks]);

  const totalAssets = cash + totalStockValuation;

  // --- Save to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('stock_game_stocks', JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem('stock_game_cash', cash.toString());
  }, [cash]);

  useEffect(() => {
    localStorage.setItem('stock_game_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('stock_game_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('stock_game_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('stock_game_day', day.toString());
  }, [day]);

  useEffect(() => {
    localStorage.setItem('stock_game_highscore', highScore.toString());
  }, [highScore]);

  // Track highscore and goal
  useEffect(() => {
    if (totalAssets > highScore) {
      setHighScore(totalAssets);
    }

    if (totalAssets >= TARGET_GOAL && !goalCelebrated) {
      setGoalCelebrated(true);
      localStorage.setItem('stock_game_goal_celebrated', 'true');
      setShowGoalModal(true);
    }
  }, [totalAssets, highScore, goalCelebrated]);

  // --- Core Simulation Tick Engine ---
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (speed === 'PAUSED') {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      return;
    }

    const intervalTime = speed === 'FAST' ? 2000 : 4000;

    const handleTick = () => {
      setDay((prevDay) => prevDay + 1);

      // Roll for news event (25% chance of news on normal speed, 15% on fast speed to avoid spam)
      const newsRollChance = speed === 'FAST' ? 0.15 : 0.25;
      const isNewsTick = Math.random() < newsRollChance;
      let activeNews: NewsItem | null = null;

      if (isNewsTick) {
        const generated = generateRandomNews(stocks);
        activeNews = generated;
        setNews((prevNews) => [generated, ...prevNews].slice(0, 50)); // Keep last 50 news items
      }

      setStocks((prevStocks) => {
        return prevStocks.map((stock) => {
          // Determine if there is an active news shock for this stock
          let newsSentimentModifier = 0;
          if (activeNews) {
            if (activeNews.impactStockId === stock.id) {
              // Stock-specific news impact
              newsSentimentModifier = activeNews.impactPercent / 100;
            } else if (activeNews.impactStockId === null) {
              // Global news impact
              newsSentimentModifier = activeNews.impactPercent / 100;
            }
          }

          const nextPrice = calculateNextPrice(stock, newsSentimentModifier);
          
          // Append to history and shift
          const nextHistory = [...stock.history, nextPrice].slice(-20);

          return {
            ...stock,
            price: nextPrice,
            prevPrice: stock.price,
            history: nextHistory
          };
        });
      });
    };

    tickTimerRef.current = setInterval(handleTick, intervalTime);

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [speed, stocks]);

  // --- Trading Logics ---
  const handleTrade = (type: 'BUY' | 'SELL', shares: number) => {
    const stockPrice = currentStock.price;
    const totalCost = shares * stockPrice;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    if (type === 'BUY') {
      if (cash < totalCost) return;

      setCash((prevCash) => prevCash - totalCost);
      setPortfolio((prevPortfolio) => {
        const existing = prevPortfolio.find((item) => item.stockId === selectedStockId);
        if (existing) {
          const totalShares = existing.shares + shares;
          const avgBuyPrice = Math.round(
            (existing.shares * existing.avgBuyPrice + totalCost) / totalShares
          );
          return prevPortfolio.map((item) =>
            item.stockId === selectedStockId
              ? { ...item, shares: totalShares, avgBuyPrice }
              : item
          );
        } else {
          return [...prevPortfolio, { stockId: selectedStockId, shares, avgBuyPrice: stockPrice }];
        }
      });
    } else {
      if (!currentPortfolioItem || currentPortfolioItem.shares < shares) return;

      setCash((prevCash) => prevCash + totalCost);
      setPortfolio((prevPortfolio) => {
        return prevPortfolio
          .map((item) => {
            if (item.stockId === selectedStockId) {
              const remainingShares = item.shares - shares;
              return { ...item, shares: remainingShares };
            }
            return item;
          })
          .filter((item) => item.shares > 0);
      });
    }

    // Add transaction history
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      stockId: selectedStockId,
      ticker: currentStock.ticker,
      stockName: currentStock.name,
      type,
      shares,
      price: stockPrice,
      total: totalCost
    };
    setTransactions((prev) => [newTx, ...prev].slice(0, 100)); // Keep last 100 transactions
  };

  // --- Reset Game ---
  const handleResetGame = () => {
    setStocks(INITIAL_STOCKS);
    setSelectedStockId('titan-tech');
    setCash(INITIAL_CAPITAL);
    setPortfolio([]);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setNews([
      {
        id: 'reset-welcome',
        title: '신규 모의 투자 시즌 시작!',
        content: '자산이 성공적으로 초기화되었습니다. 시장 종목들의 추세를 파악하고 새로운 포트폴리오를 구성해 보세요.',
        time: timeStr,
        impactStockId: null,
        impactPercent: 0,
        type: 'neutral',
        read: false
      }
    ]);
    setTransactions([]);
    setDay(1);
    setGoalCelebrated(false);
    setShowGoalModal(false);
    setShowResetModal(false);
    localStorage.removeItem('stock_game_goal_celebrated');
  };

  // Mark news as read
  const handleMarkAllNewsRead = () => {
    setNews((prevNews) => prevNews.map((item) => ({ ...item, read: true })));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans" id="app-root">
      
      {/* Header */}
      <Header
        day={day}
        totalAssets={totalAssets}
        initialCapital={INITIAL_CAPITAL}
        highScore={highScore}
        speed={speed}
        setSpeed={setSpeed}
        onResetGame={() => setShowResetModal(true)}
      />

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8" id="main-content-area">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="bento-grid">
          
          {/* Left Column: Stocks (Market) & News (Feed) */}
          <div className="lg:col-span-3 flex flex-col gap-6" id="column-market-news">
            <StockList
              stocks={stocks}
              portfolio={portfolio}
              selectedStockId={selectedStockId}
              onSelectStock={setSelectedStockId}
            />
            <NewsFeed
              news={news}
              stocks={stocks}
              onSelectStock={setSelectedStockId}
              onMarkAllAsRead={handleMarkAllNewsRead}
            />
          </div>

          {/* Center Column: Stock Chart & Trade History */}
          <div className="lg:col-span-5 flex flex-col gap-6" id="column-charts">
            <div className="flex-1 min-h-[360px]" id="chart-panel-container">
              <StockChart stock={currentStock} sharesHeld={currentPortfolioItem?.shares || 0} />
            </div>
            <div id="tx-history-container">
              <TransactionHistory
                transactions={transactions}
                onClear={() => setTransactions([])}
              />
            </div>
          </div>

          {/* Right Column: Assets Portfolio & Buying Console */}
          <div className="lg:col-span-4 flex flex-col gap-6" id="column-trading">
            <TradingPanel
              stock={currentStock}
              cash={cash}
              portfolioItem={currentPortfolioItem}
              onTrade={handleTrade}
            />
            <PortfolioSummary
              stocks={stocks}
              portfolio={portfolio}
              cash={cash}
              initialCapital={INITIAL_CAPITAL}
              onSelectStock={setSelectedStockId}
            />
          </div>

        </div>
      </main>

      {/* Goal Reached Congratulatory Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="achievement-modal-overlay">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden" id="achievement-modal-box">
            
            {/* Celebration Sparkles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />

            <span className="text-5xl block mb-4" id="celebration-emoji">🏆</span>
            
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2" id="celebration-title">
              축하합니다! 3,000만 원 돌파!
            </h3>
            
            <p className="text-sm text-slate-500 leading-relaxed mb-6" id="celebration-message">
              가상 자금 {INITIAL_CAPITAL.toLocaleString()}원으로 투자를 시작해 드디어 꿈의 자산 <strong className="text-rose-600 font-extrabold">{TARGET_GOAL.toLocaleString()}원(3천만 원)</strong>을 성공적으로 초과 달성했습니다! 
              탁월한 주가 분석 능력과 탁월한 결단력을 증명하셨습니다.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 flex justify-around text-center" id="celebration-stats">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">최종 도달 자산</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(totalAssets)}
                </span>
              </div>
              <div className="border-l border-slate-200" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">소요 기간</span>
                <span className="font-mono text-sm font-bold text-slate-800">Day {day}</span>
              </div>
            </div>

            <div className="flex gap-3" id="celebration-buttons">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                계속 투자하기
              </button>
              <button
                onClick={handleResetGame}
                className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold transition-colors"
              >
                새로운 도전 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="reset-modal-overlay">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden" id="reset-modal-box">
            
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            
            <span className="text-5xl block mb-4" id="reset-emoji">⚠️</span>
            
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mb-2" id="reset-title">
              게임을 초기화하시겠습니까?
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6" id="reset-message">
              현재까지 진행된 모의 투자 정보가 완전히 초기화되며 다시 복구할 수 없습니다.<br />
              처음부터 신규 투자 시즌을 시작하시겠습니까?
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 text-left space-y-2.5 text-xs" id="reset-current-stats">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">현재 경과 일수</span>
                <span className="font-mono font-bold text-slate-800">Day {day}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">현재 평가 자산</span>
                <span className="font-mono font-bold text-slate-900">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(totalAssets)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-semibold">초기 자본금으로 변경</span>
                <span className="font-mono font-bold text-rose-600">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(INITIAL_CAPITAL)} (1천만 원)
                </span>
              </div>
            </div>

            <div className="flex gap-3" id="reset-buttons">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
              >
                취소 (돌아가기)
              </button>
              <button
                onClick={handleResetGame}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                예, 초기화합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
