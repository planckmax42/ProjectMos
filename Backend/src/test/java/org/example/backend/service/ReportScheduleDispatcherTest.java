package org.example.backend.service;

import org.example.backend.entity.ReportSchedule;
import org.example.backend.repository.ReportScheduleRepository;
import org.example.backend.dto.ScheduleRunDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportScheduleDispatcherTest {

	@Mock
	private ReportScheduleRepository reportScheduleRepository;

	@Mock
	private ReportService reportService;

	private ReportScheduleDispatcher dispatcher;

	@BeforeEach
	void setUp() {
		dispatcher = new ReportScheduleDispatcher(reportScheduleRepository, reportService);
	}

	@Test
	void shouldMarkRunWhenScheduleDue() {
		ReportSchedule schedule = buildSchedule(1L, "DAILY", "09:00");
		LocalDateTime triggerAt = LocalDateTime.of(2026, 3, 23, 9, 0);
		LocalDateTime periodStart = triggerAt.minusDays(1);

		when(reportService.calculatePeriodStart("DAILY", triggerAt)).thenReturn(periodStart);
		when(reportScheduleRepository.markRunIfDue(1L, periodStart, triggerAt)).thenReturn(1);
		when(reportService.runScheduleNow(1L, "AUTO")).thenReturn(new ScheduleRunDto(
				1L,
				100L,
				"day",
				periodStart,
				triggerAt,
				triggerAt
		));

		dispatcher.tryDispatchOne(schedule, triggerAt);

		verify(reportService).calculatePeriodStart("DAILY", triggerAt);
		verify(reportScheduleRepository).markRunIfDue(1L, periodStart, triggerAt);
		verify(reportService).runScheduleNow(1L, "AUTO");
	}

	@Test
	void shouldSkipWhenRunTimeInvalid() {
		ReportSchedule schedule = buildSchedule(2L, "DAILY", "9:00");

		dispatcher.tryDispatchOne(schedule, LocalDateTime.of(2026, 3, 23, 9, 0));

		verify(reportService, never()).calculatePeriodStart(any(), any());
		verify(reportScheduleRepository, never()).markRunIfDue(any(), any(), any());
	}

	@Test
	void shouldSkipWhenFrequencyInvalid() {
		ReportSchedule schedule = buildSchedule(3L, "YEARLY", "09:00");
		LocalDateTime triggerAt = LocalDateTime.of(2026, 3, 23, 9, 0);

		when(reportService.calculatePeriodStart("YEARLY", triggerAt))
				.thenThrow(new IllegalArgumentException("不支持的执行频率"));

		dispatcher.tryDispatchOne(schedule, triggerAt);

		verify(reportService).calculatePeriodStart(eq("YEARLY"), eq(triggerAt));
		verify(reportScheduleRepository, never()).markRunIfDue(any(), any(), any());
	}

	private ReportSchedule buildSchedule(Long id, String frequency, String runTime) {
		ReportSchedule schedule = new ReportSchedule();
		schedule.setId(id);
		schedule.setFrequency(frequency);
		schedule.setRunTime(runTime);
		schedule.setEnabled(true);
		return schedule;
	}
}

