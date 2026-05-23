package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.dto.ShiftDTO;
import com.security.Ace.Front.Line.Security.Solutions.entity.Shift;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {

    Optional<Shift> findBySchedule_IdAndShiftDateAndShiftType(Long scheduleId, LocalDate shiftDate, ShiftType shiftType);
    List<Shift> findBySchedule_Id(Long scheduleId);

}