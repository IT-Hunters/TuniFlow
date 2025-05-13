
const token = localStorage.getItem("token");
export const submitAsset = async (formData) => {
    try {
        const response = await fetch("http://localhost:3000/assetsactifs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "cache-control": "no-cache",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error("Failed to submit asset");
        }

        const data = await response.json();
        console.log("Asset submitted successfully:", data);
        return data;
    } catch (error) {
        console.error("Error submitting asset:", error);
    }
};

export const getAllAssets = async () => {
    try {
        const response = await fetch("http://localhost:3000/assetsactifs", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "cache-control": "no-cache",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch assets");
        }

        const data = await response.json();
        console.log("Assets fetched successfully:");
        return data;
    } catch (error) {
        console.error("Error fetching assets:", error);
        return [];
    }
};
