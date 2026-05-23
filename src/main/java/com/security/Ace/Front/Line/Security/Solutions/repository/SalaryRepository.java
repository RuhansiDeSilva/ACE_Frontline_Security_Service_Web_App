package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SalaryRepository extends JpaRepository<Salary, Long> {

    Optional<Salary> findByOfficerAndMonth(User officer, String month);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Salary s WHERE s.status = com.security.Ace.Front.Line.Security.Solutions.entity.Salary.Status.PAID")
    List<Salary> findByStatusPaidOnly();

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Salary s WHERE s.officer.id = :officerId AND s.status = com.security.Ace.Front.Line.Security.Solutions.entity.Salary.Status.PAID")
    List<Salary> findByOfficer_IdAndStatusPaidOnly(
            @org.springframework.data.repository.query.Param("officerId") Long officerId);

    List<Salary> findByStatus(Salary.Status status);

    List<Salary> findByStatusAndPaymentDateBetween(Salary.Status status, java.time.LocalDate start,
                                                   java.time.LocalDate end);

    List<Salary> findByOfficer_IdAndStatus(Long officerId, Salary.Status status);

    List<Salary> findByOfficer_Id(Long officerId);

    List<Salary> findByMonth(String month);

    List<Salary> findByStatusAndMonth(Salary.Status status, String month);
}
