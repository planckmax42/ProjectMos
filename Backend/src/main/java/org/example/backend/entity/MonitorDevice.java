package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "monitor_device")
public class MonitorDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_code", unique = true, nullable = false, length = 32)
    private String deviceCode;

    @Column(name = "building_id", nullable = false)
    private Long buildingId;

    @Column(name = "status", length = 10)
    private String status;
}