package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "payroll_slips", indexes = {
    @Index(name = "idx_payroll_slip_user", columnList = "user_id"),
    @Index(name = "idx_payroll_slip_month", columnList = "pay_month"),
    @Index(name = "idx_payroll_slip_user_month", columnList = "user_id, pay_month")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollSlip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paysheet_id", nullable = false)
    private Paysheet paysheet;

    private String payMonth; // e.g. "2024-01"
    private String slipNumber; // Unique slip identifier

    // Salary Components
    private Double basicSalary;
    private Double allowances;
    private Double otherDeductions;
    private Double netSalary;

    // Payroll Slip Specific
    private Double grossSalary; // basicSalary + otAmount + allowances
    private Double totalDeductions; // loanDeduction + advanceDeduction + otherDeductions

    // Approval Info
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private LocalDateTime approvedAt;
    private String approvalRemarks;

    // Dates
    private LocalDateTime generatedAt;
    private LocalDateTime downloadedAt;
    private Integer downloadCount = 0;

    // Status
    private Boolean isDownloaded = false;
    private Boolean isViewed = false;
    private LocalDateTime viewedAt;

    // Remarks
    private String remarks;

    @PrePersist
    protected void onCreate() {
        generatedAt = LocalDateTime.now();
        if (slipNumber == null) {
            slipNumber = generateSlipNumber();
        }
    }

    private String generateSlipNumber() {
        return String.format("SLIP-%d-%s-%d", user.getId(), payMonth.replace("-", ""), System.currentTimeMillis() % 10000);
    }

    public Double calculateGrossSalary() {
        return (basicSalary != null ? basicSalary : 0.0) +
               (allowances != null ? allowances : 0.0);
    }

    public Double calculateTotalDeductions() {
        return (otherDeductions != null ? otherDeductions : 0.0);
    }
}
