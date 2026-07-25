import { Sun, Moon, User as UserIcon, LogIn, ShieldAlert } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  day: number;
  totalAssets: number;
  initialCapital: number;
  highScore: number;
  speed: 'PAUSED' | 'NORMAL' | 'FAST';
  setSpeed: (speed: 'PAUSED' | 'NORMAL' | 'FAST') => void;
  onResetGame: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  activeTab?: 'TRADING' | 'BANK';
  setActiveTab?: (tab: 'TRADING' | 'BANK') => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onOpenAdminModal?: () => void;
}

export default function Header({
  day,
  totalAssets,
  initialCapital,
  highScore,
  speed,
  setSpeed,
  onResetGame,
  darkMode,
  onToggleDarkMode,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuthModal,
  onOpenAdminModal
}: HeaderProps) {
  // Format currency
  const formatKRW = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(value);
  };

  const TARGET_GOAL = 30000000; // 30 Million KRW (3천만 원)
  const progressPercent = Math.min(100, Math.max(0, (totalAssets / TARGET_GOAL) * 100));

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-4 px-6 md:px-8 sticky top-0 z-50 shadow-sm transition-colors duration-200" id="main-header">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="header-container">
        
        {/* Brand Logo & Day Count */}
        <div className="flex flex-wrap items-center justify-between md:justify-start gap-3 sm:gap-4" id="brand-area">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0" id="logo-block">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-400 border border-transparent dark:border-slate-700 flex items-center justify-center font-black tracking-tighter text-xs sm:text-sm shadow-md shrink-0">
              📊
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1 whitespace-nowrap truncate">
                📈백만장자 만들기📉
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap truncate">가상 주식 투자 & 은행 금융 시뮬레이터</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl px-2.5 sm:px-3 py-1.5 shrink-0 whitespace-nowrap" id="day-counter-badge">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">투자 기간</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">Day {day}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        {activeTab && setActiveTab && (
          <div className="flex bg-slate-100/70 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-lg p-0.5 shrink-0" id="nav-tabs">
            <button
              onClick={() => setActiveTab('TRADING')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'TRADING'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs dark:border dark:border-slate-700'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
            >
              📈 주식 거래
            </button>
            <button
              onClick={() => setActiveTab('BANK')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'BANK'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs dark:border dark:border-slate-700'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
            >
              🏦 은행 업무
            </button>
          </div>
        )}

        {/* Goal Progress Bar */}
        <div className="flex-1 max-w-sm md:mx-6" id="goal-progress-section">
          <div className="flex justify-between items-center mb-1 text-[11px] font-semibold">
            <span className="text-slate-500 dark:text-slate-400">🏆 3,000만 원 만들기 목표</span>
            <span className="text-slate-800 dark:text-slate-200 font-mono">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" id="goal-bar-bg">
            <div 
              className="h-full bg-rose-500 transition-all duration-500 rounded-full" 
              style={{ width: `${progressPercent}%` }}
              id="goal-bar-fill"
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
            <span>시작 자금: {formatKRW(initialCapital)}</span>
            <span className="font-semibold text-slate-500 dark:text-slate-400 font-mono">목표: {formatKRW(TARGET_GOAL)}</span>
          </div>
        </div>

        {/* Game speed & Reset */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 sm:gap-3" id="controls-area">
          {/* Speed Controls */}
          <div className="flex items-center gap-0.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-md p-0.5 shrink-0" id="speed-controls">
            <button
              onClick={() => setSpeed('PAUSED')}
              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all whitespace-nowrap ${
                speed === 'PAUSED'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs dark:border dark:border-slate-700'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
              title="시간을 멈춥니다"
            >
              ⏸️ 일시정지
            </button>
            <button
              onClick={() => setSpeed('NORMAL')}
              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all whitespace-nowrap ${
                speed === 'NORMAL'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs dark:border dark:border-slate-700'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
              title="3초 간격 업데이트"
            >
              ▶️ 보통
            </button>
            <button
              onClick={() => setSpeed('FAST')}
              className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold transition-all whitespace-nowrap ${
                speed === 'FAST'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-xs dark:border dark:border-slate-700'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
              }`}
              title="1.5초 간격 업데이트"
            >
              ⚡ 2배속
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-100 dark:border-slate-800 pl-1.5 sm:pl-2 shrink-0" id="highscore-reset-row">
            {/* Admin Button for @woojin */}
            {currentUser?.username.toLowerCase() === 'woojin' && (
              <button
                onClick={onOpenAdminModal}
                className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-xs flex items-center gap-1 transition-all cursor-pointer border border-amber-300 dark:border-amber-600 animate-pulse whitespace-nowrap"
                id="header-admin-btn"
                title="우진 어드민 콘솔 열기"
              >
                <span>👑</span>
                <span>어드민</span>
              </button>
            )}

            {/* User Login/Account Button */}
            <button
              onClick={onOpenAuthModal}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap ${
                currentUser
                  ? 'bg-emerald-50 dark:bg-emerald-955/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100'
                  : 'bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 hover:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-700'
              }`}
              id="header-auth-btn"
              title={currentUser ? `${currentUser.name} 계정 관리` : '로그인 및 회원가입'}
            >
              {currentUser ? (
                <>
                  <UserIcon size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="max-w-[70px] truncate">{currentUser.name}</span>
                </>
              ) : (
                <>
                  <LogIn size={12} className="shrink-0" />
                  <span className="whitespace-nowrap">로그인 / 회원가입</span>
                </>
              )}
            </button>

            {/* Highscore display */}
            <div className="hidden sm:block text-right whitespace-nowrap" id="highscore-block">
              <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold block leading-none mb-0.5">최고 자산</span>
              <span className="font-mono text-[9px] font-bold text-slate-700 dark:text-slate-300">{formatKRW(highScore)}</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-1 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-100 rounded-md transition-all flex items-center justify-center cursor-pointer shrink-0"
              title={darkMode ? '라이트 모드' : '다크 모드'}
              id="dark-mode-toggle-btn"
            >
              {darkMode ? <Sun size={11} className="text-amber-500" /> : <Moon size={11} />}
            </button>

            {/* Reset button */}
            <button
              onClick={onResetGame}
              className="px-1.5 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-750 hover:border-rose-100 rounded-md transition-all flex items-center gap-1 shrink-0 whitespace-nowrap"
              id="reset-game-btn"
            >
              🔄 초기화
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
