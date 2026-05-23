package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyReportDTO {
    private Long id;
    private Integer month;
    private Integer year;
    private String monthName;
    private String problemsFaced;
    private String rootCauses;
    private String mitigationSteps;
    private String complaintsReceived;
    private String additionalNotes;
    private String areaManagerName;
    private String areaManagerEmployeeId;
    private String branch;
    private LocalDate generatedDate;
    private String status;
}
