package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimeSummaryDto {
    private String timeBucket;
    private BigDecimal electricityKwh;
    private BigDecimal waterM3;
    private BigDecimal hvacKwh;
}
