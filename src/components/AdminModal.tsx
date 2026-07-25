import React, { useState } from 'react';
import { Stock, User } from '../types';
import { ShieldAlert, TrendingUp, TrendingDown, DollarSign, Zap, RefreshCw, Layers, Users, X, Check } from 'lucide-react';
import { getRegisteredUsers } from '../lib/auth';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  stocks: Stock[];
  setStocks: React.Dispatch<React.SetStateAction<Stock[]>>;
  cash: number;
  setCash: React.Dispatch<React.SetStateAction<number>>;
  setLoan: React.Dispatch<React.SetStateAction<number>>;
  onTriggerNews: (title: string, content: string, impact: 'POS' | 'NEG' | 'NEU') => void;
}

export default function AdminModal({
  isOpen,
  onClose,
  currentUser,
  stocks,
  setStocks,
  cash,
  setCash,
  setLoan,
  onTriggerNews
}: AdminModalProps) {
  const [commandInput, setCommandInput] = useState<string>('');
  const [customCash, setCustomCash] = useState<string>('');
  const [selectedStockId, setSelectedStockId] = useState<string>(stocks[0]?.id || 'dog-coin');
  const [multiplierInput, setMultiplierInput] = useState<string>('2');
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Verify woojin admin permission
  const isAdmin = currentUser?.username.toLowerCase() === 'woojin';

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Command parser for format: ;(아이디) (금액) or ;(아이디) -(금액) -> e.g. ;woojin 5000000 or ;woojin -1000000
  const handleExecuteCommand = (cmdStr?: string) => {
    const rawCmd = (cmdStr || commandInput).trim();
    if (!rawCmd) return;

    // Match ;username +|- amount or username +|- amount (e.g. ;woojin -5000000 or ;woojin - 5000000)
    const match = rawCmd.match(/^;?\s*([^\s]+)\s+([+-]?)\s*([0-9,]+)$/);
    if (!match) {
      showNotice('⚠️ 올바른 명령어 형식이 아닙니다. 예시: ;woojin 5000000 또는 ;woojin -1000000');
      return;
    }

    const targetUsername = match[1].toLowerCase().replace('@', '');
    const isNegative = match[2] === '-';
    const rawNum = parseInt(match[3].replace(/,/g, ''), 10);

    if (isNaN(rawNum) || rawNum <= 0) {
      showNotice('⚠️ 올바른 금액 숫자를 입력해 주세요.');
      return;
    }

    const deltaAmount = isNegative ? -rawNum : rawNum;

    // 1. If targeting current active user, update live cash state
    if (currentUser && currentUser.username.toLowerCase() === targetUsername) {
      setCash((prev) => Math.max(0, prev + deltaAmount));
    }

    // 2. Update persistent user state in localStorage
    const userStateKey = `stock_game_user_state_${targetUsername}`;
    const savedStateStr = localStorage.getItem(userStateKey);
    if (savedStateStr) {
      try {
        const parsed = JSON.parse(savedStateStr);
        parsed.cash = Math.max(0, (parsed.cash || 0) + deltaAmount);
        localStorage.setItem(userStateKey, JSON.stringify(parsed));
      } catch (e) {
        console.error('Failed to parse user state', e);
      }
    } else if (currentUser && currentUser.username.toLowerCase() === targetUsername) {
      // Create initial state for user if missing
      const newCash = Math.max(0, cash + deltaAmount);
      const newState = { cash: newCash, portfolio: [], savings: 0, loan: 0, day: 1 };
      localStorage.setItem(userStateKey, JSON.stringify(newState));
    }

    if (isNegative) {
      showNotice(`💸 @${targetUsername} 계정에서 ${rawNum.toLocaleString('ko-KR')}원이 차감되었습니다.`);
    } else {
      showNotice(`🎉 @${targetUsername} 계정에 ${rawNum.toLocaleString('ko-KR')}원이 성공적으로 지급되었습니다!`);
    }
    setCommandInput('');
  };

  // Add cash handler
  const handleAddCash = (amount: number) => {
    setCash((prev) => prev + amount);
    showNotice(`+${(amount / 10000).toLocaleString('ko-KR')}만원 현금이 지급되었습니다!`);
  };

  const handleSetExactCash = () => {
    const val = parseInt(customCash.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val) && val >= 0) {
      setCash(val);
      showNotice(`현금이 ${val.toLocaleString('ko-KR')}원으로 설정되었습니다.`);
      setCustomCash('');
    }
  };

  // Clear loan handler
  const handleClearLoan = () => {
    setLoan(0);
    showNotice('모든 대출금이 0원으로 탕감되었습니다.');
  };

  // Pump target stock
  const handlePumpStock = (stockId: string, factor: number) => {
    setStocks((prevStocks) =>
      prevStocks.map((s) => {
        if (s.id === stockId) {
          const newPrice = Math.min(s.maxPrice, Math.round(s.price * factor));
          onTriggerNews(
            `🚀 [속보] ${s.name} (${s.ticker}), 기습 대형 호재로 폭등!`,
            `어드민 특수 연출: ${s.name}의 주가가 ${factor}배 급등하여 ${newPrice.toLocaleString('ko-KR')}원을 기록했습니다.`,
            'POS'
          );
          return {
            ...s,
            prevPrice: s.price,
            price: newPrice,
            history: [...s.history, newPrice]
          };
        }
        return s;
      })
    );
    showNotice(`${stocks.find(s => s.id === stockId)?.name} 가격이 ${factor}배 펌핑되었습니다!`);
  };

  // Dump target stock
  const handleDumpStock = (stockId: string, dropRatio: number) => {
    setStocks((prevStocks) =>
      prevStocks.map((s) => {
        if (s.id === stockId) {
          const newPrice = Math.max(s.minPrice, Math.round(s.price * (1 - dropRatio)));
          onTriggerNews(
            `📉 [속보] ${s.name} (${s.ticker}), 악재 발생으로 폭락!`,
            `어드민 특수 연출: ${s.name}의 주가가 -${Math.round(dropRatio * 100)}% 대폭락하여 ${newPrice.toLocaleString('ko-KR')}원이 되었습니다.`,
            'NEG'
          );
          return {
            ...s,
            prevPrice: s.price,
            price: newPrice,
            history: [...s.history, newPrice]
          };
        }
        return s;
      })
    );
    showNotice(`${stocks.find(s => s.id === stockId)?.name} 가격이 폭락했습니다!`);
  };

  // Super Dog Coin Pump (Meme Miracle)
  const handleDogCoinSuperPump = () => {
    setStocks((prevStocks) =>
      prevStocks.map((s) => {
        if (s.id === 'dog-coin') {
          const targetPrice = 50000; // Surge to 50,000 KRW
          onTriggerNews(
            `🐕 [전설의 떡상] 개독 코인(DOGE), 우주 돌파 50,000원 달성!`,
            `어드민 우진님의 가호로 개독 코인이 기적의 1,000배 폭등세를 기록했습니다!`,
            'POS'
          );
          return {
            ...s,
            prevPrice: s.price,
            price: targetPrice,
            history: [...s.history, targetPrice]
          };
        }
        return s;
      })
    );
    showNotice('🐕 개독 코인이 50,000원 대폭등을 이루었습니다!');
  };

  // Bull Market Global Event
  const handleGlobalBullMarket = () => {
    setStocks((prevStocks) =>
      prevStocks.map((s) => {
        const pump = 1.2 + Math.random() * 0.3;
        const newPrice = Math.min(s.maxPrice, Math.round(s.price * pump));
        return {
          ...s,
          prevPrice: s.price,
          price: newPrice,
          history: [...s.history, newPrice]
        };
      })
    );
    onTriggerNews(
      `🌐 [긴급] 전 세계 증시 슈퍼 불장(Bull Market) 진입!`,
      `어드민 우진발 글로벌 유동성 공급으로 전 종목이 강력한 상승세를 보이고 있습니다.`,
      'POS'
    );
    showNotice('글로벌 불장 이벤트가 발동되었습니다!');
  };

  const registeredUsers = getRegisteredUsers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in" id="admin-modal-overlay">
      <div className="bg-white dark:bg-slate-900 border-2 border-amber-500/80 dark:border-amber-500/60 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4" id="admin-modal-header">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black flex items-center justify-center text-xl shadow-md">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  우진(@woojin) 어드민 콘솔
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/60">
                  ADMIN MASTER
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                주식 시장 및 시스템 자산을 직접 조율하고 이벤트를 제어합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Notice Banner */}
        {notice && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-955/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold p-3 rounded-xl flex items-center gap-2 animate-bounce">
            <Check size={16} className="text-amber-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {!isAdmin ? (
          <div className="py-8 text-center space-y-3">
            <ShieldAlert size={40} className="mx-auto text-rose-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">접근 권한이 제한되었습니다</h3>
            <p className="text-xs text-slate-500">
              어드민 권한은 <span className="font-bold font-mono text-amber-600">@woojin</span> 계정으로 로그인했을 때만 활성화됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Command Terminal Box: ;(아이디) (금액) */}
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-amber-500/50 shadow-inner space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-mono font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="animate-pulse">⚡</span> 어드민 명령어 콘솔
                </span>
                <span className="text-[10px] text-slate-400">형식: ;(아이디) (금액)</span>
              </div>
              <p className="text-[11px] text-slate-300">
                명령어를 입력하면 해당 계정에 금액을 즉시 지급(+)하거나 차감(-)합니다.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecuteCommand();
                }}
                className="flex gap-2 pt-1"
              >
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2 font-mono font-bold text-amber-400 text-xs">&gt;</span>
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder=";woojin 5000000 또는 ;woojin -1000000"
                    className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-bold bg-slate-950 border border-slate-700 text-amber-300 rounded-lg focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                    id="admin-cmd-input"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg transition-colors cursor-pointer text-xs"
                >
                  실행
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecuteCommand(';woojin 5000000')}
                  className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 cursor-pointer"
                >
                  ;woojin 5000000 (+500만)
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand(';woojin -1000000')}
                  className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-rose-300 rounded border border-rose-900/60 cursor-pointer"
                >
                  ;woojin -1000000 (-100만)
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand(';woojin 100000000')}
                  className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 cursor-pointer"
                >
                  ;woojin 100000000 (+1억)
                </button>
              </div>
            </div>

            {/* Section 1: Financial Magic */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                <DollarSign size={15} className="text-emerald-500" />
                <span>어드민 자산 관리 (현재 잔액: {cash.toLocaleString('ko-KR')}원)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => handleAddCash(10000000)}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
                >
                  +1,000만 원 지급
                </button>
                <button
                  onClick={() => handleAddCash(100000000)}
                  className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
                >
                  +1억 원 지급
                </button>
                <button
                  onClick={handleClearLoan}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-lg transition-colors cursor-pointer text-center"
                >
                  대출금 전액 탕감
                </button>
              </div>

              {/* Custom exact cash setter */}
              <div className="flex gap-2 pt-1">
                <input
                  type="number"
                  value={customCash}
                  onChange={(e) => setCustomCash(e.target.value)}
                  placeholder="지정 금액 입력 (예: 50000000)"
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
                <button
                  onClick={handleSetExactCash}
                  className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg cursor-pointer"
                >
                  설정
                </button>
              </div>
            </div>

            {/* Section 2: Stock Market Manipulation */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                  <Zap size={15} className="text-amber-500" />
                  <span>개별 종목 가격 조작</span>
                </div>
                <button
                  onClick={handleDogCoinSuperPump}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-[10px] rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  🐕 개독 코인 5만 원 폭등!
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">대상 종목 선택</label>
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs"
                  >
                    {stocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.price.toLocaleString('ko-KR')}원)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">배율 지정</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={multiplierInput}
                      onChange={(e) => setMultiplierInput(e.target.value)}
                      className="w-20 px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-center font-bold text-xs"
                    />
                    <button
                      onClick={() => handlePumpStock(selectedStockId, parseFloat(multiplierInput) || 2)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                    >
                      <TrendingUp size={13} /> {multiplierInput}배 떡상
                    </button>
                    <button
                      onClick={() => handleDumpStock(selectedStockId, 0.5)}
                      className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
                    >
                      <TrendingDown size={13} /> -50% 폭락
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Global Economic Events */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                <Layers size={15} className="text-indigo-500" />
                <span>글로벌 경제 매크로 이벤트 발동</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleGlobalBullMarket}
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <TrendingUp size={14} /> 전 종목 대불장 이벤트
                </button>
                <button
                  onClick={() => {
                    setStocks((prev) =>
                      prev.map((s) => ({
                        ...s,
                        prevPrice: s.price,
                        price: Math.max(s.minPrice, Math.round(s.price * 0.75)),
                        history: [...s.history, Math.max(s.minPrice, Math.round(s.price * 0.75))]
                      }))
                    );
                    onTriggerNews(
                      `⚡ [긴급] 글로벌 금융 시장 기습 블랙스완 발생!`,
                      `어드민 제어로 인해 글로벌 금융 시장에 -25% 서킷 브레이커급 하락파동이 전파되었습니다.`,
                      'NEG'
                    );
                    showNotice('블랙스완 폭락 이벤트가 발동되었습니다!');
                  }}
                  className="py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <TrendingDown size={14} /> 블랙스완 폭락 이벤트
                </button>
              </div>
            </div>

            {/* Section 4: Registered Users Info */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Users size={15} className="text-amber-500" />
                  <span>등록된 회원 목록 ({registeredUsers.length}명)</span>
                </div>
              </div>
              {registeredUsers.length === 0 ? (
                <p className="text-[11px] text-slate-400">등록된 로컬 회원이 없습니다.</p>
              ) : (
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {registeredUsers.map((u, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg flex justify-between items-center text-[11px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{u.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">@{u.username}</span>
                        {u.username.toLowerCase() === 'woojin' && (
                          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-1 rounded text-[9px]">
                            어드민
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
