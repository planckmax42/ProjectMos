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
  message,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { ReloadOutlined } from '@ant-design/icons';
import { energyApi } from '@/api/energy';
import { statisticsApi } from '@/api/statistics';
import type { Building, StatisticsQuery, TimeSummaryDto } from '@/types/api';

const { RangePicker } = DatePicker;

type Granularity = 'hour' | 'day' | 'month';

const EnergySummary: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [records, setRecords] = useState<TimeSummaryDto[]>([]);
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
            granularity: 'day',
          });
          if (firstBuilding) {
            fetchData(firstBuilding.id, [dayjs().subtract(7, 'day'), dayjs()], 'day');
          }
        }
      } catch (error) {
        message.error('加载建筑列表失败');
      }
    };

    init();
  }, []);

  const fetchData = async (
    buildingId: number,
    dateRange: [dayjs.Dayjs, dayjs.Dayjs],
    granularity: Granularity,
  ) => {
    setLoading(true);
    try {
      const params: StatisticsQuery = {
        buildingId,
        start: dateRange[0].format('YYYY-MM-DDTHH:mm:ss'),
        end: dateRange[1].format('YYYY-MM-DDTHH:mm:ss'),
        granularity,
      };
      const res = await statisticsApi.getTimeSummary(params);
      if (res.code === 0 && res.data) {
        setRecords(res.data);
      }
    } catch (error) {
      message.error('获取能源汇总失败');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async () => {
    try {
      const values = await form.validateFields();
      fetchData(values.buildingId, values.dateRange, values.granularity);
    } catch (error) {
      // 表单校验失败时不做额外处理
    }
  };

  const totals = useMemo(() => {
    const totalElectricity = records.reduce((sum, item) => sum + Number(item.electricityKwh || 0), 0);
    const totalWater = records.reduce((sum, item) => sum + Number(item.waterM3 || 0), 0);
    const totalHvac = records.reduce((sum, item) => sum + Number(item.hvacKwh || 0), 0);
    return {
      totalElectricity,
      totalWater,
      totalHvac,
      averageElectricity: records.length > 0 ? totalElectricity / records.length : 0,
    };
  }, [records]);

  const chartOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 4 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: records.map((item) => item.timeBucket),
      axisLabel: { rotate: 35 },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '电力(kWh)',
        type: 'line',
        smooth: true,
        data: records.map((item) => Number(item.electricityKwh || 0)),
      },
      {
        name: '水(m³)',
        type: 'line',
        smooth: true,
        data: records.map((item) => Number(item.waterM3 || 0)),
      },
      {
        name: 'HVAC(kWh)',
        type: 'line',
        smooth: true,
        data: records.map((item) => Number(item.hvacKwh || 0)),
      },
    ],
  };

  const columns = [
    { title: '时间桶', dataIndex: 'timeBucket', key: 'timeBucket' },
    {
      title: '电力(kWh)',
      dataIndex: 'electricityKwh',
      key: 'electricityKwh',
      align: 'right' as const,
      render: (value: number) => Number(value || 0).toFixed(2),
    },
    {
      title: '用水(m³)',
      dataIndex: 'waterM3',
      key: 'waterM3',
      align: 'right' as const,
      render: (value: number) => Number(value || 0).toFixed(2),
    },
    {
      title: 'HVAC(kWh)',
      dataIndex: 'hvacKwh',
      key: 'hvacKwh',
      align: 'right' as const,
      render: (value: number) => Number(value || 0).toFixed(2),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="能源汇总">
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
          <Form.Item name="granularity" label="粒度">
            <Select
              style={{ width: 120 }}
              options={[
                { label: '小时', value: 'hour' },
                { label: '天', value: 'day' },
                { label: '月', value: 'month' },
              ]}
            />
          </Form.Item>
          <Button type="primary" onClick={handleQuery}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleQuery}>刷新</Button>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Card>
            <Empty description="当前条件下暂无数据" />
          </Card>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={6}><Card><Statistic title="总电力" value={totals.totalElectricity} precision={2} suffix="kWh" /></Card></Col>
              <Col span={6}><Card><Statistic title="总用水" value={totals.totalWater} precision={2} suffix="m³" /></Card></Col>
              <Col span={6}><Card><Statistic title="总HVAC" value={totals.totalHvac} precision={2} suffix="kWh" /></Card></Col>
              <Col span={6}><Card><Statistic title="平均电力" value={totals.averageElectricity} precision={2} suffix="kWh" /></Card></Col>
            </Row>
            <Card title="趋势图" style={{ marginTop: 16 }}>
              <ReactECharts option={chartOption} style={{ height: 360 }} />
            </Card>
            <Card title="明细数据" style={{ marginTop: 16 }}>
              <Table rowKey="timeBucket" columns={columns} dataSource={records} pagination={{ pageSize: 10 }} />
            </Card>
          </>
        )}
      </Spin>
    </Space>
  );
};

export default EnergySummary;