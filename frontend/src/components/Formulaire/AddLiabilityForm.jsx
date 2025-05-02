import { useState } from "react";
import { submitLiability } from "../../services/LiabilityService";

const AddLiabilityForm = ({ handleClose ,projectId}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        type_liability: "",
        category: "",
        name: "",
        total_value: "",
        date_commitment: "",
        project_id: projectId
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError("");

        const updatedFormData = Object.fromEntries(
            Object.entries(formData).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        );

        if ("total_value" in updatedFormData) {
            updatedFormData.total_value = Number(updatedFormData.total_value);
        }

        console.log(updatedFormData);

        try {
            const response = await submitLiability(updatedFormData);
            console.log("Liability submitted successfully:", response);
            alert("Liability submitted successfully!");
        } catch (err) {
            setError("Failed to submit liability. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="forms-sample" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="name"
                    placeholder="Liability Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Total</label>
                <input
                    type="number"
                    className="form-control"
                    name="total_value"
                    placeholder="Total Amount"
                    value={formData.total_value}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Commitment Date</label>
                <input
                    type="date"
                    className="form-control"
                    name="date_commitment"
                    value={formData.date_commitment}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label>Liability Type</label>
                <select
                    className="form-control"
                    name="type_liability"
                    value={formData.type_liability}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select a type</option>
                    <option value="Equity">Equity</option>
                    <option value="CurrentLiabilities">Current Liabilities</option>
                    <option value="NonCurrentLiabilities">Non-Current Liabilities</option>
                </select>
            </div>

            {formData.type_liability === "Equity" && (
                <div className="form-group">
                    <label>Equity Category</label>
                    <select
                        className="form-control"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="share_capital">Share Capital</option>
                        <option value="reserves">Reserves</option>
                        <option value="retained_earnings">Retained Earnings</option>
                    </select>
                </div>
            )}

            {formData.type_liability === "CurrentLiabilities" && (
                <div className="form-group">
                    <label>Current Liability Category</label>
                    <select
                        className="form-control"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="trade_payables">Trade Payables</option>
                        <option value="tax_liabilities">Tax Liabilities</option>
                        <option value="social_liabilities">Social Liabilities</option>
                        <option value="other_liabilities">Other Liabilities</option>
                    </select>
                </div>
            )}

            {formData.type_liability === "NonCurrentLiabilities" && (
                <div className="form-group">
                    <label>Non-Current Liability Category</label>
                    <select
                        className="form-control"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="loans">Loans</option>
                        <option value="provisions">Provisions</option>
                        <option value="other_non_current_liabilities">Other Non-Current Liabilities</option>
                    </select>
                </div>
            )}

            <button type="submit" className="btn btn-primary me-2" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
            </button>
            <button type="button" className="btn btn-light" onClick={handleClose}>
                Cancel
            </button>
        </form>
    );
};

export default AddLiabilityForm;
