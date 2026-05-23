package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftAssignmentDTO {
    private Long id;
    private Long shiftId;
    private Long securityOfficerId;
    private String securityOfficerName;
    /** Denormalized client company for this schedule row (from shift_schedules.client_company). */
    private String clientCompanyName;
}
