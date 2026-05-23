package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.AdvanceRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdvanceRequestRepository extends JpaRepository<AdvanceRequest, Long> {
    List<AdvanceRequest> findByStatus(RequestStatus status);
    List<AdvanceRequest> findByUser(User user);
    List<AdvanceRequest> findByUserAssignedArea(String area);
    List<AdvanceRequest> findByUserAssignedAreaAndStatus(String area, RequestStatus status);
    List<AdvanceRequest> findByUserAndForMonthAndStatus(User user, String forMonth, RequestStatus status);
    List<AdvanceRequest> findByUserAndForMonthAndStatusAndDeducted(User user, String forMonth, RequestStatus status, boolean deducted);
    boolean existsByUserAndForMonthAndStatusNot(User user, String forMonth, RequestStatus status);
}

