package com.security.Ace.Front.Line.Security.Solutions.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "payroll_statistics", indexes = {
    @Index(name = "idx_payroll_stats_month", columnList = "payMonth"),
    @Index(name = "idx_payroll_stats_role", columnList = "role")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String payMonth;           // e.g. "2024-01"
    private String role;               // AREA_MANAGER, DIRECTOR, etc.

    private Integer totalProcessed;    // Total employees processed for this month/role
    private Double totalAmount;        // Total net salary for this month/role
    private Double averageSalary;      // Average net salary
    private Double maxSalary;
    private Double minSalary;

    private Integer totalApproved;     // Count of approved payrolls
    private Integer totalRejected;     // Count of rejected payrolls
    private Integer totalSentToBank;   // Count sent to bank

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
