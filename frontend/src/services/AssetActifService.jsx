
export const submitAsset = async (formData) => {
    try {
        const response = await fetch("http://localhost:3000/assetsactifs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
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

