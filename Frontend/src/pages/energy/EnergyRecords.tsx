import React, { useState, useEffect } from 'react';
import {
  Table, Card, Space, Button, Input, Select, DatePicker, Form, Modal,
  message, Popconfirm, Tag, Row, Col, InputNumber
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  DownloadOutlined, ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { energyApi } from '@/api/energy';
import { buildingApi, deviceApi } from '@/api/common';
import { reportApi } from '@/api/report';
import {
  EnergyRecord, EnergyRecordRequest, Building, MonitorDevice, PageResponse
} from '@/types/api';

const { RangePicker } = DatePicker;

const EnergyRecords: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<EnergyRecord[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [devices, setDevices] = useState<MonitorDevice[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<EnergyRecord | null>(null);

  const [searchForm] = Form.useForm();
  const [modalForm] = Form.useForm();

  // 获取建筑和设备列表
  useEffect(() => {
    Promise.all([
      buildingApi.getAll(),
      deviceApi.getAll(),
    ]).then(([buildingRes, deviceRes]) => {
      if (buildingRes.success) setBuildings(buildingRes.data || []);
      if (deviceRes.success) setDevices(deviceRes.data || []);
    });
  }, []);

  // 获取能源记录
  const fetchRecords = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const values = searchForm.getFieldsValue();
      const params = {
        page: page - 1,
        size: pageSize,
        buildingId: values.buildingId,
        deviceId: values.deviceId,
        startTime: values.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
        deviceStatus: values.deviceStatus,
      };

      const res = await energyApi.getPage(params);
      if (res.success && res.data) {
        setData(res.data.content);
        setPagination({
          current: res.data.number + 1,
          pageSize: res.data.size,
          total: res.data.totalElements,
        });
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchRecords(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    fetchRecords(1, pagination.pageSize);
  };

  // 打开新增/编辑模态框
  const openModal = (record?: EnergyRecord) => {
    setEditingRecord(record || null);
    if (record) {
      modalForm.setFieldsValue({
        ...record,
        recordTime: dayjs(record.recordTime),
      });
    } else {
      modalForm.resetFields();
    }
    setModalVisible(true);
  };

  // 保存记录
  const handleSave = async () => {
    try {
      const values = await modalForm.validateFields();
      const data: EnergyRecordRequest = {
        ...values,
        recordTime: values.recordTime.format('YYYY-MM-DD HH:mm:ss'),
      };

      if (editingRecord) {
        await energyApi.update(editingRecord.id, data);
        message.success('更新成功');
      } else {
        await energyApi.create(data);
        message.success('创建成功');
      }

      setModalVisible(false);
      fetchRecords(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 删除记录
  const handleDelete = async (id: number) => {
    try {
      await energyApi.delete(id);
      message.success('删除成功');
      fetchRecords(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const values = searchForm.getFieldsValue();
      const blob = await reportApi.exportEnergyRecords({
        buildingId: values.buildingId,
        startTime: values.dateRange?.[0]?.format('YYYY-MM-DD HH:mm:ss'),
        endTime: values.dateRange?.[1]?.format('YYYY-MM-DD HH:mm:ss'),
        format: 'EXCEL',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `energy_records_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<EnergyRecord> = [
    {
      title: '记录时间',
      dataIndex: 'recordTime',
      key: 'recordTime',
      width: 150,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '建筑',
      dataIndex: ['building', 'buildingName'],
      key: 'building',
      width: 120,
    },
    {
      title: '设备',
      dataIndex: ['device', 'deviceName'],
      key: 'device',
      width: 120,
    },
    {
      title: '电力消耗(kWh)',
      dataIndex: 'electricityConsumption',
      key: 'electricityConsumption',
      width: 120,
      align: 'right',
      render: (value) => value?.toFixed(2),
    },
    {
      title: '用水量(m³)',
      dataIndex: 'waterConsumption',
      key: 'waterConsumption',
      width: 100,
      align: 'right',
      render: (value) => value?.toFixed(2),
    },
    {
      title: 'HVAC能耗(kWh)',
      dataIndex: 'hvacEnergyConsumption',
      key: 'hvacEnergyConsumption',
      width: 120,
      align: 'right',
      render: (value) => value?.toFixed(2),
    },
    {
      title: '室内温度(°C)',
      dataIndex: 'indoorTemp',
      key: 'indoorTemp',
      width: 100,
      align: 'right',
      render: (value) => value?.toFixed(1),
    },
    {
      title: '设备状态',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      width: 100,
      render: (status) => {
        const config = {
          NORMAL: { color: 'green', text: '正常' },
          ABNORMAL: { color: 'orange', text: '异常' },
          OFFLINE: { color: 'red', text: '离线' },
        };
        const { color, text } = config[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* 搜索条件 */}
      <Card>
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={6}>
              <Form.Item name="buildingId" label="建筑">
                <Select
                  placeholder="选择建筑"
                  allowClear
                  style={{ width: '100%' }}
                >
                  {buildings.map(b => (
                    <Select.Option key={b.id} value={b.id}>
                      {b.buildingName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="deviceId" label="设备">
                <Select
                  placeholder="选择设备"
                  allowClear
                  style={{ width: '100%' }}
                >
                  {devices.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.deviceName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dateRange" label="时间范围">
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="deviceStatus" label="设备状态">
                <Select placeholder="选择状态" allowClear style={{ width: '100%' }}>
                  <Select.Option value="NORMAL">正常</Select.Option>
                  <Select.Option value="ABNORMAL">异常</Select.Option>
                  <Select.Option value="OFFLINE">离线</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row style={{ marginTop: 16 }}>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 操作按钮 */}
      <Card>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
          >
            新增记录
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            导出Excel
          </Button>
        </Space>
      </Card>

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => fetchRecords(page, pageSize),
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      {/* 新增/编辑模态框 */}
      <Modal
        title={editingRecord ? '编辑能源记录' : '新增能源记录'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={720}
        destroyOnClose
      >
        <Form
          form={modalForm}
          layout="vertical"
          initialValues={{
            deviceStatus: 'NORMAL',
            recordTime: dayjs(),
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="buildingId"
                label="建筑"
                rules={[{ required: true, message: '请选择建筑' }]}
              >
                <Select placeholder="选择建筑">
                  {buildings.map(b => (
                    <Select.Option key={b.id} value={b.id}>
                      {b.buildingName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="deviceId"
                label="设备"
                rules={[{ required: true, message: '请选择设备' }]}
              >
                <Select placeholder="选择设备">
                  {devices.map(d => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.deviceName}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="recordTime"
                label="记录时间"
                rules={[{ required: true, message: '请选择记录时间' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm:ss"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceStatus" label="设备状态">
                <Select>
                  <Select.Option value="NORMAL">正常</Select.Option>
                  <Select.Option value="ABNORMAL">异常</Select.Option>
                  <Select.Option value="OFFLINE">离线</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="electricityConsumption"
                label="电力消耗(kWh)"
                rules={[{ required: true, message: '请输入电力消耗' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="waterConsumption"
                label="用水量(m³)"
                rules={[{ required: true, message: '请输入用水量' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="hvacEnergyConsumption"
                label="HVAC能耗(kWh)"
                rules={[{ required: true, message: '请输入HVAC能耗' }]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="hvacSupplyTemp" label="供水温度(°C)">
                <InputNumber
                  min={-50}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="hvacReturnTemp" label="回水温度(°C)">
                <InputNumber
                  min={-50}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="outdoorTemp" label="室外温度(°C)">
                <InputNumber
                  min={-50}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="indoorTemp" label="室内温度(°C)">
                <InputNumber
                  min={-50}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="humidity" label="湿度(%)">
                <InputNumber
                  min={0}
                  max={100}
                  precision={1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="occupancyDensity" label="人员密度">
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
};

export default EnergyRecords;