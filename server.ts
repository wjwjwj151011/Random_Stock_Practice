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
}

interface DBStructure {
  users: UserData[];
  userStates: Record<string, any>;
}

// Ensure data directory and db.json exist
function ensureDB(): DBStructure {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let db: DBStructure = { users: [], userStates: {} };

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      if (content.trim()) {
        db = JSON.parse(content);
      }
    } catch (e) {
      console.error("Error reading db.json, re-initializing", e);
    }
  }

  // Ensure default admin user 'woojin' exists if not present
  const woojinExists = db.users.some(
    (u) => u.username.toLowerCase() === "woojin"
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
    // Default woojin state
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
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
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

// --- API ROUTES ---

// 1. Get all registered users
app.get("/api/users", (req, res) => {
  const db = ensureDB();
  res.json({ users: db.users });
});

// 2. Register user
app.post("/api/register", (req, res) => {
  const { username, email, name, passwordHash, provider } = req.body || {};
  if (!username || !name) {
    return res.status(400).json({ success: false, message: "잘못된 요청입니다." });
  }

  const db = ensureDB();
  const lowerUsername = username.toLowerCase();

  const existing = db.users.find((u) => u.username.toLowerCase() === lowerUsername);
  if (existing) {
    return res.status(400).json({ success: false, message: "이미 존재하는 아이디입니다." });
  }

  const newUser: UserData = {
    username: lowerUsername,
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
    provider: provider || "local",
  };

  db.users.push(newUser);

  // Initialize state if not present
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
});

// 3. Login user check
app.post("/api/login", (req, res) => {
  const { emailOrUsername, passwordHash } = req.body || {};
  if (!emailOrUsername) {
    return res.status(400).json({ success: false, message: "아이디를 입력해주세요." });
  }

  const db = ensureDB();
  const lowerInput = emailOrUsername.toLowerCase();

  const found = db.users.find(
    (u) =>
      u.username.toLowerCase() === lowerInput ||
      (u.email && u.email.toLowerCase() === lowerInput)
  );

  if (!found) {
    return res.status(404).json({ success: false, message: "존재하지 않는 계정입니다." });
  }

  if (passwordHash && found.passwordHash !== passwordHash) {
    return res.status(401).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
  }

  res.json({ success: true, user: found });
});

// 4. Get game state for a user
app.get("/api/user-state/:username", (req, res) => {
  const username = req.params.username.toLowerCase();
  const db = ensureDB();
  const state = db.userStates[username] || null;
  res.json({ success: true, state });
});

// 5. Save/update game state for a user
app.post("/api/user-state/:username", (req, res) => {
  const username = req.params.username.toLowerCase();
  const state = req.body?.state;

  if (!state) {
    return res.status(400).json({ success: false, message: "상태 데이터가 없습니다." });
  }

  const db = ensureDB();
  db.userStates[username] = state;
  saveDB(db);

  res.json({ success: true });
});

// 6. Admin Grant / Deduct cash command execution
app.post("/api/admin/grant-cash", (req, res) => {
  const { command, target, amount } = req.body || {};
  const db = ensureDB();

  let targetUsername = "";
  let deltaAmount = 0;

  if (command) {
    const match = command.trim().match(/^;([^\s]+)\s+(-)?(\d[\d,]*)$/);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "명령어 형식이 올바르지 않습니다. 예: ;woojin 5000000 또는 ;woojin -1000000",
      });
    }
    const inputTarget = match[1].toLowerCase().replace("@", "");
    const isNegative = match[2] === "-";
    const rawNum = parseInt(match[3].replace(/,/g, ""), 10);
    deltaAmount = isNegative ? -rawNum : rawNum;

    // Find registered user by username or name
    let foundUser = db.users.find(
      (u) => u.username.toLowerCase() === inputTarget || u.name.toLowerCase() === inputTarget
    );

    targetUsername = foundUser ? foundUser.username.toLowerCase() : inputTarget;
  } else if (target && typeof amount === "number") {
    const inputTarget = target.toLowerCase().replace("@", "");
    let foundUser = db.users.find(
      (u) => u.username.toLowerCase() === inputTarget || u.name.toLowerCase() === inputTarget
    );
    targetUsername = foundUser ? foundUser.username.toLowerCase() : inputTarget;
    deltaAmount = amount;
  } else {
    return res.status(400).json({ success: false, message: "잘못된 정보입니다." });
  }

  // Ensure user exists in users table if not already
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

  // Get or initialize user state
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

  const newCash = Math.max(0, (currentState.cash || 0) + deltaAmount);
  currentState.cash = newCash;
  currentState.highScore = Math.max(currentState.highScore || 0, newCash);

  db.userStates[targetUsername] = currentState;
  saveDB(db);

  res.json({
    success: true,
    message: `@${userObj.name}(${targetUsername}) 계정에 ${deltaAmount.toLocaleString(
      "ko-KR"
    )}원이 적용되었습니다. (현재 잔액: ${newCash.toLocaleString("ko-KR")}원)`,
    targetUsername,
    targetName: userObj.name,
    newCash,
    deltaAmount,
    users: db.users,
  });
});

// 7. Admin Delete User
app.post("/api/admin/delete-user", (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ success: false, message: "유저명이 필요합니다." });
  }

  const db = ensureDB();
  const lowerName = username.toLowerCase();

  db.users = db.users.filter((u) => u.username.toLowerCase() !== lowerName);
  delete db.userStates[lowerName];
  saveDB(db);

  res.json({ success: true, users: db.users });
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
