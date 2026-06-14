const express = require("express");
const cors = require("cors");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Membaca credentials secara aman
const credentials = process.env.GOOGLE_CREDENTIALS 
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS) 
  : require('./credentials.json');

// 🌟 BERSIHKAN FORMAT ENTER KUNCI RAHASIA (Mencegah Invalid JWT Signature)
if (credentials.private_key) {
  credentials.private_key = credentials.private_key
    .replace(/\\n/g, '\n')       
    .replace(/"/g, '')           
    .trim();                     
}

const SPREADSHEET_ID = "1pMBk3-tgfDe8L6l9cUxAQgXW3c-HPyVqPkqPYf1iQfE";

// --- URL GET: AMBIL DATA ---
app.get("/api/trial", async (req, res) => {
  try {
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const data = rows.map((row) => ({
      id: row.rowNumber, 
      tanggal: row._rawData[0] || "",
      project: row._rawData[1] || "",
      profil: row._rawData[2] || "",
      trial: row._rawData[3] || "0",
      hasil: row._rawData[4] || "",
      defect: row._rawData[5] || "",
    }));

    res.json(data);
  } catch (err) {
    console.error("Gagal mengambil data:", err.message);
    res.status(500).json({ error: "Gagal mengambil data dari Google Sheets" });
  }
});

// --- URL POST: TAMBAH DATA BARU ---
app.post("/api/trial", async (req, res) => {
  try {
    const { tanggal, project, profil, trial, hasil, defect } = req.body;
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow([tanggal, project, profil, trial, hasil, defect]);
    res.json({ message: "Data baru berhasil disimpan!" });
  } catch (err) {
    console.error("Gagal menyimpan data:", err.message);
    res.status(500).json({ error: "Gagal menyimpan data baru" });
  }
});

// --- URL PUT: EDIT DATA LAMA ---
app.put('/api/trial/:rowNumber', async (req, res) => {
  try {
    const { rowNumber } = req.params;
    const { tanggal, project, profil, trial, hasil, defect } = req.body;

    const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    // Cari baris berdasarkan rowNumber Google Sheet
    const targetRow = rows.find(row => String(row.rowNumber) === String(rowNumber));

    if (!targetRow) {
      return res.status(404).json({ error: "Data baris tidak ditemukan!" });
    }

    // Update data pada array baris
    targetRow._rawData[0] = tanggal;
    targetRow._rawData[1] = project;
    targetRow._rawData[2] = profil;
    targetRow._rawData[3] = String(trial);
    targetRow._rawData[4] = hasil;
    targetRow._rawData[5] = defect;

    await targetRow.save();
    res.json({ message: "Data lama berhasil ditimpa!" });
  } catch (err) {
    console.error("Gagal mengupdate Google Sheets:", err.message);
    res.status(500).json({ error: "Gagal memperbarui data", details: err.message });
  }
});

module.exports = app;