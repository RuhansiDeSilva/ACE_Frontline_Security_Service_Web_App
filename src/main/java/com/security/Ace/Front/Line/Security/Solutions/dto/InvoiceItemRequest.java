package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InvoiceItemRequest {

    @NotBlank(message = "Item type is required")
    private String itemType;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", message = "Quantity must be positive")
    private Double quantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", message = "Unit price must be positive")
    private Double unitPrice;

    private Double taxPercentage;
}