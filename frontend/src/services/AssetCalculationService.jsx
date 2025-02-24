export const fetchWorkingCapital = async (projectId) => {
    try {
      const response = await fetch(`http://localhost:3000/assetCalculation/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const data = await response.json();
      console.log("Working Capital data fetch successfully:");
      return data ;
    } catch (error) {
      console.error("Error fetching working capital data:", error);
      return [];
    }
  };
  