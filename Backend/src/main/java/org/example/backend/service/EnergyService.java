package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.example.backend.dto.EnergyRecordRequest;
import org.example.backend.entity.Building;
import org.example.backend.entity.EnergyRecord;
import org.example.backend.entity.MonitorDevice;
import org.example.backend.repository.BuildingRepository;
import org.example.backend.repository.EnergyRecordRepository;
import org.example.backend.repository.MonitorDeviceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EnergyService {

    private final BuildingRepository buildingRepository;
    private final MonitorDeviceRepository deviceRepository;
    private final EnergyRecordRepository recordRepository;

    public List<Building> getAllBuildings() {
        return buildingRepository.findAll();
    }

    public List<MonitorDevice> getDevices(Long buildingId) {
        if (buildingId != null) {
            return deviceRepository.findByBuildingId(buildingId);
        }
        return deviceRepository.findAll();
    }

    @Transactional
    public EnergyRecord createRecord(EnergyRecordRequest request) {
        EnergyRecord record = new EnergyRecord();
        copyProperties(request, record);
        return recordRepository.save(record);
    }

    @Transactional
    public EnergyRecord updateRecord(Long id, EnergyRecordRequest request) {
        EnergyRecord record = recordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("记录不存在: " + id));
        copyProperties(request, record);
        return recordRepository.save(record);
    }

    public Page<EnergyRecord> queryRecords(
            Long buildingId,
            Long deviceId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String deviceStatus,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "recordTime"));
        return recordRepository.findByConditions(buildingId, deviceId, startTime, endTime, deviceStatus, pageable);
    }

    @Transactional
    public int importFromCsv(MultipartFile file) throws Exception {
        List<EnergyRecord> records = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {

            for (CSVRecord csvRecord : csvParser) {
                EnergyRecord record = new EnergyRecord();
                record.setBuildingId(Long.parseLong(csvRecord.get("buildingId")));
                record.setDeviceId(Long.parseLong(csvRecord.get("deviceId")));
                record.setRecordTime(LocalDateTime.parse(csvRecord.get("recordTime"), formatter));
                record.setElectricityKwh(new BigDecimal(csvRecord.get("electricityKwh")));
                record.setWaterM3(new BigDecimal(csvRecord.get("waterM3")));
                record.setHvacKwh(new BigDecimal(csvRecord.get("hvacKwh")));
                record.setHvacSupplyTemp(new BigDecimal(csvRecord.get("hvacSupplyTemp")));
                record.setHvacReturnTemp(new BigDecimal(csvRecord.get("hvacReturnTemp")));
                record.setEnvTemperature(new BigDecimal(csvRecord.get("envTemperature")));
                record.setHumidity(new BigDecimal(csvRecord.get("humidity")));
                record.setOccupancyDensity(new BigDecimal(csvRecord.get("occupancyDensity")));
                record.setDeviceStatus(csvRecord.get("deviceStatus"));
                records.add(record);
            }
        }

        recordRepository.saveAll(records);
        return records.size();
    }

    private void copyProperties(EnergyRecordRequest request, EnergyRecord record) {
        record.setBuildingId(request.getBuildingId());
        record.setDeviceId(request.getDeviceId());
        record.setRecordTime(request.getRecordTime());
        record.setElectricityKwh(request.getElectricityKwh());
        record.setWaterM3(request.getWaterM3());
        record.setHvacKwh(request.getHvacKwh());
        record.setHvacSupplyTemp(request.getHvacSupplyTemp());
        record.setHvacReturnTemp(request.getHvacReturnTemp());
        record.setEnvTemperature(request.getEnvTemperature());
        record.setHumidity(request.getHumidity());
        record.setOccupancyDensity(request.getOccupancyDensity());
        record.setDeviceStatus(request.getDeviceStatus());
    }
}
