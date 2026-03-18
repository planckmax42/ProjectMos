package org.example.backend.repository;

import org.example.backend.entity.MonitorDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonitorDeviceRepository extends JpaRepository<MonitorDevice, Long> {
    List<MonitorDevice> findByBuildingId(Long buildingId);
}
