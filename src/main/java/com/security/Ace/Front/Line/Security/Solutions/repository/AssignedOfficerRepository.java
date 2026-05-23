package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.AssignedOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignedOfficerRepository extends JpaRepository<AssignedOfficer, Integer> {

    List<AssignedOfficer> findByClientClientIdAndIsActiveTrue(Integer clientId);

    List<AssignedOfficer> findByClientClientIdOrderByAssignedFromDesc(Integer clientId);

    List<AssignedOfficer> findByOfficerIdOrderByAssignedFromDesc(Integer officerId);
//
//    // Active officers by rank — used in invoice calculation
//    List<AssignedOfficer> findByClientClientIdAndRankAndIsActiveTrue(Integer clientId, OfficerRank officerRank);

    // Count all active officers for a client
    @Query("SELECT COUNT(a) FROM AssignedOfficer a " +
            "WHERE a.client.clientId = :clientId AND a.isActive = true")
    long countActiveOfficersForClient(@Param("clientId") Integer clientId);

    // Count active OIC officers for a client
    @Query("SELECT COUNT(a) FROM AssignedOfficer a " +
            "WHERE a.client.clientId = :clientId AND a.officerRank = 'OIC' AND a.isActive = true")
    long countActiveOicForClient(@Param("clientId") Integer clientId);

    // Count active JSO officers for a client
    @Query("SELECT COUNT(a) FROM AssignedOfficer a " +
            "WHERE a.client.clientId = :clientId AND a.officerRank = 'JSO' AND a.isActive = true")
    long countActiveJsoForClient(@Param("clientId") Integer clientId);

    // Check if officer is currently assigned (active + not past end date)
    @Query(value = "SELECT COUNT(*) > 0 FROM assigned_officers " +
            "WHERE officer_id = :officerId AND is_active = 1 " +
            "AND (assigned_to IS NULL OR assigned_to >= CURDATE())",
            nativeQuery = true)
    boolean isOfficerCurrentlyAssigned(@Param("officerId") Integer officerId);

    // Assignments ending within 7 days — for admin alerts
    @Query(value = "SELECT * FROM assigned_officers WHERE is_active = 1 " +
            "AND assigned_to IS NOT NULL " +
            "AND assigned_to BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) " +
            "ORDER BY assigned_to ASC",
            nativeQuery = true)
    List<AssignedOfficer> findAssignmentsEndingSoon();
}