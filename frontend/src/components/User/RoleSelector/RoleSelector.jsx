"use client";

import { useState } from "react";
import "./RoleSelector.css";

export default function RoleSelector({ selectedRole, setSelectedRole }) {
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { value: "all", label: "All Objectives" },
    { value: "BUDGET", label: "Budget" },
    { value: "COST_REDUCTION", label: "Cost Reduction" },
    { value: "REVENUE_GROWTH", label: "Revenue Growth" },
    { value: "PROFIT_MARGIN", label: "Profit Margin" },
    { value: "CASH_FLOW", label: "Cash Flow" },
    { value: "INVESTMENT", label: "Investment" },
    { value: "DEBT_MANAGEMENT", label: "Debt Management" },
    { value: "EXPENSE_CONTROL", label: "Expense Control" },
    { value: "TAX_OPTIMIZATION", label: "Tax Optimization" },
  ];

  const handleSelect = (value) => {
    setSelectedRole(value);
    setIsOpen(false);
  };

  const selectedRoleLabel =
    roles.find((role) => role.value === selectedRole)?.label || "Select a role";

  return (
    <div className="role-selector">
      <button className="selector-button" onClick={() => setIsOpen(!isOpen)}>
        {selectedRoleLabel}
        <span className="selector-icon">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="selector-dropdown">
          {roles.map((role) => (
            <button
              key={role.value}
              className={`dropdown-item ${
                selectedRole === role.value ? "selected" : ""
              }`}
              onClick={() => handleSelect(role.value)}
            >
              {role.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
