package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationStatusUpdateDTO {

    @NotBlank(message = "Status is required")
    private String status; // PENDING, SHORTLISTED, REJECTED, INTERVIEW_SENT

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
