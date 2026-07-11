import React, { useState, useEffect } from 'react';
import { Stock, PortfolioItem } from '../types';

interface TradingPanelProps {
  stock: Stock;
  cash: number;
  portfolioItem: PortfolioItem | undefined;
  onTrade: (type: 'BUY' | 'SELL', shares: number) => void;
}

export default function TradingPanel({ stock, cash, portfolioItem, onTrade }: TradingPanelProps) {
  const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
  const [quantityStr, setQuantityStr] = useState<string>('1');
  const [error, setError] = useState<string | null>(null);

  const heldShares = portfolioItem?.shares || 0;
  const avgBuyPrice = portfolioItem?.avgBuyPrice || 0;
  const quantity = parseInt(quantityStr) || 0;

  // Reset quantity when stock changes or tab changes
  useEffect(() => {
    setQuantityStr('1');
    setError(null);
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

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex flex-col h-full justify-between animate-fade-in" id="trading-panel-card">
      <div id="trading-tabs-header">
        {/* Buy/Sell Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100/60 p-0.5 rounded-lg mb-2.5" id="trading-tabs">
          <button
            onClick={() => setTab('BUY')}
            className={`py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
              tab === 'BUY'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-buy"
          >
            🔴 매수 (Buy)
          </button>
          <button
            onClick={() => setTab('SELL')}
            className={`py-1 text-[11px] font-bold rounded-md transition-all duration-200 ${
              tab === 'SELL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="tab-sell"
          >
            🔵 매도 (Sell)
          </button>
        </div>

        {/* Selected Stock Info */}
        <div className="mb-2 p-2 rounded-lg bg-slate-50 border border-slate-100/80" id="stock-trading-info">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[9px] font-semibold text-slate-400">선택 종목</span>
            <span className="font-mono text-[9px] font-bold text-slate-500 uppercase bg-slate-200/60 px-1 py-0.2 rounded">{stock.ticker}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold text-slate-800">{stock.name}</span>
            <span className="font-mono text-xs font-bold text-slate-900">{formatKRW(stock.price)}</span>
          </div>
        </div>

        {/* Holding Info */}
        <div className="mb-2.5 space-y-1 text-[11px]" id="holding-stats">
          <div className="flex justify-between py-0.5 border-b border-dashed border-slate-100">
            <span className="text-slate-400">내 보유 수량</span>
            <span className="font-mono font-bold text-slate-800">{heldShares.toLocaleString()} 주</span>
          </div>
          {heldShares > 0 && (
            <>
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-100">
                <span className="text-slate-400">평균 매수가</span>
                <span className="font-mono font-semibold text-slate-800">{formatKRW(avgBuyPrice)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-dashed border-slate-100">
                <span className="text-slate-400">평가 손익</span>
                <span className={`font-mono font-bold ${profitLoss >= 0 ? 'text-rose-600' : 'text-blue-600'}`}>
                  {formatKRW(profitLoss)} ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between py-0.5">
            <span className="text-slate-400">
              {tab === 'BUY' ? '주문 가능 예수금' : '매도 가능 수량'}
            </span>
            <span className="font-mono font-bold text-slate-800">
              {tab === 'BUY' ? formatKRW(cash) : `${heldShares.toLocaleString()} 주`}
            </span>
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="space-y-2" id="trading-form">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-500">거래 수량 지정</label>
              <span className="text-[9px] text-slate-400 font-mono">최대: {tab === 'BUY' ? maxBuyable.toLocaleString() : maxSellable.toLocaleString()}주</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleIncrement(-10)}
                className="w-7 h-7 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-bold flex items-center justify-center transition-colors text-[9px]"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleIncrement(-1)}
                className="w-7 h-7 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-bold flex items-center justify-center transition-colors text-[9px]"
              >
                -1
              </button>
              <input
                type="text"
                value={quantityStr}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="0"
                className="flex-1 text-center font-mono font-bold text-slate-800 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 h-7 text-xs"
                id="quantity-input"
              />
              <button
                type="button"
                onClick={() => handleIncrement(1)}
                className="w-7 h-7 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-bold flex items-center justify-center transition-colors text-[9px]"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => handleIncrement(10)}
                className="w-7 h-7 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md font-bold flex items-center justify-center transition-colors text-[9px]"
              >
                +10
              </button>
            </div>
          </div>

          {/* Quick presets (Percent) */}
          <div className="space-y-0.5">
            <span className="text-[9px] font-semibold text-slate-400 block">비율 지정</span>
            <div className="grid grid-cols-4 gap-1" id="presets-grid">
              <button
                type="button"
                onClick={() => handlePreset(0.1)}
                className="py-0.5 text-[9px] font-bold border border-slate-150 hover:bg-slate-50 text-slate-600 rounded-md transition-colors"
              >
                10%
              </button>
              <button
                type="button"
                onClick={() => handlePreset(0.25)}
                className="py-0.5 text-[9px] font-bold border border-slate-150 hover:bg-slate-50 text-slate-600 rounded-md transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handlePreset(0.5)}
                className="py-0.5 text-[9px] font-bold border border-slate-150 hover:bg-slate-50 text-slate-600 rounded-md transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handlePreset(1.0)}
                className="py-0.5 text-[9px] font-bold border border-slate-150 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
              >
                전량
              </button>
            </div>
          </div>

          {/* Quick presets (KRW Value amount) */}
          <div className="space-y-0.5">
            <span className="text-[9px] font-semibold text-slate-400 block">금액별 추가</span>
            <div className="grid grid-cols-4 gap-1" id="presets-monetary-grid">
              <button
                type="button"
                onClick={() => handleMonetaryAdd(100000)}
                className="py-0.5 text-[9px] font-bold bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700 rounded-md transition-colors"
              >
                +10만
              </button>
              <button
                type="button"
                onClick={() => handleMonetaryAdd(500000)}
                className="py-0.5 text-[9px] font-bold bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700 rounded-md transition-colors"
              >
                +50만
              </button>
              <button
                type="button"
                onClick={() => handleMonetaryAdd(1000000)}
                className="py-0.5 text-[9px] font-bold bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700 rounded-md transition-colors"
              >
                +100만
              </button>
              <button
                type="button"
                onClick={() => handleMonetaryAdd(5000000)}
                className="py-0.5 text-[9px] font-bold bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-700 rounded-md transition-colors"
              >
                +500만
              </button>
            </div>
          </div>

          {error && (
            <div className="text-rose-500 text-[10px] font-semibold bg-rose-50 border border-rose-100 rounded-lg p-2 text-center">
              ⚠️ {error}
            </div>
          )}
        </form>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100" id="trading-action-footer">
        {/* Cost estimate & Balance forecast */}
        <div className="space-y-0.5 mb-2.5 text-[11px]">
          <div className="flex justify-between items-center">
            <span className="font-medium text-slate-400">총 주문 금액</span>
            <span className="font-mono text-xs font-bold text-slate-900">{formatKRW(totalCost)}</span>
          </div>
          {quantity > 0 && (
            <div className="flex justify-between items-center text-[9px] text-slate-400">
              <span>거래 후 예상 예수금</span>
              <span className="font-mono font-medium text-slate-600">
                {tab === 'BUY' ? formatKRW(cash - totalCost) : formatKRW(cash + totalCost)}
              </span>
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isInvalid}
          className={`w-full py-1.5 rounded-lg font-bold text-[11px] tracking-wide text-white transition-all duration-200 shadow-xs flex items-center justify-center gap-1 ${
            isInvalid
              ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
              : tab === 'BUY'
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.99] focus:ring-4 focus:ring-rose-100'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus:ring-4 focus:ring-blue-100'
          }`}
          id="trade-submit-button"
        >
          {tab === 'BUY' ? '🔴' : '🔵'} {buttonText()}
        </button>
      </div>
    </div>
  );
}
