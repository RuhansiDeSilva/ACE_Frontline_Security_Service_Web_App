package com.security.Ace.Front.Line.Security.Solutions.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CvSubmissionDTO {

    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String cvFilePath;
    private String submittedDate;
    private String status;
}
