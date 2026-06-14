import { useState, useEffect } from "react";
import axios from "axios";

const DEFECT_OPTIONS = [
  "DIMENSI KECIL", "TIDAK SIKU", "DIMENSI BESAR", "GELOMBANG", 
  "CEMBUNG", "MACET", "CEKUNG", "SOBEK", "TIPIS", "KEIJOU", "MELINTIR"
];

function FormInput({ onDataSaved, existingData = [] }) {
  const [isNg, setIsNg] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);

  // State untuk kontrol input form
  const [project, setProject] = useState("");
  const [profil, setProfil] = useState("");
  const [trial, setTrial] = useState("");
  const [hasil, setHasil] = useState("NG");
  const [defect, setDefect] = useState("");

  const getHariIni = () => {
    const tgl = new Date();
    const offset = tgl.getTimezoneOffset();
    const tglLokal = new Date(tgl.getTime() - (offset * 60 * 1000));
    return tglLokal.toISOString().split('T')[0];
  };

  const [tanggalInput, setTanggalInput] = useState(getHariIni());

  // 🌟 AUTOMATIC DETECT & AUTO-FILL UNTUK EDIT
  useEffect(() => {
    if (!profil || !trial || existingData.length === 0) {
      setIsEditMode(false);
      setTargetId(null);
      return;
    }

    // Cari apakah kombinasi nomor profil dan nomor trial sudah ada di database
    const dataLama = existingData.find(item => 
      item.profil?.trim().toUpperCase() === profil.trim().toUpperCase() && 
      String(item.trial) === String(trial)
    );

    if (dataLama) {
      // Jika data ditemukan, aktifkan Mode Edit dan isi form dengan data lama otomatis
      setIsEditMode(true);
      setTargetId(dataLama.id || dataLama._id); // Sesuaikan dengan key ID dari backend Anda
      setProject(dataLama.project || "");
      setHasil(dataLama.hasil?.toUpperCase() === "OK" ? "OK" : "NG");
      setIsNg(dataLama.hasil?.toUpperCase() !== "OK");
      setDefect(dataLama.defect || "");
      if (dataLama.tanggal) setTanggalInput(dataLama.tanggal);
    } else {
      setIsEditMode(false);
      setTargetId(null);
    }
  }, [profil, trial, existingData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      tanggal: tanggalInput,
      project: project,
      profil: profil.trim().toUpperCase(),
      trial: trial,
      hasil: hasil,
      defect: hasil === "OK" ? "APPROVE" : defect
    };

    if (isEditMode && targetId) {
      // 🟢 MODE EDIT: Kirim perintah PUT ke API untuk memperbarui data lama
      axios.put(`http://localhost:3000/api/trial/${targetId}`, formData)
        .then(() => {
          alert(`Data Profil ${profil} Trial Ke-${trial} Berhasil DIUPDATE!`);
          resetForm();
          if (onDataSaved) onDataSaved();
        })
        .catch(err => {
          console.error("Gagal update data:", err);
          alert("Gagal memperbarui data di server lokal!");
        });
    } else {
      // 🔵 MODE BARU: Kirim perintah POST untuk menyimpan data baru
      axios.post("http://localhost:3000/api/trial", formData)
        .then(() => {
          alert("Data Trial Baru Berhasil Disimpan ke Sistem!");
          resetForm();
          if (onDataSaved) onDataSaved();
        })
        .catch(err => {
          console.error("Gagal menyimpan data:", err);
          alert("Gagal menyimpan data baru ke server lokal!");
        });
    }
  };

  const resetForm = () => {
    setProject("");
    setProfil("");
    setTrial("");
    setHasil("NG");
    setDefect("");
    setIsNg(true);
    setIsEditMode(false);
    setTargetId(null);
    setTanggalInput(getHariIni());
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "8px", border: "1px solid #e3e6ec", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Indikator Status Mode Form */}
      <h2 style={{ margin: "0 0 20px 0", color: isEditMode ? "#2563eb" : "#2b303a", fontSize: "16px", fontWeight: "700", borderBottom: "2px solid #f4f6f9", paddingBottom: "10px" }}>
        {isEditMode ? "📝 MODE EDIT: Koreksi Data Terdeteksi" : "📥 Formulir Input Hasil Trial Profil"}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        {/* Input Nomor Profil & Trial ditaruh di atas sebagai Key Identifikasi data */}
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label style={labelStyle}>NOMOR PROFIL:</label>
            <input type="text" value={profil} onChange={(e) => setProfil(e.target.value)} required style={inputStyle} placeholder="Contoh: 9K" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label style={labelStyle}>TRIAL KE-:</label>
            <input type="number" value={trial} onChange={(e) => setTrial(e.target.value)} required style={inputStyle} placeholder="Contoh: 1" />
          </div>
        </div>

        {isEditMode && (
          <div style={{ fontSize: "12px", color: "#2563eb", backgroundColor: "#eff6ff", padding: "10px", borderRadius: "6px", fontWeight: "600", border: "1px solid #bfdbfe" }}>
            ℹ️ Sistem mendeteksi profil ini sudah ada. Mengubah form di bawah akan langsung mengupdate database lama!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={labelStyle}>TANGGAL TRIAL:</label>
          <input type="date" required value={tanggalInput} onChange={(e) => setTanggalInput(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={labelStyle}>NAMA PROJECT:</label>
          <input type="text" value={project} onChange={(e) => setProject(e.target.value)} required style={inputStyle} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={labelStyle}>STATUS HASIL:</label>
          <select value={hasil} required style={selectStyle} onChange={(e) => { setHasil(e.target.value); setIsNg(e.target.value === "NG"); }}>
            <option value="NG">NG (REJECT)</option>
            <option value="OK">OK (APPROVE)</option>
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label style={{ ...labelStyle, color: isNg ? "#b85c65" : "#495057" }}>JENIS DEFECT:</label>
          {isNg ? (
            <select value={defect} onChange={(e) => setDefect(e.target.value)} required style={selectStyle}>
              <option value="">-- Pilih Jenis Defect --</option>
              {DEFECT_OPTIONS.map((opt, index) => (
                <option key={index} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input type="text" value="APPROVE" disabled style={{ ...inputStyle, backgroundColor: "#f8f9fa", color: "#6c757d", cursor: "not-allowed" }} />
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit" style={{ ...btnSubmitStyle, backgroundColor: isEditMode ? "#2563eb" : "#1e293b", flex: 2 }}>
            {isEditMode ? "Update Data Terkini" : "Simpan Data Baru"}
          </button>
          
          {isEditMode && (
            <button type="button" onClick={resetForm} style={{ ...btnSubmitStyle, backgroundColor: "#64748b", flex: 1 }}>
              Batal
            </button>
          )}
        </div>

      </form>
    </div>
  );
}

const labelStyle = { fontSize: "11px", fontWeight: "700", color: "#475569", letterSpacing: "0.03em" };
const inputStyle = { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "100%", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" };
const selectStyle = { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", fontSize: "13px", width: "100%", boxSizing: "border-box", fontFamily: "'Inter', sans-serif" };
const btnSubmitStyle = { color: "white", border: "none", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "background 0.2s" };

export default FormInput;