package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "report_schedule", indexes = {
        @Index(name = "idx_report_schedule_building", columnList = "building_id"),
        @Index(name = "idx_report_schedule_enabled", columnList = "enabled")
})
public class ReportSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "building_id", nullable = false)
    private Long buildingId;

    @Column(name = "frequency", nullable = false, length = 16)
    private String frequency;

    @Column(name = "granularity", nullable = false, length = 16)
    private String granularity;

    @Column(name = "run_time", nullable = false, length = 5)
    private String runTime;

    @Column(name = "receivers", length = 500)
    private String receivers;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "last_run_at")
    private LocalDateTime lastRunAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.enabled == null) {
            this.enabled = Boolean.TRUE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

