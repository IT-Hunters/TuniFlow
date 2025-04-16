import { useState } from "react";
import { submitLiability } from "../../services/LiabilityService";

const AddLiabilityForm = ({ handleClose, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    type_liability: "",
    category: "",
    name: "",
    total_value: "",
    date_commitment: "",
    project_id: projectId,
  });

  // Validation function
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Liability name is required";
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
          newErrors.total_value = "Total amount is required";
        } else if (isNaN(value) || Number(value) <= 0) {
          newErrors.total_value = "Total amount must be a positive number";
        } else if (!/^\d*\.?\d{0,2}$/.test(value)) {
          newErrors.total_value = "Total amount must have up to 2 decimal places";
        } else {
          delete newErrors.total_value;
        }
        break;
      case "date_commitment":
        if (!value) {
          newErrors.date_commitment = "Commitment date is required";
        } else if (new Date(value) > new Date()) {
          newErrors.date_commitment = "Commitment date cannot be in the future";
        } else {
          delete newErrors.date_commitment;
        }
        break;
      case "type_liability":
        if (!value) {
          newErrors.type_liability = "Liability type is required";
        } else {
          delete newErrors.type_liability;
        }
        break;
      case "category":
        if (
          (formData.type_liability === "Equity" ||
            formData.type_liability === "CurrentLiabilities" ||
            formData.type_liability === "NonCurrentLiabilities") &&
          !value
        ) {
          newErrors.category = "Category is required";
        } else {
          delete newErrors.category;
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
      Object.entries({ ...formData, project_id: projectId }).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined
      )
    );

    if ("total_value" in updatedFormData) {
      updatedFormData.total_value = Number(updatedFormData.total_value);
    }

    try {
      const response = await submitLiability(updatedFormData);
      console.log("Liability submitted successfully:", response);
      alert("Liability submitted successfully!");
      handleClose();
    } catch (err) {
      setErrors({ submit: err.message || "Failed to submit liability. Please try again." });
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
      formData.date_commitment &&
      formData.type_liability &&
      (formData.type_liability === "" ||
        formData.type_liability === "Equity" ||
        formData.type_liability === "CurrentLiabilities" ||
        formData.type_liability === "NonCurrentLiabilities") &&
      (!formData.type_liability || formData.category)
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
          placeholder="Liability Name"
          value={formData.name}
          onChange={handleChange}
          onInput={(e) => restrictCharacters(e, "name")}
          required
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label>Total</label>
        <input
          type="text"
          className={`form-control ${errors.total_value ? "is-invalid" : ""}`}
          name="total_value"
          placeholder="Total Amount"
          value={formData.total_value}
          onChange={handleChange}
          onInput={(e) => restrictCharacters(e, "decimal")}
          required
        />
        {errors.total_value && <div className="invalid-feedback">{errors.total_value}</div>}
      </div>

      <div className="form-group">
        <label>Commitment Date</label>
        <input
          type="date"
          className={`form-control ${errors.date_commitment ? "is-invalid" : ""}`}
          name="date_commitment"
          value={formData.date_commitment}
          onChange={handleChange}
          required
          max={new Date().toISOString().split("T")[0]}
        />
        {errors.date_commitment && <div className="invalid-feedback">{errors.date_commitment}</div>}
      </div>

      <div className="form-group">
        <label>Liability Type</label>
        <select
          className={`form-control ${errors.type_liability ? "is-invalid" : ""}`}
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
        {errors.type_liability && <div className="invalid-feedback">{errors.type_liability}</div>}
      </div>

      {formData.type_liability === "Equity" && (
        <div className="form-group">
          <label>Equity Category</label>
          <select
            className={`form-control ${errors.category ? "is-invalid" : ""}`}
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
          {errors.category && <div className="invalid-feedback">{errors.category}</div>}
        </div>
      )}

      {formData.type_liability === "CurrentLiabilities" && (
        <div className="form-group">
          <label>Current Liability Category</label>
          <select
            className={`form-control ${errors.category ? "is-invalid" : ""}`}
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
          {errors.category && <div className="invalid-feedback">{errors.category}</div>}
        </div>
      )}

      {formData.type_liability === "NonCurrentLiabilities" && (
        <div className="form-group">
          <label>Non-Current Liability Category</label>
          <select
            className={`form-control ${errors.category ? "is-invalid" : ""}`}
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="loans">Loans</option>
            <option value="provisions">Provisions</option>
            <option value="other_noncurrent_liabilities">Other Non-Current Liabilities</option>
          </select>
          {errors.category && <div className="invalid-feedback">{errors.category}</div>}
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

export default AddLiabilityForm;