
function getOrCreateFolder() {
  const folderName = "BuildFlow Files";
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(e.parameter.sheet);
  if (!sheet) return json({ error: "Sheet not found" });
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return json([]);
  const headers = data[0];
  const rows = data.slice(1)
    .filter(r => r[0] !== "")
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });
  return json(rows);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const { action, sheet: name, data } = body;

  // ── Upload file lên Drive ──
  if (action === "uploadFile") {
    try {
      const folder = getOrCreateFolder();
      const decoded = Utilities.base64Decode(data.base64.split(",")[1]);
      const blob = Utilities.newBlob(decoded, data.mimeType, data.fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return json({
        success: true,
        fileUrl: file.getUrl(),
        fileId: file.getId(),
        directUrl: "https://drive.google.com/uc?export=view&id=" + file.getId()
      });
    } catch (err) {
      return json({ success: false, error: err.toString() });
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) return json({ error: "Sheet not found" });

  if (action === "append") {
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(h => data[h] ?? ""));
  }

  if (action === "update") {
    const all = sheet.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(data.id)) {
        const headers = all[0];
        headers.forEach((h, j) => {
          if (data[h] !== undefined)
            sheet.getRange(i+1, j+1).setValue(data[h]);
        });
        break;
      }
    }
  }

  if (action === "delete") {
    const all = sheet.getDataRange().getValues();
    for (let i = 1; i < all.length; i++) {
      if (String(all[i][0]) === String(data.id)) {
        sheet.deleteRow(i+1);
        break;
      }
    }
  }

  return json({ success: true });
}

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
