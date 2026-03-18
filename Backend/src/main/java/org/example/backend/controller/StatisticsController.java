package org.example.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.backend.common.ApiResponse;
import org.example.backend.dto.AnomalyDto;
import org.example.backend.dto.CopDto;
import org.example.backend.dto.TimeSummaryDto;
import org.example.backend.service.StatisticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Tag(name = "Statistics", description = "统计分析")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/time-summary")
    @Operation(summary = "时段汇总")
    public ApiResponse<List<TimeSummaryDto>> getTimeSummary(
            @RequestParam Long buildingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam String granularity
    ) {
        return ApiResponse.success(statisticsService.getTimeSummary(buildingId, start, end, granularity));
    }

    @GetMapping("/cop")
    @Operation(summary = "COP统计")
    public ApiResponse<List<CopDto>> getCopStatistics(
            @RequestParam Long buildingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam String granularity
    ) {
        return ApiResponse.success(statisticsService.getCopStatistics(buildingId, start, end, granularity));
    }

    @GetMapping("/anomaly")
    @Operation(summary = "异常分析")
    public ApiResponse<List<AnomalyDto>> getAnomalyAnalysis(
            @RequestParam Long buildingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        return ApiResponse.success(statisticsService.getAnomalyAnalysis(buildingId, start, end));
    }
}
