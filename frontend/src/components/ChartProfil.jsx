import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ChartProfil({ data }) {
  const profilNGCount = {};       
  const profilProjectMapping = {}; 
  const profilDefectMapping = {}; 

  // 1. Ambil data NG dari props
  data.forEach(item => {
    const statusHasil = item.hasil ? item.hasil.trim().toUpperCase() : "";
    if (statusHasil === "NG" && item.profil) {
      const noProfil = item.profil.trim();
      const projectName = item.project && item.project.trim() !== "" ? item.project.trim() : "Project Lama";
      const defectName = item.defect && item.defect.trim() !== "" ? item.defect.trim().toUpperCase() : "UNKNOWN";

      // Hitung murni 1 kasus per baris kejadian
      profilNGCount[noProfil] = (profilNGCount[noProfil] || 0) + 1;
      
      profilProjectMapping[noProfil] = projectName;
      
      if (!profilDefectMapping[noProfil]) {
        profilDefectMapping[noProfil] = new Set();
      }
      profilDefectMapping[noProfil].add(defectName);
    }
  });

  // 2. Filter: Ambil yang minimal memiliki 1 riwayat kasus NG agar langsung terpantau
  const filteredProfil = Object.keys(profilNGCount).filter(profil => profilNGCount[profil] >= 1);

  // 3. Urutkan dari yang NG terbanyak dan ambil TOP 5
  const sortedProfil = filteredProfil
    .sort((a, b) => profilNGCount[b] - profilNGCount[a])
    .slice(0, 5);

  const sortedValues = sortedProfil.map(profil => profilNGCount[profil]);

  const chartData = {
    labels: sortedProfil, 
    datasets: [{ 
      label: "Total Kasus NG",
      data: sortedValues, 
      backgroundColor: "#b85c65", 
      barThickness: 16 
    }] 
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      <h2 style={{ margin: "0 0 15px 0", fontSize: "13px", fontWeight: "700", color: "#2b303a", textTransform: "uppercase" }}>
        TOP 5 PROFIL KRITIS (BERDASARKAN TOTAL NG)
      </h2>

      {sortedProfil.length > 0 ? (
        <div style={{ display: "flex", flex: 1, minHeight: 0, gap: "15px" }}>
          
          {/* SISI KIRI: Detail info teks */}
          <div style={{ width: "30%", display: "flex", flexDirection: "column", justifyContent: "space-around", paddingRight: "5px", borderRight: "1px dashed #e2e8f0" }}>
            {sortedProfil.map((profil, idx) => {
              const project = profilProjectMapping[profil];
              const defects = Array.from(profilDefectMapping[profil]).join(", ");
              return (
                <div key={idx} style={{ lineHeight: "1.2", margin: "2px 0" }}>
                  <div style={{ fontSize: "11px", fontWeight: "700", color: "#2b303a" }}>
                    {idx + 1}. {profil}
                  </div>
                  <div style={{ fontSize: "9px", color: "#718096", wordBreak: "break-word" }}>
                    Proj: <b>{project}</b>
                  </div>
                  <div style={{ fontSize: "9px", color: "#b85c65", fontWeight: "600", wordBreak: "break-word" }}>
                    NG: {defects}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SISI KANAN: Area Grafik */}
          <div style={{ width: "70%", position: "relative" }}>
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                indexAxis: "y", 
                plugins: { 
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: function(context) { return ` Total NG: ${context.raw} Kali`; }
                    }
                  }
                }, 
                scales: { 
                  x: { 
                    beginAtZero: true, 
                    ticks: { stepSize: 1, precision: 0, font: { size: 10 } } 
                  }, 
                  y: { 
                    grid: { display: false }, 
                    ticks: { 
                      font: { size: 10, weight: "700" }, 
                      color: "#4a5568" 
                    } 
                  } 
                } 
              }} 
            />
          </div>

        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", flex: 1, color: "#718096", textAlign: "center" }}>
          <span style={{ fontSize: "24px", marginBottom: "8px" }}>✅</span>
          <b style={{ fontSize: "12px", color: "#2b303a" }}>Kondisi Produksi Aman</b>
          <p style={{ fontSize: "11px", margin: "4px 0 0 0" }}>Belum ada riwayat part dengan hasil NG.</p>
        </div>
      )}
    </div>
  );
}

export default ChartProfil;