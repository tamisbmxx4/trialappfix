import { useState, useEffect } from "react";
import axios from "axios";

const DEFECT_OPTIONS = ["DIMENSI KECIL", "TIDAK SIKU", "DIMENSI BESAR", "GELOMBANG", "CEMBUNG", "MACET", "CEKUNG", "SOBEK", "TIPIS", "KEIJOU", "MELINTIR"];

function FormInput({ onDataSaved, existingData = [] }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [targetId, setTargetId] = useState(null);

  const [project, setProject] = useState("");
  const [profil, setProfil] = useState("");
  const [trial, setTrial] = useState("");
  const [hasil, setHasil] = useState("NG");
  const [defect, setDefect] = useState("");
  const [tanggalInput, setTanggalInput] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!profil || !trial) {
      setIsEditMode(false);
      return;
    }

    const pTarget = String(profil).trim().toUpperCase();
    const tTarget = String(trial).trim();

    const dataLama = existingData.find(item => {
      const pDB = String(item.profil || "").trim().toUpperCase();
      const tDB = String(item.trial || "").trim();
      return pDB === pTarget && tDB === tTarget;
    });

    if (dataLama) {
      setIsEditMode(true);
      setTargetId(dataLama.id);
      setProject(dataLama.project || "");
      
      const statusDB = String(dataLama.hasil || "").trim().toUpperCase();
      const isOk = statusDB === "OK" || statusDB === "APPROVE";
      
      setHasil(isOk ? "OK" : "NG");
      setDefect(isOk ? "APPROVE" : (dataLama.defect || ""));
      setTanggalInput(dataLama.tanggal || "");
    } else {
      setIsEditMode(false);
      setTargetId(null);
    }
  }, [profil, trial, existingData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = { tanggal: tanggalInput, project, profil: profil.toUpperCase(), trial: String(trial), hasil, defect: hasil === "OK" ? "APPROVE" : defect };

    if (isEditMode) {
      axios.put(`/api/trial/${targetId}`, formData).then(() => { alert("Update Berhasil!"); onDataSaved(); });
    } else {
      axios.post("/api/trial", formData).then(() => { alert("Simpan Berhasil!"); onDataSaved(); });
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc" }}>
      <h2 style={{ color: isEditMode ? "blue" : "black" }}>
        {isEditMode ? `MODE EDIT (Baris #${targetId})` : "INPUT DATA BARU"}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input placeholder="Profil" value={profil} onChange={(e) => setProfil(e.target.value)} />
        <input placeholder="Trial Ke-" value={trial} onChange={(e) => setTrial(e.target.value)} />
        
        <label>HASIL:</label>
        <select value={hasil} onChange={(e) => { 
          setHasil(e.target.value); 
          if(e.target.value === "OK") setDefect("APPROVE"); 
          else setDefect(""); 
        }}>
          <option value="NG">NG (REJECT)</option>
          <option value="OK">OK (APPROVE)</option>
        </select>

        {hasil === "NG" && (
          <>
            <label>JENIS DEFECT:</label>
            <select value={defect} onChange={(e) => setDefect(e.target.value)}>
              <option value="">-- Pilih Defect --</option>
              {DEFECT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </>
        )}
        
        <button type="submit">{isEditMode ? "Update" : "Simpan"}</button>
      </form>
    </div>
  );
}

export default FormInput;