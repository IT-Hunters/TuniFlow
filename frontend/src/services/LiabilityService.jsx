const token = localStorage.getItem("token");

export const submitLiability = async (formData) => {
    try {
        const response = await fetch("http://localhost:3000/assetspassifs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error("Failed to submit asset");
        }

        const data = await response.json();
        console.log("Asset submitted successfully:");
        return data;
    } catch (error) {
        console.error("Error submitting asset:", error);
    }
};


export const getAllLiabilities = async () => {
    try {
        const response = await fetch("http://localhost:3000/assetspassifs", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
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
