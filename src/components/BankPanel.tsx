import { useState } from 'react';

interface BankPanelProps {
  cash: number;
  savings: number;
  loan: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onBorrow: (amount: number) => void;
  onRepay: (amount: number) => void;
  savingsRate: number; // e.g. 0.005 (0.5%)
  loanRate: number;    // e.g. 0.012 (1.2%)
  day: number;
  onReturnToTrading: () => void;
}

export default function BankPanel({
  cash,
  savings,
  loan,
  onDeposit,
  onWithdraw,
  onBorrow,
  onRepay,
  savingsRate,
  loanRate,
  day,
  onReturnToTrading
}: BankPanelProps) {
  const [savingsInput, setSavingsInput] = useState<string>('');
  const [loanInput, setLoanInput] = useState<string>('');

  const [savingsError, setSavingsError] = useState<string>('');
  const [loanError, setLoanError] = useState<string>('');

  const MAX_LOAN_LIMIT = 20000000; // 2천만 원

  // Format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleDepositSubmit = () => {
    const amount = parseInt(savingsInput);
    if (isNaN(amount) || amount <= 0) {
      setSavingsError('올바른 예금 금액을 입력해 주세요.');
      return;
    }
    if (amount > cash) {
      setSavingsError('보유한 예수금이 부족합니다.');
      return;
    }
    onDeposit(amount);
    setSavingsInput('');
    setSavingsError('');
  };

  const handleWithdrawSubmit = () => {
    const amount = parseInt(savingsInput);
    if (isNaN(amount) || amount <= 0) {
      setSavingsError('올바른 출금 금액을 입력해 주세요.');
      return;
    }
    if (amount > savings) {
      setSavingsError('예금 잔액이 부족합니다.');
      return;
    }
    onWithdraw(amount);
    setSavingsInput('');
    setSavingsError('');
  };

  const handleBorrowSubmit = () => {
    const amount = parseInt(loanInput);
    if (isNaN(amount) || amount <= 0) {
      setLoanError('올바른 대출 금액을 입력해 주세요.');
      return;
    }
    const maxAvailable = Math.max(0, MAX_LOAN_LIMIT - loan);
    if (amount > maxAvailable) {
      setLoanError(`대출 한도를 초과했습니다. (추가 가능액: ${formatKRW(maxAvailable)})`);
      return;
    }
    onBorrow(amount);
    setLoanInput('');
    setLoanError('');
  };

  const handleRepaySubmit = () => {
    const amount = parseInt(loanInput);
    if (isNaN(amount) || amount <= 0) {
      setLoanError('올바른 상환 금액을 입력해 주세요.');
      return;
    }
    if (amount > cash) {
      setLoanError('보유한 예수금이 부족합니다.');
      return;
    }
    if (amount > loan) {
      setLoanError('대출 잔액을 초과하여 상환할 수 없습니다.');
      return;
    }
    onRepay(amount);
    setLoanInput('');
    setLoanError('');
  };

  // Shortcut setters
  const applySavingsPreset = (type: 'CASH_ALL' | 'SAVINGS_ALL' | number) => {
    setSavingsError('');
    if (type === 'CASH_ALL') {
      setSavingsInput(cash.toString());
    } else if (type === 'SAVINGS_ALL') {
      setSavingsInput(savings.toString());
    } else {
      setSavingsInput(type.toString());
    }
  };

  const applyLoanPreset = (type: 'MAX_BORROW' | 'REPAY_ALL' | number) => {
    setLoanError('');
    if (type === 'MAX_BORROW') {
      const maxAvailable = Math.max(0, MAX_LOAN_LIMIT - loan);
      setLoanInput(maxAvailable.toString());
    } else if (type === 'REPAY_ALL') {
      setLoanInput(Math.min(cash, loan).toString());
    } else {
      setLoanInput(type.toString());
    }
  };

  // Interest estimates
  const estSavingsInterest = Math.round(savings * savingsRate);
  const estLoanInterest = Math.round(loan * loanRate);

  return (
    <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-md max-w-4xl mx-auto" id="bank-control-panel">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-200/60 dark:border-slate-800/60" id="bank-header">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            🏦 중앙 은행 모의 금융 서비스
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            원금 손실 걱정이 없는 안전한 예금과 투자를 위한 자금 마련 대출 서비스를 이용해 보세요.
          </p>
        </div>
        <button
          onClick={onReturnToTrading}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 border border-transparent dark:border-slate-700 font-bold text-[10px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
          id="btn-return-trading"
        >
          📈 거래소 가기
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" id="bank-status-grid">
        
        {/* Core Wallet */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs flex flex-col justify-between" id="wallet-card">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1">나의 보유 예수금 (현금)</span>
            <span className="font-mono text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatKRW(cash)}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <span>주식 및 대금 상환 가능 재원</span>
            <span className="text-emerald-500 font-bold">● 즉시 사용가능</span>
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs flex flex-col justify-between" id="savings-card">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">은행 총 예금 잔액</span>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                연리 이자 { (savingsRate * 100).toFixed(1) }% / 일
              </span>
            </div>
            <span className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight block">
              {formatKRW(savings)}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <span>내일 받게 될 예상 이자</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">+{formatKRW(estSavingsInterest)}</span>
          </div>
        </div>

        {/* Loan Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs flex flex-col justify-between" id="loan-card">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">받은 대출 잔액</span>
              <span className="text-[10px] bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-bold">
                이자 { (loanRate * 100).toFixed(1) }% / 일
              </span>
            </div>
            <span className={`font-mono text-xl font-extrabold tracking-tight block ${loan > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {formatKRW(loan)}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
            <span>내일 추가될 누적 이자</span>
            <span className={`font-mono font-bold ${loan > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>
              +{formatKRW(estLoanInterest)}
            </span>
          </div>
        </div>

      </div>

      {/* Interface Workplaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="bank-actions">
        
        {/* Savings Section (Left) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs" id="savings-action-card">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5 mb-4">
            💰 예금 입출금 관리
          </h3>
          
          <div className="space-y-4">
            {/* Input Group */}
            <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">거래 희망 금액 (KRW)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="금액을 입력하세요"
                  value={savingsInput}
                  onChange={(e) => {
                    setSavingsInput(e.target.value);
                    setSavingsError('');
                  }}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-400 transition-all pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
              </div>
              {savingsError && (
                <p className="text-[10px] font-bold text-rose-500 mt-1.5">{savingsError}</p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => applySavingsPreset(100000)}
                className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                +10만
              </button>
              <button
                onClick={() => applySavingsPreset(1000000)}
                className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                +100만
              </button>
              <button
                onClick={() => applySavingsPreset(5000000)}
                className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                +500만
              </button>
              <button
                onClick={() => applySavingsPreset('CASH_ALL')}
                className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/30 rounded text-[9px] font-bold text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                예수금 전액
              </button>
              <button
                onClick={() => applySavingsPreset('SAVINGS_ALL')}
                className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 rounded text-[9px] font-bold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
              >
                예금 잔액
              </button>
            </div>

            {/* Submit Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleDepositSubmit}
                disabled={cash <= 0}
                className="py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-bold text-[10px] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                💰 은행 예금
              </button>
              <button
                onClick={handleWithdrawSubmit}
                disabled={savings <= 0}
                className="py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 text-white font-bold text-[10px] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                📤 예금 출금
              </button>
            </div>
          </div>
        </div>

        {/* Loan Section (Right) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs" id="loan-action-card">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5 mb-4">
            💸 대출 및 상환 관리
          </h3>

          <div className="space-y-4">
            {/* Input Group */}
            <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block mb-1.5">대출 또는 상환 금액 (KRW)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="금액을 입력하세요"
                  value={loanInput}
                  onChange={(e) => {
                    setLoanInput(e.target.value);
                    setLoanError('');
                  }}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-400 transition-all pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">원</span>
              </div>
              {loanError && (
                <p className="text-[10px] font-bold text-rose-500 mt-1.5">{loanError}</p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => applyLoanPreset(500000)}
                className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                +50만
              </button>
              <button
                onClick={() => applyLoanPreset(2000000)}
                className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                +200만
              </button>
              <button
                onClick={() => applyLoanPreset(5000000)}
                className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              >
                +500만
              </button>
              <button
                onClick={() => applyLoanPreset('MAX_BORROW')}
                className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-100 dark:border-rose-900/30 rounded text-[9px] font-bold text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              >
                최대 대출
              </button>
              <button
                onClick={() => applyLoanPreset('REPAY_ALL')}
                className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 border border-amber-100 dark:border-amber-900/30 rounded text-[9px] font-bold text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
              >
                전액 상환
              </button>
            </div>

            {/* Submit Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleBorrowSubmit}
                disabled={loan >= MAX_LOAN_LIMIT}
                className="py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white font-bold text-[10px] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                💸 대출 실행
              </button>
              <button
                onClick={handleRepaySubmit}
                disabled={loan <= 0 || cash <= 0}
                className="py-1.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                ↩️ 대출 상환
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Credit Info Warning Box */}
      <div className="mt-6 bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-400 flex gap-3 items-start" id="bank-rules-notice">
        <span className="text-xl">💡</span>
        <div className="space-y-1">
          <h4 className="font-bold">중앙은행 모의 투자 금융 교육 가이드</h4>
          <p className="leading-relaxed font-medium">
            1. <strong>예금 이자 (연리 { (savingsRate * 100).toFixed(1) }% / 일)</strong>: 예수금을 예금에 이체하면 매일 자정이 지날 때마다 복리 이자가 발생합니다. 주식 폭락장이나 안전 자산 확보가 필요할 때 탁월한 대안입니다.<br />
            2. <strong>대출 원리금 (이자 { (loanRate * 100).toFixed(1) }% / 일)</strong>: 레버리지를 활용해 급등주에 매매 기회를 잡을 수 있으나, 대출 이자율이 예금 이자율의 2배가 넘으므로 신중해야 합니다. 대출 이자는 매일 누적되므로 고위험을 수반합니다.<br />
            3. <strong>대출 한도</strong>: 모의 금융 대출은 최대 <strong>{formatKRW(MAX_LOAN_LIMIT)}</strong>까지만 실행 가능합니다.
          </p>
        </div>
      </div>

    </div>
  );
}
