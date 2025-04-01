const token = localStorage.getItem("token");
const API_URL = "http://localhost:5000/transactions";
export const getRevenueData = async (walletId) => {
      const response = await fetch(`${API_URL}/getRevenue/${walletId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache", 
        },
      });
      return response.json(); 
  };
  export const calculateProfitMargin = async (walletId) => {
    const response = await fetch(`http://localhost:5000/wallets/calculateProfitMargin/${walletId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache", 
      },
    });
    return response.json(); 
};
export const getExpenseData = async (walletId) => {
  try {
    // Current period (last 7 days)
    const currentResponse = await fetch(`${API_URL}/expenses/${walletId}?period=current`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Cache-Control": "no-cache",
      },
    });
    const currentData = await currentResponse.json();

    // Previous period (previous 7 days)
    const previousResponse = await fetch(`${API_URL}/expenses/${walletId}?period=previous`, {
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