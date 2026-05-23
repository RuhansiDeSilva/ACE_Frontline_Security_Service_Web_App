package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserInfoDTO {
    private Long id;
    private String email;
    private String role;
    private String designation;
    private Integer clientId;
    private String clientName;
    private Long branchId;
    private String branchName;
}