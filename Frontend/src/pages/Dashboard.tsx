import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Space, Select, DatePicker, Spin } from 'antd';
import {
  ThunderboltOutlined,
  AlertOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { energyApi } from '@/api/energy';
import { statisticsApi } from '@/api/statistics';
import { buildingApi } from '@/api/common';
import { Building, TimeSummaryDto } from '@/types/api';

const { RangePicker } = DatePicker;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);

  const [stats, setStats] = useState({
    totalElectricity: 0,
    totalWater: 0,
    totalHvac: 0,
    anomalyCount: 0,
    electricityTrend: 0,
    waterTrend: 0,
  });

  const [chartData, setChartData] = useState<TimeSummaryDto[]>([]);
  const [deviceStatus, setDeviceStatus] = useState({
    normal: 0,
    abnormal: 0,
    offline: 0,
  });

  // 获取建筑列表
  useEffect(() => {
    buildingApi.getAll().then(res => {
      if (res.success && res.data) {
        setBuildings(res.data);
        if (res.data.length > 0) {
          setSelectedBuilding(res.data[0].id);
        }
      }
    });
  }, []);

  // 获取统计数据
  useEffect(() => {
    if (!selectedBuilding) return;

    fetchDashboardData();
  }, [selectedBuilding, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [startTime, endTime] = dateRange;
      const params = {
        buildingId: selectedBuilding,
        startTime: startTime.format('YYYY-MM-DD HH:mm:ss'),
        endTime: endTime.format('YYYY-MM-DD HH:mm:ss'),
      };

      // 并行获取多个数据
      const [summaryRes, anomalyRes, deviceStatusRes] = await Promise.all([
        statisticsApi.getTimeSummary({ ...params, groupBy: 'DAY' }),
        statisticsApi.getAnomalies(params),
        energyApi.getDeviceStatusStats(selectedBuilding),
      ]);

      // 处理汇总数据
      if (summaryRes.success && summaryRes.data) {
        setChartData(summaryRes.data);

        const totals = summaryRes.data.reduce((acc, item) => ({
          electricity: acc.electricity + item.totalElectricity,
          water: acc.water + item.totalWater,
          hvac: acc.hvac + item.totalHvacEnergy,
        }), { electricity: 0, water: 0, hvac: 0 });

        // 计算趋势（比较前后两半时间段）
        const mid = Math.floor(summaryRes.data.length / 2);
        const firstHalf = summaryRes.data.slice(0, mid);
        const secondHalf = summaryRes.data.slice(mid);

        const firstElec = firstHalf.reduce((sum, item) => sum + item.totalElectricity, 0);
        const secondElec = secondHalf.reduce((sum, item) => sum + item.totalElectricity, 0);
        const firstWater = firstHalf.reduce((sum, item) => sum + item.totalWater, 0);
        const secondWater = secondHalf.reduce((sum, item) => sum + item.totalWater, 0);

        setStats({
          totalElectricity: totals.electricity,
          totalWater: totals.water,
          totalHvac: totals.hvac,
          anomalyCount: anomalyRes.data?.length || 0,
          electricityTrend: firstElec ? ((secondElec - firstElec) / firstElec) * 100 : 0,
          waterTrend: firstWater ? ((secondWater - firstWater) / firstWater) * 100 : 0,
        });
      }

      // 设备状态
      if (deviceStatusRes.success && deviceStatusRes.data) {
        setDeviceStatus(deviceStatusRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 电力消耗趋势图配置
  const electricityChartOption: EChartsOption = {
    title: { text: '电力消耗趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: chartData.map(item => dayjs(item.period).format('MM-DD')),
    },
    yAxis: {
      type: 'value',
      name: 'kWh',
    },
    series: [{
      name: '电力消耗',
      type: 'line',
      smooth: true,
      data: chartData.map(item => item.totalElectricity),
      itemStyle: { color: '#1890ff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' },
          ],
        },
      },
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  // 能源类型分布饼图
  const energyDistributionOption: EChartsOption = {
    title: { text: '能源消耗分布' },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      bottom: 0,
    },
    series: [{
      name: '能源类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: {
        show: false,
        position: 'center',
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold',
        },
      },
      labelLine: { show: false },
      data: [
        { value: stats.totalElectricity, name: '电力', itemStyle: { color: '#1890ff' } },
        { value: stats.totalWater * 10, name: '水', itemStyle: { color: '#52c41a' } }, // 乘以10以便可视化
        { value: stats.totalHvac, name: 'HVAC', itemStyle: { color: '#fa8c16' } },
      ],
    }],
  };

  // 设备状态图表
  const deviceStatusOption: EChartsOption = {
    title: { text: '设备状态' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'value',
    },
    yAxis: {
      type: 'category',
      data: ['正常', '异常', '离线'],
    },
    series: [{
      type: 'bar',
      data: [
        { value: deviceStatus.normal, itemStyle: { color: '#52c41a' } },
        { value: deviceStatus.abnormal, itemStyle: { color: '#fa8c16' } },
        { value: deviceStatus.offline, itemStyle: { color: '#f5222d' } },
      ],
      barWidth: 30,
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  };

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* 筛选条件 */}
        <Card>
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="选择建筑"
              value={selectedBuilding}
              onChange={setSelectedBuilding}
              options={buildings.map(b => ({ label: b.buildingName, value: b.id }))}
            />
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
            />
          </Space>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总电力消耗"
                value={stats.totalElectricity}
                precision={2}
                suffix="kWh"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8 }}>
                {stats.electricityTrend > 0 ? (
                  <Space>
                    <RiseOutlined style={{ color: '#f5222d' }} />
                    <span style={{ color: '#f5222d' }}>
                      {Math.abs(stats.electricityTrend).toFixed(1)}%
                    </span>
                  </Space>
                ) : (
                  <Space>
                    <FallOutlined style={{ color: '#52c41a' }} />
                    <span style={{ color: '#52c41a' }}>
                      {Math.abs(stats.electricityTrend).toFixed(1)}%
                    </span>
                  </Space>
                )}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总用水量"
                value={stats.totalWater}
                precision={2}
                suffix="m³"
                valueStyle={{ color: '#52c41a' }}
              />
              <div style={{ marginTop: 8 }}>
                {stats.waterTrend > 0 ? (
                  <Space>
                    <RiseOutlined style={{ color: '#f5222d' }} />
                    <span style={{ color: '#f5222d' }}>
                      {Math.abs(stats.waterTrend).toFixed(1)}%
                    </span>
                  </Space>
                ) : (
                  <Space>
                    <FallOutlined style={{ color: '#52c41a' }} />
                    <span style={{ color: '#52c41a' }}>
                      {Math.abs(stats.waterTrend).toFixed(1)}%
                    </span>
                  </Space>
                )}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="HVAC能耗"
                value={stats.totalHvac}
                precision={2}
                suffix="kWh"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="异常告警"
                value={stats.anomalyCount}
                prefix={<AlertOutlined />}
                valueStyle={{ color: stats.anomalyCount > 0 ? '#f5222d' : '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表 */}
        <Row gutter={16}>
          <Col span={16}>
            <Card>
              <ReactECharts option={electricityChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <ReactECharts option={energyDistributionOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <ReactECharts option={deviceStatusOption} style={{ height: 250 }} />
            </Card>
          </Col>
          <Col span={16}>
            <Card title="实时告警" extra={<a href="/statistics/anomaly">查看全部</a>}>
              {/* 这里可以添加实时告警列表 */}
              <div style={{ height: 210, overflow: 'auto' }}>
                暂无告警信息
              </div>
            </Card>
          </Col>
        </Row>
      </Space>
    </Spin>
  );
};

export default Dashboard;