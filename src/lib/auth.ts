import { User, UserGameState } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const USERS_KEY = 'stock_game_users_db';
const CURRENT_USER_KEY = 'stock_game_current_session';

// Simple string hash function for password security simulation
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'hash_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// Get all registered users from local storage
export function getRegisteredUsers(): User[] {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Failed to load registered users', e);
    return [];
  }
}

// Save registered users list
function saveRegisteredUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get logged-in user session
export function getCurrentUser(): User | null {
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

// Set current logged-in user
export function setCurrentUserSession(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Async Register function supporting Supabase & Local
export async function registerUserAsync(
  emailOrUsername: string,
  name: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const cleanInput = emailOrUsername.trim();
  const cleanName = name.trim();

  if (!cleanInput) {
    return { success: false, message: '이메일 또는 아이디를 입력해주세요.' };
  }
  if (!cleanName) {
    return { success: false, message: '닉네임을 입력해주세요.' };
  }
  if (!password || password.length < 6) {
    return { success: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }

  // --- Attempt Supabase Sign Up if configured ---
  if (isSupabaseConfigured && supabase) {
    try {
      // Ensure email format for Supabase Auth
      const email = cleanInput.includes('@') ? cleanInput : `${cleanInput}@stockgame.app`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: cleanName,
            username: cleanInput.split('@')[0]
          }
        }
      });

      if (error) {
        return { success: false, message: `Supabase 오류: ${error.message}` };
      }

      const sbUser = data.user;
      if (sbUser) {
        const newUser: User = {
          username: cleanInput.split('@')[0],
          email: sbUser.email || email,
          name: cleanName,
          passwordHash: sbUser.id,
          createdAt: sbUser.created_at || new Date().toISOString(),
          provider: 'supabase'
        };
        setCurrentUserSession(newUser);
        return { 
          success: true, 
          message: data.session ? '슈퍼베이스(Supabase) 회원가입 및 로그인 완료!' : '슈퍼베이스 회원가입 신청 완료! (이메일 확인이 필요할 수 있습니다)', 
          user: newUser 
        };
      }
    } catch (err: any) {
      console.warn('Supabase auth failed, falling back to local auth mode', err);
    }
  }

  // --- Fallback Local Registration ---
  const cleanUsername = cleanInput.toLowerCase().replace(/[^a-z0-9_.-]/g, '') || 'user_' + Date.now();
  const users = getRegisteredUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: '이미 존재하는 아이디입니다.' };
  }

  const newUser: User = {
    username: cleanUsername,
    email: cleanInput.includes('@') ? cleanInput : undefined,
    name: cleanName,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    provider: 'local'
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setCurrentUserSession(newUser);

  return { success: true, message: '회원가입이 완료되었습니다!', user: newUser };
}

// Async Login function supporting Supabase & Local
export async function loginUserAsync(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const cleanInput = emailOrUsername.trim();

  if (!cleanInput || !password) {
    return { success: false, message: '아이디/이메일과 비밀번호를 모두 입력해주세요.' };
  }

  // --- Attempt Supabase Sign In if configured ---
  if (isSupabaseConfigured && supabase) {
    try {
      const email = cleanInput.includes('@') ? cleanInput : `${cleanInput}@stockgame.app`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!error && data.user) {
        const sbUser = data.user;
        const userMeta = sbUser.user_metadata || {};
        const userObj: User = {
          username: userMeta.username || cleanInput.split('@')[0],
          email: sbUser.email || email,
          name: userMeta.name || userMeta.username || cleanInput.split('@')[0],
          passwordHash: sbUser.id,
          createdAt: sbUser.created_at || new Date().toISOString(),
          provider: 'supabase'
        };
        setCurrentUserSession(userObj);
        return { success: true, message: '슈퍼베이스(Supabase) 로그인 성공!', user: userObj };
      } else if (error && isSupabaseConfigured) {
        // If Supabase was configured and gave error, report it
        return { success: false, message: `Supabase 로그인 실패: ${error.message}` };
      }
    } catch (err: any) {
      console.warn('Supabase login exception', err);
    }
  }

  // --- Fallback Local Login ---
  const cleanUsername = cleanInput.toLowerCase();
  const users = getRegisteredUsers();
  const foundUser = users.find((u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername));

  if (!foundUser) {
    return { success: false, message: '존재하지 않는 사용자 계정입니다.' };
  }

  if (foundUser.passwordHash !== hashPassword(password)) {
    return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  setCurrentUserSession(foundUser);
  return { success: true, message: '로그인되었습니다!', user: foundUser };
}

// Async Logout
export async function logoutUserAsync(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Supabase logout error', e);
    }
  }
  setCurrentUserSession(null);
}

// Async Delete Account
export async function deleteAccountAsync(user: User): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Delete user game state
    const stateKey = getUserStateKey(user.username);
    localStorage.removeItem(stateKey);

    // 2. Remove user from local storage user list if present
    const users = getRegisteredUsers();
    const filteredUsers = users.filter((u) => u.username.toLowerCase() !== user.username.toLowerCase());
    saveRegisteredUsers(filteredUsers);

    // 3. Handle Supabase sign out / account deletion
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signout during delete', err);
      }
    }

    // 4. Clear current session
    setCurrentUserSession(null);

    return { success: true, message: '계정이 성공적으로 삭제되었습니다.' };
  } catch (error: any) {
    console.error('Account deletion error', error);
    return { success: false, message: `계정 삭제 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}` };
  }
}

// User-specific game state persistence helper
export function getUserStateKey(username: string): string {
  return `stock_game_user_state_${username.toLowerCase()}`;
}

export function loadUserGameState(username: string): UserGameState | null {
  try {
    const key = getUserStateKey(username);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function saveUserGameState(username: string, state: UserGameState): void {
  try {
    const key = getUserStateKey(username);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save user game state', e);
  }
}
