// Base URL for backend API. Adjust if the backend runs on a different host/port.
const API_BASE = 'http://localhost:3000/api';

// Elements
const authSection = document.getElementById('auth-section');
const accountSection = document.getElementById('account-section');
const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const registerMessage = document.getElementById('register-message');
const loginMessage = document.getElementById('login-message');
const userNameSpan = document.getElementById('user-name');
const balanceSpan = document.getElementById('balance');
const depositForm = document.getElementById('deposit-form');
const withdrawForm = document.getElementById('withdraw-form');
const transactionMessage = document.getElementById('transaction-message');
const transactionsTableBody = document.querySelector('#transactions-table tbody');
const logoutButton = document.getElementById('logout-button');

// Store current auth token and username in memory and localStorage
let authToken = null;
let currentUser = null;

function showAuthSection() {
  accountSection.classList.add('hidden');
  authSection.classList.remove('hidden');
}

function showAccountSection() {
  authSection.classList.add('hidden');
  accountSection.classList.remove('hidden');
}

function saveAuth(token, username) {
  authToken = token;
  currentUser = username;
  localStorage.setItem('token', token);
  localStorage.setItem('username', username);
}

function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

function updateAccountInfo(balance) {
  userNameSpan.textContent = currentUser;
  balanceSpan.textContent = balance.toFixed(2);
}

function populateTransactions(transactions) {
  transactionsTableBody.innerHTML = '';
  transactions
    .slice() // shallow copy
    .reverse() // newest first
    .forEach(tx => {
      const tr = document.createElement('tr');
      const dateTd = document.createElement('td');
      const typeTd = document.createElement('td');
      const amountTd = document.createElement('td');
      dateTd.textContent = new Date(tx.date).toLocaleString();
      typeTd.textContent = tx.type;
      amountTd.textContent = `$${Number(tx.amount).toFixed(2)}`;
      tr.appendChild(dateTd);
      tr.appendChild(typeTd);
      tr.appendChild(amountTd);
      transactionsTableBody.appendChild(tr);
    });
}

async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function fetchAccountAndTransactions() {
  try {
    const accountData = await apiRequest('/account', { method: 'GET' });
    updateAccountInfo(accountData.balance);
    const txData = await apiRequest('/transactions', { method: 'GET' });
    populateTransactions(txData.transactions);
  } catch (err) {
    console.error(err);
    transactionMessage.textContent = err.message;
  }
}

// Register form handler
registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  registerMessage.textContent = '';
  const username = document.getElementById('register-username').value.trim();
  const password = document.getElementById('register-password').value;
  try {
    await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    registerMessage.style.color = 'green';
    registerMessage.textContent = 'Registration successful. You can now log in.';
    registerForm.reset();
  } catch (err) {
    registerMessage.style.color = '#d9534f';
    registerMessage.textContent = err.message;
  }
});

// Login form handler
loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginMessage.textContent = '';
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  try {
    const data = await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    saveAuth(data.token, username);
    loginForm.reset();
    await fetchAccountAndTransactions();
    showAccountSection();
  } catch (err) {
    loginMessage.style.color = '#d9534f';
    loginMessage.textContent = err.message;
  }
});

// Deposit form handler
depositForm.addEventListener('submit', async e => {
  e.preventDefault();
  transactionMessage.textContent = '';
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  try {
    const data = await apiRequest('/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    updateAccountInfo(data.balance);
    // fetch updated transactions
    const txData = await apiRequest('/transactions', { method: 'GET' });
    populateTransactions(txData.transactions);
    transactionMessage.style.color = 'green';
    transactionMessage.textContent = 'Deposit successful.';
    depositForm.reset();
  } catch (err) {
    transactionMessage.style.color = '#d9534f';
    transactionMessage.textContent = err.message;
  }
});

// Withdraw form handler
withdrawForm.addEventListener('submit', async e => {
  e.preventDefault();
  transactionMessage.textContent = '';
  const amount = parseFloat(document.getElementById('withdraw-amount').value);
  try {
    const data = await apiRequest('/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    updateAccountInfo(data.balance);
    const txData = await apiRequest('/transactions', { method: 'GET' });
    populateTransactions(txData.transactions);
    transactionMessage.style.color = 'green';
    transactionMessage.textContent = 'Withdrawal successful.';
    withdrawForm.reset();
  } catch (err) {
    transactionMessage.style.color = '#d9534f';
    transactionMessage.textContent = err.message;
  }
});

// Logout handler
logoutButton.addEventListener('click', () => {
  clearAuth();
  showAuthSection();
});

// On page load, check for stored token
function init() {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('username');
  if (storedToken && storedUser) {
    authToken = storedToken;
    currentUser = storedUser;
    fetchAccountAndTransactions().then(() => {
      showAccountSection();
    }).catch(() => {
      // token might be invalid
      clearAuth();
      showAuthSection();
    });
  } else {
    showAuthSection();
  }
}

init();
