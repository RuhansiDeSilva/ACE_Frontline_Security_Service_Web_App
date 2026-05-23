package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollSlipResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userRole;
    private String userEmail;
    private String userPhone;

    private String payMonth;
    private String slipNumber;

    // Salary Components
    private Double basicSalary;
    private Double allowances;
    private Double otherDeductions;
    private Double netSalary;

    // Calculated Totals
    private Double grossSalary;
    private Double totalDeductions;

    // Approval Info
    private String approvedByName;
    private LocalDateTime approvedAt;
    private String approvalRemarks;

    // Dates
    private LocalDateTime generatedAt;
    private LocalDateTime downloadedAt;
    private Integer downloadCount;

    // Status
    private Boolean isDownloaded;
    private Boolean isViewed;
    private LocalDateTime viewedAt;

    // Additional info
    private String remarks;
}
