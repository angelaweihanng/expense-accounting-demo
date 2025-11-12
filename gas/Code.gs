/**
 * Expense Account Demo - Google Apps Script backend
 * 1) Create a Google Sheet with the given columns:
 * 'Submission Date', 'Expense Date', 'Name', 'Category', 'Item',
 * 'Receipt No.', 'Expense Amount', 'Expense Currency', 'Expense in SGD', 'Remarks'
 * 2) Copy this file into an Apps Script project attached to any Google account.
 * 3) In config below, set SHEET_ID or rely on incoming payload.sheetId.
 * 4) Deploy as Web App (execute as you, accessible to anyone with link) and
 *    paste the resulting URL into config.js as GAS_ENDPOINT.
 */

const SHEET_ID = ""; // optional override; if empty, uses request's sheetId
const SHEET_NAME = ""; // leave blank to use the first sheet

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetId = (SHEET_ID || data.sheetId || "").trim();
    if (!sheetId) throw new Error("Missing sheetId");

    const ss = SpreadsheetApp.openById(sheetId);
    const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
    if (!sheet) throw new Error("Sheet not found");

    const row = data.row;
    if (!Array.isArray(row) || row.length < 10) throw new Error("Bad row payload");

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

function doGet() {
  return ContentService.createTextOutput("Expense Account Demo Backend");
}
