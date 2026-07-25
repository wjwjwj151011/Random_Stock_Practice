import React, { useState } from 'react';
import { User } from '../types';
import { registerUserAsync, loginUserAsync, logoutUserAsync, deleteAccountAsync } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { UserCheck, LogIn, UserPlus, LogOut, KeyRound, User as UserIcon, X, ShieldCheck, Database, Loader2, Mail, Trash2, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
}

export default function AuthModal({ isOpen, onClose, currentUser, onUserChange }: AuthModalProps) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Account deletion state
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  // Loading & status feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setLoading(false);
    setConfirmDelete(false);
  };

  const handleModeSwitch = (newMode: 'LOGIN' | 'REGISTER') => {
    setMode(newMode);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'REGISTER') {
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      if (password.length < 6) {
        setError('비밀번호는 최소 6자 이상이어야 합니다.');
        return;
      }
      setLoading(true);
      const res = await registerUserAsync(username, name, password);
      setLoading(false);

      if (res.success && res.user) {
        setSuccess(res.message);
        onUserChange(res.user);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1200);
      } else {
        setError(res.message);
      }
    } else {
      setLoading(true);
      const res = await loginUserAsync(username, password);
      setLoading(false);

      if (res.success && res.user) {
        setSuccess(res.message);
        onUserChange(res.user);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 1200);
      } else {
        setError(res.message);
      }
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logoutUserAsync();
    setLoading(false);
    onUserChange(null);
    onClose();
    resetForm();
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setLoading(true);
    const res = await deleteAccountAsync(currentUser);
    setLoading(false);
    
    if (res.success) {
      setSuccess('계정이 성공적으로 삭제되었습니다.');
      onUserChange(null);
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="auth-modal-overlay">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative transition-all duration-200"
        id="auth-modal-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          id="close-auth-modal"
        >
          <X size={18} />
        </button>

        {currentUser ? (
          /* Profile / Already Logged In View */
          <div className="text-center py-2 space-y-4" id="user-profile-view">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold text-2xl shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{currentUser.name}</h3>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <ShieldCheck size={11} /> 슈퍼베이스 인증됨
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                {currentUser.email || `@${currentUser.username}`}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-medium">인증 엔진</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                  <Database size={12} /> Supabase Cloud Auth
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 dark:text-slate-500 font-medium">가입 일자</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  {new Date(currentUser.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </div>

            {/* Success & Error notices */}
            {success && (
              <div className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2.5 text-center">
                ✨ {success}
              </div>
            )}
            {error && (
              <div className="text-rose-500 text-[11px] font-semibold bg-rose-50 dark:bg-rose-955/30 border border-rose-100 dark:border-rose-900/40 rounded-xl p-2.5 text-center">
                ⚠️ {error}
              </div>
            )}

            {/* Account Deletion Confirmation Dialog */}
            {confirmDelete ? (
              <div className="bg-rose-50 dark:bg-rose-955/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3.5 text-left space-y-3 animate-fade-in" id="delete-confirm-box">
                <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs">정말 계정을 삭제하시겠습니까?</h4>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300/80 mt-0.5 leading-snug">
                      계정을 삭제하면 저장된 포트폴리오 및 모든 투자 기록이 영구적으로 삭제되며 복구할 수 없습니다.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={loading}
                    className="flex-1 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading}
                    className="flex-1 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {loading ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> 영구 삭제</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="flex-1 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-955/30 hover:bg-rose-100 border border-rose-100 dark:border-rose-900/40 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <><LogOut size={14} /> 로그아웃</>}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-1.5 text-[11px] font-semibold text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-colors flex items-center justify-center gap-1 cursor-pointer mt-1"
                  id="btn-trigger-delete-account"
                >
                  <Trash2 size={12} /> 계정 삭제하기
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Login & Register Form View */
          <div>
            <div className="text-center mb-4" id="auth-modal-header">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white mx-auto flex items-center justify-center font-bold text-xl mb-2 shadow-sm">
                ⚡
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {mode === 'LOGIN' ? '투자자 로그인' : '새 투자자 계정 생성'}
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <Database size={10} /> Supabase Auth
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {mode === 'LOGIN'
                  ? '슈퍼베이스(Supabase) 계정으로 안전하게 로그인하세요.'
                  : '슈퍼베이스 기반으로 회원가입 후 나만의 포트폴리오를 관리하세요.'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-4" id="auth-mode-tabs">
              <button
                type="button"
                onClick={() => handleModeSwitch('LOGIN')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <LogIn size={13} /> 로그인
              </button>
              <button
                type="button"
                onClick={() => handleModeSwitch('REGISTER')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'REGISTER'
                    ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <UserPlus size={13} /> 회원가입
              </button>
            </div>

            {/* Form inputs */}
            <form onSubmit={handleSubmit} className="space-y-3" id="auth-form">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  이메일 또는 아이디
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="예: investor@example.com 또는 investor123"
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {mode === 'REGISTER' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    투자자 닉네임
                  </label>
                  <div className="relative">
                    <UserCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 워렌 버핏"
                      className="w-full pl-8 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  비밀번호 (최소 6자)
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {mode === 'REGISTER' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-8 pr-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-rose-500 text-[11px] font-semibold bg-rose-50 dark:bg-rose-955/30 border border-rose-100 dark:border-rose-900/40 rounded-xl p-2.5 text-center">
                  ⚠️ {error}
                </div>
              )}

              {success && (
                <div className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-955/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-2.5 text-center">
                  ✨ {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-all shadow-md cursor-pointer mt-1 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Database size={13} />
                    {mode === 'LOGIN' ? '로그인' : '회원가입'}
                  </>
                )}
              </button>

              {mode === 'LOGIN' && (
                <button
                  type="button"
                  onClick={async () => {
                    setUsername('woojin');
                    setPassword('admin1234');
                    setLoading(true);
                    const res = await loginUserAsync('woojin', 'admin1234');
                    setLoading(false);
                    if (res.success && res.user) {
                      setSuccess(res.message);
                      onUserChange(res.user);
                      setTimeout(() => {
                        onClose();
                        resetForm();
                      }, 1000);
                    } else if (res.message) {
                      setError(res.message);
                    }
                  }}
                  disabled={loading}
                  className="w-full py-2 rounded-xl font-extrabold text-xs text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 transition-all border border-amber-300 dark:border-amber-600 shadow-sm cursor-pointer mt-2 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  id="btn-quick-admin-login"
                >
                  👑 @woojin 어드민 계정으로 빠른 로그인
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
