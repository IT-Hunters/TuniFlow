const isEmpty = require("./isEmpty");
const validator = require("validator");

module.exports = function validateUpdateProfil(data, role) {
  let errors = {};

  // Initialisation des champs communs
  data.fullname = !isEmpty(data.fullname) ? data.fullname : "";
  data.lastname = !isEmpty(data.lastname) ? data.lastname : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.certification = !isEmpty(data.certification) ? data.certification : "";
  data.registrationNumber = !isEmpty(data.registrationNumber) ? data.registrationNumber : "";
  data.experienceYears = !isEmpty(data.experienceYears) ? data.experienceYears : "";

  // Initialisation des champs spécifiques au rôle
  data.specialization = !isEmpty(data.specialization) ? data.specialization : "";
  data.companyName = !isEmpty(data.companyName) ? data.companyName : "";
  data.industry = !isEmpty(data.industry) ? data.industry : "";
  data.department = !isEmpty(data.department) ? data.department : "";
  data.hireDate = !isEmpty(data.hireDate) ? data.hireDate : "";

  // Validation des champs communs
  if (validator.isEmpty(data.fullname)) {
    errors.fullname = "Required fullname";
  } else if (data.fullname.length < 4) {
    errors.fullname = "Fullname must be at least 4 characters long";
  }

  if (validator.isEmpty(data.lastname)) {
    errors.lastname = "Required lastname";
  } else if (data.lastname.length < 4) {
    errors.lastname = "Lastname must be at least 4 characters long";
  }

  if (!validator.isEmail(data.email)) {
    errors.email = "Required format email";
  }

  if (validator.isEmpty(data.email)) {
    errors.email = "Required email";
  }

  // Validation spécifique au rôle
  switch (role) {
    case "BUSINESS_MANAGER":
    case "ACCOUNTANT":
    case "RH":
      if (validator.isEmpty(data.certification)) {
        errors.certification = "Required certification";
      }
      if (data.experienceYears === null || data.experienceYears === undefined || data.experienceYears === "") {
        errors.experienceYears = "Required experienceYears";
      } else if (typeof data.experienceYears !== "number") {
        errors.experienceYears = "Experience years must be a number";
      }
      if (validator.isEmpty(data.specialization)) {
        errors.specialization = "Required specialization";
      }
      if (data.salary === null || data.salary === undefined || data.salary === "") {
        errors.salary = "Required salary";
      } else if (typeof data.salary !== "number") {
        errors.salary = "Salary must be a number";
      }
      break;

    case "BUSINESS_OWNER":
      if (validator.isEmpty(data.companyName)) {
        errors.companyName = "Required companyName";
      }
      if (data.registrationNumber === null || data.registrationNumber === undefined || data.registrationNumber === "") {
        errors.registrationNumber = "Required registrationNumber";
      } else if (typeof data.registrationNumber !== "number") {
        errors.registrationNumber = "Registration number must be a number";
      }
      if (validator.isEmpty(data.industry)) {
        errors.industry = "Required industry";
      }
      break;

    case "FINANCIAL_MANAGER":
      if (validator.isEmpty(data.department)) {
        errors.department = "Required department";
      }
      if (validator.isEmpty(data.hireDate)) {
        errors.hireDate = "Required hireDate";
      }
      if (data.salary === null || data.salary === undefined || data.salary === "") {
        errors.salary = "Required salary";
      } else if (typeof data.salary !== "number") {
        errors.salary = "Salary must be a number";
      }
      break;

    default:
      break;
  }

  return {
    errors,
    isValid: isEmpty(errors),
  };
};