package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaysheetRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Pay month is required")
    private String payMonth; // format: YYYY-MM

    private Double basicSalary;
    private Double allowances;
    private Double otherDeductions;
    private String remarks;
}

/**
 * admin
 */