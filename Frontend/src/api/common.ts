import request from '@/utils/request';
import { Building, MonitorDevice, ApiResponse, PageResponse } from '@/types/api';

// Building API
export const buildingApi = {
  getAll(): Promise<ApiResponse<Building[]>> {
    return request.get('/api/buildings');
  },

  getById(id: number): Promise<ApiResponse<Building>> {
    return request.get(`/api/buildings/${id}`);
  },

  create(data: Omit<Building, 'id'>): Promise<ApiResponse<Building>> {
    return request.post('/api/buildings', data);
  },

  update(id: number, data: Partial<Building>): Promise<ApiResponse<Building>> {
    return request.put(`/api/buildings/${id}`, data);
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/api/buildings/${id}`);
  },

  getPage(params: {
    page?: number;
    size?: number;
    search?: string;
  }): Promise<ApiResponse<PageResponse<Building>>> {
    return request.get('/api/buildings/page', { params });
  }
};

// Monitor Device API
export const deviceApi = {
  getAll(buildingId?: number): Promise<ApiResponse<MonitorDevice[]>> {
    return request.get('/api/devices', { params: { buildingId } });
  },

  getById(id: number): Promise<ApiResponse<MonitorDevice>> {
    return request.get(`/api/devices/${id}`);
  },

  create(data: Omit<MonitorDevice, 'id'>): Promise<ApiResponse<MonitorDevice>> {
    return request.post('/api/devices', data);
  },

  update(id: number, data: Partial<MonitorDevice>): Promise<ApiResponse<MonitorDevice>> {
    return request.put(`/api/devices/${id}`, data);
  },

  delete(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/api/devices/${id}`);
  },

  getByBuilding(buildingId: number): Promise<ApiResponse<MonitorDevice[]>> {
    return request.get(`/api/devices/building/${buildingId}`);
  },

  getPage(params: {
    page?: number;
    size?: number;
    buildingId?: number;
    deviceType?: string;
    search?: string;
  }): Promise<ApiResponse<PageResponse<MonitorDevice>>> {
    return request.get('/api/devices/page', { params });
  }
};