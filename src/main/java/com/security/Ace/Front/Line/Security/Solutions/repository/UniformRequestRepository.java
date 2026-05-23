package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.UniformRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
/**
 * STAFF AUTHENTCATION
 */
@Repository
public interface UniformRequestRepository extends JpaRepository<UniformRequest, Long> {

    List<UniformRequest> findByUser(User user);

    List<UniformRequest> findByStatus(RequestStatus status);
}
