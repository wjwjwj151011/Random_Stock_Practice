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

// Save registered users list to local storage
export function saveRegisteredUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Async Fetch registered users from backend server
export async function fetchRegisteredUsersAsync(): Promise<User[]> {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users)) {
        saveRegisteredUsers(data.users);
        return data.users;
      }
    }
  } catch (e) {
    console.warn('Backend /api/users fetch failed, fallback to local cache', e);
  }
  return getRegisteredUsers();
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

// Set current logged-in user session
export function setCurrentUserSession(user: User | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Async Register function supporting Server API, Supabase & Local
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

  const cleanUsername = cleanInput.toLowerCase().replace(/[^a-z0-9_.-]/g, '') || 'user_' + Date.now();
  const passwordHash = hashPassword(password);

  // --- 1. Call Express Server API ---
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUsername,
        email: cleanInput.includes('@') ? cleanInput : undefined,
        name: cleanName,
        passwordHash,
        provider: 'local',
      }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const newUser: User = data.user;

      // Update local storage user list
      const users = getRegisteredUsers();
      if (!users.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase())) {
        users.push(newUser);
        saveRegisteredUsers(users);
      }

      setCurrentUserSession(newUser);
      return { success: true, message: '회원가입이 완료되었습니다!', user: newUser };
    } else if (data.message) {
      return { success: false, message: data.message };
    }
  } catch (err) {
    console.warn('Server registration failed, attempting fallback local registration', err);
  }

  // --- 2. Fallback Local Registration ---
  const users = getRegisteredUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: '이미 존재하는 아이디입니다.' };
  }

  const newUser: User = {
    username: cleanUsername,
    email: cleanInput.includes('@') ? cleanInput : undefined,
    name: cleanName,
    passwordHash,
    createdAt: new Date().toISOString(),
    provider: 'local',
  };

  users.push(newUser);
  saveRegisteredUsers(users);
  setCurrentUserSession(newUser);

  return { success: true, message: '회원가입이 완료되었습니다!', user: newUser };
}

// Async Login function supporting Server API & Local
export async function loginUserAsync(
  emailOrUsername: string,
  password: string
): Promise<{ success: boolean; message: string; user?: User }> {
  const cleanInput = emailOrUsername.trim();

  if (!cleanInput || !password) {
    return { success: false, message: '아이디/이메일과 비밀번호를 모두 입력해주세요.' };
  }

  const passwordHash = hashPassword(password);

  // --- 1. Try Server Login ---
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: cleanInput, passwordHash }),
    });

    const data = await res.json();
    if (res.ok && data.success && data.user) {
      const userObj: User = data.user;
      setCurrentUserSession(userObj);

      // Refresh registered users
      fetchRegisteredUsersAsync().catch(() => {});

      return { success: true, message: '로그인되었습니다!', user: userObj };
    } else if (res.status === 401 || res.status === 404) {
      return { success: false, message: data.message || '로그인에 실패했습니다.' };
    }
  } catch (e) {
    console.warn('Server login failed, trying local fallback', e);
  }

  // --- 2. Local Fallback Login ---
  const cleanUsername = cleanInput.toLowerCase();
  const users = getRegisteredUsers();
  const foundUser = users.find(
    (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)
  );

  if (!foundUser) {
    return { success: false, message: '존재하지 않는 사용자 계정입니다.' };
  }

  if (foundUser.passwordHash !== passwordHash) {
    return { success: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  setCurrentUserSession(foundUser);
  return { success: true, message: '로그인되었습니다!', user: foundUser };
}

// Async Logout
export async function logoutUserAsync(): Promise<void> {
  setCurrentUserSession(null);
}

// Async Delete Account
export async function deleteAccountAsync(user: User): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Call server API
    await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username }),
    }).catch(() => {});

    // 2. Delete user game state locally
    const stateKey = getUserStateKey(user.username);
    localStorage.removeItem(stateKey);

    // 3. Remove user from local storage user list
    const users = getRegisteredUsers();
    const filteredUsers = users.filter((u) => u.username.toLowerCase() !== user.username.toLowerCase());
    saveRegisteredUsers(filteredUsers);

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

export async function loadUserGameStateAsync(username: string): Promise<UserGameState | null> {
  try {
    const res = await fetch(`/api/user-state/${encodeURIComponent(username)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.state) {
        saveUserGameState(username, data.state);
        return data.state;
      }
    }
  } catch (e) {
    console.warn('Async loadUserGameState failed, falling back to local storage', e);
  }
  return loadUserGameState(username);
}

export function saveUserGameState(username: string, state: UserGameState): void {
  try {
    const key = getUserStateKey(username);
    localStorage.setItem(key, JSON.stringify(state));

    // Async push to server
    fetch(`/api/user-state/${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }).catch((err) => console.warn('Sync state to server failed', err));
  } catch (e) {
    console.error('Failed to save user game state', e);
  }
}

// Admin API helper to grant cash or execute command
export async function executeAdminCashGrantAsync(
  commandOrTarget: string,
  amount?: number
): Promise<{ success: boolean; message: string; users?: User[]; targetUsername?: string; newCash?: number }> {
  try {
    const payload = typeof amount === 'number'
      ? { target: commandOrTarget, amount }
      : { command: commandOrTarget };

    const res = await fetch('/api/admin/grant-cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      if (Array.isArray(data.users)) {
        saveRegisteredUsers(data.users);
      }
      return {
        success: true,
        message: data.message,
        users: data.users,
        targetUsername: data.targetUsername,
        newCash: data.newCash,
      };
    } else {
      return { success: false, message: data.message || '명령어 실행에 실패했습니다.' };
    }
  } catch (e) {
    return { success: false, message: '서버와의 통신 오류가 발생했습니다.' };
  }
}
