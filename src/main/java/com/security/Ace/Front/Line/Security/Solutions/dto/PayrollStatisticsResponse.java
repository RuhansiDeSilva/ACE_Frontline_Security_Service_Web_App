package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollStatisticsResponse {

    private Long id;
    private String payMonth;
    private String role;
    private Integer totalProcessed;
    private Double totalAmount;
    private Double averageSalary;
    private Double maxSalary;
    private Double minSalary;
    private Integer totalApproved;
    private Integer totalRejected;
    private Integer totalSentToBank;
}
