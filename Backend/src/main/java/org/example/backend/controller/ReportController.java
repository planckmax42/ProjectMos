package org.example.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.common.ApiResponse;
import org.example.backend.dto.ReportScheduleDto;
import org.example.backend.dto.ReportScheduleRequest;
import org.example.backend.dto.ScheduleRunDto;
import org.example.backend.dto.ScheduleRunHistoryDto;
import org.example.backend.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
@Tag(name = "Report", description = "报表导出")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/export")
    @Operation(summary = "导出统计报表")
    public void exportReport(
            @RequestParam Long buildingId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam String granularity,
            HttpServletResponse response
    ) throws IOException {
        response.setContentType("text/csv");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=energy-report.csv");

        PrintWriter writer = response.getWriter();
        reportService.exportTimeSummaryToCsv(buildingId, start, end, granularity, writer);
    }

    @GetMapping("/schedules")
    @Operation(summary = "获取定时报表任务列表")
    public ApiResponse<List<ReportScheduleDto>> listSchedules() {
        return ApiResponse.success(reportService.listSchedules());
    }

    @PostMapping("/schedules")
    @Operation(summary = "创建定时报表任务")
    public ApiResponse<ReportScheduleDto> createSchedule(@Valid @RequestBody ReportScheduleRequest request) {
        return ApiResponse.success(reportService.createSchedule(request));
    }

    @PutMapping("/schedules/{id}")
    @Operation(summary = "更新定时报表任务")
    public ApiResponse<ReportScheduleDto> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody ReportScheduleRequest request
    ) {
        return ApiResponse.success(reportService.updateSchedule(id, request));
    }

    @PatchMapping("/schedules/{id}/enabled")
    @Operation(summary = "启用或停用定时报表任务")
    public ApiResponse<ReportScheduleDto> updateScheduleEnabled(
            @PathVariable Long id,
            @RequestParam Boolean enabled
    ) {
        return ApiResponse.success(reportService.updateScheduleEnabled(id, enabled));
    }

    @DeleteMapping("/schedules/{id}")
    @Operation(summary = "删除定时报表任务")
    public ApiResponse<String> deleteSchedule(@PathVariable Long id) {
        reportService.deleteSchedule(id);
        return ApiResponse.success("删除成功");
    }

    @PostMapping("/schedules/{id}/run")
    @Operation(summary = "立即执行定时报表任务")
    public ApiResponse<ScheduleRunDto> runScheduleNow(@PathVariable Long id) {
        return ApiResponse.success(reportService.runScheduleNow(id));
    }

    @GetMapping("/schedules/{id}/runs")
    @Operation(summary = "查询定时报表执行历史")
    public ApiResponse<Page<ScheduleRunHistoryDto>> listScheduleRuns(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(reportService.listScheduleRuns(id, page, size));
    }
}
