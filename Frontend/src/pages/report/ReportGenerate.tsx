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
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import { energyApi } from '@/api/energy';
import { reportApi } from '@/api/report';
import { statisticsApi } from '@/api/statistics';
import type { Building, StatisticsQuery, TimeSummaryDto } from '@/types/api';

const { RangePicker } = DatePicker;

type Granularity = 'hour' | 'day' | 'month';

const ReportGenerate: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [previewData, setPreviewData] = useState<TimeSummaryDto[]>([]);
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
            fetchPreview(firstBuilding.id, [dayjs().subtract(7, 'day'), dayjs()], 'day');
          }
        }
      } catch (error) {
        message.error('加载建筑列表失败');
      }
    };
    init();
  }, []);

  const fetchPreview = async (
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
        setPreviewData(res.data);
      }
    } catch (error) {
      message.error('获取预览数据失败');
      setPreviewData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const values = await form.validateFields();
      fetchPreview(values.buildingId, values.dateRange, values.granularity);
    } catch (error) {
      // 表单校验失败时不做额外处理
    }
  };

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      setExporting(true);
      const blob = await reportApi.exportReport({
        buildingId: values.buildingId,
        start: values.dateRange[0].format('YYYY-MM-DDTHH:mm:ss'),
        end: values.dateRange[1].format('YYYY-MM-DDTHH:mm:ss'),
        granularity: values.granularity,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `energy_report_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('报表导出成功');
    } catch (error) {
      message.error('报表导出失败');
    } finally {
      setExporting(false);
    }
  };

  const summary = useMemo(() => {
    return previewData.reduce(
      (acc, row) => ({
        electricity: acc.electricity + Number(row.electricityKwh || 0),
        water: acc.water + Number(row.waterM3 || 0),
        hvac: acc.hvac + Number(row.hvacKwh || 0),
      }),
      { electricity: 0, water: 0, hvac: 0 },
    );
  }, [previewData]);

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
      <Card title="生成报表">
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
          <Button type="primary" onClick={handlePreview}>预览</Button>
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={handleExport}>导出CSV</Button>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {previewData.length === 0 ? (
          <Card>
            <Empty description="暂无预览数据，先选择条件后点击预览" />
          </Card>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={8}><Card><Statistic title="总电力" value={summary.electricity} precision={2} suffix="kWh" /></Card></Col>
              <Col span={8}><Card><Statistic title="总用水" value={summary.water} precision={2} suffix="m³" /></Card></Col>
              <Col span={8}><Card><Statistic title="总HVAC" value={summary.hvac} precision={2} suffix="kWh" /></Card></Col>
            </Row>

            <Card title="报表预览" style={{ marginTop: 16 }}>
              <Table rowKey="timeBucket" columns={columns} dataSource={previewData} pagination={{ pageSize: 10 }} />
            </Card>
          </>
        )}
      </Spin>
    </Space>
  );
};

export default ReportGenerate;