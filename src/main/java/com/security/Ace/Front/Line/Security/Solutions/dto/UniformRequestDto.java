package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class UniformRequestDto {

    @NotBlank(message = "Uniform size is required")
    private String uniformSize;

    @NotBlank(message = "Uniform type is required")
    private String uniformType;

    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    private String notes;
}

/**
 * staff authentication
 */