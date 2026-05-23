/**
 * Frontend validation helpers for registration forms
 * Mirrors backend validation rules
 */

export const ValidationRules = {
  // Username validation
  validateUsername: (username: string): string | null => {
    if (!username || !username.trim()) {
      return "Username is required";
    }
    if (username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (username.length > 50) {
      return "Username must not exceed 50 characters";
    }
    return null;
  },

  // Password validation - must have uppercase, lowercase, number, special char, min 8 chars
  validatePassword: (password: string): string | null => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[@$!%*?&]/.test(password)) {
      return "Password must contain at least one special character (@$!%*?&)";
    }
    return null;
  },

  // Email validation
  validateEmail: (email: string): string | null => {
    if (!email || !email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return null;
  },

  // NIC validation - 9 digits + X/V or 12 digits
  validateNIC: (nic: string): string | null => {
    if (!nic || !nic.trim()) {
      return "NIC number is required";
    }
    const nicRegex = /^(?:\d{9}[Xx]|\d{12})$/;
    const cleanedNIC = nic.replace(/\s+/g, "");
    if (!nicRegex.test(cleanedNIC)) {
      return "Invalid NIC format. Must be 9 digits + X/V or 12 digits";
    }
    return null;
  },

  // Phone number validation - Sri Lankan format
  validatePhoneNumber: (phone: string): string | null => {
    if (!phone || !phone.trim()) {
      return "Phone number is required";
    }
    const phoneRegex = /^(?:\+94|0)?[1-9]\d{8}$/;
    const cleanedPhone = phone.replace(/\s+/g, "");
    if (!phoneRegex.test(cleanedPhone)) {
      return "Invalid phone number. Must be valid Sri Lankan format (+94, 0, or full number)";
    }
    return null;
  },

  // Date of birth validation - must be 18-65 years old
  validateDateOfBirth: (dateStr: string): string | null => {
    if (!dateStr) {
      return "Date of birth is required";
    }
    const birthDate = new Date(dateStr);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      const actualAge = age - 1;
      if (actualAge < 18) {
        return "Age must be at least 18 years";
      }
      if (actualAge > 65) {
        return "Age must not exceed 65 years";
      }
    } else {
      if (age < 18) {
        return "Age must be at least 18 years";
      }
      if (age > 65) {
        return "Age must not exceed 65 years";
      }
    }
    return null;
  },

  // Full name validation
  validateFullName: (name: string): string | null => {
    if (!name || !name.trim()) {
      return "Full name is required";
    }
    if (name.length < 2) {
      return "Full name must be at least 2 characters";
    }
    if (name.length > 100) {
      return "Full name must not exceed 100 characters";
    }
    return null;
  },

  // Residential address validation
  validateResidentialAddress: (address: string): string | null => {
    if (!address || !address.trim()) {
      return "Residential address is required";
    }
    if (address.length < 5) {
      return "Address must be at least 5 characters";
    }
    if (address.length > 500) {
      return "Address must not exceed 500 characters";
    }
    return null;
  },

  // Bank account validation - 8-18 digits
  validateBankAccount: (account: string): string | null => {
    if (!account || !account.trim()) {
      return null; // Optional field
    }
    const cleanedAccount = account.replace(/\s+/g, "");
    if (!/^\d{8,18}$/.test(cleanedAccount)) {
      return "Bank account number must be between 8 and 18 digits";
    }
    return null;
  },

  // Assigned area validation (for AREA_MANAGER)
  validateAssignedArea: (area: string): string | null => {
    if (!area || !area.trim()) {
      return "Assigned area is required";
    }
    if (area.length < 2) {
      return "Assigned area must be at least 2 characters";
    }
    return null;
  },

  // Generic required field validation
  validateRequired: (value: any, fieldName: string): string | null => {
    if (!value || (typeof value === "string" && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },
};

/**
 * Returns a user-friendly message for a validation error
 */
export const getValidationMessage = (field: string, error: string): string => {
  // If it's a custom message from server, use it as-is
  if (error.includes("must") || error.includes("required") || error.includes("Invalid")) {
    return error;
  }
  // Fallback for unexpected errors
  return error || `${field} is invalid`;
};

/**
 * Checks if all required fields for a role are provided
 */
export const validateFormCompleteness = (
  formData: Record<string, any>,
  role: string | null
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Common required fields
  if (!formData.username) errors.username = "Username is required";
  if (!formData.password) errors.password = "Password is required";
  if (!formData.fullName) errors.fullName = "Full name is required";
  if (!formData.email) errors.email = "Email is required";

  // Role-specific validation
  if (role !== "CHAIRMAN" && role !== "DIRECTOR") {
    if (!formData.nicNumber) errors.nicNumber = "NIC number is required";
    if (!formData.sex) errors.sex = "Sex is required";
    if (!formData.mobileNumber) errors.mobileNumber = "Mobile number is required";
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required";
    if (!formData.residentialAddress) errors.residentialAddress = "Residential address is required";
    if (!formData.emergencyContact) errors.emergencyContact = "Emergency contact is required";
  }

  if (role === "SECURITY_OFFICER") {
    if (!formData.designation) errors.designation = "Designation is required";
  }

  if (role === "AREA_MANAGER") {
    if (!formData.assignedArea) errors.assignedArea = "Assigned area is required";
  }

  return errors;
};
