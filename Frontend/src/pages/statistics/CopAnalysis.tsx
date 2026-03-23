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
import type { Building, CopDto, StatisticsQuery } from '@/types/api';

const { RangePicker } = DatePicker;

type Granularity = 'hour' | 'day' | 'month';
const COP_WARNING_THRESHOLD = 1.5;

const CopAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [records, setRecords] = useState<CopDto[]>([]);
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
      const res = await statisticsApi.getCopStatistics(params);
      if (res.code === 0 && res.data) {
        setRecords(res.data);
      }
    } catch (error) {
      message.error('获取COP分析失败');
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

  const stats = useMemo(() => {
    const values = records.map((item) => Number(item.cop || 0));
    if (values.length === 0) {
      return { avg: 0, max: 0, min: 0, warningCount: 0 };
    }

    const sum = values.reduce((acc, item) => acc + item, 0);
    return {
      avg: sum / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      warningCount: values.filter((v) => v < COP_WARNING_THRESHOLD).length,
    };
  }, [records]);

  const chartOption: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: records.map((item) => item.timeBucket), axisLabel: { rotate: 35 } },
    yAxis: { type: 'value', name: 'COP' },
    series: [
      {
        name: 'COP',
        type: 'line',
        smooth: true,
        data: records.map((item) => Number(item.cop || 0)),
        markLine: {
          data: [{ yAxis: COP_WARNING_THRESHOLD, name: '告警阈值' }],
        },
      },
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  const columns = [
    { title: '时间桶', dataIndex: 'timeBucket', key: 'timeBucket' },
    {
      title: 'COP值',
      dataIndex: 'cop',
      key: 'cop',
      align: 'right' as const,
      render: (value: number) => Number(value || 0).toFixed(4),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, row: CopDto) => {
        const cop = Number(row.cop || 0);
        return cop < COP_WARNING_THRESHOLD ? <Tag color="red">偏低</Tag> : <Tag color="green">正常</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card title="COP分析">
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
        </Form>
      </Card>

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Card>
            <Empty description="当前条件下暂无COP数据" />
          </Card>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={6}><Card><Statistic title="平均COP" value={stats.avg} precision={4} /></Card></Col>
              <Col span={6}><Card><Statistic title="最高COP" value={stats.max} precision={4} /></Card></Col>
              <Col span={6}><Card><Statistic title="最低COP" value={stats.min} precision={4} /></Card></Col>
              <Col span={6}><Card><Statistic title="低COP告警数" value={stats.warningCount} /></Card></Col>
            </Row>

            <Card title="COP趋势" style={{ marginTop: 16 }}>
              <ReactECharts option={chartOption} style={{ height: 360 }} />
            </Card>

            <Card title="COP明细" style={{ marginTop: 16 }}>
              <Table rowKey="timeBucket" columns={columns} dataSource={records} pagination={{ pageSize: 10 }} />
            </Card>
          </>
        )}
      </Spin>
    </Space>
  );
};

export default CopAnalysis;