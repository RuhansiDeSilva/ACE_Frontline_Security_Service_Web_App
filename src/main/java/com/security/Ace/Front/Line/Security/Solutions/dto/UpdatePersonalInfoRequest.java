package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.Data;

@Data
public class UpdatePersonalInfoRequest {
    private String residentialAddress;
    private String mobileNumber;
    private String emergencyContact;
    private String email;
}