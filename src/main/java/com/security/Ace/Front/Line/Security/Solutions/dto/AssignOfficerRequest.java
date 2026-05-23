package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignOfficerRequest {

    @NotNull
    private LocalDate date;

    @NotNull
    private ShiftType shiftType;

    @NotEmpty
    private List<Long> securityOfficerIds;
}