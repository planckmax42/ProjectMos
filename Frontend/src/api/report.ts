import request from '@/utils/request';
import { ApiResponse } from '@/types/api';

const BASE_URL = '/api/report';

export type ExportFormat = 'EXCEL' | 'CSV' | 'PDF';
export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface ReportParams {
  buildingIds?: number[];
  startTime: string;
  endTime: string;
  reportType: ReportType;
  includeCharts?: boolean;
  includeStatistics?: boolean;
  includeAnomalies?: boolean;
}

export const reportApi = {
  // 导出能源记录
  exportEnergyRecords(params: {
    buildingId?: number;
    startTime?: string;
    endTime?: string;
    format: ExportFormat;
  }): Promise<Blob> {
    return request.download(`${BASE_URL}/export/energy-records`, {
      params,
      responseType: 'blob'
    }).then(res => res.data);
  },

  // 导出统计报表
  exportStatistics(params: {
    buildingIds?: number[];
    startTime: string;
    endTime: string;
    format: ExportFormat;
    groupBy?: 'HOUR' | 'DAY' | 'MONTH';
  }): Promise<Blob> {
    return request.download(`${BASE_URL}/export/statistics`, {
      params,
      responseType: 'blob'
    }).then(res => res.data);
  },

  // 生成综合报告
  generateReport(params: ReportParams): Promise<ApiResponse<{
    reportId: string;
    generatedAt: string;
    downloadUrl: string;
  }>> {
    return request.post(`${BASE_URL}/generate`, params);
  },

  // 下载报告
  downloadReport(reportId: string, format: ExportFormat): Promise<Blob> {
    return request.download(`${BASE_URL}/download/${reportId}`, {
      params: { format },
      responseType: 'blob'
    }).then(res => res.data);
  },

  // 获取报告模板
  getTemplates(): Promise<ApiResponse<{
    id: string;
    name: string;
    description: string;
    type: ReportType;
  }[]>> {
    return request.get(`${BASE_URL}/templates`);
  },

  // 定时报告配置
  scheduleReport(params: {
    name: string;
    buildingIds: number[];
    reportType: ReportType;
    schedule: string; // cron expression
    recipients?: string[];
    format: ExportFormat;
  }): Promise<ApiResponse<{
    scheduleId: string;
    nextRunTime: string;
  }>> {
    return request.post(`${BASE_URL}/schedule`, params);
  },

  // 获取定时报告列表
  getScheduledReports(): Promise<ApiResponse<{
    scheduleId: string;
    name: string;
    schedule: string;
    nextRunTime: string;
    lastRunTime?: string;
    status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  }[]>> {
    return request.get(`${BASE_URL}/scheduled`);
  },

  // 取消定时报告
  cancelSchedule(scheduleId: string): Promise<ApiResponse<void>> {
    return request.delete(`${BASE_URL}/schedule/${scheduleId}`);
  }
};