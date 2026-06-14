import { useState, useEffect } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function ChartPerHari({ data = [] }) { 
  const [filter, setFilter] = useState("hari"); 
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (!data || data.length === 0) {
      setChartData({ labels: [], datasets: [] });
      return;
    }

    const trenCount = {};

    data.forEach(item => {
      if (!item.tanggal) return;
      
      // 1. Deteksi otomatis pemisah tanggal baik berupa strip (-) maupun garis miring (/)
      const pemisah = item.tanggal.includes("-") ? "-" : "/";
      const parts = item.tanggal.split(pemisah);
      if (parts.length !== 3) return;

      // Antisipasi jika format bawaan adalah YYYY-MM-DD atau DD-MM-YYYY
      let tahun = parseInt(parts[2], 10);
      let bulan = parseInt(parts[1], 10) - 1;
      let hari = parseInt(parts[0], 10);

      // Jika bagian pertama adalah 4 digit, berarti formatnya YYYY-MM-DD
      if (parts[0].length === 4) {
        tahun = parseInt(parts[0], 10);
        bulan = parseInt(parts[1], 10) - 1;
        hari = parseInt(parts[2], 10);
      }

      const dateObj = new Date(tahun, bulan, hari);
      if (isNaN(dateObj.getTime())) return;

      // Standarisasi tampilan label hari
      let labelHariStandar = `${String(hari).padStart(2, '0')}/${String(bulan + 1).padStart(2, '0')}/${tahun}`;
      let labelKunci = labelHariStandar; 

      if (filter === "minggu") {
        const tglCopy = new Date(dateObj.getTime());
        const seninObj = new Date(tglCopy.setDate(tglCopy.getDate() - tglCopy.getDay() + (tglCopy.getDay() === 0 ? -6 : 1)));
        labelKunci = `Wk - ${seninObj.toLocaleDateString("id-ID", { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      } else if (filter === "bulan") {
        labelKunci = `${dateObj.toLocaleString("id-ID", { month: "long" })} ${dateObj.getFullYear()}`;
      }
      
      // 🟢 PERBAIKAN UTAMA: Setiap baris data dihitung sebagai 1 kali aktivitas trial (bukan dijumlahkan dengan angka trial sebelumnya)
      trenCount[labelKunci] = (trenCount[labelKunci] || 0) + 1;
    });

    const sortedLabels = Object.keys(trenCount).sort((a, b) => {
      const dapatkanWaktu = (str) => {
        if (filter === "hari") { 
          const [d, m, y] = str.split("/"); 
          return new Date(y, m - 1, d).getTime(); 
        }
        if (filter === "minggu") { 
          const [d, m, y] = str.replace("Wk - ", "").split("/"); 
          return new Date(y, m - 1, d).getTime(); 
        }
        if (filter === "bulan") { 
          const namaBulanKeAngka = ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"];
          let [bln, thn] = str.toLowerCase().split(" ");
          
          if (bln === "may" || bln === "mey") {
            bln = "mei";
          }
          
          const indexBulan = namaBulanKeAngka.indexOf(bln);
          return new Date(thn, indexBulan !== -1 ? indexBulan : 0, 1).getTime(); 
        }
        return 0;
      };
      return dapatkanWaktu(a) - dapatkanWaktu(b);
    });

    setChartData({
      labels: sortedLabels,
      datasets: [{
        label: "Jumlah Frekuensi Uji Coba",
        data: sortedLabels.map(label => trenCount[label]),
        borderColor: "#1e293b", // Slate 800 - Menyelaraskan tema warna dashboard industri
        backgroundColor: "rgba(30, 41, 59, 0.05)",
        tension: 0.1, // Garis lebih tegas khas chart teknis
        fill: true,
        pointBackgroundColor: "#0f172a", // Slate 900
        pointRadius: 4, 
        pointHoverRadius: 6
      }]
    });
  }, [data, filter]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ margin: 0, fontSize: "11px", fontWeight: "800", color: "#475569", letterSpacing: "0.05em" }}>TREN UJI COBA TRIAL</h2>
        <div style={{ display: "flex", gap: "2px", backgroundColor: "#cbd5e1", padding: "3px", borderRadius: "6px" }} className="no-print">
          <button onClick={() => setFilter("hari")} style={filter === "hari" ? activeBtn : inactiveBtn}>Hari</button>
          <button onClick={() => setFilter("minggu")} style={filter === "minggu" ? activeBtn : inactiveBtn}>Minggu</button>
          <button onClick={() => setFilter("bulan")} style={filter === "bulan" ? activeBtn : inactiveBtn}>Bulan</button>
        </div>
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <Line 
          data={chartData} 
          options={{ 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
              legend: { display: false } 
            }, 
            scales: { 
              y: { 
                beginAtZero: true, 
                ticks: { 
                  callback: (v) => Number.isInteger(v) ? v : null, 
                  font: { family: "'Inter', sans-serif", size: 11, weight: "500" },
                  color: "#64748b"
                },
                grid: { color: "#f1f5f9" }
              }, 
              x: { 
                grid: { display: false }, 
                ticks: { 
                  font: { family: "'Inter', sans-serif", size: 11, weight: "500" },
                  color: "#64748b"
                } 
              } 
            } 
          }} 
        />
      </div>
    </div>
  );
}

// Style tombol navigasi disesuaikan dengan tema industri (Clean Slate)
const activeBtn = { fontFamily: "'Inter', sans-serif", backgroundColor: "white", color: "#0f172a", border: "none", padding: "4px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "700", fontSize: "11px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };
const inactiveBtn = { fontFamily: "'Inter', sans-serif", backgroundColor: "transparent", color: "#64748b", border: "none", padding: "4px 12px", cursor: "pointer", fontWeight: "500", fontSize: "11px" };

export default ChartPerHari;