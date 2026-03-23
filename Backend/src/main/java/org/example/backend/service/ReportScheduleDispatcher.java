package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ScheduleRunDto;
import org.example.backend.entity.ReportSchedule;
import org.example.backend.repository.ReportScheduleRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "bems.report-schedule", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ReportScheduleDispatcher {

    private final ReportScheduleRepository reportScheduleRepository;
    private final ReportService reportService;

    @Scheduled(cron = "${bems.report-schedule.cron:0 * * * * *}")
    @Transactional
    public void dispatchDueSchedules() {
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        String currentRunTime = now.toLocalTime().toString();

        List<ReportSchedule> dueCandidates = reportScheduleRepository.findByEnabledTrueAndRunTime(currentRunTime);
        for (ReportSchedule schedule : dueCandidates) {
            tryDispatchOne(schedule, now);
        }
    }

    void tryDispatchOne(ReportSchedule schedule, LocalDateTime triggerAt) {
        if (schedule == null || schedule.getId() == null) {
            return;
        }

        if (!isValidRunTime(schedule.getRunTime())) {
            log.warn("跳过任务 {}，执行时间格式无效: {}", schedule.getId(), schedule.getRunTime());
            return;
        }

        LocalDateTime periodStart;
        try {
            periodStart = reportService.calculatePeriodStart(schedule.getFrequency(), triggerAt);
        } catch (IllegalArgumentException ex) {
            log.warn("跳过任务 {}，执行频率无效: {}", schedule.getId(), schedule.getFrequency());
            return;
        }

        int updated = reportScheduleRepository.markRunIfDue(schedule.getId(), periodStart, triggerAt);
        if (updated > 0) {
            ScheduleRunDto runResult = reportService.runScheduleNow(schedule.getId(), "AUTO");
            log.info("自动触发定时报表任务 id={}, frequency={}, runTime={}, start={}, end={}",
                    schedule.getId(), schedule.getFrequency(), schedule.getRunTime(),
                    runResult.getStart(), runResult.getEnd());
        }
    }

    private boolean isValidRunTime(String runTime) {
        if (runTime == null || runTime.length() != 5) {
            return false;
        }
        try {
            LocalTime.parse(runTime);
            return true;
        } catch (DateTimeParseException ex) {
            return false;
        }
    }
}

