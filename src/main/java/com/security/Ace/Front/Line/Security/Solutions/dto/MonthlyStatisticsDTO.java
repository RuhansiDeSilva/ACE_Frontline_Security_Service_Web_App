package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatisticsDTO {
    private Long id;
    private String securityId;
    private String officerName;
    private Integer monthlyShifts;
    private Double monthlyOvertimeHours;
    private Double monthlyTotalHoursWorked;
}

