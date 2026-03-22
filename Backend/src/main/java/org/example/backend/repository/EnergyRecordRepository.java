package org.example.backend.repository;

import org.example.backend.entity.EnergyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EnergyRecordRepository extends JpaRepository<EnergyRecord, Long>, JpaSpecificationExecutor<EnergyRecord> {

    List<EnergyRecord> findByBuildingIdAndRecordTimeBetween(
            Long buildingId,
            LocalDateTime startTime,
            LocalDateTime endTime
    );
}
