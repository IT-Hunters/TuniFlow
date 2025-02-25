import React, { useEffect, useState } from 'react';
import Chart from "react-apexcharts";
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const CandlestickCashFlowChart = () => {
  const [chartData, setChartData] = useState([]);

  const fetchCandlestickData = async () => {
    try {
      const response = await fetch("http://localhost:5000/wallets/cashflow/candlestick2/67bcf581623ede9afabc6edf");

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const formattedData = data.map((item, index, arr) => {
        const prevCashFlow = index > 0 ? arr[index - 1].netCashFlow : item.netCashFlow;
        return {
          x: new Date(item.date),
          y: [
            prevCashFlow, 
            Math.max(prevCashFlow, item.netCashFlow), 
            Math.min(prevCashFlow, item.netCashFlow), 
            item.netCashFlow, 
          ],
        };
      });

      setChartData(formattedData);
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
