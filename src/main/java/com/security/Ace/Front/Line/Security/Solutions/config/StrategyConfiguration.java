package com.security.Ace.Front.Line.Security.Solutions.config;

import com.security.Ace.Front.Line.Security.Solutions.service.strategy.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Strategy Configuration - Manages which strategy implementation to use
 * (Project vs Source) based on application properties.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class StrategyConfiguration {

    @Value("${app.strategy.salary:project}")
    private String salaryStrategy;

    @Value("${app.strategy.payment:project}")
    private String paymentStrategy;

    @Value("${app.strategy.billing:project}")
    private String billingStrategy;

    private final org.springframework.beans.factory.ObjectProvider<SalaryCalculationStrategy> salaryStrategies;
    private final org.springframework.beans.factory.ObjectProvider<PaymentProcessStrategy> paymentStrategies;
    private final org.springframework.beans.factory.ObjectProvider<BillingRulesStrategy> billingStrategies;

    /**
     * Bean for salary calculation strategy selection
     */
    @Bean
    public SalaryCalculationStrategy activeSalaryStrategy(
            @Qualifier("projectSalaryStrategy") SalaryCalculationStrategy projectStrategy,
            @Qualifier("sourceSalaryStrategy") SalaryCalculationStrategy sourceStrategy) {
        
        SalaryCalculationStrategy strategy = "source".equalsIgnoreCase(salaryStrategy) ? sourceStrategy : projectStrategy;
        log.info("Activating Salary Strategy: {}", strategy.getStrategyName());
        return strategy;
    }

    /**
     * Bean for payment processing strategy selection
     */
    @Bean
    public PaymentProcessStrategy activePaymentStrategy(
            @Qualifier("projectPaymentStrategy") PaymentProcessStrategy projectStrategy,
            @Qualifier("sourcePaymentStrategy") PaymentProcessStrategy sourceStrategy) {
        
        PaymentProcessStrategy strategy = "source".equalsIgnoreCase(paymentStrategy) ? sourceStrategy : projectStrategy;
        log.info("Activating Payment Strategy: {}", strategy.getStrategyName());
        return strategy;
    }

    /**
     * Bean for billing rules strategy selection
     */
    @Bean
    public BillingRulesStrategy activeBillingStrategy(
            @Qualifier("projectBillingStrategy") BillingRulesStrategy projectStrategy,
            @Qualifier("sourceBillingStrategy") BillingRulesStrategy sourceStrategy) {
        
        BillingRulesStrategy strategy = "source".equalsIgnoreCase(billingStrategy) ? sourceStrategy : projectStrategy;
        log.info("Activating Billing Strategy: {}", strategy.getStrategyName());
        return strategy;
    }
}
