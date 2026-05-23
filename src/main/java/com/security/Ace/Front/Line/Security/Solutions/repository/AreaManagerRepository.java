package com.security.Ace.Front.Line.Security.Solutions.repository;

import com.security.Ace.Front.Line.Security.Solutions.entity.AreaManager;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AreaManagerRepository extends JpaRepository<AreaManager, Long> {

    Optional<AreaManager> findByEmployeeId(String employeeId);

    Optional<AreaManager> findByEmail(String email);

    boolean existsByEmployeeId(String employeeId);

    boolean existsByEmail(String email);
}
