package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.entity.User;
import com.security.Ace.Front.Line.Security.Solutions.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CustomUserDetailsService – Unit Tests")
class CustomUserDetailsServiceTest extends BaseServiceTest {

    @Mock private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("loadUserByUsername returns correct UserDetails for existing username")
    void loadUserByUsername_existingUser_returnsUserDetails() {
        User officer = aSecurityOfficer();
        when(userRepository.findByUsername("officer_01")).thenReturn(Optional.of(officer));

        UserDetails details = customUserDetailsService.loadUserByUsername("officer_01");

        assertThat(details).isNotNull();
        assertThat(details.getUsername()).isEqualTo("officer_01");
        assertThat(details.getPassword()).isEqualTo(officer.getPassword());
        assertThat(details.getAuthorities()).isNotEmpty();
        verify(userRepository).findByUsername("officer_01");
    }

    @Test
    @DisplayName("loadUserByUsername throws UsernameNotFoundException for unknown username")
    void loadUserByUsername_unknownUser_throwsUsernameNotFoundException() {
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("ghost"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("ghost");
    }

    @Test
    @DisplayName("loadUserByUsername returns correct granted authority for AREA_MANAGER role")
    void loadUserByUsername_areaManager_returnsCorrectAuthority() {
        User manager = anAreaManager();
        when(userRepository.findByUsername("area_mgr_01")).thenReturn(Optional.of(manager));

        UserDetails details = customUserDetailsService.loadUserByUsername("area_mgr_01");

        assertThat(details.getAuthorities())
                .anyMatch(a -> a.getAuthority().equals("ROLE_AREA_MANAGER"));
    }
}