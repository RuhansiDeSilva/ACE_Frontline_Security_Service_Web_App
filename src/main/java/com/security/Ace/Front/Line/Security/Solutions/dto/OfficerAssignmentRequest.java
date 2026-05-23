package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OfficerAssignmentRequest {

    @NotNull(message = "Client ID is required")
    private Integer clientId;

    @NotNull(message = "Officer ID is required")
    private Integer officerId;

    @NotNull(message = "Officer name is required")
    private String officerName;

    @NotNull(message = "Shift type is required")
    private String shiftType;

    @NotNull(message = "Assignment start date is required")
    private LocalDate assignedFrom;

    private LocalDate assignedTo;

    private String officerRank;

    private String location;
    private String duties;
}