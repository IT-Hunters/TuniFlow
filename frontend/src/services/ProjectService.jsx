const token = localStorage.getItem("token");
const API_URL = "https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net:3000/project";
export const fetchProject = async (userId) => {
    try {
        const url = new URL(`${API_URL}/getProjectByUser/${userId}`);

  
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