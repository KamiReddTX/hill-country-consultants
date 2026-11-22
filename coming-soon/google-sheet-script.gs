/* DBW News launch list → this Google Sheet.

   Paste into the Sheet: Extensions → Apps Script, replace everything, Save.
   Then Deploy → New deployment → Web app; Execute as: Me; Who has access:
   Anyone. The Web app URL it gives you goes into Netlify as
   SHEET_WEBHOOK_URL, and TOKEN below goes in as SHEET_WEBHOOK_TOKEN.

   Only a request carrying TOKEN can add a row. */
const TOKEN = 'REPLACE-WITH-THE-SECRET';

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
  if (!body || body.token !== TOKEN) return ContentService.createTextOutput('no');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Signed up', 'Name', 'Email', 'Phone', 'Write or be featured']);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([new Date(), cell(body.name, 80), cell(body.email, 200), cell(body.phone, 30), body.writing ? 'Yes' : 'No']);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

// Text that starts like a formula is stored as plain text, so nothing a
// visitor types can run as a spreadsheet formula.
function cell(v, max) {
  v = String(v == null ? '' : v).trim().slice(0, max);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
