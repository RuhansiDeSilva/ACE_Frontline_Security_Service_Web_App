package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.ShiftSchedule;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ScheduleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftScheduleRepository extends JpaRepository<ShiftSchedule, Long> {

    // Active model: look up by clients.client_id
    Optional<ShiftSchedule> findByClient_ClientIdAndMonthAndYear(Integer clientId, Integer month, Integer year);

    List<ShiftSchedule> findByStatus(ScheduleStatus status);

    List<ShiftSchedule> findByStatusAndClient_ClientId(ScheduleStatus status, Integer clientId);

    List<ShiftSchedule> findByMonthAndYearAndStatusIn(
            Integer month,
            Integer year,
            List<ScheduleStatus> statuses
    );

    List<ShiftSchedule> findByMonthAndYearAndStatus(
            Integer month, 
            Integer year, 
            ScheduleStatus status
    );

    List<ShiftSchedule> findByStatusOrderByApprovedDateDesc(ScheduleStatus status);
}