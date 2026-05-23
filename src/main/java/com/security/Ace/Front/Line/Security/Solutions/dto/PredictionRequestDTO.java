package com.security.Ace.Front.Line.Security.Solutions.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequestDTO {
    @JsonProperty("company_name")
    private String companyName;

    @JsonProperty("employee_count")
    private int employeeCount;

    @JsonProperty("required_officers")
    private int requiredOfficers;

    @JsonProperty("distance_to_city_km")
    private double distanceToCityKm;

    @JsonProperty("company_assets")
    private double companyAssets;

    @JsonProperty("cctv_count")
    private int cctvCount;

    @JsonProperty("company_type")
    private String companyType;

    @JsonProperty("urban_rural")
    private String urbanRural;

    @JsonProperty("night_activity")
    private boolean nightActivity;

    @JsonProperty("nearest_city")
    private String nearestCity;

    @JsonProperty("major_event_nearby")
    private boolean majorEventNearby;

    @JsonProperty("cash_handling")
    private boolean cashHandling;
}
