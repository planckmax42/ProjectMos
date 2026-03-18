package org.example.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class EnergyRecordRequest {
    private Long buildingId;
    private Long deviceId;
    private LocalDateTime recordTime;
    private BigDecimal electricityKwh;
    private BigDecimal waterM3;
    private BigDecimal hvacKwh;
    private BigDecimal hvacSupplyTemp;
    private BigDecimal hvacReturnTemp;
    private BigDecimal envTemperature;
    private BigDecimal humidity;
    private BigDecimal occupancyDensity;
    private String deviceStatus;
}
