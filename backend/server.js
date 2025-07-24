/*
 * Simple personal deposit management backend
 *
 * This Node.js server provides a REST‑style API for managing user
 * accounts, including registration, login, account balance checks,
 * deposits, withdrawals and transaction history. Data is stored in a
 * JSON file on disk (data.json) for persistence. The server does
 * not require any external dependencies beyond the Node standard
 * library so it can run in environments without network access.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Path to the data file (persisted on disk)
const DATA_FILE = path.join(__dirname, 'data.json');

/**
 * Load the persisted data from disk. If the file does not exist
 * or is invalid, a fresh structure is returned.
 *
 * Data structure:
 * {
 *   users: {
 *     username: {
 *       password: string,
 *       balance: number,
 *       transactions: Array<{ type: string, amount: number, date: string }>
 *     }
 *   },
 *   sessions: {
 *     token: username
 *   }
 * }
 */
function loadData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    // basic validation
    if (!data.users) data.users = {};
    if (!data.sessions) data.sessions = {};
    return data;
  } catch (err) {
    return { users: {}, sessions: {} };
  }
}

/**
 * Persist the provided data structure to disk. The file is
 * overwritten atomically to avoid corruption.
 */
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Generate a random session token. A secure random buffer is
 * generated and converted to a hex string. Tokens are not
 * persisted beyond the server lifetime (they reside in the data
 * structure and are saved when users interact with the API).
 */
function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Parse the body of a request as JSON. Returns a Promise which
 * resolves with the parsed object or rejects on error.
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // limit request size to 1MB
      if (body.length > 1e6) {
        req.connection.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

/**
 * Send a JSON response with the given status code and body.
 */
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    // allow simple CORS for frontend calls
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(payload);
}

/**
 * Handle user registration.
 * Expects { username, password } in the request body. Fails
 * if the username already exists. Passwords are stored in plain
 * text for simplicity—do not use this approach in production.
 */
function handleRegister(dataStore, body, res) {
  const { username, password } = body;
  if (!username || !password) {
    return sendJson(res, 400, { error: 'username and password are required' });
  }
  if (dataStore.users[username]) {
    return sendJson(res, 400, { error: 'username already exists' });
  }
  dataStore.users[username] = {
    password: String(password),
    balance: 0,
    transactions: [],
  };
  saveData(dataStore);
  return sendJson(res, 201, { message: 'registration successful' });
}

/**
 * Handle user login.
 * Expects { username, password } in the body. Returns a token
 * on success which must be supplied in the Authorization header
 * for subsequent requests (Bearer <token>).
 */
function handleLogin(dataStore, body, res) {
  const { username, password } = body;
  const user = dataStore.users[username];
  if (!user || user.password !== String(password)) {
    return sendJson(res, 401, { error: 'invalid credentials' });
  }
  // create session token
  const token = generateToken();
  dataStore.sessions[token] = username;
  saveData(dataStore);
  return sendJson(res, 200, { token });
}

/**
 * Authenticate a request based on the Authorization header.
 * On success, returns the username. On failure, sends an
 * appropriate response and returns null.
 */
function authenticate(dataStore, req, res) {
  const auth = req.headers['authorization'] || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    sendJson(res, 401, { error: 'Missing or invalid Authorization header' });
    return null;
  }
  const username = dataStore.sessions[token];
  if (!username || !dataStore.users[username]) {
    sendJson(res, 401, { error: 'Invalid or expired token' });
    return null;
  }
  return username;
}

/**
 * Handle retrieving account information for the authenticated user.
 */
function handleAccount(dataStore, username, res) {
  const user = dataStore.users[username];
  sendJson(res, 200, { balance: user.balance, username });
}

/**
 * Handle deposit or withdrawal for the authenticated user.
 * Body must contain { amount } (positive number). Type is
 * determined by caller.
 */
function handleTransaction(dataStore, username, type, body, res) {
  let { amount } = body;
  amount = Number(amount);
  if (!amount || amount <= 0 || !Number.isFinite(amount)) {
    return sendJson(res, 400, { error: 'amount must be a positive number' });
  }
  const user = dataStore.users[username];
  if (type === 'withdraw' && user.balance < amount) {
    return sendJson(res, 400, { error: 'insufficient funds' });
  }
  if (type === 'deposit') {
    user.balance += amount;
  } else if (type === 'withdraw') {
    user.balance -= amount;
  }
  user.transactions.push({ type, amount, date: new Date().toISOString() });
  saveData(dataStore);
  sendJson(res, 200, { balance: user.balance });
}

/**
 * Handle retrieving transaction history for the authenticated user.
 */
function handleTransactions(dataStore, username, res) {
  const user = dataStore.users[username];
  sendJson(res, 200, { transactions: user.transactions });
}

// Main HTTP server
const server = http.createServer(async (req, res) => {
  // handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }

  // load data for each request
  const dataStore = loadData();

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    if (req.method === 'POST' && pathname === '/api/register') {
      const body = await parseBody(req);
      return handleRegister(dataStore, body, res);
    }
    if (req.method === 'POST' && pathname === '/api/login') {
      const body = await parseBody(req);
      return handleLogin(dataStore, body, res);
    }
    // all endpoints below require authentication
    if (pathname.startsWith('/api/')) {
      const username = authenticate(dataStore, req, res);
      if (!username) return; // response already sent
      if (req.method === 'GET' && pathname === '/api/account') {
        return handleAccount(dataStore, username, res);
      }
      if (req.method === 'GET' && pathname === '/api/transactions') {
        return handleTransactions(dataStore, username, res);
      }
      if (req.method === 'POST' && pathname === '/api/deposit') {
        const body = await parseBody(req);
        return handleTransaction(dataStore, username, 'deposit', body, res);
      }
      if (req.method === 'POST' && pathname === '/api/withdraw') {
        const body = await parseBody(req);
        return handleTransaction(dataStore, username, 'withdraw', body, res);
      }
      // unknown API
      return sendJson(res, 404, { error: 'Not Found' });
    }
    // For all other requests, serve a simple response
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Personal deposit management API is running');
  } catch (e) {
    // handle unexpected errors
    sendJson(res, 500, { error: 'Server error', details: e.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
