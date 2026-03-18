package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyDto {
    private Long recordId;
    private LocalDateTime recordTime;
    private BigDecimal electricityKwh;
    private BigDecimal zScore;
    private BigDecimal changeRate;
}
