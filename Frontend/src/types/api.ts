// API Response Types - 与后端保持完全一致
export interface ApiResponse<T = any> {
  code: number;  // 0表示成功，1表示失败
  message: string;
  data: T;
}

// Building Types - 与后端entity匹配
export interface Building {
  id: number;
  buildingCode: string;
  buildingType: string;
  buildingName: string;
  area: number;  // 后端使用area而不是totalArea
}

// Monitor Device Types
export interface MonitorDevice {
  id: number;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  installLocation: string;
  buildingId: number;
  building?: Building;
}

// Energy Record Types - 与后端字段完全匹配
export interface EnergyRecord {
  id: number;
  buildingId: number;
  building?: Building;
  deviceId: number;
  device?: MonitorDevice;
  recordTime: string;  // ISO-8601格式
  electricityKwh: number;  // 电耗 kWh
  waterM3: number;  // 水耗 m³
  hvacKwh: number;  // 空调能耗 kWh
  hvacSupplyTemp?: number;  // 供水温度 ℃
  hvacReturnTemp?: number;  // 回水温度 ℃
  envTemperature?: number;  // 环境温度 ℃ (后端用envTemperature不是outdoorTemp)
  humidity?: number;  // 湿度 %
  occupancyDensity?: number;  // 人员密度 人/100㎡
  deviceStatus: 'NORMAL' | 'ABNORMAL';  // 设备状态
}

// Energy Record Request DTO - 与后端完全匹配
export interface EnergyRecordRequest {
  buildingId: number;
  deviceId: number;
  recordTime: string;  // ISO-8601格式 例如: 2026-03-18T10:00:00
  electricityKwh: number;
  waterM3: number;
  hvacKwh: number;
  hvacSupplyTemp?: number;
  hvacReturnTemp?: number;
  envTemperature?: number;
  humidity?: number;
  occupancyDensity?: number;
  deviceStatus?: 'NORMAL' | 'ABNORMAL';
}

// Statistics DTOs - 与后端完全匹配
export interface TimeSummaryDto {
  timeBucket: string;  // 时间段，格式根据granularity决定
  electricityKwh: number;
  waterM3: number;
  hvacKwh: number;
}

export interface CopDto {
  timeBucket: string;
  cop: number;
}

export interface AnomalyDto {
  recordId: number;
  recordTime: string;
  electricityKwh: number;
  zScore: number;  // Z-Score值
  changeRate: number;  // 变化率
}

// Query Parameters
export interface PageParams {
  page?: number;  // 页码，从0开始
  size?: number;  // 每页大小，默认50
}

// Energy Record Query Parameters
export interface EnergyRecordQuery extends PageParams {
  buildingId?: number;
  deviceId?: number;
  startTime?: string;  // ISO-8601格式
  endTime?: string;    // ISO-8601格式
  deviceStatus?: 'NORMAL' | 'ABNORMAL';
}

// Statistics Query Parameters - 与后端完全匹配
export interface StatisticsQuery {
  buildingId: number;  // 必需
  start: string;  // ISO-8601格式
  end: string;    // ISO-8601格式
  granularity: 'hour' | 'day' | 'month';  // 小写
}

// Page Response - Spring Data分页响应
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;  // 当前页码，从0开始
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      ascending: boolean;
      descending: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
}

// CSV Import Result
export interface ImportResult {
  imported: number;
  failed: number;
  errors?: string[];
}