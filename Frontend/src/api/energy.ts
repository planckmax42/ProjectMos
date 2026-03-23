import request from '@/utils/request';
import type {
  EnergyRecord,
  EnergyRecordRequest,
  EnergyRecordQuery,
  PageResponse,
  ApiResponse,
  Building,
  MonitorDevice
} from '@/types/api';

const BASE_URL = '/api/energy';

export const energyApi = {
  // 获取建筑列表 - GET /api/energy/buildings
  getBuildings(): Promise<ApiResponse<Building[]>> {
    return request.get(`${BASE_URL}/buildings`);
  },

  // 获取设备列表 - GET /api/energy/devices
  getDevices(buildingId?: number): Promise<ApiResponse<MonitorDevice[]>> {
    return request.get(`${BASE_URL}/devices`, {
      params: buildingId ? { buildingId } : undefined
    });
  },

  // 新增能耗记录 - POST /api/energy/records
  createRecord(data: EnergyRecordRequest): Promise<ApiResponse<EnergyRecord>> {
    return request.post(`${BASE_URL}/records`, data);
  },

  // 更新能耗记录 - PUT /api/energy/records/{id}
  updateRecord(id: number, data: EnergyRecordRequest): Promise<ApiResponse<EnergyRecord>> {
    return request.put(`${BASE_URL}/records/${id}`, data);
  },

  // 查询能耗记录（分页）- GET /api/energy/records
  queryRecords(params: EnergyRecordQuery): Promise<ApiResponse<PageResponse<EnergyRecord>>> {
    return request.get(`${BASE_URL}/records`, { params });
  },

  // CSV导入 - POST /api/energy/import/csv
  importCsv(file: File): Promise<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('file', file);
    return request.upload(`${BASE_URL}/import/csv`, formData);
  }
};