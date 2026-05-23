package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClientRegistrationRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 200)
    private String companyName;

    @Size(max = 100)
    private String companyRegistrationNo;

    // Client's own VAT registration — printed on invoices
    @Size(max = 50)
    private String vatNumber;

    @Size(max = 100)
    private String industryType;

    private String address;

    @NotBlank(message = "Service location is required")
    private String serviceLocation;

    @Size(max = 50)
    private String city;

    @NotBlank(message = "Contact person name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String contactPersonName;

    @Size(max = 100)
    private String contactPersonDesignation;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 100)
    private String contactPersonEmail;

    @NotBlank(message = "Phone number is required")
    @jakarta.validation.constraints.Pattern(regexp = "^(\\+\\d{1,3}[- ]?)?\\d{10}$", message = "Invalid phone number format. Use 10 digits or international format (e.g., +94XXXXXXXXX)")
    private String contactPersonPhone;

    @NotNull(message = "Service start date is required")
    private LocalDate serviceStartDate;

    @NotNull(message = "Contract duration is required")
    @Min(value = 1, message = "Contract duration must be at least 1 month")
    private Integer contractDurationMonths;

    // Number of officers per category
    @NotNull(message = "Entry-level officer count is required")
    @Min(value = 0)
    private Integer entryLevelCount;

    @NotNull(message = "Mid-level officer count is required")
    @Min(value = 0)
    private Integer midLevelCount;

    @NotNull(message = "Specialized officer count is required")
    @Min(value = 0)
    private Integer specializedCount;

    @NotNull(message = "Supervisor count is required")
    @Min(value = 0)
    private Integer supervisorCount;

    // Rates per 12-hour shift
    @NotNull(message = "Entry-level rate is required")
    @DecimalMin(value = "0.0", message = "Entry-level rate must be >= 0")
    private BigDecimal entryLevelRatePerShift;

    @NotNull(message = "Mid-level rate is required")
    @DecimalMin(value = "0.0", message = "Mid-level rate must be >= 0")
    private BigDecimal midLevelRatePerShift;

    @NotNull(message = "Specialized rate is required")
    @DecimalMin(value = "0.0", message = "Specialized rate must be >= 0")
    private BigDecimal specializedRatePerShift;

    @NotNull(message = "Supervisor rate is required")
    @DecimalMin(value = "0.0", message = "Supervisor rate must be >= 0")
    private BigDecimal supervisorRatePerShift;

    // OT rates per hour
    @NotNull(message = "Entry-level OT rate is required")
    @DecimalMin(value = "0.0", message = "Entry-level OT rate must be >= 0")
    private BigDecimal entryLevelOtRatePerHour;

    @NotNull(message = "Mid-level OT rate is required")
    @DecimalMin(value = "0.0", message = "Mid-level OT rate must be >= 0")
    private BigDecimal midLevelOtRatePerHour;

    @NotNull(message = "Specialized OT rate is required")
    @DecimalMin(value = "0.0", message = "Specialized OT rate must be >= 0")
    private BigDecimal specializedOtRatePerHour;

    @NotNull(message = "Supervisor OT rate is required")
    @DecimalMin(value = "0.0", message = "Supervisor OT rate must be >= 0")
    private BigDecimal supervisorOtRatePerHour;

    private String riskLevel;

    private Integer recommendedOfficers;
}