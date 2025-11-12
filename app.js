import { SHEET_ID, GAS_ENDPOINT } from './config.js';

const USERS = {
  test_user_1: "test_password_1",
  test_user_2: "test_password_2",
  test_user_3: "test_password_3",
  test_user_4: "test_password_4",
};

const categories = [
  { label: "Airfare", options: ["Final Inbound", "First Outbound", "Fly-In Visit"] },
  { label: "Meeting", options: [
    "CARE Trip", "Lindau Meeting", "RIKEN Summer Programme", "Scholars' ASN Claims",
    "Scholars' Gathering/Networking", "Senior Management Visit", "Singapore Seminar"
  ]},
  { label: "Miscellaneous", options: [
    "Bank Charges/Wired Transfer", "COVID19 - Airfare", "Deposit /Matriculation Fees",
    "Excess Baggage/Shipping", "Medical/Health Insurance",
    "SHN/PCR (Inbound to SG)- Dependent", "SHN/PCR (Inbound to SG)- Scholar",
    "SHN/PCR (Outbound)– Dependent", "SHN/PCR (Outbound)- Scholar",
    "Thesis Allowance", "Tuition Fees"
  ]}
];

// State
let rates = null; // { base: 'SGD', rates: {...} }
let username = null;

// Elements
const authView = document.getElementById('authView');
const formView = document.getElementById('formView');
const loginBtn = document.getElementById('loginBtn');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const userBadge = document.getElementById('userBadge');
const y = document.getElementById('y');
const rateInfo = document.getElementById('rateInfo').querySelector('span');

const form = document.getElementById('expenseForm');
const submissionDate = document.getElementById('submissionDate');
const expenseDate = document.getElementById('expenseDate');
const nameEl = document.getElementById('name');
const categoryEl = document.getElementById('category');
const itemEl = document.getElementById('item');
const receiptEl = document.getElementById('receipt');
const amountEl = document.getElementById('amount');
const currencyEl = document.getElementById('currency');
const amountSGDEl = document.getElementById('amountSGD');
const remarksEl = document.getElementById('remarks');

y.textContent = new Date().getFullYear().toString();

// Initialise dates as today (yyyy-mm-dd)
const today = new Date().toISOString().slice(0,10);
submissionDate.value = today;
expenseDate.value = today;

// Populate category with optgroups
for (const group of categories) {
  const og = document.createElement('optgroup');
  og.label = group.label;
  for (const option of group.options) {
    const opt = document.createElement('option');
    opt.value = option;
    opt.textContent = option;
    og.appendChild(opt);
  }
  categoryEl.appendChild(og);
}

// Populate currencies
async function loadCurrencies() {
  const list = await fetch('./currencies.json').then(r => r.json());
  list.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code;
    currencyEl.appendChild(opt);
  });
  currencyEl.value = 'SGD';
}
loadCurrencies();

// Load rates: try online (exchangerate.host), fallback to bundled snapshot
async function loadRates() {
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=SGD',{mode:'cors'});
    if (!res.ok) throw new Error('network');
    const data = await res.json();
    if (!data?.rates) throw new Error('bad');
    rates = { base: 'SGD', rates: data.rates };
    rateInfo.textContent = 'exchangerate.host (latest)';
    return;
  } catch (e) {
    const data = await fetch('./fallback_rates_sgd.json').then(r => r.json());
    rates = data;
    rateInfo.textContent = `bundled snapshot ${data.date}`;
  }
}
loadRates();

function computeSGD() {
  const amt = parseFloat(amountEl.value || '0');
  const curr = currencyEl.value || 'SGD';
  if (!rates || !amt || !curr) { amountSGDEl.value = ''; return; }
  if (curr === 'SGD') { amountSGDEl.value = amt.toFixed(2); return; }
  const r = rates.rates[curr];
  if (!r || r === 0) { amountSGDEl.value = ''; return; }
  // rates are units of 'curr' per 1 SGD, so SGD = amount / r
  const sgd = amt / r;
  amountSGDEl.value = sgd.toFixed(2);
}

amountEl.addEventListener('input', computeSGD);
currencyEl.addEventListener('change', computeSGD);

// Auth
function showForm(user) {
  username = user;
  nameEl.value = user;
  userBadge.textContent = user;
  userBadge.classList.remove('hidden');
  authView.classList.add('hidden');
  formView.classList.remove('hidden');
}
loginBtn.addEventListener('click', () => {
  const u = (usernameEl.value || '').trim();
  const p = passwordEl.value;
  if (USERS[u] && USERS[u] === p) {
    showForm(u);
  } else {
    alert('Invalid username or password');
  }
});
// If previously signed in in this browser session
const cached = sessionStorage.getItem('ead-user');
if (cached && USERS[cached]) showForm(cached);
else sessionStorage.removeItem('ead-user');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    sheetId: SHEET_ID,
    row: [
      submissionDate.value,
      expenseDate.value,
      nameEl.value,
      categoryEl.value,
      itemEl.value,
      receiptEl.value,
      amountEl.value,
      currencyEl.value,
      amountSGDEl.value,
      remarksEl.value
    ]
  };
  // cache username for convenience
  sessionStorage.setItem('ead-user', username);

  if (!GAS_ENDPOINT) {
    alert('Please set GAS_ENDPOINT in config.js after deploying Code.gs');
    return;
  }
  try {
    const res = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data?.error || 'Submit failed');
    alert('Submitted!');
    form.reset();
    submissionDate.value = new Date().toISOString().slice(0,10);
    expenseDate.value = submissionDate.value;
    nameEl.value = username;
    currencyEl.value = 'SGD';
    computeSGD();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});
