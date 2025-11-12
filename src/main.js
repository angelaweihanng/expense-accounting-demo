import './styles.css';
import { SHEET_ID, GAS_ENDPOINT } from './config.js';

const USERS = {
  test_user_1: "test_password_1",
  test_user_2: "test_password_2",
  test_user_3: "test_password_3",
  test_user_4: "test_password_4",
};

document.querySelector('#app').innerHTML = `
  <div class="card">
    <div class="header">
      <div class="logo"></div>
      <div class="title">
        <h1>Expense Account Demo</h1>
        <p class="kicker">Submit and log expenses to Google Sheets</p>
      </div>
      <div style="margin-left:auto" id="userBadge" class="badge hidden"></div>
    </div>

    <div class="content" id="authView">
      <div class="grid">
        <div class="col-6">
          <h2>Sign in</h2>
          <label>Username</label>
          <input id="username" placeholder="test_user_1" autocomplete="username"/>
          <label style="margin-top:10px">Password</label>
          <input id="password" type="password" placeholder="••••••••" autocomplete="current-password"/>
          <div style="margin-top:16px"><button id="loginBtn">Sign in</button></div>
        </div>
      </div>
    </div>

    <div class="content hidden" id="formView">
      <form id="expenseForm" class="grid">
        <div class="col-4"><label>Submission Date</label><input id="submissionDate" type="date" required/></div>
        <div class="col-4"><label>Expense Date</label><input id="expenseDate" type="date" required/></div>
        <div class="col-4"><label>Name</label><input id="name" type="text" readonly/></div>
        <div class="col-6"><label>Category</label><select id="category" required></select></div>
        <div class="col-6"><label>Item</label><input id="item" placeholder="e.g., Taxi from airport" required/></div>
        <div class="col-3"><label>Receipt No.</label><input id="receipt" placeholder="e.g., R12345" /></div>
        <div class="col-3"><label>Expense Amount</label><input id="amount" type="number" step="0.01" min="0" required/></div>
        <div class="col-3"><label>Expense Currency</label><select id="currency" required></select></div>
        <div class="col-3"><label>Expense in SGD</label><input id="amountSGD" type="number" step="0.01" min="0" readonly/></div>
        <div class="col-12"><label>Remarks</label><textarea id="remarks" placeholder="Add any notes here…"></textarea></div>
        <div class="col-12 row" style="justify-content:space-between;margin-top:8px">
          <div class="kicker" id="rateInfo">Rate source: <span>Loading…</span></div>
          <button type="submit">Submit to Sheet</button>
        </div>
      </form>
    </div>
    <div class="footer"><div>Expense Account Demo</div><div>© <span id="y"></span></div></div>
  </div>
`;

const y = document.getElementById('y');
y.textContent = new Date().getFullYear().toString();

const authView = document.getElementById('authView');
const formView = document.getElementById('formView');
const loginBtn = document.getElementById('loginBtn');
const usernameEl = document.getElementById('username');
const passwordEl = document.getElementById('password');
const userBadge = document.getElementById('userBadge');
const form = document.getElementById('expenseForm');

const submissionDate = document.getElementById('submissionDate');
const expenseDate = document.getElementById('expenseDate');
const nameEl = document.getElementById('name');
const categoryEl = document.getElementById('category');
const amountEl = document.getElementById('amount');
const currencyEl = document.getElementById('currency');
const amountSGDEl = document.getElementById('amountSGD');
const remarksEl = document.getElementById('remarks');
const rateInfo = document.getElementById('rateInfo').querySelector('span');

const categories = [
  { label: "Airfare", options: ["Final Inbound", "First Outbound", "Fly-In Visit"] },
  { label: "Meeting", options: ["CARE Trip", "Lindau Meeting", "RIKEN Summer Programme", "Scholars' ASN Claims", "Scholars' Gathering/Networking", "Senior Management Visit", "Singapore Seminar"] },
  { label: "Miscellaneous", options: ["Bank Charges/Wired Transfer", "COVID19 - Airfare", "Deposit /Matriculation Fees", "Excess Baggage/Shipping", "Medical/Health Insurance", "SHN/PCR (Inbound to SG)- Dependent", "SHN/PCR (Inbound to SG)- Scholar", "SHN/PCR (Outbound)– Dependent", "SHN/PCR (Outbound)- Scholar", "Thesis Allowance", "Tuition Fees"] }
];

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

fetch('/currencies.json').then(r => r.json()).then(list => {
  list.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = code;
    currencyEl.appendChild(opt);
  });
  currencyEl.value = 'SGD';
});

let rates = null;
async function loadRates() {
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=SGD');
    const data = await res.json();
    rates = data;
    rateInfo.textContent = 'exchangerate.host (latest)';
  } catch (e) {
    const data = await fetch('/fallback_rates_sgd.json').then(r => r.json());
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
  const sgd = amt / r;
  amountSGDEl.value = sgd.toFixed(2);
}
amountEl.addEventListener('input', computeSGD);
currencyEl.addEventListener('change', computeSGD);

function showForm(user) {
  nameEl.value = user;
  userBadge.textContent = user;
  userBadge.classList.remove('hidden');
  authView.classList.add('hidden');
  formView.classList.remove('hidden');
}
loginBtn.addEventListener('click', () => {
  const u = usernameEl.value.trim();
  const p = passwordEl.value;
  if (USERS[u] && USERS[u] === p) showForm(u);
  else alert('Invalid credentials');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    sheetId: SHEET_ID,
    row: [
      submissionDate.value,
      expenseDate.value,
      nameEl.value,
      categoryEl.value,
      "",
      "",
      amountEl.value,
      currencyEl.value,
      amountSGDEl.value,
      remarksEl.value
    ]
  };
  try {
    const res = await fetch(`https://script.google.com/macros/s/${GAS_ENDPOINT}/exec`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Submit failed');
    alert('Submitted!');
    form.reset();
  } catch (err) {
    alert('Error: ' + err.message);
  }
});
