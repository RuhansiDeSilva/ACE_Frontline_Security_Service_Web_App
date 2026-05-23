package com.security.Ace.Front.Line.Security.Solutions.service;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.security.Ace.Front.Line.Security.Solutions.dto.ChangePasswordRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientRegistrationRequest;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientResponse;
import com.security.Ace.Front.Line.Security.Solutions.dto.ClientUpdateRequest;
import com.security.Ace.Front.Line.Security.Solutions.entity.Client;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ClientStatus;
import com.security.Ace.Front.Line.Security.Solutions.entity.Invoice;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.RiskLevel;
import com.security.Ace.Front.Line.Security.Solutions.exception.DuplicateResourceException;
import com.security.Ace.Front.Line.Security.Solutions.exception.InvalidOperationException;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.AssignedOfficerRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.ClientRepository;
import com.security.Ace.Front.Line.Security.Solutions.repository.InvoiceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final InvoiceRepository invoiceRepository;
    private final AssignedOfficerRepository assignedOfficerRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public ClientResponse registerClient(ClientRegistrationRequest request) {
        // Duplicate checks
        String username = generateUsername(request.getCompanyName());

        if (clientRepository.existsByUsername(username)) {
            throw new DuplicateResourceException("Client", "company name", request.getCompanyName());
        }
        if (clientRepository.existsByContactPersonEmail(request.getContactPersonEmail())) {
            throw new DuplicateResourceException("Client", "email", request.getContactPersonEmail());
        }
        if (request.getCompanyRegistrationNo() != null &&
                clientRepository.existsByCompanyRegistrationNo(request.getCompanyRegistrationNo())) {
            throw new DuplicateResourceException("Client", "registration number", request.getCompanyRegistrationNo());
        }

        // Generate temporary password (min 8 chars per guide)
        String tempPassword = generateRandomPassword();

        // Generate unique client code e.g. ACE-2026-001
        String clientCode = generateClientCode();

        // Build entity
        Client client = new Client();
        client.setClientCode(clientCode);
        client.setCompanyName(request.getCompanyName());
        client.setCompanyRegistrationNo(request.getCompanyRegistrationNo());
        client.setVatNumber(request.getVatNumber());
        client.setIndustryType(request.getIndustryType());
        client.setAddress(request.getAddress());
        client.setServiceLocation(request.getServiceLocation());
        client.setCity(request.getCity());
        client.setContactPersonName(request.getContactPersonName());
        client.setContactPersonDesignation(request.getContactPersonDesignation());
        client.setContactPersonEmail(request.getContactPersonEmail());
        client.setContactPersonPhone(request.getContactPersonPhone());
        client.setUsername(username);
        client.setPasswordHash(passwordEncoder.encode(tempPassword));
        client.setIsFirstLogin(true);
        client.setServiceStartDate(request.getServiceStartDate());
        client.setContractDurationMonths(
                request.getContractDurationMonths() != null ? request.getContractDurationMonths() : 12);
        // Invoice calculation fields (4 categories)
        client.setEntryLevelCount(request.getEntryLevelCount());
        client.setMidLevelCount(request.getMidLevelCount());
        client.setSpecializedCount(request.getSpecializedCount());
        client.setSupervisorCount(request.getSupervisorCount());

        client.setEntryLevelRatePerShift(request.getEntryLevelRatePerShift());
        client.setMidLevelRatePerShift(request.getMidLevelRatePerShift());
        client.setSpecializedRatePerShift(request.getSpecializedRatePerShift());
        client.setSupervisorRatePerShift(request.getSupervisorRatePerShift());

        client.setEntryLevelOtRatePerHour(request.getEntryLevelOtRatePerHour());
        client.setMidLevelOtRatePerHour(request.getMidLevelOtRatePerHour());
        client.setSpecializedOtRatePerHour(request.getSpecializedOtRatePerHour());
        client.setSupervisorOtRatePerHour(request.getSupervisorOtRatePerHour());
        // Risk assessment
        if (request.getRiskLevel() != null) {
            client.setRiskLevel(RiskLevel.valueOf(request.getRiskLevel()));
        }
        client.setRecommendedOfficers(request.getRecommendedOfficers());
        client.setStatus(ClientStatus.ACTIVE);
        client.setRegisteredAt(LocalDateTime.now());
        client.setUpdatedAt(LocalDateTime.now());

        Client savedClient = clientRepository.save(client);

        // Send welcome email with credentials — password never returned in response
        emailService.sendCredentialsEmail(savedClient, tempPassword);

        return mapToResponse(savedClient);
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getActiveClients() {
        return clientRepository.findByStatus(ClientStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClientResponse getClientById(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));
        return mapToResponse(client);
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getClientsExpiringSoon(int withinDays) {
        return clientRepository.findClientsExpiringSoonNative(withinDays).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClientResponse updateClient(Integer clientId, ClientUpdateRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        if (request.getCompanyName() != null)
            client.setCompanyName(request.getCompanyName());
        if (request.getVatNumber() != null)
            client.setVatNumber(request.getVatNumber());
        if (request.getAddress() != null)
            client.setAddress(request.getAddress());
        if (request.getServiceLocation() != null)
            client.setServiceLocation(request.getServiceLocation());
        if (request.getCity() != null)
            client.setCity(request.getCity());
        if (request.getContactPersonName() != null)
            client.setContactPersonName(request.getContactPersonName());
        if (request.getContactPersonDesignation() != null)
            client.setContactPersonDesignation(request.getContactPersonDesignation());
        if (request.getContactPersonEmail() != null)
            client.setContactPersonEmail(request.getContactPersonEmail());
        if (request.getContactPersonPhone() != null)
            client.setContactPersonPhone(request.getContactPersonPhone());
        if (request.getEntryLevelCount() != null)
            client.setEntryLevelCount(request.getEntryLevelCount());
        if (request.getMidLevelCount() != null)
            client.setMidLevelCount(request.getMidLevelCount());
        if (request.getSpecializedCount() != null)
            client.setSpecializedCount(request.getSpecializedCount());
        if (request.getSupervisorCount() != null)
            client.setSupervisorCount(request.getSupervisorCount());

        if (request.getEntryLevelRatePerShift() != null)
            client.setEntryLevelRatePerShift(request.getEntryLevelRatePerShift());
        if (request.getMidLevelRatePerShift() != null)
            client.setMidLevelRatePerShift(request.getMidLevelRatePerShift());
        if (request.getSpecializedRatePerShift() != null)
            client.setSpecializedRatePerShift(request.getSpecializedRatePerShift());
        if (request.getSupervisorRatePerShift() != null)
            client.setSupervisorRatePerShift(request.getSupervisorRatePerShift());

        if (request.getEntryLevelOtRatePerHour() != null)
            client.setEntryLevelOtRatePerHour(request.getEntryLevelOtRatePerHour());
        if (request.getMidLevelOtRatePerHour() != null)
            client.setMidLevelOtRatePerHour(request.getMidLevelOtRatePerHour());
        if (request.getSpecializedOtRatePerHour() != null)
            client.setSpecializedOtRatePerHour(request.getSpecializedOtRatePerHour());
        if (request.getSupervisorOtRatePerHour() != null)
            client.setSupervisorOtRatePerHour(request.getSupervisorOtRatePerHour());
        if (request.getContractDurationMonths() != null)
            client.setContractDurationMonths(request.getContractDurationMonths());
        if (request.getRiskLevel() != null)
            client.setRiskLevel(RiskLevel.valueOf(request.getRiskLevel()));
        if (request.getRecommendedOfficers() != null)
            client.setRecommendedOfficers(request.getRecommendedOfficers());

        client.setUpdatedAt(LocalDateTime.now());
        return mapToResponse(clientRepository.save(client));
    }

    @Transactional
    public void suspendClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));
        client.setStatus(ClientStatus.SUSPENDED);
        clientRepository.save(client);
    }

    @Transactional
    public void terminateClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));
        client.setStatus(ClientStatus.TERMINATED);
        clientRepository.save(client);
    }

    @Transactional
    public void reactivateClient(Integer clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));
        client.setStatus(ClientStatus.ACTIVE);
        clientRepository.save(client);
    }

    /**
     * Phase 17 — Renew contract after offline signing.
     * Adds additionalMonths to the existing contract duration and reactivates if
     * suspended/expired.
     */
    @Transactional
    public ClientResponse renewContract(Integer clientId, int additionalMonths) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        int currentMonths = client.getContractDurationMonths() != null ? client.getContractDurationMonths() : 0;
        client.setContractDurationMonths(currentMonths + additionalMonths);
        client.setStatus(ClientStatus.ACTIVE);
        client.setUpdatedAt(LocalDateTime.now());

        return mapToResponse(clientRepository.save(client));
    }

    /**
     * Mandatory password change — enforced on first login.
     */
    @Transactional
    public void changePassword(Integer clientId, ChangePasswordRequest request) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", clientId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), client.getPasswordHash())) {
            throw new InvalidOperationException("Current password is incorrect");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new InvalidOperationException("New password and confirm password do not match");
        }

        client.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        client.setIsFirstLogin(false);
        client.setUpdatedAt(LocalDateTime.now());
        clientRepository.save(client);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private String generateUsername(String companyName) {
        String cleaned = companyName.toLowerCase().replaceAll("[^a-z0-9]", "");
        String base = cleaned.substring(0, Math.min(10, cleaned.length()));
        if (base.isEmpty())
            base = "client";

        String username = base;
        int counter = 1;
        while (clientRepository.existsByUsername(username)) {
            username = base + counter++;
        }
        return username;
    }

    private String generateClientCode() {
        int year = Year.now().getValue();
        String prefix = String.format("ACE-%d-", year);
        String maxCode = clientRepository.findMaxClientCodeByPrefix(prefix + "%");

        int nextId = 1;
        if (maxCode != null) {
            try {
                String suffix = maxCode.substring(prefix.length());
                nextId = Integer.parseInt(suffix) + 1;
            } catch (Exception e) {
                // Fallback to count if format is unexpected, though unlikely
                nextId = (int) (clientRepository.count() + 1);
            }
        }

        return String.format("%s%03d", prefix, nextId);
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private ClientResponse mapToResponse(Client client) {
        ClientResponse response = new ClientResponse();
        response.setClientId(client.getClientId());
        response.setClientCode(client.getClientCode());
        response.setCompanyName(client.getCompanyName());
        response.setCompanyRegistrationNo(client.getCompanyRegistrationNo());
        response.setVatNumber(client.getVatNumber());
        response.setIndustryType(client.getIndustryType());
        response.setAddress(client.getAddress());
        response.setServiceLocation(client.getServiceLocation());
        response.setCity(client.getCity());
        response.setContactPersonName(client.getContactPersonName());
        response.setContactPersonDesignation(client.getContactPersonDesignation());
        response.setContactPersonEmail(client.getContactPersonEmail());
        response.setContactPersonPhone(client.getContactPersonPhone());
        response.setUsername(client.getUsername());
        response.setServiceStartDate(client.getServiceStartDate());
        response.setContractDurationMonths(client.getContractDurationMonths());
        response.setContractEndDate(client.getContractEndDate());
        response.setEntryLevelCount(client.getEntryLevelCount());
        response.setMidLevelCount(client.getMidLevelCount());
        response.setSpecializedCount(client.getSpecializedCount());
        response.setSupervisorCount(client.getSupervisorCount());

        response.setEntryLevelRatePerShift(client.getEntryLevelRatePerShift());
        response.setMidLevelRatePerShift(client.getMidLevelRatePerShift());
        response.setSpecializedRatePerShift(client.getSpecializedRatePerShift());
        response.setSupervisorRatePerShift(client.getSupervisorRatePerShift());

        response.setOtRatePerHour(client.getOtRatePerHour());
        response.setEntryLevelOtRatePerHour(client.getEntryLevelOtRatePerHour());
        response.setMidLevelOtRatePerHour(client.getMidLevelOtRatePerHour());
        response.setSpecializedOtRatePerHour(client.getSpecializedOtRatePerHour());
        response.setSupervisorOtRatePerHour(client.getSupervisorOtRatePerHour());
        response.setRiskLevel(client.getRiskLevel() != null ? client.getRiskLevel().toString() : null);
        response.setRecommendedOfficers(client.getRecommendedOfficers());
        response.setStatus(client.getStatus().toString());
        response.setRegisteredAt(client.getRegisteredAt());
        response.setUpdatedAt(client.getUpdatedAt());

        long activeOfficers = assignedOfficerRepository.countActiveOfficersForClient(client.getClientId());
        response.setActiveOfficersCount((int) activeOfficers);

        // Outstanding is specific to this client's invoices
        List<Invoice> pendingInvoices = invoiceRepository.findPendingInvoicesByClient(client.getClientId());
        double outstanding = pendingInvoices.stream()
                .mapToDouble(i -> i.getBalanceAmount() != null ? i.getBalanceAmount().doubleValue() : 0.0)
                .sum();
        response.setTotalOutstanding(outstanding);

        // NOTE: temporaryPassword intentionally not set — sent via email only
        return response;
    }
}