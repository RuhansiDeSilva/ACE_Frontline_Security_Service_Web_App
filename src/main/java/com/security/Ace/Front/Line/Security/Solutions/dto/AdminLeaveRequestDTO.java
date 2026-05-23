package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.AdminLeaveRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminLeaveRequestDTO {
    private Long id;
    private Long employeeId;
    private String employeeEmail;
    private String employeeRole;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String rejectionReason;
    private AdminLeaveRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private Integer consumedLeaveDays;
}
