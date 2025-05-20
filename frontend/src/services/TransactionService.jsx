const token = localStorage.getItem("token");
const API_URL = "https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/transactions";
export const getRevenueData = async (userId) => {
      const response = await fetch(`${API_URL}/getRevenue/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache", 
        },
      });
      return response.json(); 
  };
  export const calculateProfitMargin = async (userId) => {
    const response = await fetch(`https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/wallets/calculateProfitMargin/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache", 
      },
    });
    return response.json(); 
};
export const getExpenseData = async (userId) => {
  try {
    // Current period (last 7 days)
    const currentResponse = await fetch(`${API_URL}/expenses/${userId}?period=current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });
    const currentData = await currentResponse.json();

    // Previous period (previous 7 days)
    const previousResponse = await fetch(`${API_URL}/expenses/${userId}?period=previous`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache",  
      },
    });
    const previousData = await previousResponse.json();

    const totalExpenses = currentData.totalExpenses || 0;
    const previousExpenses = previousData.totalExpenses || 0;
    const expenseChange = totalExpenses - previousExpenses;

    return {
      totalExpenses,
      expenseChange
    };
  } catch (error) {
    console.error("Error fetching expense data:", error);
    return {
      totalExpenses: 0,
      expenseChange: 0
    };
  }
};
export const getTransactions = async (walletId, startDate, endDate) => {
  try {
    const response = await fetch(`${API_URL}/getTransactions/${walletId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
      params: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};
export const getTransactionById = async (userId) => {
  try {
      const response = await fetch(`${API_URL}/getTransactionByWalletId/${userId}`, {
          method: "GET",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
              "Cache-Control": "no-cache",
          },
      });

      const data = await response.json();

      if (!response.ok) {
          throw new Error(data.message || "Failed to fetch transaction");
      }

      return data;
  } catch (error) {
      console.error("Error fetching transaction by ID:", error);
      return {
          message: error.message,
          data: null
      };
  }
};