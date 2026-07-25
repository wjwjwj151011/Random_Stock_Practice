import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path for server-side JSON database
const DB_FILE = path.join(process.cwd(), "data", "db.json");

interface UserData {
  username: string;
  email?: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  provider: string;
  cash?: number;
}

interface DBStructure {
  users: UserData[];
  userStates: Record<string, any>;
}

// Ensure data directory and db.json exist
function ensureDB(): DBStructure {
  let db: DBStructure = { users: [], userStates: {} };

  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object") {
          db = {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            userStates: parsed.userStates && typeof parsed.userStates === "object" ? parsed.userStates : {},
          };
        }
      }
    }
  } catch (e) {
    console.error("Error reading or parsing db.json, using fallback empty DB", e);
  }

  // Ensure default admin user 'woojin' exists if not present
  const woojinExists = db.users.some(
    (u) => u && u.username && u.username.toLowerCase() === "woojin"
  );
  if (!woojinExists) {
    db.users.push({
      username: "woojin",
      email: "woojin@stockgame.app",
      name: "우진(어드민)",
      passwordHash: "hash_admin_woojin",
      createdAt: new Date().toISOString(),
      provider: "local",
    });
    if (!db.userStates["woojin"]) {
      db.userStates["woojin"] = {
        cash: 10000000,
        portfolio: [],
        savings: 0,
        loan: 0,
        day: 1,
        autoSellOrders: [],
        highScore: 10000000,
        goalCelebrated: false,
        transactions: [],
      };
    }
    saveDB(db);
  }

  return db;
}

function saveDB(db: DBStructure): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save DB", e);
  }
}

// Robust Helper to parse admin command string
function parseAdminCmd(cmdStr: string) {
  if (!cmdStr) return null;
  const trimmed = cmdStr.trim().replace(/^;/, "").trim();
  if (!trimmed) return null;

  // Match: optional @, target, optional sign (+ or -), number with optional commas
  const match = trimmed.match(/^@?([^\s+,-]+)\s+([+-]?)\s*([0-9,]+)$/);
  if (!match) return null;

  const targetStr = match[1].trim().toLowerCase().replace(/^@/, "");
  const isNegative = match[2] === "-";
  const numStr = match[3].replace(/,/g, "");
  let rawNum = Number(numStr);

  if (isNaN(rawNum) || rawNum <= 0 || !isFinite(rawNum)) return null;

  // Limit max grant amount per command to 1000 Trillion (1e15) to prevent floating overflow
  if (rawNum > 1e15) {
    rawNum = 1e15;
  }

  return {
    targetStr,
    deltaAmount: isNegative ? -rawNum : rawNum,
    absAmount: rawNum,
    isNegative,
  };
}

function getUsersWithCash(db: DBStructure): UserData[] {
  return db.users.map((u) => {
    const state = db.userStates[u.username.toLowerCase()];
    return {
      ...u,
      cash: state && typeof state.cash === "number" ? state.cash : 1000000,
    };
  });
}

// --- API ROUTES ---

// 1. Get all registered users with their current cash balance
app.get("/api/users", (req, res) => {
  try {
    const db = ensureDB();
    res.json({ success: true, users: getUsersWithCash(db) });
  } catch (err: any) {
    res.json({ success: false, users: [], message: err?.message || "서버 오류" });
  }
});

// 2. Register user
app.post("/api/register", (req, res) => {
  try {
    const { username, email, name, passwordHash, provider } = req.body || {};
    if (!username || !name) {
      return res.json({ success: false, message: "잘못된 요청입니다." });
    }

    const db = ensureDB();
    const lowerUsername = username.toLowerCase();

    const existing = db.users.find((u) => u.username.toLowerCase() === lowerUsername);
    if (existing) {
      return res.json({ success: false, message: "이미 존재하는 아이디입니다." });
    }

    const newUser: UserData = {
      username: lowerUsername,
      email,
      name,
      passwordHash: passwordHash || "default_hash",
      createdAt: new Date().toISOString(),
      provider: provider || "local",
    };

    db.users.push(newUser);

    if (!db.userStates[lowerUsername]) {
      db.userStates[lowerUsername] = {
        cash: 1000000,
        portfolio: [],
        savings: 0,
        loan: 0,
        day: 1,
        autoSellOrders: [],
        highScore: 1000000,
        goalCelebrated: false,
        transactions: [],
      };
    }

    saveDB(db);
    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.json({ success: false, message: err?.message || "회원가입 처리 중 오류 발생" });
  }
});

// 3. Login user check
app.post("/api/login", (req, res) => {
  try {
    const { emailOrUsername, passwordHash } = req.body || {};
    if (!emailOrUsername) {
      return res.json({ success: false, message: "아이디를 입력해주세요." });
    }

    const db = ensureDB();
    const lowerInput = emailOrUsername.toLowerCase();

    const found = db.users.find(
      (u) =>
        u.username.toLowerCase() === lowerInput ||
        (u.email && u.email.toLowerCase() === lowerInput)
    );

    if (!found) {
      return res.json({ success: false, message: "존재하지 않는 계정입니다." });
    }

    if (passwordHash && found.passwordHash !== passwordHash) {
      return res.json({ success: false, message: "비밀번호가 일치하지 않습니다." });
    }

    res.json({ success: true, user: found });
  } catch (err: any) {
    res.json({ success: false, message: err?.message || "로그인 처리 중 오류 발생" });
  }
});

// 4. Get game state for a user
app.get("/api/user-state/:username", (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const db = ensureDB();
    const state = db.userStates[username] || null;
    res.json({ success: true, state });
  } catch (err: any) {
    res.json({ success: false, state: null });
  }
});

// 5. Save/update game state for a user
app.post("/api/user-state/:username", (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const state = req.body?.state;

    if (!state) {
      return res.json({ success: false, message: "상태 데이터가 없습니다." });
    }

    const db = ensureDB();
    db.userStates[username] = state;

    // Ensure user exists in users list
    if (!db.users.some((u) => u.username.toLowerCase() === username)) {
      db.users.push({
        username,
        name: username,
        passwordHash: "auto_created",
        createdAt: new Date().toISOString(),
        provider: "local",
      });
    }

    saveDB(db);

    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, message: err?.message || "상태 저장 실패" });
  }
});

// 6. Admin Grant / Deduct cash command execution
app.post("/api/admin/grant-cash", (req, res) => {
  try {
    const { command, target, amount } = req.body || {};
    const db = ensureDB();

    let targetUsername = "";
    let deltaAmount = 0;
    let absAmount = 0;
    let isNegative = false;

    if (command) {
      const parsedCmd = parseAdminCmd(command);
      if (!parsedCmd) {
        return res.json({
          success: false,
          message: "명령어 형식이 올바르지 않습니다. 예: ;wjwjwj 100000000000000 또는 ;woojin 5000000",
        });
      }

      const inputTarget = parsedCmd.targetStr;
      deltaAmount = parsedCmd.deltaAmount;
      absAmount = parsedCmd.absAmount;
      isNegative = parsedCmd.isNegative;

      let foundUser = db.users.find(
        (u) =>
          u.username.toLowerCase() === inputTarget ||
          u.name.toLowerCase() === inputTarget ||
          u.name.toLowerCase().includes(inputTarget)
      );
      targetUsername = foundUser ? foundUser.username.toLowerCase() : inputTarget;
    } else if (target && typeof amount === "number") {
      const inputTarget = target.toLowerCase().replace(/^@/, "");
      let foundUser = db.users.find(
        (u) =>
          u.username.toLowerCase() === inputTarget ||
          u.name.toLowerCase() === inputTarget ||
          u.name.toLowerCase().includes(inputTarget)
      );
      targetUsername = foundUser ? foundUser.username.toLowerCase() : inputTarget;
      deltaAmount = amount;
      absAmount = Math.abs(amount);
      isNegative = amount < 0;
    } else {
      return res.json({ success: false, message: "잘못된 정보입니다." });
    }

    // Ensure target user exists in DB user list
    let userObj = db.users.find((u) => u.username.toLowerCase() === targetUsername);
    if (!userObj) {
      userObj = {
        username: targetUsername,
        name: targetUsername,
        passwordHash: "auto_created",
        createdAt: new Date().toISOString(),
        provider: "local",
      };
      db.users.push(userObj);
    }

    // Get or initialize state
    const currentState = db.userStates[targetUsername] || {
      cash: 1000000,
      portfolio: [],
      savings: 0,
      loan: 0,
      day: 1,
      autoSellOrders: [],
      highScore: 1000000,
      goalCelebrated: false,
      transactions: [],
    };

    const currentCash = typeof currentState.cash === "number" ? currentState.cash : 1000000;
    const newCash = Math.max(0, currentCash + deltaAmount);
    currentState.cash = newCash;
    currentState.highScore = Math.max(currentState.highScore || 0, newCash);

    db.userStates[targetUsername] = currentState;
    saveDB(db);

    const actionText = isNegative ? "차감되었습니다" : "성공적으로 지급되었습니다!";
    res.json({
      success: true,
      message: `@${userObj.name}(${targetUsername}) 계정에 ${absAmount.toLocaleString("ko-KR")}원이 ${actionText}`,
      targetUsername,
      targetName: userObj.name,
      newCash,
      deltaAmount,
      users: getUsersWithCash(db),
    });
  } catch (err: any) {
    res.json({ success: false, message: err?.message || "명령어 처리 중 오류 발생" });
  }
});

// 7. Admin Delete User
app.post("/api/admin/delete-user", (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) {
      return res.json({ success: false, message: "유저명이 필요합니다." });
    }

    const db = ensureDB();
    const lowerName = username.toLowerCase();

    db.users = db.users.filter((u) => u.username.toLowerCase() !== lowerName);
    delete db.userStates[lowerName];
    saveDB(db);

    res.json({ success: true, users: getUsersWithCash(db) });
  } catch (err: any) {
    res.json({ success: false, message: err?.message || "유저 삭제 오류" });
  }
});

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
