package com.security.Ace.Front.Line.Security.Solutions.controller;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    // ── Registration ─────────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<ClientResponse>> registerClient(
            @Valid @RequestBody ClientRegistrationRequest request) {
        ClientResponse response = clientService.registerClient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Client registered successfully", response));
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getAllClients() {
        List<ClientResponse> clients = clientService.getAllClients();
        return ResponseEntity.ok(ApiResponse.success("Clients retrieved successfully", clients));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getActiveClients() {
        List<ClientResponse> clients = clientService.getActiveClients();
        return ResponseEntity.ok(ApiResponse.success("Active clients retrieved successfully", clients));
    }

    /** Returns clients whose contracts expire within 30 or 60 days — Phase 17 renewal panel */
    @GetMapping("/expiring-soon")
    public ResponseEntity<ApiResponse<List<ClientResponse>>> getClientsExpiringSoon(
            @RequestParam(defaultValue = "60") int withinDays) {
        List<ClientResponse> clients = clientService.getClientsExpiringSoon(withinDays);
        return ResponseEntity.ok(ApiResponse.success(
                "Clients expiring within " + withinDays + " days retrieved", clients));
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<ApiResponse<ClientResponse>> getClientById(
            @PathVariable Integer clientId) {
        ClientResponse client = clientService.getClientById(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client retrieved successfully", client));
    }

    // ── Updates ──────────────────────────────────────────────────────────────

    @PutMapping("/{clientId}")
    public ResponseEntity<ApiResponse<ClientResponse>> updateClient(
            @PathVariable Integer clientId,
            @Valid @RequestBody ClientUpdateRequest request) {
        ClientResponse response = clientService.updateClient(clientId, request);
        return ResponseEntity.ok(ApiResponse.success("Client updated successfully", response));
    }

    // ── Status Management ────────────────────────────────────────────────────

    @PutMapping("/{clientId}/suspend")
    public ResponseEntity<ApiResponse<String>> suspendClient(@PathVariable Integer clientId) {
        clientService.suspendClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client suspended successfully", null));
    }

    @PutMapping("/{clientId}/terminate")
    public ResponseEntity<ApiResponse<String>> terminateClient(@PathVariable Integer clientId) {
        clientService.terminateClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client terminated successfully", null));
    }

    @PutMapping("/{clientId}/reactivate")
    public ResponseEntity<ApiResponse<String>> reactivateClient(@PathVariable Integer clientId) {
        clientService.reactivateClient(clientId);
        return ResponseEntity.ok(ApiResponse.success("Client reactivated successfully", null));
    }

    /**
     * Mark contract as RENEWED with new end date — Phase 17.
     * Admin manually confirms after offline signing.
     */
    @PutMapping("/{clientId}/renew")
    public ResponseEntity<ApiResponse<ClientResponse>> renewContract(
            @PathVariable Integer clientId,
            @RequestParam int additionalMonths) {
        ClientResponse response = clientService.renewContract(clientId, additionalMonths);
        return ResponseEntity.ok(ApiResponse.success("Contract renewed successfully", response));
    }

    /**
     * Mandatory password change — enforced on client's first login.
     */
    @PutMapping("/{clientId}/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
            @PathVariable Integer clientId,
            @Valid @RequestBody ChangePasswordRequest request) {
        clientService.changePassword(clientId, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}