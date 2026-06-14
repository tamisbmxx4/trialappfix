import { useState, useEffect, useCallback } from "react";
import axios from "axios"; 
import SummaryCard from "./components/SummaryCard";
import ChartOKNG from "./components/ChartOKNG";
import PieDefect from "./components/PieDefect";
import ChartPerHari from "./components/ChartPerHari";
import ChartProfil from "./components/ChartProfil";
import FormInput from "./components/FormInput"; 
import "./App.css"; 

const GLOBAL_PASSWORD = "12345678"; 

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const [rawData, setRawData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [chartData, setChartData] = useState([]); 
  const [projectList, setProjectList] = useState([]);
  const [selectedProject, setSelectedProject] = useState("ALL");

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const [tableFilterHasil, setTableFilterHasil] = useState("ALL");
  const [tableFilterDefect, setTableFilterDefect] = useState("ALL");
  
  const [tableStartDate, setTableStartDate] = useState("");
  const [tableEndDate, setTableEndDate] = useState("");
  const [filterTrialTerbanyak, setFilterTrialTerbanyak] = useState(false);

  // 1. FUNGSI AMBIL DATA
//  const fetchDataDariBackend = useCallback(() => {
 //   axios.get("http://localhost:3000/api/trial") 
  //    .then((res) => {
   //     setRawData(res.data);
   //     setFilteredData(res.data);
   const fetchDataDariBackend = useCallback(() => {
    axios.get("/api/trial") 
      .then((res) => {  
        setRawData(res.data);

        const projects = new Set();
        res.data.forEach(item => {
          const pName = item.project && item.project.trim() !== "" ? item.project.trim() : "Project Lama";
          projects.add(pName);
        });
        setProjectList(["ALL", ...Array.from(projects)]);
      })
      .catch(err => console.error("Gagal mengambil data API Lokal:", err));
  }, []);

  useEffect(() => {
    const loginStatus = localStorage.getItem("dashboard_access");
    if (loginStatus === "granted") setIsAuthenticated(true);
  }, []);

  // Pemicu ambil data pertama kali saat user berhasil login
  useEffect(() => {
    if (isAuthenticated) {
      fetchDataDariBackend();
    }
  }, [isAuthenticated, fetchDataDariBackend]);

  // 2. LOGIKA FILTER GLOBAL (Hanya untuk Project & Normalisasi Format Teks Tanggal)
  useEffect(() => {
    let baseData = rawData;

    // Filter berdasarkan Project Utama (Kiri Atas)
    if (selectedProject !== "ALL") {
      baseData = rawData.filter(item => {
        const pName = item.project && item.project.trim() !== "" ? item.project.trim() : "Project Lama";
        return pName.toUpperCase() === selectedProject.toUpperCase();
      });
    }

    // Normalisasi teks penulisan bulan dari database
    const cleanedBaseData = baseData.map(item => {
      if (item && item.tanggal) {
        let formattedDate = String(item.tanggal).toLowerCase()
          .replace(/mei/g, "05")
          .replace(/may/g, "05")
          .replace(/mey/g, "05")
          .replace(/\//g, "-");
        return { ...item, tanggal: formattedDate };
      }
      return item;
    });

    setFilteredData(cleanedBaseData);

    // Olah data unik untuk keperluan chart profil
    const uniqueDataMap = new Map();
    cleanedBaseData.forEach(item => {
      if (item && item.profil) {
        const key = item.profil.trim().toUpperCase();
        uniqueDataMap.set(key, item);
      }
    });
    setChartData(Array.from(uniqueDataMap.values()));

    // Reset filter individual tabel ketika ganti project utama agar tidak tabrakan
    setSearchQuery("");
    setTableFilterHasil("ALL");
    setTableFilterDefect("ALL");
    setTableStartDate("");
    setTableEndDate("");
    setFilterTrialTerbanyak(false);
  }, [selectedProject, rawData]);

  // 3. LOGIKA FILTER BERLAPIS PADA TABEL LOG (Termasuk Perbaikan Filter Tanggal Akurat)
  const dataHasilSearch = filteredData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    
    const statusHasil = item.hasil ? String(item.hasil).trim().toUpperCase() : "";
    const defectHasil = item.defect ? String(item.defect).trim().toUpperCase() : "";
    const itemDateStr = item.tanggal ? String(item.tanggal).trim() : "";

    // A. Filter Pencarian global teks
    const cocokSearch = (
      !searchQuery ||
      (item.profil && String(item.profil).toLowerCase().includes(searchLower)) ||
      (item.defect && String(item.defect).toLowerCase().includes(searchLower)) ||
      (item.hasil && String(item.hasil).toLowerCase().includes(searchLower)) ||
      (item.tanggal && String(item.tanggal).toLowerCase().includes(searchLower))
    );

    // B. Filter Dropdown Status OK/NG
    let cocokHasil = true;
    if (tableFilterHasil === "OK") cocokHasil = (statusHasil === "OK" || statusHasil === "APPROVE");
    if (tableFilterHasil === "NG") cocokHasil = (statusHasil === "NG");

    // C. Filter Dropdown Jenis Defect
    let cocokDefect = true;
    if (tableFilterDefect !== "ALL") cocokDefect = (defectHasil === tableFilterDefect);

    // D. Filter Rentang Tanggal yang Akurat (Mengatasi Format Masalah Kombinasi)
    let cocokTanggal = true;
    if (itemDateStr) {
      let dateData;

      // Cek jika format database adalah DD-MM-YYYY (Contoh: 14-06-2026)
      const bagianTanggal = itemDateStr.split("-");
      if (bagianTanggal.length === 3 && bagianTanggal[0].length === 2) {
        // Balik urutannya menjadi format standar YYYY-MM-DD agar bisa dibaca JavaScript
        dateData = new Date(`${bagianTanggal[2]}-${bagianTanggal[1]}-${bagianTanggal[0]}`);
      } else {
        // Jika format database sudah standar YYYY-MM-DD (Contoh: 2026-06-14)
        dateData = new Date(itemDateStr);
      }

      // Jalankan validasi objek tanggal
      if (!isNaN(dateData.getTime())) {
        dateData.setHours(0, 0, 0, 0);

        if (tableStartDate) {
          const dateMulai = new Date(tableStartDate);
          dateMulai.setHours(0, 0, 0, 0);
          cocokTanggal = cocokTanggal && (dateData >= dateMulai);
        }
        if (tableEndDate) {
          const dateSelesai = new Date(tableEndDate);
          dateSelesai.setHours(0, 0, 0, 0);
          cocokTanggal = cocokTanggal && (dateData <= dateSelesai);
        }
      } else {
        // Pengaman: Jika parsing gagal, tampilkan data hanya jika filter tanggal kosong
        cocokTanggal = !tableStartDate && !tableEndDate;
      }
    } else if (tableStartDate || tableEndDate) {
      cocokTanggal = false; 
    }

    // E. Filter Checkbox Trial Tertinggi
    let cocokTrialTerbanyak = true;
    if (filterTrialTerbanyak && item.profil) {
      const semuaTrialProfilIni = filteredData
        .filter(x => x.profil && x.profil.trim().toUpperCase() === item.profil.trim().toUpperCase())
        .map(x => parseInt(x.trial) || 0);
      
      const maxTrial = Math.max(...semuaTrialProfilIni);
      cocokTrialTerbanyak = (parseInt(item.trial) || 0) === maxTrial;
    }

    return cocokSearch && cocokHasil && cocokDefect && cocokTanggal && cocokTrialTerbanyak;
  });

  const handleLogout = () => {
    localStorage.removeItem("dashboard_access");
    setIsAuthenticated(false);
    setInputPassword("");
  };

  if (!isAuthenticated) {
    return (
      <div className="login-overlay">
        <div className="login-box">
          <h2>🔒 Verifikasi Akses</h2>
          <form onSubmit={(e) => { e.preventDefault(); if (inputPassword === GLOBAL_PASSWORD) { localStorage.setItem("dashboard_access", "granted"); setIsAuthenticated(true); setErrorMessage(""); } else { setErrorMessage("Password salah!"); } }} className="login-form">
            <input type="password" placeholder="Password sistem..." value={inputPassword} onChange={(e) => setInputPassword(e.target.value)} className="login-input" autoFocus />
            {errorMessage && <span className="login-error">{errorMessage}</span>}
            <button type="submit" className="login-submit-btn">Masuk Sistem</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* PANEL NAVIGASI ATAS */}
      <div className="nav-panel no-print">
        <div className="tab-wrapper">
          <button onClick={() => setActiveMenu("dashboard")} className={activeMenu === "dashboard" ? "tab-btn-active" : "tab-btn-inactive"}>
            Ringkasan Grafik
          </button>
          <button onClick={() => setActiveMenu("table")} className={activeMenu === "table" ? "tab-btn-active" : "tab-btn-inactive"}>
            Log Tabel ({filteredData.length})
          </button>
          <button onClick={() => setActiveMenu("input_form")} className={activeMenu === "input_form" ? "tab-btn-active" : "tab-btn-inactive"}>
            Input Data Trial
          </button>
        </div>

        <div className="proj-select-wrapper">
          <span className="proj-select-label">Project By:</span>
          <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="custom-select">
            {projectList.map((proj, idx) => (
              <option key={idx} value={proj}>{proj === "ALL" ? "SEMUA PROJECT" : proj.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <button onClick={() => window.print()} className="btn-print" style={{ marginRight: "8px" }}> Eksport PDF</button>
          <button onClick={handleLogout} className="btn-logout"> Kunci</button>
        </div>
      </div>

      <h1 className="main-title">MONITORING PERFORMA TRIAL PROFIL</h1>

      {/* VALIDASI KARTU RINGKASAN */}
      {rawData.length > 0 ? (
        <SummaryCard data={chartData} rawData={filteredData}/>
      ) : (
        <div className="calc-notice">Sedang menghitung performa kualitas trial...</div>
      )}
      <br /><br />

      {/* VIEW GRAPH */}
      {activeMenu === "dashboard" && (
        <>
          <div className="dashboard-grid">
            <div className="card-chart-sm card-pdf">
              <ChartOKNG data={filteredData} />
            </div>
            <div className="card-chart-md card-pdf">
              <PieDefect data={filteredData} />
            </div>
            <div className="card-chart-lg card-pdf">
              <ChartProfil data={filteredData} />
            </div>
          </div>
          <br /><br />
          <div className="card-chart-line card-pdf">
            <ChartPerHari data={filteredData} />
          </div>
        </>
      )}

      {/* VIEW TABLE */}
      {activeMenu === "table" && (
        <div className="table-view-card">
          <div className="filter-bar no-print">
            <div className="filter-field">
              <label>FILTER STATUS:</label>
              <select value={tableFilterHasil} onChange={(e) => setTableFilterHasil(e.target.value)} className="custom-select">
                <option value="ALL">SEMUA HASIL</option>
                <option value="OK">ONLY OK / APPROVE</option>
                <option value="NG">ONLY NG</option>
              </select>
            </div>
            
            <div className="filter-field">
              <label>FILTER DEFECT:</label>
              <select value={tableFilterDefect} onChange={(e) => setTableFilterDefect(e.target.value)} className="custom-select">
                <option value="ALL">SEMUA DEFECT</option>
                {Array.from(new Set(filteredData.map(id => id.defect ? String(id.defect).trim().toUpperCase() : "").filter(d => d !== "" && d !== "APPROVE"))).map((def, i) => (
                  <option key={i} value={def}>{def}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label>TANGGAL AWAL:</label>
              <input type="date" value={tableStartDate} onChange={(e) => setTableStartDate(e.target.value)} className="custom-select" style={{ fontWeight: "normal" }} />
            </div>

            <div className="filter-field">
              <label>TANGGAL AKHIR:</label>
              <input type="date" value={tableEndDate} onChange={(e) => setTableEndDate(e.target.value)} className="custom-select" style={{ fontWeight: "normal" }} />
            </div>

            <div className="filter-checkbox-wrapper">
              <input type="checkbox" id="chkMaxTrial" checked={filterTrialTerbanyak} onChange={(e) => setFilterTrialTerbanyak(e.target.checked)} />
              <label htmlFor="chkMaxTrial" className="filter-checkbox-label" style={{ color: filterTrialTerbanyak ? "#b85c65" : "#4a5568" }}>
               TRIAL TERTINGGI
              </label>
            </div>

            <div className="search-field">
              <label>PENCARIAN :</label>
              <input type="text" placeholder="Cari nomor profil atau temuan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          <div className="filter-info-row">
            <span className="filter-info-text">
              Menampilkan <b className="filter-info-count">{dataHasilSearch.length}</b> baris dari filter aktif.
            </span>
            {(searchQuery || tableFilterHasil !== "ALL" || tableFilterDefect !== "ALL" || tableStartDate || tableEndDate || filterTrialTerbanyak) && (
              <button 
                onClick={() => { 
                  setSearchQuery(""); setTableFilterHasil("ALL"); setTableFilterDefect("ALL"); 
                  setTableStartDate(""); setTableEndDate(""); setFilterTrialTerbanyak(false); 
                }} 
                className="btn-reset-filter"
              >
                Clear Semua Filter ×
              </button>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>No</th>
                  <th style={{ width: "120px" }}>Tanggal</th>
                  <th style={{ width: "160px" }}>Project</th>
                  <th style={{ width: "150px" }}>No Profil</th>
                  <th style={{ width: "100px", textAlign: "center" }}>Trial Ke</th>
                  <th style={{ width: "120px" }}>Hasil</th>
                  <th>Keterangan Temuan Lapangan</th>
                </tr>
              </thead>
              <tbody>
                {dataHasilSearch.length > 0 ? (
                  dataHasilSearch.map((item, idx) => {
                    const status = item.hasil ? item.hasil.trim().toUpperCase() : "NG";
                    const isOk = status === "OK" || status === "APPROVE";
                    return (
                      <tr key={idx} className={idx % 2 === 0 ? "row-even" : "row-odd"}>
                        <td>{idx + 1}</td>
                        <td>{item.tanggal || "-"}</td>
                        <td>{item.project || "Project Lama"}</td>
                        <td style={{ fontWeight: "600", color: "#2b303a" }}>{item.profil || "-"}</td>
                        <td style={{ textAlign: "center", fontWeight: "600" }}>{item.trial || "0"}</td>
                        <td>
                          <span className={`badge ${isOk ? "badge-ok" : "badge-ng"}`}>
                            {status}
                          </span>
                        </td>
                        <td style={{ fontWeight: "500", color: isOk ? "#6c757d" : "#9e3d48" }}>
                          {isOk ? "✅ PASS PRODUCT" : `❌ DEFECT: ${item.defect ? item.defect.toUpperCase() : "UNKNOWN"}`}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-row-text">
                      📭 Tidak ada data log yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW INPUT FORM */}
      {activeMenu === "input_form" && (
        <FormInput 
          onDataSaved={fetchDataDariBackend} 
          existingData={rawData} 
        />
      )}

    </div>
  );
}

export default App;