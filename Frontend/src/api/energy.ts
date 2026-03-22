import request from '@/utils/request';
import {
  EnergyRecord,
  EnergyRecordRequest,
  EnergyRecordQuery,
  PageResponse,
  ApiResponse
} from '@/types/api';

const BASE_URL = '/api/energy';

export const energyApi = {
  // 创建能源记录
  create(data: EnergyRecordRequest): Promise<ApiResponse<EnergyRecord>> {
    return request.post(`${BASE_URL}/create`, data);
  },

  // 批量创建能源记录
  batchCreate(data: EnergyRecordRequest[]): Promise<ApiResponse<EnergyRecord[]>> {
    return request.post(`${BASE_URL}/batch-create`, data);
  },

  // 更新能源记录
  update(id: number, data: Partial<EnergyRecordRequest>): Promise<ApiResponse<EnergyRecord>> {
    return request.put(`${BASE_URL}/update/${id}`, data);
  },

  // 删除能源记录
  delete(id: number): Promise<ApiResponse<void>> {
    return request.delete(`${BASE_URL}/delete/${id}`);
  },

  // 获取单个能源记录
  getById(id: number): Promise<ApiResponse<EnergyRecord>> {
    return request.get(`${BASE_URL}/${id}`);
  },

  // 分页查询能源记录
  getPage(params: EnergyRecordQuery): Promise<ApiResponse<PageResponse<EnergyRecord>>> {
    return request.get(`${BASE_URL}/page`, { params });
  },

  // 导入CSV文件
  importCsv(file: File): Promise<ApiResponse<{ imported: number; failed: number; errors: string[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    return request.upload(`${BASE_URL}/import-csv`, formData);
  },

  // 获取最新记录
  getLatest(buildingId: number, limit: number = 10): Promise<ApiResponse<EnergyRecord[]>> {
    return request.get(`${BASE_URL}/latest`, {
      params: { buildingId, limit }
    });
  },

  // 按时间范围查询
  getByTimeRange(
    buildingId: number,
    startTime: string,
    endTime: string
  ): Promise<ApiResponse<EnergyRecord[]>> {
    return request.get(`${BASE_URL}/time-range`, {
      params: { buildingId, startTime, endTime }
    });
  },

  // 获取设备状态统计
  getDeviceStatusStats(buildingId?: number): Promise<ApiResponse<{
    normal: number;
    abnormal: number;
    offline: number;
  }>> {
    return request.get(`${BASE_URL}/device-status-stats`, {
      params: { buildingId }
    });
  }
};