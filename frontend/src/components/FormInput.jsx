import { useState, useEffect } from "react";
import axios from "axios";

const DEFECT_OPTIONS = [
  "DIMENSI KECIL", "TIDAK SIKU", "DIMENSI BESAR", "GELOMBANG",
  "CEMBUNG", "MACET", "CEKUNG", "SOBEK", "TIPIS", "KEIJOU", "MELINTIR"
];

const labelStyle = { fontSize: "11px", fontWeight: "700", color: "#475569" };
const inputStyle = { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "100%", boxSizing: "border-box" };
const selectStyle = { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", fontSize: "13px", width: "100%", boxSizing: "border-box" };
const btnStyle = (color) => ({ color: "white", border: "none", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", backgroundColor: color, flex: 1 });

const getHariIni = () => {
  const tgl = new Date();
  const tglLokal = new Date(tgl.getTime() - tgl.getTimezoneOffset() * 60000);
  return tglLokal.toISOString().split("T")[0];
};

function FormInput({ onDataSaved, existingData = [] }) {
  const [profil, setProfil]           = useState("");
  const [trial, setTrial]             = useState("");
  const [project, setProject]         = useState("");
  const [tanggal, setTanggal]         = useState(getHariIni());
  const [hasil, setHasil]             = useState("NG");
  const [defect, setDefect]           = useState("");

  // Mode flags
  const [mode, setMode]               = useState("input"); // "input" | "pokayoke" | "edit"
  const [targetId, setTargetId]       = useState(null);
  const [lastTrialData, setLastTrialData] = useState(null);
  const [isManualBypass, setIsManualBypass] = useState(false);
  const [autoTrialNum, setAutoTrialNum]    = useState(null);

  const resetForm = () => {
    setProfil(""); setTrial(""); setProject(""); setTanggal(getHariIni());
    setHasil("NG"); setDefect(""); setMode("input"); setTargetId(null);
    setLastTrialData(null); setIsManualBypass(false); setAutoTrialNum(null);
  };

  const loadDataKeForm = (data) => {
    const status = data.hasil?.toUpperCase() === "OK" || data.hasil?.toUpperCase() === "APPROVE" ? "OK" : "NG";
    setProject(data.project || "");
    setTrial(String(data.trial));
    setHasil(status);
    setDefect(data.defect || "");
    if (data.tanggal) setTanggal(data.tanggal);
    setTargetId(data.id);
    setMode("edit");
  };

  // Deteksi otomatis saat profil diketik
  useEffect(() => {
    if (!profil.trim() || existingData.length === 0 || isManualBypass) return;

    const profilClean = profil.trim().toUpperCase();

    // Cari semua riwayat profil ini
    const riwayat = existingData.filter(
      (item) => String(item.profil).trim().toUpperCase() === profilClean
    );

    if (riwayat.length === 0) {
      setMode("input");
      setLastTrialData(null);
      setAutoTrialNum(null);
      return;
    }

    // Cek exact match profil + trial (jika trial sudah diisi manual)
    if (trial) {
      const exactMatch = riwayat.find((item) => String(item.trial).trim() === String(trial).trim());
      if (exactMatch) {
        loadDataKeForm(exactMatch);
        return;
      }
    }

    // Ambil trial terakhir
    const trialTertinggi = Math.max(...riwayat.map((x) => Number(x.trial) || 0));
    const dataTrialTerakhir = riwayat.find((x) => Number(x.trial) === trialTertinggi);
    const statusTerakhir = dataTrialTerakhir?.hasil?.trim().toUpperCase();

    setLastTrialData(dataTrialTerakhir);
    setProject(dataTrialTerakhir.project || "");

    if (statusTerakhir === "NG") {
      // Auto-increment trial berikutnya
      setAutoTrialNum(trialTertinggi + 1);
      setTrial(trialTertinggi + 1);
      setMode("pokayoke-ng");
    } else {
      // Status OK — tampilkan poka-yoke, beri pilihan edit atau input baru
      setAutoTrialNum(null);
      setMode("pokayoke-ok");
    }
  }, [profil, existingData]);

  const handleEditDariPokaYoke = () => {
    if (!lastTrialData) return;
    loadDataKeForm(lastTrialData);
  };

  const handleInputBaru = () => {
    setIsManualBypass(true);
    setMode("input");
    setLastTrialData(null);
    setTrial("");
    setAutoTrialNum(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = {
      tanggal,
      project,
      profil: profil.trim().toUpperCase(),
      trial: String(trial),
      hasil,
      defect: hasil === "OK" ? "APPROVE" : defect,
    };

    if (mode === "edit" && targetId) {
      axios.put(`/api/trial/${targetId}`, formData)
        .then(() => { alert(`🎉 Data berhasil diperbarui di baris #${targetId}!`); resetForm(); if (onDataSaved) onDataSaved(); })
        .catch(() => alert("Gagal memperbarui data di Google Sheets!"));
    } else {
      axios.post("/api/trial", formData)
        .then(() => { alert(`🟢 Data baru profil ${profil.toUpperCase()} berhasil disimpan!`); resetForm(); if (onDataSaved) onDataSaved(); })
        .catch(() => alert("Gagal menyimpan data ke Google Sheets!"));
    }
  };

  const isPokayoke = mode === "pokayoke-ng" || mode === "pokayoke-ok";

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "8px", border: "1px solid #e3e6ec", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <h2 style={{ margin: "0 0 20px 0", fontSize: "16px", fontWeight: "700", borderBottom: "2px solid #f4f6f9", paddingBottom: "10px", color: mode === "edit" ? "#2563eb" : isPokayoke ? "#b91c1c" : "#2b303a" }}>
        {mode === "edit" && `✏️ MODE EDIT: Mengoreksi Baris #${targetId}`}
        {mode === "pokayoke-ng" && "⚠️ POKA-YOKE: Kelanjutan Uji Coba (Auto-Increment)"}
        {mode === "pokayoke-ok" && "✅ POKA-YOKE: Profil Sudah Berstatus OK"}
        {mode === "input" && "Input Hasil Trial Profil"}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Profil + Trial */}
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={labelStyle}>NOMOR PROFIL:</label>
            <input
              type="text" value={profil} required placeholder="Contoh: 9K"
              onChange={(e) => { setProfil(e.target.value); setIsManualBypass(false); setMode("input"); setTrial(""); setLastTrialData(null); }}
              style={inputStyle}
            />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={labelStyle}>TRIAL KE-:</label>
            <input
              type="number" value={trial} required
              disabled={mode === "pokayoke-ng"}
              onChange={(e) => setTrial(e.target.value)}
              style={{ ...inputStyle, backgroundColor: mode === "pokayoke-ng" ? "#f1f5f9" : "white", fontWeight: mode === "pokayoke-ng" ? "700" : "normal" }}
            />
          </div>
        </div>

        {/* Banner poka-yoke NG */}
        {mode === "pokayoke-ng" && (
          <div style={{ fontSize: "12px", color: "#b91c1c", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "6px", fontWeight: "600", border: "1px solid #fca5a5" }}>
            ⚠️ Profil <strong>{profil.toUpperCase()}</strong> terakhir berstatus <strong>NG</strong> (Trial ke-{lastTrialData?.trial}). Nomor trial otomatis naik ke <strong>Trial ke-{autoTrialNum}</strong> agar tidak menimpa data lama.
          </div>
        )}

        {/* Banner poka-yoke OK */}
        {mode === "pokayoke-ok" && (
          <div style={{ fontSize: "12px", color: "#166534", backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "6px", fontWeight: "600", border: "1px solid #86efac" }}>
            ✅ Profil <strong>{profil.toUpperCase()}</strong> terakhir berstatus <strong>OK</strong> (Trial ke-{lastTrialData?.trial}). Pilih <em>Edit</em> untuk koreksi data atau <em>Input Baru</em> untuk tambah trial.
          </div>
        )}

        {/* Banner mode edit */}
        {mode === "edit" && (
          <div style={{ fontSize: "12px", color: "#2563eb", backgroundColor: "#eff6ff", padding: "10px", borderRadius: "6px", fontWeight: "600", border: "1px solid #bfdbfe" }}>
            ℹ️ MODE EDIT AKTIF: Data baris #{targetId} akan ditimpa saat klik <em>Update</em>.
          </div>
        )}

        {/* Field lain — hidden saat poka-yoke OK (belum pilih aksi) */}
        {mode !== "pokayoke-ok" && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={labelStyle}>TANGGAL TRIAL:</label>
              <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={labelStyle}>NAMA PROJECT:</label>
              <input type="text" required value={project} onChange={(e) => setProject(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={labelStyle}>STATUS HASIL:</label>
              <select value={hasil} required style={selectStyle} onChange={(e) => setHasil(e.target.value)}>
                <option value="NG">NG (REJECT)</option>
                <option value="OK">OK (APPROVE)</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ ...labelStyle, color: hasil === "NG" ? "#b85c65" : "#495057" }}>JENIS DEFECT:</label>
              {hasil === "NG" ? (
                <select value={defect} onChange={(e) => setDefect(e.target.value)} required style={selectStyle}>
                  <option value="">-- Pilih Jenis Defect --</option>
                  {DEFECT_OPTIONS.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input type="text" value="APPROVE" disabled style={{ ...inputStyle, backgroundColor: "#f8f9fa", color: "#6c757d" }} />
              )}
            </div>
          </>
        )}

        {/* Tombol aksi */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          {/* Poka-yoke OK: hanya Edit & Input Baru */}
          {mode === "pokayoke-ok" && (
            <>
              <button type="button" onClick={handleEditDariPokaYoke} style={btnStyle("#2563eb")}>✏️ Edit Trial {lastTrialData?.trial}</button>
              <button type="button" onClick={handleInputBaru} style={btnStyle("#64748b")}>➕ Input Baru</button>
            </>
          )}

          {/* Poka-yoke NG: Simpan + Edit data lama + Input Baru */}
          {mode === "pokayoke-ng" && (
            <>
              <button type="submit" style={btnStyle("#b91c1c")}>Simpan Trial ke-{autoTrialNum}</button>
              <button type="button" onClick={handleEditDariPokaYoke} style={btnStyle("#2563eb")}>✏️ Edit Trial {lastTrialData?.trial}</button>
              <button type="button" onClick={handleInputBaru} style={btnStyle("#64748b")}>Input Baru</button>
            </>
          )}

          {/* Mode edit */}
          {mode === "edit" && (
            <>
              <button type="submit" style={btnStyle("#2563eb")}>Update Data</button>
              <button type="button" onClick={resetForm} style={btnStyle("#dc2626")}>Batal / Reset</button>
            </>
          )}

          {/* Mode input biasa */}
          {mode === "input" && (
            <button type="submit" style={btnStyle("#1e293b")}>Simpan Data Baru</button>
          )}
        </div>
      </form>
    </div>
  );
}

export default FormInput;
