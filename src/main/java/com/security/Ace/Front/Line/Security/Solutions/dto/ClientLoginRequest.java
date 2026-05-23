package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

@Data
public class ClientLoginRequest {
    private String username;
    private String password;
}