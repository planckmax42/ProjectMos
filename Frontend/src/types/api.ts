// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// Building Types
export interface Building {
  id: number;
  buildingCode: string;
  buildingType: string;
  buildingName: string;
  totalArea: number;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

// Energy Record Types
export interface EnergyRecord {
  id: number;
  buildingId: number;
  building?: Building;
  deviceId: number;
  device?: MonitorDevice;
  recordTime: string;
  electricityConsumption: number;
  waterConsumption: number;
  hvacEnergyConsumption: number;
  hvacSupplyTemp?: number;
  hvacReturnTemp?: number;
  outdoorTemp?: number;
  indoorTemp?: number;
  humidity?: number;
  occupancyDensity?: number;
  deviceStatus: 'NORMAL' | 'ABNORMAL' | 'OFFLINE';
  createdAt?: string;
  updatedAt?: string;
}

// Energy Record Request DTO
export interface EnergyRecordRequest {
  buildingId: number;
  deviceId: number;
  recordTime: string;
  electricityConsumption: number;
  waterConsumption: number;
  hvacEnergyConsumption: number;
  hvacSupplyTemp?: number;
  hvacReturnTemp?: number;
  outdoorTemp?: number;
  indoorTemp?: number;
  humidity?: number;
  occupancyDensity?: number;
  deviceStatus?: 'NORMAL' | 'ABNORMAL' | 'OFFLINE';
}

// Statistics DTOs
export interface TimeSummaryDto {
  period: string;
  totalElectricity: number;
  totalWater: number;
  totalHvacEnergy: number;
  avgOutdoorTemp?: number;
  avgIndoorTemp?: number;
  recordCount: number;
}

export interface CopDto {
  buildingId: number;
  buildingName: string;
  period: string;
  cop: number;
  totalHvacEnergy: number;
  avgSupplyTemp?: number;
  avgReturnTemp?: number;
}

export interface AnomalyDto {
  recordId: number;
  buildingName: string;
  deviceName: string;
  recordTime: string;
  anomalyType: string;
  anomalyValue: number;
  threshold: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Query Parameters
export interface PageParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface EnergyRecordQuery extends PageParams {
  buildingId?: number;
  deviceId?: number;
  startTime?: string;
  endTime?: string;
  deviceStatus?: 'NORMAL' | 'ABNORMAL' | 'OFFLINE';
}

export interface StatisticsQuery {
  buildingId?: number;
  startTime: string;
  endTime: string;
  groupBy?: 'HOUR' | 'DAY' | 'MONTH';
}

// Page Response
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}