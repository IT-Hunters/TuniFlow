import { useState } from "react";
import { submitAsset } from "../../services/AssetActifService";     

const AssetForm = ({ handleClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        type_actif: "",
        type_IntangibleAsset: "",
        type_corporel: "",
        type_financement: "",
        type_Treasury: "",
        categorie_stock: "",
        receivable_type: "",
        name: "",
        total_value: "",
        date_acquisition: "",
        balance: "",
        quantite: "",
        unite_value: "",
        projet_id: ""
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; 
        setLoading(true);
        setError("");
        formData.projet_id="65d7c5f1a2b3c45678901234";
        const updatedFormData = Object.fromEntries(
            Object.entries({ ...formData, projet_id: "65d7c5f1a2b3c45678901234" })
                .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        );       
        const numericalFields = ["total_value", "quantite", "unite_value"];
        numericalFields.forEach(field => {
            if (field in updatedFormData && updatedFormData[field] !== "") {
                updatedFormData[field] = Number(updatedFormData[field]);
            }
        });  
        console.log(updatedFormData)
        try {
            const response = await submitAsset(updatedFormData);
            console.log("Asset submitted successfully:", response);
            alert("Asset submitted successfully!");
        } catch (err) {
            setError("Failed to submit asset. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="forms-sample" onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Name</label>
                <input type="text" className="form-control" name="name" placeholder="Asset Name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Total Value</label>
                <input type="number" className="form-control" name="total_value" placeholder="Total" value={formData.total_value} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Acquisition Date</label>
                <input type="date" className="form-control" name="date_acquisition" value={formData.date_acquisition} onChange={handleChange} required />
            </div>

            <div className="form-group">
                <label>Asset Type</label>
                <select className="form-control" name="type_actif" value={formData.type_actif} onChange={handleChange} required>
                    <option value="">Select a type</option>
                    <option value="Intangible Asset">Intangible Asset</option>
                    <option value="Tangible Asset">Tangible Asset</option>
                    <option value="Receivables">Receivables</option>
                    <option value="Treasury">Treasury</option>
                    <option value="Financial Asset">Financial Asset</option>
                    <option value="Stock">Stock</option>
                </select>
            </div>

            {formData.type_actif === "Intangible Asset" && (
                <div className="form-group">
                    <label>Intangible Asset Type</label>
                    <select className="form-control" name="type_IntangibleAsset" value={formData.type_IntangibleAsset} onChange={handleChange} required>
                        <option value="">Select a type</option>
                        <option value="Patent">Patent</option>
                        <option value="License">License</option>
                        <option value="Goodwill">Goodwill</option>
                    </select>
                </div>
            )}

            {formData.type_actif === "Tangible Asset" && (
                <div className="form-group">
                    <label>Tangible Asset Type</label>
                    <select className="form-control" name="type_corporel" value={formData.type_corporel} onChange={handleChange} required>
                        <option value="">Select a type</option>
                        <option value="Land">Land</option>
                        <option value="Building">Building</option>
                        <option value="Equipment">Equipment</option>
                        <option value="TransportEquipment">Transport Equipment</option>
                    </select>
                </div>
            )}

            {formData.type_actif === "Treasury" && (
                <div className="form-group">
                    <label>Treasury Type</label>
                    <select className="form-control" name="type_Treasury" value={formData.type_Treasury} onChange={handleChange} required>
                        <option value="">Select a type</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="ShortTermInvestment">Short-Term Investment</option>
                        <option value="Participation">Participation</option>
                        <option value="LongTermDeposit">Long-Term Deposit</option>
                        <option value="Bond">Bond</option>
                    </select>
                </div>
            )}

            {formData.type_actif === "Stock" && (
                <div className="form-group">
                    <label>Stock Category</label>
                    <select className="form-control" name="categorie_stock" value={formData.categorie_stock} onChange={handleChange} required>
                        <option value="">Select a category</option>
                        <option value="RawMaterials">Raw Materials</option>
                        <option value="FinishedProducts">Finished Products</option>
                    </select>
                    <label>Quantity</label>
                    <input type="number" className="form-control" name="quantite" placeholder="Quantity" value={formData.quantite} onChange={handleChange} required />
                    <label>Unit Value</label>
                    <input type="number" className="form-control" name="unite_value" placeholder="Unit Value" value={formData.unite_value} onChange={handleChange} required />                
                </div>
            )}

            {formData.type_actif === "Financial Asset" && (
                <div className="form-group">
                    <label>Financial Asset Type</label>
                    <select className="form-control" name="type_financement" value={formData.type_financement} onChange={handleChange} required>
                        <option value="">Select a type</option>
                        <option value="Participation">Participation</option>
                        <option value="LongTermDeposit">Long-Term Deposit</option>
                        <option value="Bond">Bond</option>
                    </select>
                </div>
            )}

            {formData.type_actif === "Receivables" && (
                <div className="form-group">
                    <label>Receivable Type</label>
                    <select className="form-control" name="receivable_type" value={formData.receivable_type} onChange={handleChange} required>
                        <option value="">Select a type</option>
                        <option value="Client">Client</option>
                        <option value="Supplier">Supplier</option>
                        <option value="Other">Other</option>
                    </select>

                    <label>Due Date</label>
                    <input type="date" className="form-control" name="due_date" value={formData.due_date} onChange={handleChange} required />
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

export default AssetForm;
