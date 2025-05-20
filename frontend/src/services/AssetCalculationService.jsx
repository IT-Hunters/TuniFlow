const token = localStorage.getItem("token");
export const fetchWorkingCapital = async (projectId) => {
    try {
      const response = await fetch(`https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/assetCalculation/${projectId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, 
            "Cache-Control": "no-cache",
        },
    });
    console.log(token)
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const data = await response.json();
      console.log("Working Capital data fetch successfully:");
      return data ;
    } catch (error) {
      console.error("Error fetching working capital data:", error);
      return [];
    }
  };
  export const fetchCandlestickData = async (userId) => {
    try {
      
      const response = await fetch(`http://localhost:5000/wallets/cashflow/candlestick2/${userId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "cache-control": "no-cache",
        },
    });
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
      return formattedData;
    } catch (error) {
      console.error("Error fetching candlestick data:", error);
    }
  };
  export const fetchWorkingCapitalStatus = async (projectId) => {
    try {
        // Adjusting the URL to the new endpoint
        const response = await fetch(`http://localhost:5000/assetCalculation/WorkingCapitalStatus/${projectId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, 
                "Cache-Control": "no-cache", 
            },
        });

        console.log(token);

        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        console.log("Working Capital data fetched successfully:" + data);
        return data;

    } catch (error) {
        console.error("Error fetching working capital data:", error);
        return [];
    }
};