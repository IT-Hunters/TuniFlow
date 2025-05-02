import React, { useEffect, useState } from 'react';
import Chart from "react-apexcharts";
import io from 'socket.io-client';
import { fetchCandlestickData } from "../../services/AssetCalculationService"; 
const socket = io('http://localhost:5000');

const CandlestickCashFlowChart = ( {projectId}) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {

        const data = await fetchCandlestickData(localStorage.getItem("userId"));
        if (data) {
          setChartData(data);
        }
      } catch (error) {
        console.error("Error fetching candlestick data:", error);
      }
    };
    loadData();

    socket.on("transactionUpdate", () => {
      console.log("Real-time update received");
      loadData();
    });

    return () => socket.off("transactionUpdate");
  }, [projectId]);

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
