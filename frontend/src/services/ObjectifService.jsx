const token = localStorage.getItem("token");
const API_URL = "http://localhost:5000/objectif";
export const getObjectifs = async (role,projectSearch) => {
    try {
        const url = new URL(`${API_URL}/getProjectsOverview/${projectSearch}`);
      if (role && role.toLowerCase() !== "all") {
        url.searchParams.append("role", role);
        url.searchParams.append("projectSearch", projectSearch);
      }
  
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch objectifs");
      }
  
      return data;
    } catch (error) {
      console.error("Error fetching objectifs:", error);
      return { success: false, message: error.message, data: [] };
    }
  };