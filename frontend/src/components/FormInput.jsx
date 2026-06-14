import { useState, useEffect } from "react";
import axios from "axios";

const DEFECT_OPTIONS = [
  "DIMENSI KECIL", "TIDAK SIKU", "DIMENSI BESAR", "GELOMBANG", 
  "CEMBUNG", "MACET", "CEKUNG", "SOBEK", "TIPIS", "KEIJOU", "MELINTIR"
];

function FormInput({ onDataSaved, existingData = [] }) {
  const [isNg, setIsNg] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLockedBySystem, setIsLockedBySystem] = useState(false); 
  const [isManualBypass, setIsManualBypass] = useState(false); 
  const [targetId, setTargetId] = useState(null);

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

  useEffect(() => {
    if (!profil || existingData.length === 0) {
      setIsEditMode(false);
      setIsLockedBySystem(false);
      setTargetId(null);
      return;
    }

    const profilClean = profil.trim().toUpperCase();

    // 1. CEK MODE EDIT (Jika data lama ditemukan)
    const dataLama = existingData.find(item => 
      item.profil?.trim().toUpperCase() === profilClean && 
      String(item.trial).trim() === String(trial).trim()
    );

    if (dataLama) {
      setTargetId(dataLama.id); 
      setIsLockedBySystem(false); 
      
      // Pengaman rendering loop: Hanya isi state form jika sebelumnya belum aktif mode edit
      if (!isEditMode) {
        setIsEditMode(true);
        setProject(dataLama.project || "");
        setHasil(dataLama.hasil?.toUpperCase() === "OK" ? "OK" : "NG");
        setIsNg(dataLama.hasil?.toUpperCase() !== "OK");
        setDefect(dataLama.defect || "");
        if (dataLama.tanggal) setTanggalInput(dataLama.tanggal);
      }
      return; 
    }

    // 2. LOGIKA POKA-YOKE AUTO-INCREMENT
    if (!isManualBypass) {
      const riwayatProfil = existingData.filter(item => 
        item.profil?.trim().toUpperCase() === profilClean
      );

      if (riwayatProfil.length > 0 && !isEditMode) {
        const semuaNomorTrial = riwayatProfil.map(x => Number(x.trial) || 0);
        const trialTertinggi = Math.max(...semuaNomorTrial);
        
        const dataTrialTerakhir = riwayatProfil.find(x => Number(x.trial) === trialTertinggi);
        const statusTerakhir = dataTrialTerakhir?.hasil?.trim().toUpperCase();

        if (statusTerakhir === "NG" && !trial) {
          setTrial(trialTertinggi + 1); 
          setIsLockedBySystem(true);    
          setProject(dataTrialTerakhir.project || "");
          return;
        }
      }
    }

    if (!dataLama && !isLockedBySystem) {
      setIsEditMode(false);
    }
  }, [profil, trial, existingData, isManualBypass, isEditMode]); 

  const handleBukaGembok = () => {
    setIsManualBypass(true);     
    setIsLockedBySystem(false);   
    setTrial("");                 
  };

  const resetFormTotal = () => {
    setProject("");
    setProfil("");
    setTrial("");
    setHasil("NG");
    setDefect("");
    setIsNg(true);
    setIsEditMode(false);
    setIsLockedBySystem(false);
    setIsManualBypass(false); 
    setTargetId(null);
    setTanggalInput(getHariIni());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = {
      tanggal: tanggalInput,
      project: project,
      profil: profil.trim().toUpperCase(),
      trial: String(trial),
      hasil: hasil,
      defect: hasil === "OK" ? "APPROVE" : defect
    };

    if (isEditMode && targetId) {
      // RELATIVE PATH DENGAN PARAMETER NOMOR BARIS UNTUK UPDATE DATA LAMA
      axios.put(`/api/trial/${targetId}`, formData)
        .then(() => {
          alert(`🎉 PROFIL BERHASIL DI-EDIT PADA BARIS #${targetId}!`);
          resetFormTotal();
          if (onDataSaved) onDataSaved();
        })
        .catch(err => {
          console.error("Gagal update data:", err);
          alert("Gagal memperbarui data lama di Google Sheets!");
        });
    } else {
      // RELATIVE PATH UNTUK DATA BARU
      axios.post("/api/trial", formData)
        .then(() => {
          alert(`🟢 Data Baru Profil ${profil.toUpperCase()} Berhasil Disimpan!`);
          resetFormTotal();
          if (onDataSaved) onDataSaved();
        })
        .catch(err => {
          console.error("Gagal menyimpan data:", err);
          alert("Gagal menyimpan data baru ke Google Sheets!");
        });
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "8px", border: "1px solid #e3e6ec", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", fontFamily: "'Inter', sans-serif" }}>
      <h2 style={{ margin: "0 0 20px 0", color: isEditMode ? "#2563eb" : isLockedBySystem ? "#b91c1c" : "#2b303a", fontSize: "16px", fontWeight: "700", borderBottom: "2px solid #f4f6f9", paddingBottom: "10px" }}>
        {isEditMode ? `MODE EDIT: Mengoreksi Baris #${targetId} di Google Sheet` : isLockedBySystem ? "POKA-YOKE: Kelanjutan Uji Coba (Auto-Increment)" : "Input Hasil Trial Profil"}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", gap: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label style={labelStyle}>NOMOR PROFIL:</label>
            <input type="text" value={profil} onChange={(e) => setProfil(e.target.value)} required style={inputStyle} placeholder="Contoh: 9K" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flex: 1 }}>
            <label style={labelStyle}>TRIAL KE-:</label>
            <input type="number" value={trial} onChange={(e) => setTrial(e.target.value)} required disabled={isLockedBySystem} style={{ ...inputStyle, backgroundColor: isLockedBySystem ? "#f1f5f9" : "white", fontWeight: isLockedBySystem ? "700" : "normal" }} />
          </div>
        </div>
        {isLockedBySystem && <div style={{ fontSize: "12px", color: "#b91c1c", backgroundColor: "#fef2f2", padding: "10px", borderRadius: "6px", fontWeight: "600", border: "1px solid #fca5a5" }}>⚠️ SISTEM AUTOMATIC: Profil {profil.toUpperCase()} terakhir berstatus NG. Urutan otomatis naik ke Trial Ke-{trial} agar tidak menimpa data lama.</div>}
        {isEditMode && <div style={{ fontSize: "12px", color: "#2563eb", backgroundColor: "#eff6ff", padding: "10px", borderRadius: "6px", fontWeight: "600", border: "1px solid #bfdbfe" }}>ℹ️ MODE EDIT AKTIF: Anda mengubah data lama. Klik simpan untuk MENIMPA data lama di baris #{targetId}.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}><label style={labelStyle}>TANGGAL TRIAL:</label><input type="date" required value={tanggalInput} onChange={(e) => setTanggalInput(e.target.value)} style={inputStyle} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}><label style={labelStyle}>NAMA PROJECT:</label><input type="text" value={project} onChange={(e) => setProject(e.target.value)} required style={inputStyle} /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}><label style={labelStyle}>STATUS HASIL:</label><select value={hasil} required style={selectStyle} onChange={(e) => { setHasil(e.target.value); setIsNg(e.target.value === "NG"); }}><option value="NG">NG (REJECT)</option><option value="OK">OK (APPROVE)</option></select></div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}><label style={{ ...labelStyle, color: isNg ? "#b85c65" : "#495057" }}>JENIS DEFECT:</label>{isNg ? ( <select value={defect} onChange={(e) => setDefect(e.target.value)} required style={selectStyle}><option value="">-- Pilih Jenis Defect --</option>{DEFECT_OPTIONS.map((opt, index) => ( <option key={index} value={opt}>{opt}</option> ))}</select> ) : ( <input type="text" value="APPROVE" disabled style={{ ...inputStyle, backgroundColor: "#f8f9fa", color: "#6c757d" }} /> )}</div>
        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button type="submit" style={{ ...btnSubmitStyle, backgroundColor: isEditMode ? "#2563eb" : isLockedBySystem ? "#b91c1c" : "#1e293b", flex: 2 }}>{isEditMode ? "Update Data Terkini" : isLockedBySystem ? `Simpan Sebagai Trial Ke-${trial}` : "Simpan Data Baru"}</button>
          {isLockedBySystem && <button type="button" onClick={handleBukaGembok} style={{ ...btnSubmitStyle, backgroundColor: "#64748b", flex: 1 }}>Edit Profil</button>}
          {(isEditMode || isManualBypass) && <button type="button" onClick={resetFormTotal} style={{ ...btnSubmitStyle, backgroundColor: "#dc2626", flex: 1 }}>Batal Edit / Reset</button>}
        </div>
      </form>
    </div>
  );
}

const labelStyle = { fontSize: "11px", fontWeight: "700", color: "#475569" };
const inputStyle = { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "100%", boxSizing: "border-box" };
const selectStyle = { padding: "10px 14px", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "white", fontSize: "13px", width: "100%", boxSizing: "border-box" };
const btnSubmitStyle = { color: "white", border: "none", padding: "12px", borderRadius: "6px", fontSize: "14px", fontWeight: "600", cursor: "pointer" };

export default FormInput;