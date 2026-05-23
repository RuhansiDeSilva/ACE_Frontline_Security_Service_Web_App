package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.Paysheet;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.PayrollStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
/**
 * ADMIN FINANCE
 */

@Repository
public interface PaysheetRepository extends JpaRepository<Paysheet, Long> {

    List<Paysheet> findByUserOrderByCreatedAtDesc(User user);

    Optional<Paysheet> findByUserAndPayMonth(User user, String payMonth);
    
    List<Paysheet> findByStatus(PayrollStatus status);

    List<Paysheet> findByStatusAndPayMonth(PayrollStatus status, String payMonth);

    @Query("SELECT p FROM Paysheet p JOIN p.user u WHERE u.role = 'ADMIN' AND p.payMonth = :payMonth")
    List<Paysheet> findAdminPayrollsForMonth(String payMonth);

    @Query("SELECT p FROM Paysheet p JOIN p.user u WHERE u.role = 'SECURITY_PERSONNEL' AND p.payMonth = :payMonth")
    List<Paysheet> findSecurityPayrollsForMonth(String payMonth);
}
