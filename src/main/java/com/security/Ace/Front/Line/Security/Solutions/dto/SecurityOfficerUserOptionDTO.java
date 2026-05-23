package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecurityOfficerUserOptionDTO {
    private Long securityOfficerId;
    private String securityOfficerName;
    /** Optional badge / display (from {@code security_officers.security_id}). */
    private String securityId;
}

