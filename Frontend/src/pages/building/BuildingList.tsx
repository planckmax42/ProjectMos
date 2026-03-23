import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import { energyApi } from '@/api/energy';
import type { Building, MonitorDevice } from '@/types/api';

const BuildingList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [devices, setDevices] = useState<MonitorDevice[]>([]);
  const [keyword, setKeyword] = useState('');
  const [buildingType, setBuildingType] = useState<string | undefined>();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [buildingRes, deviceRes] = await Promise.all([
          energyApi.getBuildings(),
          energyApi.getDevices(),
        ]);

        if (buildingRes.code === 0 && buildingRes.data) {
          setBuildings(buildingRes.data);
        }
        if (deviceRes.code === 0 && deviceRes.data) {
          setDevices(deviceRes.data);
        }
      } catch (error) {
        message.error('加载建筑信息失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const typeOptions = useMemo(() => {
    const allTypes = Array.from(new Set(buildings.map((item) => item.buildingType).filter(Boolean)));
    return allTypes.map((type) => ({ label: type, value: type }));
  }, [buildings]);

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return buildings
      .filter((item) => !buildingType || item.buildingType === buildingType)
      .filter((item) => {
        if (!normalizedKeyword) return true;
        return (
          item.buildingName?.toLowerCase().includes(normalizedKeyword) ||
          item.buildingCode?.toLowerCase().includes(normalizedKeyword)
        );
      })
      .map((item) => ({
        ...item,
        deviceCount: devices.filter((d) => d.buildingId === item.id).length,
      }));
  }, [buildings, devices, keyword, buildingType]);

  const summary = useMemo(() => {
    const totalArea = filteredData.reduce((sum, item) => sum + Number(item.area || 0), 0);
    const totalDevices = filteredData.reduce((sum, item) => sum + Number(item.deviceCount || 0), 0);
    return {
      totalBuildings: filteredData.length,
      totalArea,
      avgArea: filteredData.length > 0 ? totalArea / filteredData.length : 0,
      totalDevices,
    };
  }, [filteredData]);

  const columns = [
    {
      title: '建筑编码',
      dataIndex: 'buildingCode',
      key: 'buildingCode',
      width: 160,
    },
    {
      title: '建筑名称',
      dataIndex: 'buildingName',
      key: 'buildingName',
      width: 180,
    },
    {
      title: '建筑类型',
      dataIndex: 'buildingType',
      key: 'buildingType',
      width: 120,
      render: (value: string) => <Tag color="blue">{value || '-'}</Tag>,
    },
    {
      title: '建筑面积(㎡)',
      dataIndex: 'area',
      key: 'area',
      align: 'right' as const,
      render: (value: number) => Number(value || 0).toFixed(2),
    },
    {
      title: '设备数量',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      align: 'right' as const,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="建筑列表">
        <Space>
          <Input.Search
            allowClear
            placeholder="搜索建筑名称/编码"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <Select
            allowClear
            style={{ width: 200 }}
            placeholder="建筑类型"
            value={buildingType}
            options={typeOptions}
            onChange={setBuildingType}
          />
        </Space>
      </Card>

      <Spin spinning={loading}>
        {filteredData.length === 0 ? (
          <Card>
            <Empty description="没有匹配的建筑数据" />
          </Card>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={6}><Card><Statistic title="建筑数量" value={summary.totalBuildings} /></Card></Col>
              <Col span={6}><Card><Statistic title="总面积" value={summary.totalArea} precision={2} suffix="㎡" /></Card></Col>
              <Col span={6}><Card><Statistic title="平均面积" value={summary.avgArea} precision={2} suffix="㎡" /></Card></Col>
              <Col span={6}><Card><Statistic title="设备总数" value={summary.totalDevices} /></Card></Col>
            </Row>

            <Card title="建筑明细" style={{ marginTop: 16 }}>
              <Table rowKey="id" columns={columns} dataSource={filteredData} pagination={{ pageSize: 10 }} />
            </Card>
          </>
        )}
      </Spin>
    </Space>
  );
};

export default BuildingList;