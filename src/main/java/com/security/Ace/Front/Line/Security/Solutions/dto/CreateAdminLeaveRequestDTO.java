package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class CreateAdminLeaveRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
