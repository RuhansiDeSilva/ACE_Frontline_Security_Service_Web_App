package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.Equipment;
import com.security.Ace.Front.Line.Security.Solutions.validator.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterUserRequest {

    // Login credentials
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @ValidPasswordStrength(message = "Password must be at least 8 characters and contain uppercase letter, lowercase letter, number, and special character")
    private String password;

    @NotBlank(message = "Role is required")
    private String role;

    // Personal Information
    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @ValidNICNumber(message = "Invalid NIC number format. Must be 9 digits + X/V or 12 digits")
    private String nicNumber;

    private String sex;

    private String bloodGroup;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Size(min = 5, max = 500, message = "Residential address must be between 5 and 500 characters")
    private String residentialAddress;

    @ValidPhoneNumber(message = "Invalid phone number format. Must be valid Sri Lankan format (+94, 0, or full number)")
    private String mobileNumber;

    @ValidAge(minAge = 18, maxAge = 65, message = "Age must be between 18 and 65 years")
    private LocalDate dateOfBirth;

    @ValidPhoneNumber(message = "Emergency contact must be a valid phone number")
    private String emergencyContact;

    @Size(min = 2, max = 100, message = "Emergency contact person name must be between 2 and 100 characters")
    private String emergencyContactPersonName;

    // Professional Details
    private String professionalCertificate;

    private String assignedArea;

    private String assignedCompany; // for security officers and area managers

    private LocalDate joinDate;

    private String designation; // for security officers only

    @DecimalMin(value = "0.0", message = "Basic salary must be non-negative")
    private Double basicSalary;

    private String adminPosition; // for admin roles

    private String specialSkills;

    private List<Equipment> handoverEquipment;

    // Bank Details
    private String bankName;

    @ValidBankAccount(message = "Bank account number must be between 8 and 18 digits")
    private String bankAccountNumber;

    private String bankBranch;
}
