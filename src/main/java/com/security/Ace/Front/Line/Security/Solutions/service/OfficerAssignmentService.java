package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.*;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.OfficerRank;
import com.security.Ace.Front.Line.Security.Solutions.entity.enums.ShiftType;
import com.security.Ace.Front.Line.Security.Solutions.exception.ResourceNotFoundException;
import com.security.Ace.Front.Line.Security.Solutions.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfficerAssignmentService {

    private final AssignedOfficerRepository assignedOfficerRepository;
    private final ClientRepository clientRepository;

    @Transactional
    public OfficerAssignmentResponse assignOfficer(OfficerAssignmentRequest request) {
        Client client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", request.getClientId()));

        AssignedOfficer assignment = new AssignedOfficer();
        assignment.setClient(client);
        assignment.setOfficerId(request.getOfficerId());
        assignment.setOfficerName(request.getOfficerName());
        if (request.getOfficerRank() != null && !request.getOfficerRank().isBlank()) {
            assignment.setOfficerRank(OfficerRank.valueOf(request.getOfficerRank().trim().toUpperCase()));
        }
        assignment.setShiftType(ShiftType.valueOf(request.getShiftType()));
        assignment.setAssignedFrom(request.getAssignedFrom());
        assignment.setAssignedTo(request.getAssignedTo());
        assignment.setIsActive(true);
        assignment.setLocation(request.getLocation());
        assignment.setDuties(request.getDuties());
        assignment.setAssignedAt(LocalDateTime.now());

        AssignedOfficer savedAssignment = assignedOfficerRepository.save(assignment);

        return mapToResponse(savedAssignment);
    }

    @Transactional
    public OfficerAssignmentResponse updateAssignment(Integer assignmentId, OfficerAssignmentRequest request) {
        AssignedOfficer assignment = assignedOfficerRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", assignmentId));

        if (request.getShiftType() != null) {
            assignment.setShiftType(ShiftType.valueOf(request.getShiftType()));
        }
        if (request.getOfficerRank() != null && !request.getOfficerRank().isBlank()) {
            assignment.setOfficerRank(OfficerRank.valueOf(request.getOfficerRank().trim().toUpperCase()));
        }
        if (request.getAssignedFrom() != null) {
            assignment.setAssignedFrom(request.getAssignedFrom());
        }
        if (request.getAssignedTo() != null) {
            assignment.setAssignedTo(request.getAssignedTo());
        }
        if (request.getLocation() != null) {
            assignment.setLocation(request.getLocation());
        }
        if (request.getDuties() != null) {
            assignment.setDuties(request.getDuties());
        }

        AssignedOfficer updatedAssignment = assignedOfficerRepository.save(assignment);

        return mapToResponse(updatedAssignment);
    }

    @Transactional
    public void deactivateAssignment(Integer assignmentId) {
        AssignedOfficer assignment = assignedOfficerRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", assignmentId));

        assignment.setIsActive(false);
        assignedOfficerRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public List<OfficerAssignmentResponse> getActiveAssignmentsByClient(Integer clientId) {
        return assignedOfficerRepository.findByClientClientIdAndIsActiveTrue(clientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfficerAssignmentResponse> getAllAssignmentsByClient(Integer clientId) {
        return assignedOfficerRepository.findByClientClientIdOrderByAssignedFromDesc(clientId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfficerAssignmentResponse> getAssignmentsByOfficer(Integer officerId) {
        return assignedOfficerRepository.findByOfficerIdOrderByAssignedFromDesc(officerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfficerAssignmentResponse> getAssignmentsEndingSoon() {
        return assignedOfficerRepository.findAssignmentsEndingSoon().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean isOfficerCurrentlyAssigned(Integer officerId) {
        return assignedOfficerRepository.isOfficerCurrentlyAssigned(officerId);
    }

    @Transactional(readOnly = true)
    public OfficerAssignmentResponse getAssignmentById(Integer assignmentId) {
        AssignedOfficer assignment = assignedOfficerRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", assignmentId));
        return mapToResponse(assignment);
    }

    private OfficerAssignmentResponse mapToResponse(AssignedOfficer assignment) {
        OfficerAssignmentResponse response = new OfficerAssignmentResponse();
        response.setAssignmentId(assignment.getAssignmentId());
        response.setClientId(assignment.getClient().getClientId());
        response.setCompanyName(assignment.getClient().getCompanyName());
        response.setOfficerId(assignment.getOfficerId());
        response.setOfficerName(assignment.getOfficerName());
        response.setOfficerRank(assignment.getOfficerRank() != null ? assignment.getOfficerRank().toString() : null);
        response.setShiftType(assignment.getShiftType().toString());
        response.setAssignedFrom(assignment.getAssignedFrom());
        response.setAssignedTo(assignment.getAssignedTo());
        response.setActive(assignment.getIsActive());
        response.setLocation(assignment.getLocation());
        response.setDuties(assignment.getDuties());
        return response;
    }
}