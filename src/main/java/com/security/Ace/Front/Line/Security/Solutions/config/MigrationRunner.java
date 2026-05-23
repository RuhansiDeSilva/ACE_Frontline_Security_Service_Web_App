package com.security.Ace.Front.Line.Security.Solutions.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class MigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public MigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        int updatedAccounts = jdbcTemplate.update("UPDATE users SET role='ACCOUNT_EXECUTIVE' WHERE role='ACCOUNTANT'");
        int updatedExecs = jdbcTemplate.update("UPDATE users SET role='EXECUTIVE_OFFICER' WHERE role='EXECUTIVE'");
        int updatedOps = jdbcTemplate
                .update("UPDATE users SET role='OPERATION_MANAGER' WHERE role='OPERATIONAL_MANAGER'");
        System.out.println("Roles migrated! Accountants: " + updatedAccounts + ", Execs: " + updatedExecs + ", Ops: "
                + updatedOps);
    }
}
