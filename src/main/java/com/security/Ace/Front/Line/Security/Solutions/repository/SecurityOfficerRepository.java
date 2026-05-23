package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.SecurityOfficer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SecurityOfficerRepository extends JpaRepository<SecurityOfficer, Long> {

    Optional<SecurityOfficer> findBySecurityId(String securityId);

    Optional<SecurityOfficer> findByEmailAddress(String emailAddress);

    Optional<SecurityOfficer> findFirstByFullNameIgnoreCase(String fullName);

    List<SecurityOfficer> findByAreaManagerId(Long areaManagerId);

    List<SecurityOfficer> findByBranch(String branch);

    List<SecurityOfficer> findByStatus(String status);

    List<SecurityOfficer> findByAssignedCompany(String companyName);

    @Query("SELECT s FROM SecurityOfficer s WHERE s.areaManager.id = :managerId AND s.status = 'ACTIVE'")
    List<SecurityOfficer> findActiveOfficersByManager(@Param("managerId") Long managerId);

    @Query("SELECT DISTINCT s.assignedCompany FROM SecurityOfficer s WHERE s.areaManager.id = :managerId AND s.status = 'ACTIVE'")
    List<String> findDistinctCompaniesByManager(@Param("managerId") Long managerId);

    @Query("SELECT s FROM SecurityOfficer s WHERE s.areaManager.id = :managerId AND s.assignedCompany = :companyName AND s.status = 'ACTIVE'")
    List<SecurityOfficer> findActiveByManagerAndCompany(@Param("managerId") Long managerId,
                                                        @Param("companyName") String companyName);

    boolean existsBySecurityId(String securityId);
}
