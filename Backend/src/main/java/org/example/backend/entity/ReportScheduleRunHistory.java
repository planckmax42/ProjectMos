package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "report_schedule_run_history", indexes = {
        @Index(name = "idx_schedule_run_history_schedule", columnList = "schedule_id,triggered_at"),
        @Index(name = "idx_schedule_run_history_status", columnList = "status")
})
public class ReportScheduleRunHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "schedule_id", nullable = false)
    private Long scheduleId;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "trigger_source", nullable = false, length = 16)
    private String triggerSource;

    @Column(name = "window_start", nullable = false)
    private LocalDateTime windowStart;

    @Column(name = "window_end", nullable = false)
    private LocalDateTime windowEnd;

    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    @Column(name = "finished_at", nullable = false)
    private LocalDateTime finishedAt;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;
}

