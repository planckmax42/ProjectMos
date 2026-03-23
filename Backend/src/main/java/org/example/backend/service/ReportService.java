package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ReportScheduleDto;
import org.example.backend.dto.ReportScheduleRequest;
import org.example.backend.dto.ScheduleRunDto;
import org.example.backend.dto.ScheduleRunHistoryDto;
import org.example.backend.dto.TimeSummaryDto;
import org.example.backend.entity.Building;
import org.example.backend.entity.ReportSchedule;
import org.example.backend.entity.ReportScheduleRunHistory;
import org.example.backend.repository.BuildingRepository;
import org.example.backend.repository.ReportScheduleRepository;
import org.example.backend.repository.ReportScheduleRunHistoryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.Writer;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final StatisticsService statisticsService;
    private final BuildingRepository buildingRepository;
    private final ReportScheduleRepository reportScheduleRepository;
    private final ReportScheduleRunHistoryRepository reportScheduleRunHistoryRepository;

    public void exportTimeSummaryToCsv(
            Long buildingId,
            LocalDateTime start,
            LocalDateTime end,
            String granularity,
            Writer writer
    ) throws IOException {
        List<TimeSummaryDto> data = statisticsService.getTimeSummary(buildingId, start, end, granularity);

        // Write CSV header
        writer.write("timeBucket,electricityKwh,waterM3,hvacKwh\n");

        // Write data rows
        for (TimeSummaryDto row : data) {
            writer.write(String.format("%s,%s,%s,%s\n",
                    row.getTimeBucket(),
                    row.getElectricityKwh(),
                    row.getWaterM3(),
                    row.getHvacKwh()
            ));
        }

        writer.flush();
    }

    public List<ReportScheduleDto> listSchedules() {
        return reportScheduleRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public ReportScheduleDto createSchedule(ReportScheduleRequest request) {
        ReportSchedule schedule = new ReportSchedule();
        applyRequest(schedule, request);
        return toDto(reportScheduleRepository.save(schedule));
    }

    @Transactional
    public ReportScheduleDto updateSchedule(Long id, ReportScheduleRequest request) {
        ReportSchedule schedule = reportScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("定时报表任务不存在: " + id));
        applyRequest(schedule, request);
        return toDto(reportScheduleRepository.save(schedule));
    }

    @Transactional
    public void deleteSchedule(Long id) {
        if (!reportScheduleRepository.existsById(id)) {
            throw new IllegalArgumentException("定时报表任务不存在: " + id);
        }
        reportScheduleRepository.deleteById(id);
    }

    @Transactional
    public ReportScheduleDto updateScheduleEnabled(Long id, boolean enabled) {
        ReportSchedule schedule = reportScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("定时报表任务不存在: " + id));
        schedule.setEnabled(enabled);
        return toDto(reportScheduleRepository.save(schedule));
    }

    @Transactional
    public ScheduleRunDto runScheduleNow(Long id) {
        return runScheduleNow(id, "MANUAL");
    }

    @Transactional
    public ScheduleRunDto runScheduleNow(Long id, String triggerSource) {
        ReportSchedule schedule = reportScheduleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("定时报表任务不存在: " + id));

        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = calculatePeriodStart(schedule.getFrequency(), end);

        try {
            schedule.setLastRunAt(end);
            reportScheduleRepository.save(schedule);

            ScheduleRunDto result = new ScheduleRunDto(
                    schedule.getId(),
                    schedule.getBuildingId(),
                    schedule.getGranularity(),
                    start,
                    end,
                    end
            );

            recordRunHistory(schedule.getId(), "SUCCESS", normalizeTriggerSource(triggerSource), start, end, end, null);
            return result;
        } catch (Exception ex) {
            recordRunHistory(schedule.getId(), "FAILED", normalizeTriggerSource(triggerSource), start, end, end, ex.getMessage());
            throw ex;
        }
    }

    public LocalDateTime calculatePeriodStart(String frequency, LocalDateTime end) {
        String normalized = normalizeFrequency(frequency);
        return switch (normalized) {
            case "DAILY" -> end.minusDays(1);
            case "WEEKLY" -> end.minusDays(7);
            case "MONTHLY" -> end.minusMonths(1);
            default -> throw new IllegalArgumentException("不支持的执行频率: " + normalized);
        };
    }

    public Page<ScheduleRunHistoryDto> listScheduleRuns(Long scheduleId, int page, int size) {
        if (!reportScheduleRepository.existsById(scheduleId)) {
            throw new IllegalArgumentException("定时报表任务不存在: " + scheduleId);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "triggeredAt"));
        return reportScheduleRunHistoryRepository.findByScheduleIdOrderByTriggeredAtDesc(scheduleId, pageable)
                .map(this::toHistoryDto);
    }

    private void applyRequest(ReportSchedule schedule, ReportScheduleRequest request) {
        Building building = buildingRepository.findById(request.getBuildingId())
                .orElseThrow(() -> new IllegalArgumentException("建筑不存在: " + request.getBuildingId()));

        String frequency = normalizeFrequency(request.getFrequency());
        String granularity = normalizeGranularity(request.getGranularity());

        if (!isValidRunTime(request.getRunTime())) {
            throw new IllegalArgumentException("执行时间格式无效，应为 HH:mm");
        }

        schedule.setName(request.getName().trim());
        schedule.setBuildingId(building.getId());
        schedule.setFrequency(frequency);
        schedule.setGranularity(granularity);
        schedule.setRunTime(request.getRunTime());
        schedule.setReceivers(request.getReceivers());
        schedule.setEnabled(request.getEnabled() == null ? Boolean.TRUE : request.getEnabled());
    }

    private String normalizeFrequency(String frequency) {
        String normalized = frequency == null ? "" : frequency.trim().toUpperCase();
        if (!List.of("DAILY", "WEEKLY", "MONTHLY").contains(normalized)) {
            throw new IllegalArgumentException("执行频率仅支持 DAILY/WEEKLY/MONTHLY");
        }
        return normalized;
    }

    private String normalizeGranularity(String granularity) {
        String normalized = granularity == null ? "" : granularity.trim().toLowerCase();
        if (!List.of("hour", "day", "month").contains(normalized)) {
            throw new IllegalArgumentException("统计粒度仅支持 hour/day/month");
        }
        return normalized;
    }

    private boolean isValidRunTime(String runTime) {
        try {
            if (runTime == null || runTime.length() != 5) {
                return false;
            }
            java.time.LocalTime.parse(runTime);
            return true;
        } catch (DateTimeParseException ex) {
            return false;
        }
    }

    private void recordRunHistory(
            Long scheduleId,
            String status,
            String triggerSource,
            LocalDateTime windowStart,
            LocalDateTime windowEnd,
            LocalDateTime triggeredAt,
            String errorMessage
    ) {
        ReportScheduleRunHistory history = new ReportScheduleRunHistory();
        history.setScheduleId(scheduleId);
        history.setStatus(status);
        history.setTriggerSource(triggerSource);
        history.setWindowStart(windowStart);
        history.setWindowEnd(windowEnd);
        history.setTriggeredAt(triggeredAt);
        history.setFinishedAt(LocalDateTime.now());
        history.setErrorMessage(truncateError(errorMessage));
        reportScheduleRunHistoryRepository.save(history);
    }

    private String normalizeTriggerSource(String triggerSource) {
        if (triggerSource == null || triggerSource.isBlank()) {
            return "MANUAL";
        }
        String normalized = triggerSource.trim().toUpperCase();
        return switch (normalized) {
            case "MANUAL", "AUTO" -> normalized;
            default -> "MANUAL";
        };
    }

    private String truncateError(String errorMessage) {
        if (errorMessage == null) {
            return null;
        }
        return errorMessage.length() <= 1000 ? errorMessage : errorMessage.substring(0, 1000);
    }

    private ReportScheduleDto toDto(ReportSchedule schedule) {
        Building building = buildingRepository.findById(schedule.getBuildingId()).orElse(null);

        return new ReportScheduleDto(
                schedule.getId(),
                schedule.getName(),
                schedule.getBuildingId(),
                building != null ? building.getBuildingName() : null,
                schedule.getFrequency(),
                schedule.getGranularity(),
                schedule.getRunTime(),
                schedule.getReceivers(),
                schedule.getEnabled(),
                schedule.getLastRunAt(),
                schedule.getCreatedAt()
        );
    }

    private ScheduleRunHistoryDto toHistoryDto(ReportScheduleRunHistory history) {
        return new ScheduleRunHistoryDto(
                history.getId(),
                history.getScheduleId(),
                history.getStatus(),
                history.getTriggerSource(),
                history.getWindowStart(),
                history.getWindowEnd(),
                history.getTriggeredAt(),
                history.getFinishedAt(),
                history.getErrorMessage()
        );
    }
}
