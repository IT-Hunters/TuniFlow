
export const findMyProfile = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return

        const response = await fetch("http://localhost:3000/users/findMyProfile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json();
        console.log("Asset submitted successfully:");
        return data;
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error)
      }
  };