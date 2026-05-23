package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PayrollApprovalRequest {

    @NotBlank(message = "Approval remarks is required")
    private String approvalRemarks;
}
