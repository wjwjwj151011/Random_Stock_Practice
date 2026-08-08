import { useState, useEffect, useMemo, useRef } from 'react';
import { Stock, PortfolioItem, NewsItem, Transaction, AutoSellOrder, User } from './types';
import { INITIAL_STOCKS, calculateNextPrice, generateRandomNews } from './data/stocks';
import Header from './components/Header';
import StockChart from './components/StockChart';
import StockList from './components/StockList';
import TradingPanel from './components/TradingPanel';
import PortfolioSummary from './components/PortfolioSummary';
import NewsFeed from './components/NewsFeed';
import BankPanel from './components/BankPanel';
import { getCurrentUser, loadUserGameState, loadUserGameStateAsync, saveUserGameState, setCurrentUserSession, fetchRegisteredUsersAsync } from './lib/auth';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const INITIAL_CAPITAL = 10000000; // 10,000,000 KRW (1천만 원)
const TARGET_GOAL = 30000000; // 30,000,000 KRW (3천만 원)
const SAVINGS_INTEREST_RATE = 0.005; // 0.5% per Day
const LOAN_INTEREST_RATE = 0.012;    // 1.2% per Day

export default function App() {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

  // Subscribe to Supabase Auth state changes if configured
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const sbUser = session.user;
          const userMeta = sbUser.user_metadata || {};
          const email = sbUser.email || '';
          const username = userMeta.username || (email ? email.split('@')[0] : 'user');
          const name = userMeta.name || username;

          const updatedUser: User = {
            username,
            email,
            name,
            passwordHash: sbUser.id,
            createdAt: sbUser.created_at || new Date().toISOString(),
            provider: 'supabase'
          };
          setCurrentUser(updatedUser);
          setCurrentUserSession(updatedUser);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // --- Game State ---
  const [stocks, setStocks] = useState<Stock[]>(() => {
    // Attempt load from localStorage or fall back to INITIAL_STOCKS
    const saved = localStorage.getItem('stock_game_stocks');
    let loadedStocks: Stock[] = INITIAL_STOCKS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Stock[];
        // Auto-merge newly added stocks to preserve user's session but load new options
        if (parsed.length < INITIAL_STOCKS.length) {
          const parsedIds = new Set(parsed.map((s) => s.id));
          const newStocks = INITIAL_STOCKS.filter((s) => !parsedIds.has(s.id));
          loadedStocks = [...parsed, ...newStocks];
        } else {
          loadedStocks = parsed;
        }
      } catch (e) {
        loadedStocks = INITIAL_STOCKS;
      }
    }

    // Sanitize prices & migrate legacy titan-tech to nexus-ai
    return loadedStocks.map((stock) => {
      if (stock.id === 'titan-tech') {
        const nexus = INITIAL_STOCKS.find((s) => s.id === 'nexus-ai') || INITIAL_STOCKS[0];
        return { ...nexus };
      }
      const initialRef = INITIAL_STOCKS.find((s) => s.id === stock.id);
      const minP = stock.id === 'dog-coin' ? 100 : (initialRef?.minPrice ?? stock.minPrice ?? 30);
      const maxP = initialRef?.maxPrice ?? stock.maxPrice ?? 100000;
      let sanitizedPrice = Math.max(minP, Math.min(maxP, stock.price));
      if (stock.id === 'dog-coin' && sanitizedPrice < 100) {
        sanitizedPrice = 500;
      }
      return {
        ...stock,
        minPrice: minP,
        maxPrice: maxP,
        price: sanitizedPrice,
        prevPrice: stock.prevPrice < minP ? sanitizedPrice : stock.prevPrice
      };
    });
  });

  const [selectedStockId, setSelectedStockId] = useState<string>('nexus-ai');

  const [cash, setCash] = useState<number>(() => {
    const saved = localStorage.getItem('stock_game_cash');
    return saved ? parseFloat(saved) : INITIAL_CAPITAL;
  });

  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('stock_game_portfolio');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as PortfolioItem[];
      return parsed.map((item) => (item.stockId === 'titan-tech' ? { ...item, stockId: 'nexus-ai' } : item));
    } catch (e) {
      return [];
    }
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

  const [autoSellOrders, setAutoSellOrders] = useState<AutoSellOrder[]>(() => {
    const saved = localStorage.getItem('stock_game_autosell');
    return saved ? JSON.parse(saved) : [];
  });

  // Goal celebration state
  const [goalCelebrated, setGoalCelebrated] = useState<boolean>(() => {
    return localStorage.getItem('stock_game_goal_celebrated') === 'true';
  });
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  // --- Bank and Tab States ---
  const [activeTab, setActiveTab] = useState<'TRADING' | 'BANK'>('TRADING');

  const [savings, setSavings] = useState<number>(() => {
    const saved = localStorage.getItem('stock_game_savings');
    return saved ? parseFloat(saved) : 0;
  });

  const [loan, setLoan] = useState<number>(() => {
    const saved = localStorage.getItem('stock_game_loan');
    return saved ? parseFloat(saved) : 0;
  });

  // --- Dark Mode State ---
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('stock_game_dark_mode');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#020617';
      document.body.style.backgroundColor = '#020617';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.body.style.backgroundColor = '#f8fafc';
    }
    localStorage.setItem('stock_game_dark_mode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('stock_game_savings', savings.toString());
  }, [savings]);

  useEffect(() => {
    localStorage.setItem('stock_game_loan', loan.toString());
  }, [loan]);

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

  const totalAssets = cash + totalStockValuation + savings - loan;

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

  useEffect(() => {
    localStorage.setItem('stock_game_autosell', JSON.stringify(autoSellOrders));
  }, [autoSellOrders]);

  // Initial fetch of registered users list on mount
  useEffect(() => {
    fetchRegisteredUsersAsync().catch(() => {});
  }, []);

  // Handle user account switching / hydration & periodic server sync
  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const syncState = async () => {
      const userState = await loadUserGameStateAsync(currentUser.username);
      if (userState && isMounted) {
        setCash((prev) => (userState.cash !== undefined ? userState.cash : prev));
        setPortfolio(userState.portfolio ?? []);
        setSavings(userState.savings ?? 0);
        setLoan(userState.loan ?? 0);
        setDay(userState.day ?? 1);
        setAutoSellOrders(userState.autoSellOrders ?? []);
        setHighScore(userState.highScore ?? INITIAL_CAPITAL);
        setGoalCelebrated(userState.goalCelebrated ?? false);
        setTransactions(userState.transactions ?? []);
      }
    };

    syncState();

    // Refresh every 5 seconds so live cash changes from admin appear on user device
    const interval = setInterval(syncState, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser]);

  // Sync current game state to user's dedicated save slot
  useEffect(() => {
    if (currentUser) {
      saveUserGameState(currentUser.username, {
        cash,
        portfolio,
        savings,
        loan,
        day,
        autoSellOrders,
        highScore,
        goalCelebrated,
        transactions,
        stats: {
          totalTrades: transactions.length,
          winningTrades: 0,
          highestPortfolioValue: highScore,
          biggestGainPercent: 0
        }
      });
    }
  }, [currentUser, cash, portfolio, savings, loan, day, autoSellOrders, highScore, goalCelebrated, transactions]);

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

  // --- Auto-Sell Trigger Effect ---
  useEffect(() => {
    const activeOrders = autoSellOrders.filter((o) => o.isActive);
    if (activeOrders.length === 0) return;

    let cashBonus = 0;
    let portfolioChanged = false;
    let autoSellTriggered = false;
    
    let updatedPortfolio = [...portfolio];
    const triggeredOrderIds: string[] = [];
    const newTransactions: Transaction[] = [];

    activeOrders.forEach((order) => {
      const stock = stocks.find((s) => s.id === order.stockId);
      if (!stock) return;

      // Trigger condition: stock price reaches or exceeds the target price
      if (stock.price >= order.targetPrice) {
        const portfolioItem = updatedPortfolio.find((item) => item.stockId === order.stockId);
        if (portfolioItem && portfolioItem.shares > 0) {
          const sharesToSell = order.sellAll ? portfolioItem.shares : Math.min(order.shares, portfolioItem.shares);
          
          if (sharesToSell > 0) {
            const saleValue = sharesToSell * stock.price;
            cashBonus += saleValue;
            
            // Deduct shares
            updatedPortfolio = updatedPortfolio.map((item) => {
              if (item.stockId === order.stockId) {
                return { ...item, shares: item.shares - sharesToSell };
              }
              return item;
            }).filter((item) => item.shares > 0);

            portfolioChanged = true;
            autoSellTriggered = true;
            triggeredOrderIds.push(order.id);

            // Log Transaction
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            const newTx: Transaction = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: timeStr,
              stockId: order.stockId,
              ticker: stock.ticker,
              stockName: `[자동매도] ${stock.name}`,
              type: 'SELL',
              shares: sharesToSell,
              price: stock.price,
              total: saleValue
            };
            newTransactions.push(newTx);

            // Add automatic selling notification to the news feed
            const newsItem: NewsItem = {
              id: `autosell-${Date.now()}-${Math.random()}`,
              title: `📢 자동 매도 체결: ${stock.name}`,
              content: `지정가 자동 매도가 완료되었습니다. 설정 목표가 ${order.targetPrice.toLocaleString()}원 도달로 인해 보유 주식 중 ${sharesToSell.toLocaleString()}주가 주당 ${stock.price.toLocaleString()}원에 매도 처리되었습니다. (체결액: ${saleValue.toLocaleString()}원)`,
              time: timeStr,
              impactStockId: null,
              impactPercent: 0,
              type: 'positive',
              read: false
            };
            setNews((prevNews) => [newsItem, ...prevNews].slice(0, 50));
          }
        }
      }
    });

    if (autoSellTriggered) {
      if (cashBonus > 0) {
        setCash((prevCash) => prevCash + cashBonus);
      }
      if (portfolioChanged) {
        setPortfolio(updatedPortfolio);
      }
      if (newTransactions.length > 0) {
        setTransactions((prev) => [...newTransactions, ...prev].slice(0, 100));
      }

      // Remove triggered orders to keep lists clean and avoid repeat triggers
      setAutoSellOrders((prevOrders) =>
        prevOrders.filter((o) => !triggeredOrderIds.includes(o.id))
      );
    }
  }, [stocks, autoSellOrders, portfolio]);

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

      // Accrue savings and loan interest
      setSavings((prevSavings) => {
        if (prevSavings <= 0) return 0;
        return prevSavings + Math.round(prevSavings * SAVINGS_INTEREST_RATE);
      });

      setLoan((prevLoan) => {
        if (prevLoan <= 0) return 0;
        return prevLoan + Math.round(prevLoan * LOAN_INTEREST_RATE);
      });

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
    setSavings(0);
    setLoan(0);
    setAutoSellOrders([]);
    setActiveTab('TRADING');
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

  const handleAddAutoSellOrder = (targetPrice: number, shares: number, sellAll: boolean) => {
    const newOrder: AutoSellOrder = {
      id: Math.random().toString(36).substring(2, 9),
      stockId: selectedStockId,
      stockName: currentStock.name,
      ticker: currentStock.ticker,
      targetPrice,
      shares,
      sellAll,
      isActive: true
    };
    setAutoSellOrders((prev) => [newOrder, ...prev]);
  };

  const handleCancelAutoSellOrder = (orderId: string) => {
    setAutoSellOrders((prev) => prev.filter((o) => o.id !== orderId));
  };

  // --- Bank Handlers ---
  const handleDeposit = (amount: number) => {
    if (cash < amount) return;
    setCash((prev) => prev - amount);
    setSavings((prev) => prev + amount);

    // Record transaction
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      stockId: 'BANK',
      ticker: 'BANK',
      stockName: '은행 예치',
      type: 'DEPOSIT',
      shares: 0,
      price: amount,
      total: amount
    };
    setTransactions((prev) => [newTx, ...prev].slice(0, 100));
  };

  const handleWithdraw = (amount: number) => {
    if (savings < amount) return;
    setSavings((prev) => prev - amount);
    setCash((prev) => prev + amount);

    // Record transaction
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      stockId: 'BANK',
      ticker: 'BANK',
      stockName: '예금 인출',
      type: 'WITHDRAW',
      shares: 0,
      price: amount,
      total: amount
    };
    setTransactions((prev) => [newTx, ...prev].slice(0, 100));
  };

  const handleBorrow = (amount: number) => {
    setLoan((prev) => prev + amount);
    setCash((prev) => prev + amount);

    // Record transaction
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      stockId: 'BANK',
      ticker: 'BANK',
      stockName: '대출 실행',
      type: 'BORROW',
      shares: 0,
      price: amount,
      total: amount
    };
    setTransactions((prev) => [newTx, ...prev].slice(0, 100));
  };

  const handleRepay = (amount: number) => {
    if (cash < amount || loan < amount) return;
    setLoan((prev) => prev - amount);
    setCash((prev) => prev - amount);

    // Record transaction
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newTx: Transaction = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      stockId: 'BANK',
      ticker: 'BANK',
      stockName: '대출 상환',
      type: 'REPAY',
      shares: 0,
      price: amount,
      total: amount
    };
    setTransactions((prev) => [newTx, ...prev].slice(0, 100));
  };

  // Mark news as read
  const handleMarkAllNewsRead = () => {
    setNews((prevNews) => prevNews.map((item) => ({ ...item, read: true })));
  };

  // Trigger custom news from Admin Console
  const handleTriggerAdminNews = (title: string, content: string, impact: 'POS' | 'NEG' | 'NEU') => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNews: NewsItem = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      content,
      time: timeStr,
      impactStockId: null,
      impactPercent: impact === 'POS' ? 15 : impact === 'NEG' ? -15 : 0,
      type: impact === 'POS' ? 'positive' : impact === 'NEG' ? 'negative' : 'neutral',
      read: false
    };
    setNews((prev) => [newNews, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" id="app-root">
      
      {/* Header */}
      <Header
        day={day}
        totalAssets={totalAssets}
        initialCapital={INITIAL_CAPITAL}
        highScore={highScore}
        speed={speed}
        setSpeed={setSpeed}
        onResetGame={() => setShowResetModal(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-4 lg:p-4 flex flex-col justify-center" id="main-content-area">
        {activeTab === 'TRADING' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" id="bento-grid">
            
            {/* Left Column: Stocks (Market) & News (Feed) */}
            <div className="lg:col-span-3 flex flex-col gap-4 lg:h-[540px]" id="column-market-news">
              <div className="h-[280px]">
                <StockList
                  stocks={stocks}
                  portfolio={portfolio}
                  selectedStockId={selectedStockId}
                  onSelectStock={setSelectedStockId}
                />
              </div>
              <div className="h-[244px]">
                <NewsFeed
                  news={news}
                  stocks={stocks}
                  onSelectStock={setSelectedStockId}
                  onMarkAllAsRead={handleMarkAllNewsRead}
                />
              </div>
            </div>

            {/* Center Column: Stock Chart & Trade History */}
            <div className="lg:col-span-5 lg:h-[540px]" id="column-charts">
              <StockChart stock={currentStock} sharesHeld={currentPortfolioItem?.shares || 0} />
            </div>

            {/* Right Column: Assets Portfolio & Buying Console */}
            <div className="lg:col-span-4 flex flex-col gap-3 lg:h-[540px]" id="column-trading">
              <div className="flex-1 min-h-[330px] overflow-visible">
                <TradingPanel
                  stock={currentStock}
                  cash={cash}
                  portfolioItem={currentPortfolioItem}
                  onTrade={handleTrade}
                  autoSellOrders={autoSellOrders}
                  onAddAutoSellOrder={handleAddAutoSellOrder}
                  onCancelAutoSellOrder={handleCancelAutoSellOrder}
                />
              </div>
              <div className="h-[200px] shrink-0">
                <PortfolioSummary
                  stocks={stocks}
                  portfolio={portfolio}
                  cash={cash}
                  initialCapital={INITIAL_CAPITAL}
                  onSelectStock={setSelectedStockId}
                  savings={savings}
                  loan={loan}
                  onGoToBank={() => setActiveTab('BANK')}
                />
              </div>
            </div>

          </div>
        ) : (
          <div className="animate-fade-in" id="bank-panel-view">
            <BankPanel
              cash={cash}
              savings={savings}
              loan={loan}
              onDeposit={handleDeposit}
              onWithdraw={handleWithdraw}
              onBorrow={handleBorrow}
              onRepay={handleRepay}
              savingsRate={SAVINGS_INTEREST_RATE}
              loanRate={LOAN_INTEREST_RATE}
              day={day}
              onReturnToTrading={() => setActiveTab('TRADING')}
            />
          </div>
        )}
      </main>

      {/* Goal Reached Congratulatory Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="achievement-modal-overlay">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden" id="achievement-modal-box">
            
            {/* Celebration Sparkles */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl" />

            <span className="text-5xl block mb-4" id="celebration-emoji">🏆</span>
            
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2" id="celebration-title">
              축하합니다! 3,000만 원 돌파!
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6" id="celebration-message">
              가상 자금 {INITIAL_CAPITAL.toLocaleString()}원으로 투자를 시작해 드디어 꿈의 자산 <strong className="text-rose-600 dark:text-rose-400 font-extrabold">{TARGET_GOAL.toLocaleString()}원(3천만 원)</strong>을 성공적으로 초과 달성했습니다! 
              탁월한 주가 분석 능력과 탁월한 결단력을 증명하셨습니다.
            </p>

            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-850 mb-6 flex justify-around text-center" id="celebration-stats">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-0.5">최종 도달 자산</span>
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(totalAssets)}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-0.5">소요 기간</span>
                <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">Day {day}</span>
              </div>
            </div>

            <div className="flex gap-3" id="celebration-buttons">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 border border-transparent dark:border-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                계속 투자하기
              </button>
              <button
                onClick={handleResetGame}
                className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded-xl text-xs font-bold transition-colors"
              >
                새로운 도전 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" id="reset-modal-overlay">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center relative overflow-hidden" id="reset-modal-box">
            
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            
            <span className="text-5xl block mb-4" id="reset-emoji">⚠️</span>
            
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2" id="reset-title">
              게임을 초기화하시겠습니까?
            </h3>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6" id="reset-message">
              현재까지 진행된 모의 투자 정보가 완전히 초기화되며 다시 복구할 수 없습니다.<br />
              처음부터 신규 투자 시즌을 시작하시겠습니까?
            </p>

            <div className="bg-slate-50 dark:bg-slate-950/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-850 mb-6 text-left space-y-2.5 text-xs" id="reset-current-stats">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-semibold">현재 경과 일수</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Day {day}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-semibold">현재 평가 자산</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(totalAssets)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-semibold">초기 자본금으로 변경</span>
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                  {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(INITIAL_CAPITAL)} (1천만 원)
                </span>
              </div>
            </div>

            <div className="flex gap-3" id="reset-buttons">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
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
