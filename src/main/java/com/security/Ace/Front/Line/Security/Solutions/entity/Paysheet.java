package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.PayrollStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "paysheets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paysheet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String payMonth; // e.g. "2024-01"
    private int payYear;

    private Double basicSalary;
    private Double allowances;
    private Double otherDeductions;
    private Double netSalary;

    private String remarks;

    // Allowance details breakdown (JSON) - stores addition/subtraction details
    @Column(columnDefinition = "TEXT")
    private String allowancesDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by", nullable = false)
    private User generatedBy;

    // Director approval workflow
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private LocalDateTime submittedAt;    // When submitted to director
    private LocalDateTime approvedAt;     // When director approved
    private LocalDateTime rejectedAt;     // When director rejected
    private LocalDateTime sentToBankAt;   // When sent to bank

    private String approvalRemarks;       // Director's approval comments
    private String rejectionReason;       // Director's rejection reason

    @Enumerated(EnumType.STRING)
    private PayrollStatus status = PayrollStatus.DRAFT;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
