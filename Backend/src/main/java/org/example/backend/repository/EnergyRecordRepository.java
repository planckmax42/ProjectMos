package org.example.backend.repository;

import org.example.backend.entity.EnergyRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnergyRecordRepository extends JpaRepository<EnergyRecord, Long> {

    @Query("SELECT e FROM EnergyRecord e WHERE " +
            "(:buildingId IS NULL OR e.buildingId = :buildingId) AND " +
            "(:deviceId IS NULL OR e.deviceId = :deviceId) AND " +
            "(:startTime IS NULL OR e.recordTime >= :startTime) AND " +
            "(:endTime IS NULL OR e.recordTime <= :endTime) AND " +
            "(:deviceStatus IS NULL OR e.deviceStatus = :deviceStatus)")
    Page<EnergyRecord> findByConditions(
            @Param("buildingId") Long buildingId,
            @Param("deviceId") Long deviceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("deviceStatus") String deviceStatus,
            Pageable pageable
    );

    List<EnergyRecord> findByBuildingIdAndRecordTimeBetween(
            Long buildingId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );
}
