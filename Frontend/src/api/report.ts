import request from '@/utils/request';

const BASE_URL = '/api/report';

export type Granularity = 'hour' | 'day' | 'month';

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
  }
};