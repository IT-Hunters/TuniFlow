import { useState } from "react";
import { submitAsset } from "../../services/AssetActifService";

const AssetForm = ({ handleClose, projectId }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
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
        due_date: "",
        projet_id: projectId,
    });

    // Validation function
    const validateField = (name, value) => {
        const newErrors = { ...errors };

        switch (name) {
            case "name":
                if (!value.trim()) {
                    newErrors.name = "Asset name is required";
                } else if (value.length > 100) {
                    newErrors.name = "Name must be less than 100 characters";
                } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
                    newErrors.name = "Name can only contain letters, numbers, spaces, hyphens, or underscores";
                } else {
                    delete newErrors.name;
                }
                break;
            case "total_value":
                if (!value) {
                    newErrors.total_value = "Total value is required";
                } else if (isNaN(value) || Number(value) <= 0) {
                    newErrors.total_value = "Total value must be a positive number";
                } else if (!/^\d*\.?\d{0,2}$/.test(value)) {
                    newErrors.total_value = "Total value must have up to 2 decimal places";
                } else {
                    delete newErrors.total_value;
                }
                break;
            case "date_acquisition":
                if (!value) {
                    newErrors.date_acquisition = "Acquisition date is required";
                } else if (new Date(value) > new Date()) {
                    newErrors.date_acquisition = "Acquisition date cannot be in the future";
                } else {
                    delete newErrors.date_acquisition;
                }
                break;
            case "type_actif":
                if (!value) {
                    newErrors.type_actif = "Asset type is required";
                } else {
                    delete newErrors.type_actif;
                }
                break;
            case "type_IntangibleAsset":
                if (formData.type_actif === "Intangible Asset" && !value) {
                    newErrors.type_IntangibleAsset = "Intangible asset type is required";
                } else {
                    delete newErrors.type_IntangibleAsset;
                }
                break;
            case "type_corporel":
                if (formData.type_actif === "Tangible Asset" && !value) {
                    newErrors.type_corporel = "Tangible asset type is required";
                } else {
                    delete newErrors.type_corporel;
                }
                break;
            case "type_Treasury":
                if (formData.type_actif === "Treasury" && !value) {
                    newErrors.type_Treasury = "Treasury type is required";
                } else {
                    delete newErrors.type_Treasury;
                }
                break;
            case "categorie_stock":
                if (formData.type_actif === "Stock" && !value) {
                    newErrors.categorie_stock = "Stock category is required";
                } else {
                    delete newErrors.categorie_stock;
                }
                break;
            case "quantite":
                if (formData.type_actif === "Stock" && !value) {
                    newErrors.quantite = "Quantity is required";
                } else if (formData.type_actif === "Stock" && (isNaN(value) || Number(value) <= 0)) {
                    newErrors.quantite = "Quantity must be a positive integer";
                } else if (formData.type_actif === "Stock" && !/^\d+$/.test(value)) {
                    newErrors.quantite = "Quantity must be an integer";
                } else {
                    delete newErrors.quantite;
                }
                break;
            case "unite_value":
                if (formData.type_actif === "Stock" && !value) {
                    newErrors.unite_value = "Unit value is required";
                } else if (formData.type_actif === "Stock" && (isNaN(value) || Number(value) <= 0)) {
                    newErrors.unite_value = "Unit value must be a positive number";
                } else if (formData.type_actif === "Stock" && !/^\d*\.?\d{0,2}$/.test(value)) {
                    newErrors.unite_value = "Unit value must have up to 2 decimal places";
                } else {
                    delete newErrors.unite_value;
                }
                break;
            case "type_financement":
                if (formData.type_actif === "Financial Asset" && !value) {
                    newErrors.type_financement = "Financial asset type is required";
                } else {
                    delete newErrors.type_financement;
                }
                break;
            case "receivable_type":
                if (formData.type_actif === "Receivables" && !value) {
                    newErrors.receivable_type = "Receivable type is required";
                } else {
                    delete newErrors.receivable_type;
                }
                break;
            case "due_date":
                if (formData.type_actif === "Receivables" && !value) {
                    newErrors.due_date = "Due date is required";
                } else {
                    delete newErrors.due_date;
                }
                break;
            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle character restrictions
    const restrictCharacters = (e, fieldType) => {
        const { value, name } = e.target;

        if (fieldType === "name") {
            // Allow letters, numbers, spaces, hyphens, underscores
            const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-_]/g, "");
            if (sanitizedValue !== value) {
                setFormData({ ...formData, [name]: sanitizedValue });
                validateField(name, sanitizedValue);
            }
        } else if (fieldType === "integer") {
            // Allow only digits
            const sanitizedValue = value.replace(/[^0-9]/g, "");
            if (sanitizedValue !== value) {
                setFormData({ ...formData, [name]: sanitizedValue });
                validateField(name, sanitizedValue);
            }
        } else if (fieldType === "decimal") {
            // Allow digits and one decimal point
            const sanitizedValue = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
            if (sanitizedValue !== value) {
                setFormData({ ...formData, [name]: sanitizedValue });
                validateField(name, sanitizedValue);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        validateField(name, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        // Validate all fields before submission
        const isValid = Object.keys(formData).every((key) => validateField(key, formData[key]));
        if (!isValid) {
            return;
        }

        setLoading(true);
        setErrors({});

        const updatedFormData = Object.fromEntries(
            Object.entries({ ...formData, projet_id: projectId })
                .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        );

        const numericalFields = ["total_value", "quantite", "unite_value"];
        numericalFields.forEach((field) => {
            if (field in updatedFormData && updatedFormData[field] !== "") {
                updatedFormData[field] = Number(updatedFormData[field]);
            }
        });

        try {
            const response = await submitAsset(updatedFormData);
            console.log("Asset submitted successfully:", response);
            alert("Asset submitted successfully!");
            handleClose();
        } catch (err) {
            setErrors({ submit: "Failed to submit asset. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    // Check if form is valid to enable/disable submit button
    const isFormValid = () => {
        return (
            Object.keys(errors).length === 0 &&
            formData.name &&
            formData.total_value &&
            formData.date_acquisition &&
            formData.type_actif &&
            (formData.type_actif !== "Intangible Asset" || formData.type_IntangibleAsset) &&
            (formData.type_actif !== "Tangible Asset" || formData.type_corporel) &&
            (formData.type_actif !== "Treasury" || formData.type_Treasury) &&
            (formData.type_actif !== "Stock" ||
                (formData.categorie_stock && formData.quantite && formData.unite_value)) &&
            (formData.type_actif !== "Financial Asset" || formData.type_financement) &&
            (formData.type_actif !== "Receivables" || (formData.receivable_type && formData.due_date))
        );
    };

    return (
        <form className="forms-sample" onSubmit={handleSubmit}>
            {errors.submit && <div className="alert alert-danger">{errors.submit}</div>}

            <div className="form-group">
                <label>Name</label>
                <input
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    name="name"
                    placeholder="Asset Name"
                    value={formData.name}
                    onChange={handleChange}
                    onInput={(e) => restrictCharacters(e, "name")}
                    required
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="form-group">
                <label>Total Value</label>
                <input
                    type="text" // Changed to text to allow custom decimal control
                    className={`form-control ${errors.total_value ? "is-invalid" : ""}`}
                    name="total_value"
                    placeholder="Total"
                    value={formData.total_value}
                    onChange={handleChange}
                    onInput={(e) => restrictCharacters(e, "decimal")}
                    required
                />
                {errors.total_value && <div className="invalid-feedback">{errors.total_value}</div>}
            </div>

            <div className="form-group">
                <label>Acquisition Date</label>
                <input
                    type="date"
                    className={`form-control ${errors.date_acquisition ? "is-invalid" : ""}`}
                    name="date_acquisition"
                    value={formData.date_acquisition}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split("T")[0]}
                />
                {errors.date_acquisition && <div className="invalid-feedback">{errors.date_acquisition}</div>}
            </div>

            <div className="form-group">
                <label>Asset Type</label>
                <select
                    className={`form-control ${errors.type_actif ? "is-invalid" : ""}`}
                    name="type_actif"
                    value={formData.type_actif}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select a type</option>
                    <option value="Intangible Asset">Intangible Asset</option>
                    <option value="Tangible Asset">Tangible Asset</option>
                    <option value="Receivables">Receivables</option>
                    <option value="Treasury">Treasury</option>
                    <option value="Financial Asset">Financial Asset</option>
                    <option value="Stock">Stock</option>
                </select>
                {errors.type_actif && <div className="invalid-feedback">{errors.type_actif}</div>}
            </div>

            {formData.type_actif === "Intangible Asset" && (
                <div className="form-group">
                    <label>Intangible Asset Type</label>
                    <select
                        className={`form-control ${errors.type_IntangibleAsset ? "is-invalid" : ""}`}
                        name="type_IntangibleAsset"
                        value={formData.type_IntangibleAsset}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a type</option>
                        <option value="Patent">Patent</option>
                        <option value="License">License</option>
                        <option value="Goodwill">Goodwill</option>
                    </select>
                    {errors.type_IntangibleAsset && (
                        <div className="invalid-feedback">{errors.type_IntangibleAsset}</div>
                    )}
                </div>
            )}

            {formData.type_actif === "Tangible Asset" && (
                <div className="form-group">
                    <label>Tangible Asset Type</label>
                    <select
                        className={`form-control ${errors.type_corporel ? "is-invalid" : ""}`}
                        name="type_corporel"
                        value={formData.type_corporel}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a type</option>
                        <option value="Land">Land</option>
                        <option value="Building">Building</option>
                        <option value="Equipment">Equipment</option>
                        <option value="TransportEquipment">Transport Equipment</option>
                    </select>
                    {errors.type_corporel && <div className="invalid-feedback">{errors.type_corporel}</div>}
                </div>
            )}

            {formData.type_actif === "Treasury" && (
                <div className="form-group">
                    <label>Treasury Type</label>
                    <select
                        className={`form-control ${errors.type_Treasury ? "is-invalid" : ""}`}
                        name="type_Treasury"
                        value={formData.type_Treasury}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a type</option>
                        <option value="Cash">Cash</option>
                        <option value="Bank">Bank</option>
                        <option value="ShortTermInvestment">Short-Term Investment</option>
                        <option value="Participation">Participation</option>
                        <option value="LongTermDeposit">Long-Term Deposit</option>
                        <option value="Bond">Bond</option>
                    </select>
                    {errors.type_Treasury && <div className="invalid-feedback">{errors.type_Treasury}</div>}
                </div>
            )}

            {formData.type_actif === "Stock" && (
                <div className="form-group">
                    <label>Stock Category</label>
                    <select
                        className={`form-control ${errors.categorie_stock ? "is-invalid" : ""}`}
                        name="categorie_stock"
                        value={formData.categorie_stock}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a category</option>
                        <option value="RawMaterials">Raw Materials</option>
                        <option value="FinishedProducts">Finished Products</option>
                    </select>
                    {errors.categorie_stock && <div className="invalid-feedback">{errors.categorie_stock}</div>}

                    <label>Quantity</label>
                    <input
                        type="text" // Changed to text for custom integer control
                        className={`form-control ${errors.quantite ? "is-invalid" : ""}`}
                        name="quantite"
                        placeholder="Quantity"
                        value={formData.quantite}
                        onChange={handleChange}
                        onInput={(e) => restrictCharacters(e, "integer")}
                        required
                    />
                    {errors.quantite && <div className="invalid-feedback">{errors.quantite}</div>}

                    <label>Unit Value</label>
                    <input
                        type="text" // Changed to text for custom decimal control
                        className={`form-control ${errors.unite_value ? "is-invalid" : ""}`}
                        name="unite_value"
                        placeholder="Unit Value"
                        value={formData.unite_value}
                        onChange={handleChange}
                        onInput={(e) => restrictCharacters(e, "decimal")}
                        required
                    />
                    {errors.unite_value && <div className="invalid-feedback">{errors.unite_value}</div>}
                </div>
            )}

            {formData.type_actif === "Financial Asset" && (
                <div className="form-group">
                    <label>Financial Asset Type</label>
                    <select
                        className={`form-control ${errors.type_financement ? "is-invalid" : ""}`}
                        name="type_financement"
                        value={formData.type_financement}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a type</option>
                        <option value="Participation">Participation</option>
                        <option value="LongTermDeposit">Long-Term Deposit</option>
                        <option value="Bond">Bond</option>
                    </select>
                    {errors.type_financement && <div className="invalid-feedback">{errors.type_financement}</div>}
                </div>
            )}

            {formData.type_actif === "Receivables" && (
                <div className="form-group">
                    <label>Receivable Type</label>
                    <select
                        className={`form-control ${errors.receivable_type ? "is-invalid" : ""}`}
                        name="receivable_type"
                        value={formData.receivable_type}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select a type</option>
                        <option value="Client">Client</option>
                        <option value="Supplier">Supplier</option>
                        <option value="Other">Other</option>
                    </select>
                    {errors.receivable_type && <div className="invalid-feedback">{errors.receivable_type}</div>}

                    <label>Due Date</label>
                    <input
                        type="date"
                        className={`form-control ${errors.due_date ? "is-invalid" : ""}`}
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleChange}
                        required
                    />
                    {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
                </div>
            )}

            <button
                type="submit"
                className="btn btn-primary me-2"
                disabled={loading || !isFormValid()}
            >
                {loading ? "Submitting..." : "Submit"}
            </button>
            <button type="button" className="btn btn-light" onClick={handleClose}>
                Cancel
            </button>
        </form>
    );
};

export default AssetForm;