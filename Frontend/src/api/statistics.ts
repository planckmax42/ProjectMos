import request from '@/utils/request';
import type {
  TimeSummaryDto,
  CopDto,
  AnomalyDto,
  StatisticsQuery,
  ApiResponse
} from '@/types/api';

const BASE_URL = '/api/statistics';

export const statisticsApi = {
  // 时段汇总 - GET /api/statistics/time-summary
  getTimeSummary(params: StatisticsQuery): Promise<ApiResponse<TimeSummaryDto[]>> {
    return request.get(`${BASE_URL}/time-summary`, { params });
  },

  // COP统计 - GET /api/statistics/cop
  getCopStatistics(params: StatisticsQuery): Promise<ApiResponse<CopDto[]>> {
    return request.get(`${BASE_URL}/cop`, { params });
  },

  // 异常分析 - GET /api/statistics/anomaly
  getAnomalyAnalysis(params: {
    buildingId: number;
    start: string;
    end: string;
  }): Promise<ApiResponse<AnomalyDto[]>> {
    return request.get(`${BASE_URL}/anomaly`, { params });
  }
};