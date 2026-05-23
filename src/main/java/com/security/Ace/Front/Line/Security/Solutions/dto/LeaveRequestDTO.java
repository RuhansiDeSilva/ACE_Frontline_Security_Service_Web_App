package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.LeaveRequestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class LeaveRequestDTO {
    private Long id;
    private Long employeeId;
    private String employeeName; // email or name
    private Integer clientId;
    private String clientName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private LeaveRequestStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByName;
    private boolean replacementHandled;
}
