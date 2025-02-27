import React, { useEffect, useState } from 'react';
import Chart from "react-apexcharts";
import io from 'socket.io-client';
import { fetchCandlestickData } from "../../services/AssetCalculationService";
const socket = io('http://localhost:5000');

const CandlestickCashFlowChart = () => {
  const [chartData, setChartData] = useState([]);

  const fetchCandlestickData = async () => {
    try {
      const response = await fetchWorkingCapital();

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      setChartData(response);
    } catch (error) {
      console.error("Error fetching candlestick data:", error);
    }
  };

  useEffect(() => {
    fetchCandlestickData();
    socket.on("transactionUpdate", (data) => {
      console.log("Real-time update received:", data);
      fetchCandlestickData();
    });

    return () => socket.off("transactionUpdate");
  }, []);

  const series = [{ data: chartData }];
  
  const options = {
    chart: {
      type: "candlestick",
      height: 400,
      background: "#1e1e1e",  
      toolbar: { show: true },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
      },
    },
    title: {
      text: "📈 Cash Flow Analysis",
      align: "left",
      style: { color: "#ffffff", fontSize: "18px" },
    },
    xaxis: {
      type: "datetime",
      labels: { style: { colors: "#ffffff" } },
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: { style: { colors: "#ffffff" } },
    },
    grid: {
      borderColor: "#444",
    },
    tooltip: {
      theme: "dark",
      x: { format: "dd MMM HH:mm" },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: "#00C853",
          downward: "#D50000", 
        },
        wick: {
          useFillColor: true,
        },
      },
    },
  };

  return <Chart options={options} series={series} type="candlestick" height={400} />;
};

export default CandlestickCashFlowChart;
