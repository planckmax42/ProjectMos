import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { energyApi } from '@/api/energy';
import { statisticsApi } from '@/api/statistics';
import type { AnomalyDto, Building } from '@/types/api';

const { RangePicker } = DatePicker;

const AnomalyDetection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [records, setRecords] = useState<AnomalyDto[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await energyApi.getBuildings();
        if (res.code === 0 && res.data) {
          setBuildings(res.data);
          const firstBuilding = res.data[0];
          form.setFieldsValue({
            buildingId: firstBuilding?.id,
            dateRange: [dayjs().subtract(7, 'day'), dayjs()],
          });
          if (firstBuilding) {
            fetchData(firstBuilding.id, [dayjs().subtract(7, 'day'), dayjs()]);
          }
        }
      } catch (error) {
        message.error('加载建筑列表失败');
      }
    };
    init();
  }, []);

  const fetchData = async (buildingId: number, dateRange: [dayjs.Dayjs, dayjs.Dayjs]) => {
    setLoading(true);
    try {
      const res = await statisticsApi.getAnomalyAnalysis({
        buildingId,
        start: dateRange[0].format('YYYY-MM-DDTHH:mm:ss'),
        end: dateRange[1].format('YYYY-MM-DDTHH:mm:ss'),
      });
      if (res.code === 0 && res.data) {
        setRecords(res.data);
      }
    } catch (error) {
      message.error('获取异常检测结果失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    try {
      const values = await form.validateFields();
      fetchData(values.buildingId, values.dateRange);
    } catch (error) {
      // 表单校验失败时不做额外处理
    }
  };

  const stats = useMemo(() => {
    if (records.length === 0) {
      return { count: 0, maxAbsZScore: 0, maxChangeRate: 0 };
    }
    const maxAbsZScore = Math.max(...records.map((item) => Math.abs(Number(item.zScore || 0))));
    const maxChangeRate = Math.max(...records.map((item) => Math.abs(Number(item.changeRate || 0))));
    return {
      count: records.length,
      maxAbsZScore,
      maxChangeRate,
    };
  }, [records]);

  const chartOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 4 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: records.map((item) => dayjs(item.recordTime).format('MM-DD HH:mm')),
      axisLabel: { rotate: 35 },
    },
    yAxis: [
      { type: 'value', name: '电力(kWh)' },
      { type: 'value', name: 'Z-Score' },
    ],
    series: [
      {
        name: '电力',
        type: 'bar',
        data: records.map((item) => Number(item.electricityKwh || 0)),
      },
      {
        name: 'Z-Score',
        type: 'line',
        yAxisIndex: 1,
        data: records.map((item) => Number(item.zScore || 0)),
      },
    ],
  };

  const columns = [
    { title: '记录ID', dataIndex: 'recordId', key: 'recordId', width: 100 },
    {
      title: '记录时间',
      dataIndex: 'recordTime',
      key: 'recordTime',
      width: 180,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '电力(kWh)',
      dataIndex: 'electricityKwh',
      key: 'electricityKwh',
      align: 'right' as const,
      render: (value: number) => Number(value || 0).toFixed(2),
    },
    {
      title: 'Z-Score',
      dataIndex: 'zScore',
      key: 'zScore',
      align: 'right' as const,
      sorter: (a: AnomalyDto, b: AnomalyDto) => Number(a.zScore || 0) - Number(b.zScore || 0),
      render: (value: number) => {
        const numeric = Number(value || 0);
        const color = Math.abs(numeric) >= 3 ? 'red' : 'orange';
        return <Tag color={color}>{numeric.toFixed(2)}</Tag>;
      },
    },
    {
      title: '变化率',
      dataIndex: 'changeRate',
      key: 'changeRate',
      align: 'right' as const,
      render: (value: number) => `${(Number(value || 0) * 100).toFixed(2)}%`,
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="异常检测">
        <Form form={form} layout="inline">
          <Form.Item name="buildingId" label="建筑" rules={[{ required: true, message: '请选择建筑' }]}> 
            <Select
              placeholder="选择建筑"
              style={{ width: 220 }}
              options={buildings.map((b) => ({ label: b.buildingName, value: b.id }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="时间范围" rules={[{ required: true, message: '请选择时间范围' }]}> 
            <RangePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Button type="primary" onClick={handleQuery}>查询</Button>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Card>
            <Empty description="当前条件下未发现异常" />
          </Card>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={8}><Card><Statistic title="异常记录数" value={stats.count} /></Card></Col>
              <Col span={8}><Card><Statistic title="最大|Z-Score|" value={stats.maxAbsZScore} precision={2} /></Card></Col>
              <Col span={8}><Card><Statistic title="最大变化率" value={stats.maxChangeRate * 100} precision={2} suffix="%" /></Card></Col>
            </Row>

            <Card title="异常趋势" style={{ marginTop: 16 }}>
              <ReactECharts option={chartOption} style={{ height: 360 }} />
            </Card>

            <Card title="异常记录明细" style={{ marginTop: 16 }}>
              <Table
                rowKey="recordId"
                columns={columns}
                dataSource={records}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 980 }}
              />
            </Card>
          </>
        )}
      </Spin>
    </Space>
  );
};

export default AnomalyDetection;