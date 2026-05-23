package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PayrollRejectionRequest {

    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
