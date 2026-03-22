import request from '@/utils/request';
import {
  TimeSummaryDto,
  CopDto,
  AnomalyDto,
  StatisticsQuery,
  ApiResponse
} from '@/types/api';

const BASE_URL = '/api/statistics';

export const statisticsApi = {
  // 获取时间汇总统计
  getTimeSummary(params: StatisticsQuery): Promise<ApiResponse<TimeSummaryDto[]>> {
    return request.get(`${BASE_URL}/time-summary`, { params });
  },

  // 获取COP分析
  getCopAnalysis(params: {
    buildingIds?: number[];
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<CopDto[]>> {
    return request.get(`${BASE_URL}/cop`, { params });
  },

  // 获取异常检测结果
  getAnomalies(params: {
    buildingId?: number;
    startTime: string;
    endTime: string;
    anomalyType?: 'ELECTRICITY' | 'WATER' | 'HVAC' | 'ALL';
    severityLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<ApiResponse<AnomalyDto[]>> {
    return request.get(`${BASE_URL}/anomalies`, { params });
  },

  // 获取能源趋势分析
  getEnergyTrend(params: {
    buildingId: number;
    startTime: string;
    endTime: string;
    energyType: 'ELECTRICITY' | 'WATER' | 'HVAC';
    interval?: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
  }): Promise<ApiResponse<{
    timestamps: string[];
    values: number[];
    trend: 'UP' | 'DOWN' | 'STABLE';
    changeRate: number;
  }>> {
    return request.get(`${BASE_URL}/energy-trend`, { params });
  },

  // 获取建筑能效排名
  getBuildingRanking(params: {
    startTime: string;
    endTime: string;
    rankBy: 'ELECTRICITY' | 'WATER' | 'HVAC' | 'TOTAL';
    top?: number;
  }): Promise<ApiResponse<{
    buildingId: number;
    buildingName: string;
    consumption: number;
    rank: number;
    efficiency: number;
  }[]>> {
    return request.get(`${BASE_URL}/building-ranking`, { params });
  },

  // 获取峰谷分析
  getPeakValleyAnalysis(params: {
    buildingId: number;
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<{
    peakHours: string[];
    valleyHours: string[];
    peakAvg: number;
    valleyAvg: number;
    savingPotential: number;
  }>> {
    return request.get(`${BASE_URL}/peak-valley`, { params });
  },

  // 获取环境相关性分析
  getEnvironmentCorrelation(params: {
    buildingId: number;
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<{
    tempCorrelation: number;
    humidityCorrelation: number;
    occupancyCorrelation: number;
    recommendations: string[];
  }>> {
    return request.get(`${BASE_URL}/environment-correlation`, { params });
  }
};