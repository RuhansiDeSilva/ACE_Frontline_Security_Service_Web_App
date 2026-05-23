package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByTargetRoleOrderByCreatedAtDesc(String targetRole);

    List<Announcement> findByTargetRoleInOrderByCreatedAtDesc(List<String> targetRoles);

    long countByTargetRoleAndReadFalse(String targetRole);

    List<Announcement> findByInterviewDateAndInterviewTimeAndInterviewLocation(
            LocalDate interviewDate, LocalTime interviewTime, String interviewLocation);
}
