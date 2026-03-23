package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleRunDto {
	private Long scheduleId;
	private Long buildingId;
	private String granularity;
	private LocalDateTime start;
	private LocalDateTime end;
	private LocalDateTime triggeredAt;
}

