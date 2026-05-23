package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EligibleReplacementDTO {
    private Long officerId;
    private String officerName;
}
