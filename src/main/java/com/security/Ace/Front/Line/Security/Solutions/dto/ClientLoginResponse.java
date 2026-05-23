package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ClientLoginResponse {
    private String message;
    private String role;
    private String redirectUrl;
    private String token;
    private Integer clientId;
    private String companyName;
    private Boolean firstLogin;
}