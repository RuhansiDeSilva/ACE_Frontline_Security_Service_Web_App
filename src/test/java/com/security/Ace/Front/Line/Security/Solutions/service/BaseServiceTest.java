package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.*;

import java.time.LocalDate;
import java.util.ArrayList;

/**
 * Shared test fixture for all service-layer unit tests.
 *
 * Provides pre-built {@link User} instances for every role so each
 * individual test class does not duplicate builder code.
 * All entity factories are {@code protected} static methods so
 * subclasses can call them directly without instantiation.
 */
public abstract class BaseServiceTest {

    // ─── User factories ───────────────────────────────────────────────────────

    protected static User aSecurityOfficer() {
        return User.builder()
                .id(1L)
                .username("officer_01")
                .password("$2a$10$encodedPassword")
                .role(Role.SECURITY_OFFICER.name())
                .fullName("John Priyantha Silva")
                .nicNumber("199045678901")
                .sex(Sex.MALE.name())
                .email("john.silva@ace.lk")
                .residentialAddress("45/A, High Level Road, Maharagama, Colombo")
                .mobileNumber("+94771234567")
                .dateOfBirth(LocalDate.of(1990, 6, 15))
                .emergencyContact("Mary Silva - +94779876543")
                .designation(Designation.SSO.name())
                .basicSalary(50000.0)
                .assignedArea("Colombo-North")
                .assignedCompany("ABC Bank PLC")
                .joinDate(LocalDate.of(2023, 1, 15))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }

    protected static User aFirstLoginOfficer() {
        User u = aSecurityOfficer();
        u.setFirstLogin(true);
        u.setId(11L);
        u.setUsername("new_officer");
        return u;
    }

    protected static User anAreaManager() {
        return User.builder()
                .id(2L)
                .username("area_mgr_01")
                .password("$2a$10$encodedPassword")
                .role(Role.AREA_MANAGER.name())
                .fullName("Suresh Perera")
                .nicNumber("198512345678")
                .sex(Sex.MALE.name())
                .email("suresh.perera@ace.lk")
                .residentialAddress("12, Park Road, Kandy")
                .mobileNumber("+94712345678")
                .dateOfBirth(LocalDate.of(1985, 3, 20))
                .emergencyContact("Nimal Perera - +94713456789")
                .assignedArea("Colombo-North")
                .joinDate(LocalDate.of(2020, 5, 1))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }

    protected static User anAreaManagerDifferentArea() {
        User mgr = anAreaManager();
        mgr.setId(21L);
        mgr.setUsername("area_mgr_south");
        mgr.setAssignedArea("Colombo-South");   // deliberately different
        return mgr;
    }

    protected static User anAccountExecutive() {
        return User.builder()
                .id(3L)
                .username("acc_exec_01")
                .password("$2a$10$encodedPassword")
                .role(Role.ACCOUNT_EXECUTIVE.name())
                .fullName("Nirosha Fernando")
                .nicNumber("199278901234")
                .sex(Sex.FEMALE.name())
                .email("nirosha.f@ace.lk")
                .residentialAddress("78, Marine Drive, Colombo 6")
                .mobileNumber("+94778901234")
                .dateOfBirth(LocalDate.of(1992, 11, 8))
                .emergencyContact("Lalith Fernando - +94713456789")
                .adminPosition("Account Executive")
                .joinDate(LocalDate.of(2021, 3, 1))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }

    protected static User anExecutiveOfficer() {
        return User.builder()
                .id(4L)
                .username("exec_officer_01")
                .password("$2a$10$encodedPassword")
                .role(Role.EXECUTIVE_OFFICER.name())
                .fullName("Kasun Bandara")
                .nicNumber("198890123456")
                .sex(Sex.MALE.name())
                .email("kasun.b@ace.lk")
                .residentialAddress("5, Lotus Road, Colombo 1")
                .mobileNumber("+94765432100")
                .dateOfBirth(LocalDate.of(1988, 7, 14))
                .emergencyContact("Dilrukshi Bandara - +94712340000")
                .adminPosition("Executive Officer")
                .joinDate(LocalDate.of(2019, 9, 1))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }

    protected static User anOperationManager() {
        return User.builder()
                .id(5L)
                .username("op_mgr_01")
                .password("$2a$10$encodedPassword")
                .role(Role.OPERATION_MANAGER.name())
                .fullName("Chaminda Rathnayake")
                .nicNumber("197801234567")
                .sex(Sex.MALE.name())
                .email("chaminda.r@ace.lk")
                .residentialAddress("21, Temple Road, Nugegoda")
                .mobileNumber("+94711234567")
                .dateOfBirth(LocalDate.of(1978, 2, 28))
                .emergencyContact("Shanthi Rathnayake - +94714567890")
                .adminPosition("Operation Manager")
                .joinDate(LocalDate.of(2015, 1, 15))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }

    protected static User aDirector() {
        return User.builder()
                .id(6L)
                .username("director_01")
                .password("$2a$10$encodedPassword")
                .role(Role.DIRECTOR.name())
                .fullName("Rajitha Wickramasinghe")
                .nicNumber("197001234567")
                .sex(Sex.MALE.name())
                .email("rajitha.w@ace.lk")
                .residentialAddress("1, Galle Face, Colombo 3")
                .mobileNumber("+94770000001")
                .dateOfBirth(LocalDate.of(1970, 4, 10))
                .emergencyContact("Priyani W - +94770000002")
                .adminPosition("Director")
                .joinDate(LocalDate.of(2010, 6, 1))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }

    protected static User aChairman() {
        return User.builder()
                .id(7L)
                .username("chairman_01")
                .password("$2a$10$encodedPassword")
                .role(Role.CHAIRMAN.name())
                .fullName("Prasanna Siriwardena")
                .nicNumber("196501234567")
                .sex(Sex.MALE.name())
                .email("prasanna.s@ace.lk")
                .residentialAddress("1, Independence Square, Colombo 7")
                .mobileNumber("+94770000010")
                .dateOfBirth(LocalDate.of(1965, 8, 25))
                .emergencyContact("Sandya S - +94770000011")
                .adminPosition("Chairman")
                .joinDate(LocalDate.of(2005, 1, 1))
                .handoverEquipment(new ArrayList<>())
                .firstLogin(false)
                .isActive(true)
                .build();
    }
}