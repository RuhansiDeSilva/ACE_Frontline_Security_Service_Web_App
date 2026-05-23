package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResponseDTO {
    @JsonProperty("risk_level_code")
    private int riskLevelCode;
    
    @JsonProperty("risk_level")
    private String riskLevel;
    
    @JsonProperty("officer_count")
    private int officerCount;
}
