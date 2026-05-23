package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.LoanRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * ADMIN FINANCE
 */
@Repository
public interface LoanRequestRepository extends JpaRepository<LoanRequest, Long> {

    List<LoanRequest> findByUser(User user);

    List<LoanRequest> findByStatus(RequestStatus status);

    long countByStatus(RequestStatus status);
}
