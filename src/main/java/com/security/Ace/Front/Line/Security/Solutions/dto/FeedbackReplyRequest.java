package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackReplyRequest {

    @NotBlank(message = "Reply message is required")
    @Size(max = 1000, message = "Reply must not exceed 1000 characters")
    private String replyMessage;
}
