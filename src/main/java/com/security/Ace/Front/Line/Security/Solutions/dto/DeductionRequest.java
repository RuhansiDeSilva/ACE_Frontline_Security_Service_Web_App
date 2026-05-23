package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class DeductionRequest {

    @NotNull(message = "Client ID is required")
    private Integer clientId;

    // Must be one of: ABSENCE, MISCONDUCT, SLA_BREACH, EQUIPMENT_NON_COMPLIANCE, CUSTOM
    @NotBlank(message = "Deduction type is required")
    private String deductionType;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be positive")
    private BigDecimal amount;

    @NotNull(message = "Incident date is required")
    private LocalDate incidentDate;

    @NotBlank(message = "Description is required")
    private String description;

    private Integer officerId;
    private String officerName;

    // Which billing month/year this deduction targets
    @NotNull(message = "Target billing month is required")
    private Integer targetBillingMonth;

    @NotNull(message = "Target billing year is required")
    private Integer targetBillingYear;
}