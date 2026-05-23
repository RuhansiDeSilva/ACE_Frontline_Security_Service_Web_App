package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class AffectedShiftDTO {
    private Long shiftId;
    private LocalDate date;
    private ShiftType shiftType;
    private Long currentOfficerId;
    private String currentOfficerName;
    private Long assignmentId;
}
