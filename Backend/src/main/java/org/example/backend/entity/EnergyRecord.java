package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "energy_record", indexes = {
    @Index(name = "idx_building_time", columnList = "building_id,record_time"),
    @Index(name = "idx_device", columnList = "device_id"),
    @Index(name = "idx_record_time", columnList = "record_time"),
    @Index(name = "idx_device_status", columnList = "device_status")
})
public class EnergyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "building_id", nullable = false)
    private Long buildingId;

    @Column(name = "device_id", nullable = false)
    private Long deviceId;

    @Column(name = "record_time", nullable = false)
    private LocalDateTime recordTime;

    @Column(name = "electricity_kwh", precision = 12, scale = 4)
    private BigDecimal electricityKwh;

    @Column(name = "water_m3", precision = 12, scale = 4)
    private BigDecimal waterM3;

    @Column(name = "hvac_kwh", precision = 12, scale = 4)
    private BigDecimal hvacKwh;

    @Column(name = "hvac_supply_temp", precision = 6, scale = 2)
    private BigDecimal hvacSupplyTemp;

    @Column(name = "hvac_return_temp", precision = 6, scale = 2)
    private BigDecimal hvacReturnTemp;

    @Column(name = "env_temperature", precision = 6, scale = 2)
    private BigDecimal envTemperature;

    @Column(name = "humidity", precision = 6, scale = 2)
    private BigDecimal humidity;

    @Column(name = "occupancy_density", precision = 8, scale = 2)
    private BigDecimal occupancyDensity;

    @Column(name = "device_status", length = 10)
    private String deviceStatus;
}
