# Expense Account Demo

A minimal, aesthetic web app to submit expenses into a Google Sheet.

## What changed
- Project name and titles set to **Expense Account Demo** (`expense-accounting-demo`).
- Google Sheet ID is set to **1BxMM6j4EzXNLqlKVIlj5R90BsxJt_GC11bcM3xYm1Ok** in `config.js`.
- Columns expected (order matters):  
  `Submission Date, Expense Date, Name, Category, Item, Receipt No., Expense Amount, Expense Currency, Expense in SGD, Remarks`.
- Date inputs use native date pickers. Name is auto-filled from the signed-in username.
- Category is a dropdown with the options shown in your screenshot (grouped as Airfare, Meeting, Miscellaneous).
- Currency dropdown lists ISO-4217 active currencies. The app fetches the latest rates with base SGD from exchangerate.host and falls back to a bundled snapshot (`fallback_rates_sgd.json`) if offline. The **Expense in SGD** field auto-computes as you type.
- Remarks is a large textarea.
- Test accounts: `test_user_1..4` with passwords `test_password_1..4`.

## Setup

### 1) Google Sheet
Create a Google Sheet with the 10 headers in row 1, matching the order above.

### 2) Apps Script
- In Google Drive: **New → Apps Script**. Create project and add the contents of `gas/Code.gs`.
- Set `SHEET_ID` if you want to force a specific sheet; otherwise leave it blank (the app sends it).
- **Deploy → New deployment → Web app**
  - *Execute as:* Me
  - *Who has access:* Anyone with the link
- Copy the web app URL and set it as `GAS_ENDPOINT` in `config.js`.

### 3) Local
Serve the folder with any static server (e.g., `python -m http.server`) and open `index.html`.
Submit a test record.

## Notes
- If your environment blocks the live FX API, the app will automatically use the bundled snapshot (rates as of `fallback_rates_sgd.json`).
- All styling is in `styles.css` so you can tweak aesthetics easily.
