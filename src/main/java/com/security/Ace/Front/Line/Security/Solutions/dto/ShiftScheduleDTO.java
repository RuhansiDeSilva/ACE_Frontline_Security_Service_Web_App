package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShiftScheduleDTO {
    private Long id;
    private Integer clientId;
    private String clientName;
    private Integer month;
    private Integer year;
    private ScheduleStatus status;
    private LocalDateTime submittedDate;
    private LocalDateTime approvedDate;
    private String createdByUserName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ShiftDTO> shifts;
    private boolean editedByAreaManager;
    private LocalDateTime areaManagerEditedAt;
}
