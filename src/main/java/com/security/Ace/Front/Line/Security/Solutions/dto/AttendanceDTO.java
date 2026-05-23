package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {
    private Long id;
    private Long securityOfficerId;
    private String securityOfficerName;
    private String securityId;
    private LocalDate attendanceDate;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private String status;
    private String remarks;
    private Double hoursWorked;
    private Double overtimeHours;
    private Boolean isShiftCounted;
    private String recordedByName;
}
