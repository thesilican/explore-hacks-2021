import { google, sheets_v4 } from "googleapis";

// Utility functions to convert a row/col into Google Sheets A1 notation
// Col uses alphabet A-Z
// Row starts at 2 (row 1 is header)
const ALPHABET = Array.from(Array(26)).map((_, i) =>
  String.fromCharCode("A".charCodeAt(0) + i)
);
function a1Col(num: number) {
  if (num < 0 || num >= 26) {
    throw new Error("Invalid column: " + num);
  }
  return ALPHABET[num];
}
function a1Row(num: number) {
  return num + 2;
}

// Wrapper for Google Sheets API
export class Sheets {
  authFile: string;
  sheetID: string;
  sheets: sheets_v4.Sheets | null;

  constructor(authFile: string, sheetID: string) {
    this.authFile = authFile;
    this.sheetID = sheetID;
    this.sheets = null;
  }

  // Connect to Google Sheets API
  async connect() {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      keyFilename: this.authFile,
    });
    this.sheets = google.sheets({ version: "v4", auth });
    console.log("Connected to Google Sheets");
  }
  // Read cells of a sheet
  async readSheet(sheet: string): Promise<string[][]> {
    if (!this.sheets) {
      throw new Error("Sheets not connected");
    }
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetID,
      range: `'${sheet}'!2:1000`,
    });
    const data = response.data.values ?? [];
    return data;
  }
  // Append a row to the end of a sheet
  async appendRow(sheet: string, value: string[]) {
    if (!this.sheets) {
      throw new Error("Sheets not connected");
    }
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.sheetID,
      range: `'${sheet}'!2:1000`,
      valueInputOption: "RAW",
      requestBody: { values: [value] },
    });
  }
  // Update an entire row of a sheet
  async updateRow(sheet: string, row: number, value: string[]) {
    if (!this.sheets) {
      throw new Error("Sheets not connected");
    }
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetID,
      range: `'${sheet}'!${a1Row(row)}:${a1Row(row)}`,
      valueInputOption: "RAW",
      requestBody: { values: [value] },
    });
  }
  // Update an individual cell within a sheet
  async updateCell(sheet: string, row: number, col: number, value: string) {
    if (!this.sheets) {
      throw new Error("Sheets not connected");
    }
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetID,
      range: `'${sheet}'!${a1Col(col)}${a1Row(row)}`,
      valueInputOption: "RAW",
      requestBody: { values: [[value]] },
    });
  }
  // Delete an entire row of a sheet
  async deleteRow(sheet: string, row: number) {
    if (!this.sheets) {
      throw new Error("Sheets not connected");
    }

    // Since you can't directly delete a row of a google sheet
    // This copies all the rows and re-writes them
    const values = (await this.readSheet(sheet)).filter((_, i) => i !== row);
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetID,
      range: `'${sheet}'!2:1000`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
    const lines = values.length;

    // Clear any left over rows
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: this.sheetID,
      range: `'${sheet}'!${a1Row(lines)}:1000`,
    });
  }
}
