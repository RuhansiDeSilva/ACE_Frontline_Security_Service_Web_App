package com.security.Ace.Front.Line.Security.Solutions.service;

import com.security.Ace.Front.Line.Security.Solutions.dto.PredictionRequestDTO;
import com.security.Ace.Front.Line.Security.Solutions.dto.PredictionResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class MLPredictionService {

    private final RestTemplate restTemplate;
    
    @Value("${ml.service.url}")
    private String mlServiceBaseUrl;

    @Autowired
    public MLPredictionService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public PredictionResponseDTO predictRisk(PredictionRequestDTO request) {
        String url = mlServiceBaseUrl + "/predict";
        return restTemplate.postForObject(url, request, PredictionResponseDTO.class);
    }
}
