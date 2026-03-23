package org.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportScheduleRequest {

	@NotBlank(message = "任务名称不能为空")
	private String name;

	@NotNull(message = "建筑ID不能为空")
	private Long buildingId;

	@NotBlank(message = "执行频率不能为空")
	private String frequency;

	@NotBlank(message = "统计粒度不能为空")
	private String granularity;

	@NotBlank(message = "执行时间不能为空")
	private String runTime;

	private String receivers;

	private Boolean enabled;
}

