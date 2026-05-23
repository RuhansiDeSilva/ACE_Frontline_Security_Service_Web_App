package com.security.Ace.Front.Line.Security.Solutions;

import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableScheduling
public class AceFrontLineSecuritySolutionsApplication {

	public static void main(String[] args) {
		SpringApplication.run(AceFrontLineSecuritySolutionsApplication.class, args);
	}

	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

}

