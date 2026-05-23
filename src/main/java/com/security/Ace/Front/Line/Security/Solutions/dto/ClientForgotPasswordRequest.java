package com.security.Ace.Front.Line.Security.Solutions.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClientForgotPasswordRequest {

    @NotBlank(message = "Username is required")
    private String username;
}
