const express = require("express");
const cors = require("cors");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const creds = require("./credentials.json");

const SPREADSHEET_ID = "1J4wCo8eD0BUEwkvHGNmeGMBiXwKoaRe5VkuVNridvvU";

const app = express();

app.use(cors());
app.use(express.json());

// Inisialisasi Auth Google API
const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// 1. FUNGSI UNTUK MENYIMPAN DATA BARU (POST)
app.post('/api/trial', async (req, res) => {
    try {
        const { tanggal, project, profil, trial, hasil, defect } = req.body;
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // Simpan data ke baris baru
        await sheet.addRow([tanggal, project, profil, trial, hasil, defect]);

        console.log("🎉 Data baru berhasil ditulis ke Google Sheets:", req.body);
        res.status(201).json({ message: "Data berhasil disimpan ke Google Spreadsheet!" });
    } catch (err) {
        console.error("🛑 Gagal menulis ke Google Sheets:", err.message);
        res.status(500).json({ error: "Gagal menyimpan data", details: err.message });
    }
});

// 2. FUNGSI UNTUK MEMBACA DATA (GET) -> Sekarang menyertakan ID Baris Google Sheets
app.get("/api/trial", async (req, res) => {
    try {
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const data = rows.map(row => {
            const raw = row._rawData || [];
            return {
                id: row.rowNumber, // 🌟 MENJADI ID UNIK (Nomor Baris di Google Sheets)
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

// 🌟 3. FUNGSI BARU: UNTUK MENGEDIT/UPDATE DATA BERDASARKAN NOMOR BARIS (PUT)
// Gantilah bagian isi app.put di backend Anda dengan logika berbasis objek kolom ini:
// GANTI SELEURUH BLOK app.put DI SERVER.JS ANDA DENGAN INI:
app.put('/api/trial/:rowNumber', async (req, res) => {
    try {
        const { rowNumber } = req.params;
        const { tanggal, project, profil, trial, hasil, defect } = req.body;

        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        // Cari baris Google Sheets yang nomor barisnya cocok dengan target dari React
        const targetRow = rows.find(r => String(r.rowNumber) === String(rowNumber));

        if (!targetRow) {
            console.log(`🛑 Baris #${rowNumber} tidak ditemukan!`);
            return res.status(404).json({ error: "Data lama tidak ditemukan di Google Sheets!" });
        }

        // 🌟 TEKNIK UPDATE PALING AMAN: Mengisi berdasarkan urutan kolom Sheet (A, B, C, D, E, F)
        targetRow._rawData[0] = tanggal;
        targetRow._rawData[1] = project;
        targetRow._rawData[2] = profil;
        targetRow._rawData[3] = String(trial);
        targetRow._rawData[4] = hasil;
        targetRow._rawData[5] = defect;

        // Commit perubahan langsung ke baris yang sama
        await targetRow.save();

        console.log(`🎉 BERHASIL MENIMPA DATA! Baris #${rowNumber} di Google Sheets telah diperbarui.`);
        res.json({ message: "Data lama berhasil ditimpa!" });
    } catch (err) {
        console.error("🛑 Gagal mengupdate Google Sheets:", err.message);
        res.status(500).json({ error: "Gagal memperbarui data", details: err.message });
    }
});

app.listen(3000, () => {
    console.log("Server berjalan di port 3000");
});