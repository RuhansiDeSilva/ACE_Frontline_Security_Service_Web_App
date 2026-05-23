package com.security.Ace.Front.Line.Security.Solutions.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import com.security.Ace.Front.Line.Security.Solutions.util.JwtAuthFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/shift-schedules/**",
                                "/api/users/**",
                                "/api/attendance/**",
                                "/api/weekly-reports/**",
                                "/api/monthly-reports/**",
                                "/api/monthly-statistics/**",
                                "/api/security-officers/**",
                                "/api/officers/**",
                                "/api/leaves/**",
                                "/api/notifications/**",
                                "/api/admin-leaves/**",
                                "/api/vacancies/**",
                                "/api/applications/**",
                                "/api/inquiries/**",
                                "/api/interviews/**",
                                "/api/announcements/**",
                                "/api/cv-submissions/**",
                                "/api/public/**",
                                "/api/clients/**",
                                "/api/feedback/**",
                                "/api/invoices/**",
                                "/api/payments/**",
                                "/api/deductions/**",
                                "/api/officer-assignments/**",
                                "/api/dashboard/**",
                                "/api/pdf/**",
                                "/api/payroll/**",
                                "/api/salary-advances/**",
                                "/api/v1/automation/**",
                                "/api/ml/**")

                        .permitAll()
                        .anyRequest().authenticated())
                .cors(cors -> cors.configurationSource(request -> {
                    CorsConfiguration configuration = new CorsConfiguration();
                    configuration.setAllowedOriginPatterns(List.of("*"));
                    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    configuration.setAllowedHeaders(List.of("*"));
                    configuration.setAllowCredentials(true);
                    return configuration;
                }))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
