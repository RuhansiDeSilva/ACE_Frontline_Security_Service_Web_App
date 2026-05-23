package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;


@Entity
@Table(
        name = "payroll_deductions",
        indexes = @Index(name = "idx_payroll_deduction", columnList = "payroll_id")
)
public class SalaryDeduction {

    public enum DeductionType {
        STATUTORY,
        CUSTOM
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deduction_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payroll_id", nullable = false)
    private Salary payroll;

    @Column(name = "deduction_name", length = 100, nullable = false)
    private String deductionName;

    @Column(name = "deduction_amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal deductionAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "deduction_type", length = 20, nullable = false)
    private DeductionType deductionType = DeductionType.CUSTOM;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // Getters and setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Salary getPayroll() {
        return payroll;
    }

    public void setPayroll(Salary payroll) {
        this.payroll = payroll;
    }

    public String getDeductionName() {
        return deductionName;
    }

    public void setDeductionName(String deductionName) {
        this.deductionName = deductionName;
    }

    public BigDecimal getDeductionAmount() {
        return deductionAmount;
    }

    public void setDeductionAmount(BigDecimal deductionAmount) {
        this.deductionAmount = deductionAmount;
    }

    public DeductionType getDeductionType() {
        return deductionType;
    }

    public void setDeductionType(DeductionType deductionType) {
        this.deductionType = deductionType;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}

