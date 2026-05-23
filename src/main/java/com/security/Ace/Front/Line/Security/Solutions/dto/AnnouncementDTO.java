package com.security.Ace.Front.Line.Security.Solutions.dto;

public class AnnouncementDTO {

    private Long id;
    private String targetRole;
    private String vacancyTitle;
    private String interviewDate;
    private String interviewTime;
    private String interviewLocation;
    private int numberOfInterviewees;
    private boolean read;
    private String createdAt;

    public AnnouncementDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }

    public String getVacancyTitle() { return vacancyTitle; }
    public void setVacancyTitle(String vacancyTitle) { this.vacancyTitle = vacancyTitle; }

    public String getInterviewDate() { return interviewDate; }
    public void setInterviewDate(String interviewDate) { this.interviewDate = interviewDate; }

    public String getInterviewTime() { return interviewTime; }
    public void setInterviewTime(String interviewTime) { this.interviewTime = interviewTime; }

    public String getInterviewLocation() { return interviewLocation; }
    public void setInterviewLocation(String interviewLocation) { this.interviewLocation = interviewLocation; }

    public int getNumberOfInterviewees() { return numberOfInterviewees; }
    public void setNumberOfInterviewees(int numberOfInterviewees) { this.numberOfInterviewees = numberOfInterviewees; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
