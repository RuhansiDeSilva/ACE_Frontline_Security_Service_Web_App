package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.AnnouncementDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Announcement;
import com.security.Ace.Front.Line.Security.Solutions.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    /**
     * Create announcements for each selected interviewer role.
     */
    public void createAnnouncements(List<String> targetRoles, String vacancyTitle,
                                     LocalDate interviewDate, LocalTime interviewTime,
                                     String interviewLocation, int numberOfInterviewees) {
        for (String role : targetRoles) {
            Announcement a = new Announcement();
            a.setTargetRole(role);
            a.setVacancyTitle(vacancyTitle);
            a.setInterviewDate(interviewDate);
            a.setInterviewTime(interviewTime);
            a.setInterviewLocation(interviewLocation);
            a.setNumberOfInterviewees(numberOfInterviewees);
            a.setRead(false);
            announcementRepository.save(a);
        }
    }

    /**
     * Get all announcements for a given role.
     */
    public List<AnnouncementDTO> getAnnouncementsByRole(String role) {
        return announcementRepository.findByTargetRoleOrderByCreatedAtDesc(role)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get unread count for a role.
     */
    public long getUnreadCount(String role) {
        return announcementRepository.countByTargetRoleAndReadFalse(role);
    }

    /**
     * Mark a single announcement as read.
     */
    public void markAsRead(Long id) {
        announcementRepository.findById(id).ifPresent(a -> {
            a.setRead(true);
            announcementRepository.save(a);
        });
    }

    /**
     * Mark all announcements for a role as read.
     */
    public void markAllAsRead(String role) {
        List<Announcement> announcements = announcementRepository.findByTargetRoleOrderByCreatedAtDesc(role);
        for (Announcement a : announcements) {
            if (!a.isRead()) {
                a.setRead(true);
                announcementRepository.save(a);
            }
        }
    }

    private AnnouncementDTO toDTO(Announcement a) {
        AnnouncementDTO dto = new AnnouncementDTO();
        dto.setId(a.getId());
        dto.setTargetRole(a.getTargetRole());
        dto.setVacancyTitle(a.getVacancyTitle());
        dto.setInterviewDate(a.getInterviewDate() != null ? a.getInterviewDate().toString() : null);
        dto.setInterviewTime(a.getInterviewTime() != null
                ? a.getInterviewTime().format(DateTimeFormatter.ofPattern("HH:mm")) : null);
        dto.setInterviewLocation(a.getInterviewLocation());
        dto.setNumberOfInterviewees(a.getNumberOfInterviewees());
        dto.setRead(a.isRead());
        dto.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
        return dto;
    }
}
