export const getDailyLogins = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/userLogs/getDailyLogins", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json();
      console.log("Logs fetched successfully:" + data.logs);
      return data.logs;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil :", error)
    }
};