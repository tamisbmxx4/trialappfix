const express = require("express");
const cors = require("cors");
const { GoogleSpreadsheet } = require("google-spreadsheet");

// Membaca credentials secara aman (Lokal / Vercel)
const credentials = process.env.GOOGLE_CREDENTIALS 
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS) 
  : require('./credentials.json');

const SPREADSHEET_ID = "1J4wCo8eD0BUEwkvHGNmeGMBiXwKoaRe5VkuVNridvvU";

const app = express();
app.use(cors());
app.use(express.json());

// 1. FUNGSI UNTUK MENYIMPAN DATA BARU (POST)
app.post('/api/trial', async (req, res) => {
    try {
        const { tanggal, project, profil, trial, hasil, defect } = req.body;
        
        // Versi 3: Inisialisasi hanya membutuhkan ID Spreadsheet saja
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        
        // Autentikasi gaya Versi 3
        await doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        });

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // Simpan data ke baris baru
        await sheet.addRow([tanggal, project, profil, trial, hasil, defect]);

        console.log("🎉 Data baru berhasil ditulis ke Google Sheets:", req.body);
        res.status(201).json({ message: "Data berhasil disimpan!" });
    } catch (err) {
        console.error("🛑 Gagal menulis ke Google Sheets:", err.message);
        res.status(500).json({ error: "Gagal menyimpan data", details: err.message });
    }
});

// 2. FUNGSI UNTUK MEMBACA DATA (GET)
app.get("/api/trial", async (req, res) => {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        
        // Autentikasi gaya Versi 3
        await doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        });

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const data = rows.map(row => {
            const raw = row._rawData || [];
            return {
                id: row.rowNumber, // Nomor Baris di Google Sheets sebagai ID unik
                tanggal: raw[0] ? raw[0].trim() : "",
                project: raw[1] ? raw[1].trim() : "", 
                profil:  raw[2] ? raw[2].trim() : "",
                trial:   raw[3] ? raw[3].trim() : "",
                hasil:   raw[4] ? raw[4].trim() : "",
                defect:  raw[5] ? raw[5].trim() : ""
            };
        });

        res.json(data);
    } catch (err) {
        console.error("🛑 Gagal mengambil data:", err.message);
        res.status(500).json({ error: "Gagal mengambil data", details: err.message });
    }
});

// 3. FUNGSI UNTUK MENGEDIT/UPDATE DATA BERDASARKAN NOMOR BARIS (PUT)
app.put('/api/trial/:rowNumber', async (req, res) => {
    try {
        const { rowNumber } = req.params;
        const { tanggal, project, profil, trial, hasil, defect } = req.body;

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        
        // Autentikasi gaya Versi 3
        await doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        });

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        // Cari baris Google Sheets yang cocok dengan nomor baris target
        const targetRow = rows.find(r => String(r.rowNumber) === String(rowNumber));

        if (!targetRow) {
            return res.status(404).json({ error: "Data tidak ditemukan!" });
        }

        targetRow._rawData[0] = tanggal;
        targetRow._rawData[1] = project;
        targetRow._rawData[2] = profil;
        targetRow._rawData[3] = String(trial);
        targetRow._rawData[4] = hasil;
        targetRow._rawData[5] = defect;

        await targetRow.save();

        console.log(`🎉 Baris #${rowNumber} berhasil diperbarui.`);
        res.json({ message: "Data berhasil diperbarui!" });
    } catch (err) {
        console.error("🛑 Gagal mengupdate Google Sheets:", err.message);
        res.status(500).json({ error: "Gagal memperbarui data", details: err.message });
    }
});

module.exports = app;