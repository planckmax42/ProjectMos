import request from '@/utils/request';
import type { ApiResponse, PageResponse } from '@/types/api';

const BASE_URL = '/api/report';

export type Granularity = 'hour' | 'day' | 'month';
export type ScheduleFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ReportScheduleRequest {
  name: string;
  buildingId: number;
  frequency: ScheduleFrequency;
  granularity: Granularity;
  runTime: string;
  receivers?: string;
  enabled?: boolean;
}

export interface ReportSchedule {
  id: number;
  name: string;
  buildingId: number;
  buildingName: string;
  frequency: ScheduleFrequency;
  granularity: Granularity;
  runTime: string;
  receivers?: string;
  enabled: boolean;
  lastRunAt?: string;
  createdAt: string;
}

export interface ScheduleRunResult {
  scheduleId: number;
  buildingId: number;
  granularity: Granularity;
  start: string;
  end: string;
  triggeredAt: string;
}

export interface ScheduleRunHistory {
  id: number;
  scheduleId: number;
  status: 'SUCCESS' | 'FAILED';
  triggerSource: 'MANUAL' | 'AUTO';
  windowStart: string;
  windowEnd: string;
  triggeredAt: string;
  finishedAt: string;
  errorMessage?: string;
}

export const reportApi = {
  // 导出统计报表 - GET /api/report/export
  // 返回CSV文件，不使用标准响应格式
  exportReport(params: {
    buildingId: number;
    start: string;  // ISO-8601格式
    end: string;    // ISO-8601格式
    granularity: Granularity;
  }): Promise<Blob> {
    return request.download(`${BASE_URL}/export`, {
      params,
      responseType: 'blob'
    }).then(res => res.data);
  },

  // 获取定时报表任务列表 - GET /api/report/schedules
  getSchedules(): Promise<ApiResponse<ReportSchedule[]>> {
    return request.get(`${BASE_URL}/schedules`);
  },

  // 新建定时报表任务 - POST /api/report/schedules
  createSchedule(data: ReportScheduleRequest): Promise<ApiResponse<ReportSchedule>> {
    return request.post(`${BASE_URL}/schedules`, data);
  },

  // 更新定时报表任务 - PUT /api/report/schedules/{id}
  updateSchedule(id: number, data: ReportScheduleRequest): Promise<ApiResponse<ReportSchedule>> {
    return request.put(`${BASE_URL}/schedules/${id}`, data);
  },

  // 启停定时报表任务 - PATCH /api/report/schedules/{id}/enabled
  updateScheduleEnabled(id: number, enabled: boolean): Promise<ApiResponse<ReportSchedule>> {
    return request.patch(`${BASE_URL}/schedules/${id}/enabled`, null, {
      params: { enabled }
    });
  },

  // 删除定时报表任务 - DELETE /api/report/schedules/{id}
  deleteSchedule(id: number): Promise<ApiResponse<string>> {
    return request.delete(`${BASE_URL}/schedules/${id}`);
  },

  // 立即执行定时报表任务 - POST /api/report/schedules/{id}/run
  runScheduleNow(id: number): Promise<ApiResponse<ScheduleRunResult>> {
    return request.post(`${BASE_URL}/schedules/${id}/run`);
  },

  // 查询任务执行历史 - GET /api/report/schedules/{id}/runs
  getScheduleRuns(
    id: number,
    params?: { page?: number; size?: number }
  ): Promise<ApiResponse<PageResponse<ScheduleRunHistory>>> {
    return request.get(`${BASE_URL}/schedules/${id}/runs`, { params });
  }
};