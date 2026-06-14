const express = require("express");
const cors = require("cors");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const creds = require("./credentials.json");

// 🌟 SATU-SATUNYA TEMPAT UNTUK MEMASUKKAN ID SPREADSHEET ASLI ANDA
// Salin ID Spreadsheet Anda (karakter acak panjang di URL Google Sheets) dan tempel di sini:
const SPREADSHEET_ID = "1J4wCo8eD0BUEwkvHGNmeGMBiXwKoaRe5VkuVNridvvU";

const app = express();

app.use(cors());
app.use(express.json()); // Membaca data JSON dari React

// 1. FUNGSI UNTUK MENYIMPAN DATA (POST)
app.post('/api/trial', async (req, res) => {
    try {
        const { tanggal, project, profil, trial, hasil, defect } = req.body;

        const serviceAccountAuth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        // Menggunakan variabel SPREADSHEET_ID yang ada di atas
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];

        // Menambahkan baris baru ke Google Spreadsheet
        await sheet.addRow([tanggal, project, profil, trial, hasil, defect]);

        console.log("🎉 Data baru berhasil ditulis ke Google Sheets:", req.body);
        res.status(201).json({ message: "Data berhasil disimpan ke Google Spreadsheet!" });

    } catch (err) {
        console.error("🛑 Gagal menulis ke Google Sheets:", err.message);
        res.status(500).json({ error: "Gagal menyimpan data", details: err.message });
    }
});

// 2. FUNGSI UNTUK MEMBACA DATA (GET)
app.get("/api/trial", async (req, res) => {
    try {
        const serviceAccountAuth = new JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });

        // Menggunakan variabel SPREADSHEET_ID yang sama
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const data = rows.map(row => {
            const raw = row._rawData || [];
            return {
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

app.listen(3000, () => {
    console.log("Server berjalan di port 3000");
});