package com.security.Ace.Front.Line.Security.Solutions.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class OfficerAssignmentResponse {

    private Integer assignmentId;
    private Integer clientId;
    private String companyName;
    private Integer officerId;
    private String officerName;
    private String officerRank;
    private String shiftType;
    private LocalDate assignedFrom;
    private LocalDate assignedTo;
    private Boolean active;
    private String location;
    private String duties;
}
