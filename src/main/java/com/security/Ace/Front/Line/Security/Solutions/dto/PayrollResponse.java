package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.PayrollStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollResponse {

    private Long id;
    private Long employeeId;
    private String employeeName;
    private String employeeRole;
    private String payMonth;
    private Integer payYear;

    private Double basicSalary;
    private Double allowances;
    private Map<String, Double> allowancesDetail;
    private Double otherDeductions;
    private Double netSalary;

    private PayrollStatus status;
    private String submittedByName;
    private LocalDateTime submittedAt;
    private String approvedByName;
    private LocalDateTime approvedAt;
    private LocalDateTime sentToBankAt;

    private String approvalRemarks;
    private String rejectionReason;
    private String remarks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Calculated field
    public Double getGrossSalary() {
        return (basicSalary != null ? basicSalary : 0.0) +
               (allowances != null ? allowances : 0.0);
    }

    public Double getTotalDeductions() {
        return (otherDeductions != null ? otherDeductions : 0.0);
    }
}
