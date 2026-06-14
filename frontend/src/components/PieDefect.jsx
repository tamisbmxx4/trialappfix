import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// 🛠️ PALET TEKNIS INDUSTRI (Slate, Steel, Iron, Charcoal, Muted Navy)
const defectColors = {
  "DIMENSI KECIL": "#4a5568", "TIDAK SIKU": "#718096", "DIMENSI BESAR": "#a0aec0",
  "GELOMBANG": "#4a6b82", "CEMBUNG": "#68768a", "MACET": "#2d3748",
  "CEKUNG": "#b85c65", "SOBEK": "#8c6239", "TIPIS": "#5a6b5c",
  "KEIJOU": "#2b3e50", "MELINTIR": "#d97706"
};

function PieDefect({ data }) {
  const countDefect = {};
  
  data.forEach(item => {
    // Pastikan item ada dan status barisnya adalah NG (bukan OK / APPROVE)
    const statusHasil = item.hasil ? item.hasil.trim().toUpperCase() : "";
    
    if (statusHasil === "NG" && item.defect && item.defect.trim() !== "") {
      const defect = item.defect.trim().toUpperCase();
      
      // 🌟 PERBAIKAN UTAMA: Hitung murni +1 per baris kasus defect, abaikan urutan trial-nya
      countDefect[defect] = (countDefect[defect] || 0) + 1;
    }
  });

  const labels = Object.keys(countDefect);
  const dynamicColors = labels.map(defect => defectColors[defect] || "#cbd5e0");

  const chartData = {
    labels: labels,
    datasets: [{ data: Object.values(countDefect), backgroundColor: dynamicColors, borderWidth: 1, borderColor: "#ffffff" }]
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Pie 
        data={chartData} 
        options={{ 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            title: { 
              display: true, 
              text: "PERSENTASE JENIS NG", 
              align: "start", 
              color: "#2b303a", 
              font: { size: 13, weight: "700" } 
            }, 
            legend: { 
              position: "right", 
              labels: { 
                boxWidth: 10, 
                font: { size: 10, weight: "500" }, 
                color: "#4a5568" 
              } 
            } 
          } 
        }} 
      />
    </div>
  );
}

export default PieDefect;