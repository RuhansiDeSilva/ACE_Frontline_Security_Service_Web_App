package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftDTO {
    private Long id;
    private Long scheduleId;
    private LocalDate date;
    private ShiftType shiftType;
    private List<ShiftAssignmentDTO> assignments;
}
