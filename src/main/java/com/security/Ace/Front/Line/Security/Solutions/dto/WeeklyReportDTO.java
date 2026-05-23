package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReportDTO {
    private Long id;
    private String securityOfficerName;
    private String securityId;
    private String companyName;
    private String branch;
    private Integer totalShifts;
    private Double totalOvertimeHours;
    private Double totalHoursWorked;
    private String areaManagerName;
    private String areaManagerEmployeeId;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private Integer weekNumber;  // week of month 1-4
    private Integer month;       // 1-12
    private Integer year;
    private String remarks;
}
