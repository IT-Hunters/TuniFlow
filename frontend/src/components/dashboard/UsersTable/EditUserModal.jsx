// EditUserModal.jsx
import React, { useState, useCallback, useEffect, memo } from "react";
import PropTypes from "prop-types";
import debounce from "lodash/debounce";
import "./EditUserModal.css";

const EditUserModal = ({ isOpen, user, token, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        firstname: user.firstname || "",
        lastname: user.lastname || "",
        email: user.email || "",
      });
      setFormErrors({});
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      document.getElementById("firstname")?.focus();
    }
  }, [isOpen]);

  const validateField = useCallback((name, value) => {
    const errors = { ...formErrors };
    switch (name) {
      case "firstname":
      case "lastname":
        if (!value.trim()) {
          errors[name] = `${name === "firstname" ? "First" : "Last"} name is required`;
        } else if (value.length > 100) {
          errors[name] = `${name === "firstname" ? "First" : "Last"} name must be less than 100 characters`;
        } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
          errors[name] = `${
            name === "firstname" ? "First" : "Last"
          } name can only contain letters, numbers, spaces, hyphens, or underscores`;
        } else {
          delete errors[name];
        }
        break;
      case "email":
        if (!value.trim()) {
          errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;
      default:
        break;
    }
    return errors;
  }, [formErrors]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      const sanitizedValue = name !== "email" ? value.replace(/[^a-zA-Z0-9\s\-_]/g, "") : value;
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      debounceValidate(name, sanitizedValue);
    },
    [],
  );

  const debounceValidate = useCallback(
    debounce((name, value) => {
      setFormErrors((prev) => validateField(name, value));
    }, 300),
    [validateField],
  );

  const isFormValid = useCallback(() => {
    return (
      !Object.keys(formErrors).length &&
      formData.firstname.trim() &&
      formData.lastname.trim() &&
      formData.email.trim() &&
      /^[a-zA-Z0-9\s\-_]+$/.test(formData.firstname) &&
      /^[a-zA-Z0-9\s\-_]+$/.test(formData.lastname) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    );
  }, [formData, formErrors]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user?._id) {
        setFormErrors({ submit: "User ID is missing. Cannot update this user." });
        return;
      }
      const errors = Object.keys(formData).reduce((acc, key) => {
        return { ...acc, ...validateField(key, formData[key]) };
      }, {});
      setFormErrors(errors);
      if (Object.keys(errors).length) return;
      setIsSubmitting(true);
      try {
        const response = await fetch(`http://localhost:3000/users/updatebyid/${user._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (response.ok) {
          onSave({ ...user, ...formData });
          onClose();
          alert(result.message);
        } else {
          setFormErrors({ submit: result.message || "Failed to update user" });
        }
      } catch (err) {
        console.error("Error updating user:", err);
        setFormErrors({ submit: `An error occurred: ${err.message || err}` });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, user, token, onSave, onClose, validateField],
  );

  if (!isOpen) return null;

  return (
    <div className="edit-user-modal modal-overlay" role="dialog" aria-labelledby="modal-title">
      <div className="modal-content">
        <h2 id="modal-title" className="modal-title">
          Edit User
        </h2>
        {formErrors.submit && <div className="alert-error">{formErrors.submit}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { id: "firstname", label: "First Name", type: "text" },
            { id: "lastname", label: "Last Name", type: "text" },
            { id: "email", label: "Email", type: "email" },
          ].map(({ id, label, type }) => (
            <div key={id} className="form-group">
              <label htmlFor={id} className="form-label">
                {label}
              </label>
              <input
                id={id}
                name={id}
                type={type}
                value={formData[id]}
                onChange={handleInputChange}
                className={`form-input ${formErrors[id] ? "form-input-error" : ""}`}
                required
                aria-invalid={!!formErrors[id]}
                aria-describedby={formErrors[id] ? `${id}-error` : undefined}
              />
              {formErrors[id] && (
                <div id={`${id}-error`} className="form-error">
                  {formErrors[id]}
                </div>
              )}
            </div>
          ))}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-save"
              disabled={!isFormValid() || isSubmitting}
              aria-label={isSubmitting ? "Saving..." : "Save Changes"}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    _id: PropTypes.string,
    firstname: PropTypes.string,
    lastname: PropTypes.string,
    email: PropTypes.string,
  }),
  token: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default memo(EditUserModal);