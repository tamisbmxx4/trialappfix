import React from 'react';

function SummaryCard({ data, rawData = [] }) {
  
  // 1. Total Trial dari seluruh baris di database (Hasil: 18)
  const totalTrial = rawData.length > 0 ? rawData.length : data.length;
  
  // 2. OKE Keseluruhan menghitung profil unik yang sudah berhasil OK (Hasil: 2)
  const totalOke = data.filter(item => {
    const status = item.hasil ? String(item.hasil).trim().toUpperCase() : "";
    return status === "OK" || status === "APPROVE";
  }).length;

  // 3. TOTAL NG menghitung SEMUA baris NG yang ada di database mentah/filteredData (Hasil: 12)
  const totalNg = rawData.filter(item => {
    const status = item.hasil ? String(item.hasil).trim().toUpperCase() : "";
    return status === "NG";
  }).length;

  // 🌟 PERBAIKAN SINKRONISASI: Hitung persentase dari total OK dibanding akumulasi riwayat nyata (OK + NG)
  // Menghindari angka melompat ke 66.7% akibat pembagian total profil unik.
  const totalRiwayatKasus = totalOke + totalNg;
  const successRate = totalRiwayatKasus > 0 ? ((totalOke / totalRiwayatKasus) * 100).toFixed(1) : "0.0";

  return (
    <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* KOTAK 1: TOTAL TRIAL */}
      <div style={cardStyle}>
        <span style={titleStyle}>TOTAL TRIAL</span>
        <b style={{ ...valueStyle, color: "#2b303a" }}>{totalTrial}</b>
      </div>

      {/* KOTAK 2: OKE KESELURUHAN */}
      <div style={cardStyle}>
        <span style={titleStyle}>OKE KESELURUHAN (AKTUAL)</span>
        <b style={{ ...valueStyle, color: "#2e6557" }}>{totalOke}</b>
      </div>

      {/* KOTAK 3: TOTAL NG */}
      <div style={{ ...cardStyle, borderLeft: "4px solid #9e3d48" }}>
        <span style={titleStyle}>TOTAL AKUMULASI NG</span>
        <b style={{ ...valueStyle, color: "#9e3d48" }}>{totalNg}</b>
      </div>

      {/* KOTAK 4: HITUNGAN PRESENTASE */}
      <div style={cardStyle}>
        <span style={titleStyle}>HITUNGAN PRESENTASE AKTUAL</span>
        <b style={{ ...valueStyle, color: "#2b6cb0" }}>{successRate}%</b>
      </div>

    </div>
  );
}

const cardStyle = {
  backgroundColor: "white", padding: "20px", borderRadius: "8px", border: "1px solid #e3e6ec",
  flex: "1 1 220px", maxWidth: "320px", display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
};
const titleStyle = { fontSize: "11px", fontWeight: "700", color: "#718096", marginBottom: "10px", letterSpacing: "0.5px", textTransform: "uppercase" };
const valueStyle = { fontSize: "32px", fontWeight: "700" };

export default SummaryCard;