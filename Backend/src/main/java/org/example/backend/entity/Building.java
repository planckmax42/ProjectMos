package org.example.backend.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Entity
@Table(name = "building")
public class Building {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "building_code", unique = true, nullable = false, length = 32)
    private String buildingCode;

    @Column(name = "building_type", length = 20)
    private String buildingType;

    @Column(name = "building_name", length = 100)
    private String buildingName;

    @Column(name = "area", precision = 10, scale = 2)
    private BigDecimal area;
}