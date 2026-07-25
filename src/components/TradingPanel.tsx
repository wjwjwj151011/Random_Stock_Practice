import React, { useState, useEffect } from 'react';
import { Stock, PortfolioItem, AutoSellOrder } from '../types';

interface TradingPanelProps {
  stock: Stock;
  cash: number;
  portfolioItem: PortfolioItem | undefined;
  onTrade: (type: 'BUY' | 'SELL', shares: number) => void;
  autoSellOrders: AutoSellOrder[];
  onAddAutoSellOrder: (targetPrice: number, shares: number, sellAll: boolean) => void;
  onCancelAutoSellOrder: (orderId: string) => void;
}

export default function TradingPanel({
  stock,
  cash,
  portfolioItem,
  onTrade,
  autoSellOrders,
  onAddAutoSellOrder,
  onCancelAutoSellOrder
}: TradingPanelProps) {
  const [tab, setTab] = useState<'BUY' | 'SELL' | 'AUTO_SELL'>('BUY');
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const [error, setError] = useState<string | null>(null);

  // Auto-sell local states
  const [targetPriceStr, setTargetPriceStr] = useState<string>('');
  const [autoSellQuantityStr, setAutoSellQuantityStr] = useState<string>('1');
  const [sellAll, setSellAll] = useState<boolean>(true);
  const [autoSellError, setAutoSellError] = useState<string | null>(null);
  const [autoSellSuccess, setAutoSellSuccess] = useState<string | null>(null);

  const heldShares = portfolioItem?.shares || 0;
  const avgBuyPrice = portfolioItem?.avgBuyPrice || 0;
  const quantity = parseInt(quantityStr) || 0;

  // Reset quantity and auto-sell settings when stock changes or tab changes
  useEffect(() => {
    setQuantityStr('1');
    setError(null);
    setTargetPriceStr(Math.round(stock.price * 1.1).toString()); // Default 10% target
    setAutoSellQuantityStr(portfolioItem ? portfolioItem.shares.toString() : '1');
    setSellAll(true);
    setAutoSellError(null);
    setAutoSellSuccess(null);
  }, [stock.id, tab]);

  // Format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalCost = quantity * stock.price;

  // Max calculations
  const maxBuyable = Math.floor(cash / stock.price);
  const maxSellable = heldShares;

  const handleQuantityChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setQuantityStr(clean);
    setError(null);
  };

  const handlePreset = (percent: number) => {
    if (tab === 'BUY') {
      const targetCash = cash * percent;
      const calculated = Math.floor(targetCash / stock.price);
      setQuantityStr(Math.max(0, calculated).toString());
    } else {
      const calculated = Math.floor(heldShares * percent);
      setQuantityStr(calculated.toString());
    }
    setError(null);
  };

  // Add quantity based on monetary budget (e.g. +100k, +1m KRW)
  const handleMonetaryAdd = (amountKRW: number) => {
    if (tab === 'BUY') {
      const additionalShares = Math.floor(amountKRW / stock.price);
      const nextShares = Math.min(maxBuyable, (parseInt(quantityStr) || 0) + additionalShares);
      setQuantityStr(nextShares.toString());
    } else {
      const valueOfShares = amountKRW;
      const sharesToSell = Math.floor(valueOfShares / stock.price);
      const nextShares = Math.min(maxSellable, (parseInt(quantityStr) || 0) + sharesToSell);
      setQuantityStr(nextShares.toString());
    }
    setError(null);
  };

  const handleIncrement = (amount: number) => {
    const current = parseInt(quantityStr) || 0;
    const next = Math.max(0, current + amount);
    if (tab === 'BUY' && next > maxBuyable) {
      setQuantityStr(maxBuyable.toString());
    } else if (tab === 'SELL' && next > maxSellable) {
      setQuantityStr(maxSellable.toString());
    } else {
      setQuantityStr(next.toString());
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError('수량을 1주 이상 입력해 주세요.');
      return;
    }

    if (tab === 'BUY') {
      if (totalCost > cash) {
        setError('예수금이 부족합니다.');
        return;
      }
      onTrade('BUY', quantity);
    } else {
      if (quantity > heldShares) {
        setError('보유 수량보다 많은 주식을 매도할 수 없습니다.');
        return;
      }
      onTrade('SELL', quantity);
    }

    setQuantityStr('1');
    setError(null);
  };

  const handleAutoSellTargetPreset = (percent: number) => {
    const calculated = Math.round(stock.price * (1 + percent));
    setTargetPriceStr(calculated.toString());
    setAutoSellError(null);
  };

  const handleAutoSellQuantityPreset = (percent: number) => {
    setSellAll(false);
    const calculated = Math.floor(heldShares * percent);
    setAutoSellQuantityStr(Math.max(1, calculated).toString());
    setAutoSellError(null);
  };

  const handleAutoSellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAutoSellError(null);
    setAutoSellSuccess(null);

    const targetPrice = parseInt(targetPriceStr) || 0;
    const shares = parseInt(autoSellQuantityStr) || 0;

    if (heldShares <= 0) {
      setAutoSellError('해당 주식을 보유하고 있어야 자동 판매를 설정할 수 있습니다.');
      return;
    }

    if (targetPrice <= stock.price) {
      setAutoSellError('목표 감시가는 현재가보다 높아야 설정할 수 있습니다.');
      return;
    }

    if (!sellAll && (shares <= 0 || shares > heldShares)) {
      setAutoSellError(`매도할 수량은 1주 이상, 보유 수량(${heldShares.toLocaleString()}주) 이하로 입력해야 합니다.`);
      return;
    }

    onAddAutoSellOrder(targetPrice, sellAll ? heldShares : shares, sellAll);
    setAutoSellSuccess('지정가 자동 매도 등록이 완료되었습니다!');
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setAutoSellSuccess(null);
    }, 3000);
  };

  // Stock holding P&L
  const profitLoss = heldShares > 0 ? (stock.price - avgBuyPrice) * heldShares : 0;
  const profitLossPercent = heldShares > 0 ? ((stock.price - avgBuyPrice) / avgBuyPrice) * 100 : 0;

  // Real-time trading validity check
  const isInvalid = quantity <= 0 || (tab === 'BUY' && totalCost > cash) || (tab === 'SELL' && quantity > heldShares);
  const buttonText = () => {
    if (quantity <= 0) return '수량을 입력해 주세요';
    if (tab === 'BUY') {
      if (totalCost > cash) return '예수금 부족';
      return `${quantity.toLocaleString()}주 매수 (${formatKRW(totalCost)})`;
    } else {
      if (quantity > heldShares) return '보유량 초과';
      return `${quantity.toLocaleString()}주 매도 (${formatKRW(totalCost)})`;
    }
  };

  const currentStockAutoSellOrders = autoSellOrders.filter(
    (order) => order.stockId === stock.id && order.isActive
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-full justify-between overflow-y-auto max-h-[540px] lg:max-h-none animate-fade-in transition-all duration-200" id="trading-panel-card">
      <div id="trading-tabs-header">
        {/* Buy/Sell/Auto-Sell Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/80 dark:bg-slate-950/80 p-1 rounded-xl mb-2.5" id="trading-tabs">
          <button
            onClick={() => setTab('BUY')}
            className={`py-1.5 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'BUY'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            id="tab-buy"
          >
            <span>🔴</span>
            <span>매수</span>
          </button>
          <button
            onClick={() => setTab('SELL')}
            className={`py-1.5 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'SELL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            id="tab-sell"
          >
            <span>🔵</span>
            <span>매도</span>
          </button>
          <button
            onClick={() => setTab('AUTO_SELL')}
            className={`py-1.5 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'AUTO_SELL'
                ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            id="tab-autosell"
          >
            <span>⚙️</span>
            <span>자동매도</span>
          </button>
        </div>

        {/* Selected Stock Info */}
        <div className="mb-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100/80 dark:border-slate-850" id="stock-trading-info">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-550">선택 종목</span>
            <span className="font-mono text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-200/60 dark:bg-slate-900 px-1 py-0.2 rounded">{stock.ticker}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{stock.name}</span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{formatKRW(stock.price)}</span>
          </div>
        </div>

        {/* Holding Info */}
        <div className="mb-2.5 space-y-1 text-[11px]" id="holding-stats">
          <div className="flex justify-between py-0.5 border-b border-dashed border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 dark:text-slate-500">내 보유 수량</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{heldShares.toLocaleString()} 주</span>
          </div>
          {heldShares > 0 && (
            <>
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">평균 매수가</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{formatKRW(avgBuyPrice)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500">평가 손익</span>
                <span className={`font-mono font-bold ${profitLoss >= 0 ? 'text-rose-600 dark:text-rose-450' : 'text-blue-600 dark:text-blue-400'}`}>
                  {formatKRW(profitLoss)} ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400 dark:text-slate-500">
              {tab === 'BUY' ? '주문 가능 예수금' : tab === 'SELL' ? '매도 가능 수량' : '매도 가능 수량'}
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {tab === 'BUY' ? formatKRW(cash) : `${heldShares.toLocaleString()} 주`}
            </span>
          </div>
        </div>

        {/* Form area depending on active tab */}
        {tab === 'AUTO_SELL' ? (
          <form onSubmit={handleAutoSellSubmit} className="space-y-2.5" id="autosell-form">
            {/* Target Price */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">목표 감시 가격 설정</label>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">현재가 대비 지정 비율 예약</span>
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={targetPriceStr}
                  onChange={(e) => {
                    setTargetPriceStr(e.target.value.replace(/[^0-9]/g, ''));
                    setAutoSellError(null);
                  }}
                  placeholder="0"
                  className="w-full text-center font-mono font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-700 bg-white dark:bg-slate-950 h-7 text-xs animate-fade-in"
                />
              </div>
              {/* Target Price Presets */}
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => handleAutoSellTargetPreset(0.05)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                >
                  +5%
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoSellTargetPreset(0.10)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                >
                  +10%
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoSellTargetPreset(0.20)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                >
                  +20%
                </button>
                <button
                  type="button"
                  onClick={() => handleAutoSellTargetPreset(0.50)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                >
                  +50%
                </button>
              </div>
            </div>

            {/* Sell Mode Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">자동 분할 매도 방식</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-100/60 dark:bg-slate-950/60 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setSellAll(true)}
                  className={`py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    sellAll
                      ? 'bg-slate-800 dark:bg-slate-700 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  전량 매도
                </button>
                <button
                  type="button"
                  onClick={() => setSellAll(false)}
                  className={`py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                    !sellAll
                      ? 'bg-slate-800 dark:bg-slate-700 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  지정 수량만
                </button>
              </div>
            </div>

            {/* Custom Quantity */}
            {!sellAll && (
              <div className="space-y-1 animate-fade-in">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">지정 매도 수량</label>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">보유: {heldShares.toLocaleString()}주</span>
                </div>
                <input
                  type="text"
                  value={autoSellQuantityStr}
                  onChange={(e) => {
                    setAutoSellQuantityStr(e.target.value.replace(/[^0-9]/g, ''));
                    setAutoSellError(null);
                  }}
                  className="w-full text-center font-mono font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-700 bg-white dark:bg-slate-950 h-7 text-xs"
                />
                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => handleAutoSellQuantityPreset(0.1)}
                    className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                  >
                    10%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoSellQuantityPreset(0.25)}
                    className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoSellQuantityPreset(0.5)}
                    className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoSellQuantityPreset(1.0)}
                    className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 rounded-md transition-colors cursor-pointer"
                  >
                    100%
                  </button>
                </div>
              </div>
            )}

            {autoSellError && (
              <div className="text-rose-500 text-[9px] font-semibold bg-rose-50 dark:bg-rose-955/25 border border-rose-100 dark:border-rose-900/40 rounded-md p-1.5 text-center animate-shake">
                ⚠️ {autoSellError}
              </div>
            )}

            {autoSellSuccess && (
              <div className="text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-955/25 border border-emerald-100 dark:border-emerald-900/40 rounded-md p-1.5 text-center">
                ✨ {autoSellSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={heldShares <= 0}
              className={`w-full py-1 rounded-md font-bold text-[10px] tracking-wide text-white transition-all duration-200 shadow-xs flex items-center justify-center gap-1 cursor-pointer ${
                heldShares <= 0
                  ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500 shadow-none'
                  : 'bg-slate-800 dark:bg-slate-200 hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900'
              }`}
            >
              ⚙️ 자동 판매(매도) 예약 등록
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2" id="trading-form">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">거래 수량 지정</label>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">최대: {tab === 'BUY' ? maxBuyable.toLocaleString() : maxSellable.toLocaleString()}주</span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleIncrement(-10)}
                  className="w-7 h-7 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md font-bold flex items-center justify-center transition-colors text-[9px] cursor-pointer"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrement(-1)}
                  className="w-7 h-7 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md font-bold flex items-center justify-center transition-colors text-[9px] cursor-pointer"
                >
                  -1
                </button>
                <input
                  type="text"
                  value={quantityStr}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="0"
                  className="flex-1 text-center font-mono font-bold text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-700 bg-white dark:bg-slate-950 h-7 text-xs"
                  id="quantity-input"
                />
                <button
                  type="button"
                  onClick={() => handleIncrement(1)}
                  className="w-7 h-7 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md font-bold flex items-center justify-center transition-colors text-[9px] cursor-pointer"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrement(10)}
                  className="w-7 h-7 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md font-bold flex items-center justify-center transition-colors text-[9px] cursor-pointer"
                >
                  +10
                </button>
              </div>
            </div>

            {/* Quick presets (Percent) */}
            <div className="space-y-0.5">
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block">비율 지정</span>
              <div className="grid grid-cols-4 gap-1" id="presets-grid">
                <button
                  type="button"
                  onClick={() => handlePreset(0.1)}
                  className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md transition-colors cursor-pointer"
                >
                  10%
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(0.25)}
                  className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md transition-colors cursor-pointer"
                >
                  25%
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(0.5)}
                  className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950/40 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-md transition-colors cursor-pointer"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(1.0)}
                  className="py-0.5 text-[9px] font-bold border border-slate-150 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition-colors cursor-pointer"
                >
                  전량
                </button>
              </div>
            </div>

            {/* Quick presets (KRW Value amount) */}
            <div className="space-y-0.5">
              <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block">금액별 추가</span>
              <div className="grid grid-cols-4 gap-1" id="presets-monetary-grid">
                <button
                  type="button"
                  onClick={() => handleMonetaryAdd(100000)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  +10만
                </button>
                <button
                  type="button"
                  onClick={() => handleMonetaryAdd(500000)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  +50만
                </button>
                <button
                  type="button"
                  onClick={() => handleMonetaryAdd(1000000)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  +100만
                </button>
                <button
                  type="button"
                  onClick={() => handleMonetaryAdd(5000000)}
                  className="py-0.5 text-[9px] font-bold bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  +500만
                </button>
              </div>
            </div>

            {error && (
              <div className="text-rose-500 dark:text-rose-450 text-[10px] font-semibold bg-rose-50 dark:bg-rose-955/25 border border-rose-100 dark:border-rose-900/40 rounded-lg p-2 text-center animate-shake">
                ⚠️ {error}
              </div>
            )}
          </form>
        )}
      </div>

      {tab === 'AUTO_SELL' ? (
        /* Auto-sell current list footer */
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800" id="autosell-panel-footer">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-slate-500 dark:text-slate-400">등록된 자동 매도 예약</span>
            <span className="font-mono text-slate-400 dark:text-slate-550">{currentStockAutoSellOrders.length}건</span>
          </div>
          <div className="mt-1.5 space-y-1 max-h-[70px] overflow-y-auto pr-0.5" id="active-autosells-footer">
            {currentStockAutoSellOrders.length === 0 ? (
              <span className="text-[9px] text-slate-400 dark:text-slate-550 italic block text-center py-1.5 bg-slate-50/50 dark:bg-slate-950/30 rounded border border-dashed border-slate-100/50 dark:border-slate-850">
                현재 주식의 자동 매도 설정이 없습니다.
              </span>
            ) : (
              currentStockAutoSellOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex justify-between items-center p-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded text-[9px] font-mono hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      📈 {formatKRW(ord.targetPrice)} 이상 도달 시
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500">
                      {ord.sellAll ? '보유 전량 매도' : `${ord.shares.toLocaleString()}주 매도`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCancelAutoSellOrder(ord.id)}
                    className="p-0.5 px-1.5 text-[8px] font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded border border-rose-100 dark:border-rose-900/35 cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Original Cost estimate & Balance forecast Footer */
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800" id="trading-action-footer">
          <div className="space-y-0.5 mb-2.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-400 dark:text-slate-550">총 주문 금액</span>
              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{formatKRW(totalCost)}</span>
            </div>
            {quantity > 0 && (
              <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500">
                <span>거래 후 예상 예수금</span>
                <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                  {tab === 'BUY' ? formatKRW(cash - totalCost) : formatKRW(cash + totalCost)}
                </span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isInvalid}
            className={`w-full py-2.5 px-4 rounded-xl font-black text-xs tracking-wide text-white transition-all duration-200 shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
              isInvalid
                ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-650 shadow-none'
                : tab === 'BUY'
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 active:scale-[0.98] ring-2 ring-rose-500/20 shadow-rose-600/20'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] ring-2 ring-blue-500/20 shadow-blue-600/20'
            }`}
            id="trade-submit-button"
          >
            <span className="text-sm">{tab === 'BUY' ? '🔴' : '🔵'}</span>
            <span>{buttonText()}</span>
          </button>
        </div>
      )}
    </div>
  );
}
