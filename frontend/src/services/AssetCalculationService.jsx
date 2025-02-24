export const fetchWorkingCapital = async (projectId) => {
    try {
      const response = await fetch(`//${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch data");
      
      const data = await response.json();
      return data.history || [];
    } catch (error) {
      console.error("Error fetching working capital data:", error);
      return [];
    }
  };
  