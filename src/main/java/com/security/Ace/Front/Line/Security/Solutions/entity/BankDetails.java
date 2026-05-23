package com.security.Ace.Front.Line.Security.Solutions.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_bank_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BankDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "bank_id")
    private Integer bankId;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "account_name", nullable = false, length = 200)
    private String accountName;

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Column(name = "branch_name", length = 100)
    private String branchName;

    // Bank branch code e.g. 612 for Lake View Branch
    @Column(name = "branch_code", length = 20)
    private String branchCode;

    @Column(name = "swift_code", length = 20)
    private String swiftCode;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}