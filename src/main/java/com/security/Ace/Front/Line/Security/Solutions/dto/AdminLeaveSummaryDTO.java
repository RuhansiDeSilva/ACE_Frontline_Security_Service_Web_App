package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminLeaveSummaryDTO {
    private int monthlyLimit;
    private int usedLeaves;
    private int remainingLeaves;
    private int month;
    private int year;
}
