import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function ChartOKNG({ data = [] }) {
  const [chartData, setChartData] = useState({ labels: ["OK", "NG"], datasets: [] });

  useEffect(() => {
    let okCount = 0;
    let ngCount = 0;

    data.forEach(item => {
      if (!item) return;
      const statusHasil = item.hasil ? item.hasil.trim().toUpperCase() : "";
      
      // Menghitung murni jumlah baris dari properti 'hasil'
      if (statusHasil === "OK" || statusHasil === "APPROVE") {
        okCount += 1;
      } else if (statusHasil === "NG") {
        ngCount += 1;
      }
    });

    setChartData({
      labels: ["OK", "NG"],
      datasets: [{
        label: "Total Kejadian",
        data: [okCount, ngCount],
        backgroundColor: ["#5a8f76", "#b85c65"], 
        barThickness: 45
      }]
    });
  }, [data]); // Efek akan jalan ulang setiap kali props 'data' berubah

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Bar 
        data={chartData} 
        options={{ 
          responsive: true, 
          maintainAspectRatio: false, 
          plugins: { 
            legend: { display: false }, 
            title: { 
              display: true, 
              text: "PERBANDINGAN HASIL OK & NG (AKUMULASI RAWDATA)", 
              align: "start", 
              color: "#2b303a", 
              font: { size: 13, weight: "700" } 
            } 
          }, 
          scales: { 
            y: { 
              beginAtZero: true, 
              ticks: { 
                font: { size: 11 },
                precision: 0,
                stepSize: 1 
              } 
            }, 
            x: { 
              grid: { display: false }, 
              ticks: { font: { size: 11, weight: "600" } } 
            } 
          } 
        }} 
      />
    </div>
  );
}

export default ChartOKNG;