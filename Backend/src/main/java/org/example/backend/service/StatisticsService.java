package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.AnomalyDto;
import org.example.backend.dto.CopDto;
import org.example.backend.dto.TimeSummaryDto;
import org.example.backend.entity.EnergyRecord;
import org.example.backend.repository.EnergyRecordRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final EnergyRecordRepository recordRepository;

    public List<TimeSummaryDto> getTimeSummary(Long buildingId, LocalDateTime start, LocalDateTime end, String granularity) {
        List<EnergyRecord> records = recordRepository.findByBuildingIdAndRecordTimeBetween(buildingId, start, end);

        List<TimeSummaryDto> result = new ArrayList<>();
        DateTimeFormatter formatter = getFormatter(granularity);

        records.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        r -> formatTime(r.getRecordTime(), granularity, formatter)
                ))
                .forEach((timeBucket, groupRecords) -> {
                    BigDecimal totalElectricity = groupRecords.stream()
                            .map(EnergyRecord::getElectricityKwh)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalWater = groupRecords.stream()
                            .map(EnergyRecord::getWaterM3)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal totalHvac = groupRecords.stream()
                            .map(EnergyRecord::getHvacKwh)
                            .filter(java.util.Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    result.add(new TimeSummaryDto(timeBucket, totalElectricity, totalWater, totalHvac));
                });

        result.sort((a, b) -> a.getTimeBucket().compareTo(b.getTimeBucket()));
        return result;
    }

    public List<CopDto> getCopStatistics(Long buildingId, LocalDateTime start, LocalDateTime end, String granularity) {
        List<EnergyRecord> records = recordRepository.findByBuildingIdAndRecordTimeBetween(buildingId, start, end);

        List<CopDto> result = new ArrayList<>();
        DateTimeFormatter formatter = getFormatter(granularity);

        records.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        r -> formatTime(r.getRecordTime(), granularity, formatter)
                ))
                .forEach((timeBucket, groupRecords) -> {
                    BigDecimal avgCop = calculateAverageCop(groupRecords);
                    if (avgCop != null) {
                        result.add(new CopDto(timeBucket, avgCop));
                    }
                });

        result.sort((a, b) -> a.getTimeBucket().compareTo(b.getTimeBucket()));
        return result;
    }

    public List<AnomalyDto> getAnomalyAnalysis(Long buildingId, LocalDateTime start, LocalDateTime end) {
        List<EnergyRecord> records = recordRepository.findByBuildingIdAndRecordTimeBetween(buildingId, start, end);

        if (records.size() < 3) {
            return new ArrayList<>();
        }

        // Calculate mean and standard deviation
        double mean = records.stream()
                .map(EnergyRecord::getElectricityKwh)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(BigDecimal::doubleValue)
                .average()
                .orElse(0.0);

        double variance = records.stream()
                .map(EnergyRecord::getElectricityKwh)
                .filter(java.util.Objects::nonNull)
                .mapToDouble(v -> Math.pow(v.doubleValue() - mean, 2))
                .average()
                .orElse(0.0);

        double stdDev = Math.sqrt(variance);

        List<AnomalyDto> anomalies = new ArrayList<>();

        for (int i = 0; i < records.size(); i++) {
            EnergyRecord record = records.get(i);
            if (record.getElectricityKwh() == null) continue;

            double value = record.getElectricityKwh().doubleValue();
            double zScore = stdDev > 0 ? (value - mean) / stdDev : 0;

            // Z-Score anomaly detection (|z| > 3)
            if (Math.abs(zScore) > 3) {
                BigDecimal changeRate = BigDecimal.ZERO;

                // Calculate change rate if previous record exists
                if (i > 0 && records.get(i - 1).getElectricityKwh() != null) {
                    BigDecimal prevValue = records.get(i - 1).getElectricityKwh();
                    if (prevValue.compareTo(BigDecimal.ZERO) > 0) {
                        changeRate = record.getElectricityKwh()
                                .subtract(prevValue)
                                .divide(prevValue, 4, RoundingMode.HALF_UP);
                    }
                }

                anomalies.add(new AnomalyDto(
                        record.getId(),
                        record.getRecordTime(),
                        record.getElectricityKwh(),
                        BigDecimal.valueOf(zScore).setScale(2, RoundingMode.HALF_UP),
                        changeRate
                ));
            }
        }

        return anomalies;
    }

    private BigDecimal calculateAverageCop(List<EnergyRecord> records) {
        List<BigDecimal> cops = new ArrayList<>();

        for (EnergyRecord record : records) {
            if (record.getHvacKwh() != null && record.getHvacKwh().compareTo(BigDecimal.ZERO) > 0
                    && record.getHvacSupplyTemp() != null && record.getHvacReturnTemp() != null) {

                // COP = (回水温度 - 出水温度) * 系数 / 空调能耗
                // 简化计算: COP ≈ 温差 / 能耗 * 调整系数
                BigDecimal tempDiff = record.getHvacReturnTemp().subtract(record.getHvacSupplyTemp());
                if (tempDiff.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal cop = tempDiff.divide(record.getHvacKwh(), 4, RoundingMode.HALF_UP);
                    cops.add(cop);
                }
            }
        }

        if (cops.isEmpty()) {
            return null;
        }

        BigDecimal sum = cops.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(cops.size()), 4, RoundingMode.HALF_UP);
    }

    private DateTimeFormatter getFormatter(String granularity) {
        return switch (granularity.toLowerCase()) {
            case "hour" -> DateTimeFormatter.ofPattern("yyyy-MM-dd HH:00");
            case "day" -> DateTimeFormatter.ofPattern("yyyy-MM-dd");
            case "month" -> DateTimeFormatter.ofPattern("yyyy-MM");
            default -> DateTimeFormatter.ofPattern("yyyy-MM-dd");
        };
    }

    private String formatTime(LocalDateTime time, String granularity, DateTimeFormatter formatter) {
        return time.format(formatter);
    }
}
