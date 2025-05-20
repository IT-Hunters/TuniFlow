
export const findMyProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
          "cache-control": "no-cache",
        })
        const data = await response.json();
        console.log("Asset submitted successfully:");
        return data;
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error)
      }
};

export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem("token")
    if (!token) return

    const response = await fetch("https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/users/getall", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await response.json();
    console.log("Users fetched successfully:");
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil :", error)
  }
}
export const logout = async () => {
  try {
    const token = localStorage.getItem("token")
    if (!token) return
    const response = await fetch("https://tuniflow-dhaygzhmbrarfghy.francecentral-01.azurewebsites.net/users/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
         Authorization: `Bearer ${token}`
      },
    });
    localStorage.removeItem("token");
    if (response.ok) {
      console.log("Logged out successfully");
    } else {
      console.error("Error during logout");
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }
};
