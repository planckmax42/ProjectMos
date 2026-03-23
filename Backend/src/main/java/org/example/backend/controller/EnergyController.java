package org.example.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.backend.common.ApiResponse;
import org.example.backend.dto.EnergyRecordRequest;
import org.example.backend.entity.Building;
import org.example.backend.entity.EnergyRecord;
import org.example.backend.entity.MonitorDevice;
import org.example.backend.service.EnergyService;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/energy")
@RequiredArgsConstructor
@Tag(name = "Energy", description = "能耗数据管理")
public class
EnergyController {

    private final EnergyService energyService;

    @GetMapping("/buildings")
    @Operation(summary = "获取建筑列表")
    public ApiResponse<List<Building>> getBuildings() {
        return ApiResponse.success(energyService.getAllBuildings());
    }

    @GetMapping("/devices")
    @Operation(summary = "获取设备列表")
    public ApiResponse<List<MonitorDevice>> getDevices(
            @RequestParam(required = false) Long buildingId
    ) {
        return ApiResponse.success(energyService.getDevices(buildingId));
    }

    @PostMapping("/records")
    @Operation(summary = "新增能耗记录")
    public ApiResponse<EnergyRecord> createRecord(@RequestBody EnergyRecordRequest request) {
        return ApiResponse.success(energyService.createRecord(request));
    }

    @PutMapping("/records/{id}")
    @Operation(summary = "更新能耗记录")
    public ApiResponse<EnergyRecord> updateRecord(
            @PathVariable Long id,
            @RequestBody EnergyRecordRequest request
    ) {
        return ApiResponse.success(energyService.updateRecord(id, request));
    }

    @DeleteMapping("/records/{id}")
    @Operation(summary = "删除能耗记录")
    public ApiResponse<String> deleteRecord(@PathVariable Long id) {
        energyService.deleteRecord(id);
        return ApiResponse.success("删除成功");
    }

    @GetMapping("/records")
    @Operation(summary = "查询能耗记录")
    public ApiResponse<Page<EnergyRecord>> queryRecords(
            @RequestParam(required = false) Long buildingId,
            @RequestParam(required = false) Long deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) String deviceStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ApiResponse.success(energyService.queryRecords(
                buildingId, deviceId, startTime, endTime, deviceStatus, page, size
        ));
    }

    @PostMapping("/import/csv")
    @Operation(summary = "CSV导入")
    public ApiResponse<String> importCsv(@RequestParam("file") MultipartFile file) {
        try {
            int count = energyService.importFromCsv(file);
            return ApiResponse.success("成功导入 " + count + " 条记录");
        } catch (Exception e) {
            return ApiResponse.error("导入失败: " + e.getMessage());
        }
    }
}
