-- 建筑能源智能管理系统数据库初始化脚本
-- 注意：数据库 energy_mos 已通过 pgAdmin 创建，此脚本仅创建表和数据

-- 建筑信息表
CREATE TABLE IF NOT EXISTS building (
    id BIGSERIAL PRIMARY KEY,
    building_code VARCHAR(32) UNIQUE NOT NULL,
    building_type VARCHAR(20),
    building_name VARCHAR(100),
    area DECIMAL(10,2)
);

-- 监测设备表
CREATE TABLE IF NOT EXISTS monitor_device (
    id BIGSERIAL PRIMARY KEY,
    device_code VARCHAR(32) UNIQUE NOT NULL,
    building_id BIGINT NOT NULL,
    status VARCHAR(10),
    FOREIGN KEY (building_id) REFERENCES building(id)
);

-- 能耗记录表
CREATE TABLE IF NOT EXISTS energy_record (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT NOT NULL,
    device_id BIGINT NOT NULL,
    record_time TIMESTAMP NOT NULL,
    electricity_kwh DECIMAL(12,4),
    water_m3 DECIMAL(12,4),
    hvac_kwh DECIMAL(12,4),
    hvac_supply_temp DECIMAL(6,2),
    hvac_return_temp DECIMAL(6,2),
    env_temperature DECIMAL(6,2),
    humidity DECIMAL(6,2),
    occupancy_density DECIMAL(8,2),
    device_status VARCHAR(10),
    FOREIGN KEY (building_id) REFERENCES building(id),
    FOREIGN KEY (device_id) REFERENCES monitor_device(id)
);

-- 定时报表任务表
CREATE TABLE IF NOT EXISTS report_schedule (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building_id BIGINT NOT NULL,
    frequency VARCHAR(16) NOT NULL,
    granularity VARCHAR(16) NOT NULL,
    run_time VARCHAR(5) NOT NULL,
    receivers VARCHAR(500),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES building(id)
);

CREATE TABLE IF NOT EXISTS report_schedule_run_history (
    id BIGSERIAL PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    status VARCHAR(16) NOT NULL,
    trigger_source VARCHAR(16) NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    triggered_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP NOT NULL,
    error_message VARCHAR(1000),
    FOREIGN KEY (schedule_id) REFERENCES report_schedule(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_building_time ON energy_record(building_id, record_time);
CREATE INDEX IF NOT EXISTS idx_device ON energy_record(device_id);
CREATE INDEX IF NOT EXISTS idx_record_time ON energy_record(record_time);
CREATE INDEX IF NOT EXISTS idx_device_status ON energy_record(device_status);
CREATE INDEX IF NOT EXISTS idx_report_schedule_building ON report_schedule(building_id);
CREATE INDEX IF NOT EXISTS idx_report_schedule_enabled ON report_schedule(enabled);
CREATE INDEX IF NOT EXISTS idx_schedule_run_history_schedule ON report_schedule_run_history(schedule_id, triggered_at);
CREATE INDEX IF NOT EXISTS idx_schedule_run_history_status ON report_schedule_run_history(status);

-- 插入示例数据
INSERT INTO building (building_code, building_type, building_name, area) VALUES
('BLD-A01', '办公', '总部办公楼A', 23500.00),
('BLD-B02', '教育', '教学楼B', 18000.00),
('BLD-C03', '医疗', '医疗中心C', 32000.00)
ON CONFLICT (building_code) DO NOTHING;

INSERT INTO monitor_device (device_code, building_id, status) VALUES
('DEV-001', 1, 'NORMAL'),
('DEV-002', 1, 'NORMAL'),
('DEV-003', 2, 'NORMAL'),
('DEV-004', 3, 'NORMAL')
ON CONFLICT (device_code) DO NOTHING;

-- 插入示例能耗记录
INSERT INTO energy_record (building_id, device_id, record_time, electricity_kwh, water_m3, hvac_kwh,
                           hvac_supply_temp, hvac_return_temp, env_temperature, humidity,
                           occupancy_density, device_status) VALUES
(1, 1, '2026-03-18 08:00:00', 128.5, 22.1, 88.3, 8.5, 13.1, 24.0, 45.0, 62.0, 'NORMAL'),
(1, 1, '2026-03-18 09:00:00', 135.2, 23.5, 92.1, 8.3, 13.0, 24.5, 46.0, 68.0, 'NORMAL'),
(1, 1, '2026-03-18 10:00:00', 142.8, 24.8, 95.7, 8.4, 13.2, 25.0, 47.0, 72.0, 'NORMAL'),
(2, 3, '2026-03-18 08:00:00', 98.3, 18.2, 65.4, 8.6, 13.3, 23.5, 44.0, 55.0, 'NORMAL'),
(2, 3, '2026-03-18 09:00:00', 105.7, 19.1, 68.9, 8.5, 13.1, 24.0, 45.0, 60.0, 'NORMAL'),
(3, 4, '2026-03-18 08:00:00', 215.6, 35.7, 145.2, 8.2, 12.9, 23.0, 43.0, 48.0, 'NORMAL'),
(3, 4, '2026-03-18 09:00:00', 223.4, 36.8, 148.9, 8.3, 13.0, 23.5, 44.0, 50.0, 'NORMAL');

INSERT INTO report_schedule (name, building_id, frequency, granularity, run_time, receivers, enabled) VALUES
('总部办公楼日报', 1, 'DAILY', 'day', '09:00', 'ops@example.com', TRUE),
('教学楼周报', 2, 'WEEKLY', 'day', '10:00', 'admin@example.com', TRUE)
ON CONFLICT DO NOTHING;
