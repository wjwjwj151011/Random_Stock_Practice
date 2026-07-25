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
    let users: User[] = saved ? JSON.parse(saved) : [];

    // Always ensure default admin account 'woojin' exists
    const woojinExists = users.some(
      (u) => u && u.username && u.username.toLowerCase() === 'woojin'
    );
    if (!woojinExists) {
      const defaultAdmin: User = {
        username: 'woojin',
        email: 'woojin@stockgame.app',
        name: '우진(어드민)',
        passwordHash: hashPassword('admin1234'),
        createdAt: new Date().toISOString(),
        provider: 'local',
      };
      users.push(defaultAdmin);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return users;
  } catch (e) {
    console.error('Failed to load registered users', e);
    return [
      {
        username: 'woojin',
        email: 'woojin@stockgame.app',
        name: '우진(어드민)',
        passwordHash: hashPassword('admin1234'),
        createdAt: new Date().toISOString(),
        provider: 'local',
      },
    ];
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
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          saveRegisteredUsers(data.users);
          return data.users;
        }
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

    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && data.user) {
          const newUser: User = data.user;

          const users = getRegisteredUsers();
          if (!users.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase())) {
            users.push(newUser);
            saveRegisteredUsers(users);
          }

          setCurrentUserSession(newUser);
          return { success: true, message: '회원가입이 완료되었습니다!', user: newUser };
        } else if (data && data.message) {
          return { success: false, message: data.message };
        }
      }
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

    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && data.user) {
          const userObj: User = data.user;
          setCurrentUserSession(userObj);

          fetchRegisteredUsersAsync().catch(() => {});

          return { success: true, message: '로그인되었습니다!', user: userObj };
        } else if (data && data.message) {
          return { success: false, message: data.message };
        }
      }
    }
  } catch (e) {
    console.warn('Server login failed, trying local fallback', e);
  }

  // --- 2. Local Fallback Login ---
  const cleanUsername = cleanInput.toLowerCase();
  const users = getRegisteredUsers();
  let foundUser = users.find(
    (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)
  );

  // Special handler for admin user 'woojin'
  if (cleanUsername === 'woojin' || cleanUsername === 'woojin@stockgame.app') {
    if (!foundUser) {
      foundUser = {
        username: 'woojin',
        email: 'woojin@stockgame.app',
        name: '우진(어드민)',
        passwordHash: hashPassword('admin1234'),
        createdAt: new Date().toISOString(),
        provider: 'local',
      };
      users.push(foundUser);
      saveRegisteredUsers(users);
    }

    if (password === 'admin1234' || password === 'admin' || foundUser.passwordHash === passwordHash) {
      setCurrentUserSession(foundUser);
      return { success: true, message: '어드민 계정으로 로그인되었습니다!', user: foundUser };
    }
  }

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
    await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username }),
    }).catch(() => {});

    const stateKey = getUserStateKey(user.username);
    localStorage.removeItem(stateKey);

    const users = getRegisteredUsers();
    const filteredUsers = users.filter((u) => u.username.toLowerCase() !== user.username.toLowerCase());
    saveRegisteredUsers(filteredUsers);

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
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && data.state) {
          saveUserGameState(username, data.state);
          return data.state;
        }
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
  amount?: number,
  activeUser?: string
): Promise<{ success: boolean; message: string; users?: User[]; targetUsername?: string; newCash?: number }> {
  // 1. Try server endpoint first
  try {
    const payload = typeof amount === 'number'
      ? { target: commandOrTarget, amount, currentUser: activeUser }
      : { command: commandOrTarget, currentUser: activeUser };

    const res = await fetch('/api/admin/grant-cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data && data.success) {
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
        } else if (data && data.message) {
          return { success: false, message: data.message };
        }
      }
    }
  } catch (e) {
    console.warn('Server admin grant failed, proceeding with client-side fallback', e);
  }

  // 2. Client-side fallback handler
  let targetInput = (activeUser || 'woojin').toLowerCase();
  let deltaAmount = 0;

  if (typeof amount === 'number') {
    targetInput = commandOrTarget.trim().toLowerCase().replace(/^@/, '');
    deltaAmount = amount;
  } else {
    let trimmed = commandOrTarget.trim();
    if (trimmed.startsWith(';')) {
      trimmed = trimmed.substring(1).trim();
    }
    if (!trimmed) {
      return { success: false, message: '명령어를 입력해 주세요.' };
    }

    let amountStr = trimmed;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      targetInput = parts[0].replace(/^@/, '').toLowerCase();
      amountStr = parts.slice(1).join(' ');
    } else if (parts.length === 1) {
      targetInput = (activeUser || 'woojin').toLowerCase();
      amountStr = parts[0];
    }

    amountStr = amountStr.trim();
    let isNegative = false;
    if (amountStr.startsWith('-')) {
      isNegative = true;
      amountStr = amountStr.substring(1).trim();
    } else if (amountStr.startsWith('+')) {
      amountStr = amountStr.substring(1).trim();
    }

    let rawNum = 0;
    if (amountStr.includes('조')) {
      const [numPart] = amountStr.split('조');
      const val = parseFloat(numPart.replace(/,/g, '')) || 1;
      rawNum = val * 1e12;
    } else if (amountStr.includes('억')) {
      const [numPart] = amountStr.split('억');
      const val = parseFloat(numPart.replace(/,/g, '')) || 1;
      rawNum = val * 1e8;
    } else if (amountStr.includes('만')) {
      const [numPart] = amountStr.split('만');
      const val = parseFloat(numPart.replace(/,/g, '')) || 1;
      rawNum = val * 1e4;
    } else {
      rawNum = Number(amountStr.replace(/,/g, ''));
    }

    if (isNaN(rawNum) || rawNum <= 0 || !isFinite(rawNum)) {
      return {
        success: false,
        message: '명령어 형식이 올바르지 않습니다. 예: ;wjwjwj 100000000000000 또는 ;woojin 5000000',
      };
    }
    if (rawNum > 9e15) {
      rawNum = 9e15;
    }
    deltaAmount = isNegative ? -rawNum : rawNum;
  }

  // Find or create user in local storage
  const users = getRegisteredUsers();
  let foundUser = users.find(
    (u) => u.username.toLowerCase() === targetInput || u.name.toLowerCase() === targetInput
  );

  const targetUsername = foundUser ? foundUser.username.toLowerCase() : targetInput;
  const targetName = foundUser ? foundUser.name : targetUsername;

  if (!foundUser) {
    foundUser = {
      username: targetUsername,
      name: targetName,
      passwordHash: 'local_admin',
      createdAt: new Date().toISOString(),
      provider: 'local',
    };
    users.push(foundUser);
    saveRegisteredUsers(users);
  }

  // Update user state in localStorage
  const stateKey = getUserStateKey(targetUsername);
  const savedStateStr = localStorage.getItem(stateKey);
  let currentState: UserGameState = {
    cash: 1000000,
    portfolio: [],
    savings: 0,
    loan: 0,
    day: 1,
    autoSellOrders: [],
    highScore: 1000000,
    goalCelebrated: false,
    transactions: [],
    stats: {
      totalTrades: 0,
      winningTrades: 0,
      highestPortfolioValue: 1000000,
      biggestGainPercent: 0,
    },
  };

  if (savedStateStr) {
    try {
      currentState = { ...currentState, ...JSON.parse(savedStateStr) };
    } catch (e) {}
  }

  const currentCash = typeof currentState.cash === 'number' ? currentState.cash : 1000000;
  const newCash = Math.max(0, currentCash + deltaAmount);
  currentState.cash = newCash;
  currentState.highScore = Math.max(currentState.highScore || 0, newCash);

  localStorage.setItem(stateKey, JSON.stringify(currentState));

  const absAmount = Math.abs(deltaAmount);
  const actionText = deltaAmount < 0 ? '차감되었습니다' : '성공적으로 지급되었습니다!';

  return {
    success: true,
    message: `@${targetName}(${targetUsername}) 계정에 ${absAmount.toLocaleString('ko-KR')}원이 ${actionText}`,
    users,
    targetUsername,
    newCash,
  };
}
