package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateLeaveRequestDTO {
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
