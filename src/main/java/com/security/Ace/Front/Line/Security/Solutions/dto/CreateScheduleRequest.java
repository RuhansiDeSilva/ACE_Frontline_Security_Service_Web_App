package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateScheduleRequest {
    @NotNull
    private Integer clientId;

    @NotNull
    @Min(1)
    @Max(12)
    private Integer month;

    @NotNull
    private Integer year;
}
