package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportScheduleDto {
	private Long id;
	private String name;
	private Long buildingId;
	private String buildingName;
	private String frequency;
	private String granularity;
	private String runTime;
	private String receivers;
	private Boolean enabled;
	private LocalDateTime lastRunAt;
	private LocalDateTime createdAt;
}

