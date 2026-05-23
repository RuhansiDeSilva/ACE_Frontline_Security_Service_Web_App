package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackRejectionRequest {
    @Size(max = 1000, message = "Response must not exceed 1000 characters")
    private String adminResponse;

    public String getAdminResponse() {
        return adminResponse;
    }

    public void setAdminResponse(String adminResponse) {
        this.adminResponse = adminResponse;
    }
}
