package org.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleRunHistoryDto {
    private Long id;
    private Long scheduleId;
    private String status;
    private String triggerSource;
    private LocalDateTime windowStart;
    private LocalDateTime windowEnd;
    private LocalDateTime triggeredAt;
    private LocalDateTime finishedAt;
    private String errorMessage;
}

