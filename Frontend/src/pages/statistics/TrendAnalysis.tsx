import React, { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Space, Row, Col, Spin, Radio, Empty, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { statisticsApi } from '@/api/statistics';
import { energyApi } from '@/api/energy';
import type { Building } from '@/types/api';

dayjs.extend(weekOfYear);

const { RangePicker } = DatePicker;

type EnergyType = 'ELECTRICITY' | 'WATER' | 'HVAC';
type TimeInterval = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';

const TrendAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);
  const [energyType, setEnergyType] = useState<EnergyType>('ELECTRICITY');
  const [interval, setInterval] = useState<TimeInterval>('DAY');

  const [trendData, setTrendData] = useState<{
    timestamps: string[];
    values: number[];
    trend: 'UP' | 'DOWN' | 'STABLE';
    changeRate: number;
  } | null>(null);

  const [comparisonData, setComparisonData] = useState<{
    current: number;
    previous: number;
    changePercent: number;
  } | null>(null);

  // 获取建筑列表
  useEffect(() => {
    energyApi.getBuildings().then(res => {
      if (res.code === 0 && res.data) {
        setBuildings(res.data);
        if (res.data.length > 0) {
          setSelectedBuilding(res.data[0].id);
        }
      }
    });
  }, []);

  // 获取趋势数据
  useEffect(() => {
    if (!selectedBuilding) return;
    fetchTrendData();
  }, [selectedBuilding, dateRange, energyType, interval]);

  const fetchTrendData = async () => {
    if (!selectedBuilding) return;

    setLoading(true);
    try {
      const [startTime, endTime] = dateRange;

      // 映射前端的 interval 到后端的 granularity
      const granularityMap: Record<TimeInterval, 'hour' | 'day' | 'month'> = {
        'HOUR': 'hour',
        'DAY': 'day',
        'WEEK': 'day', // 周视图使用日数据后聚合
        'MONTH': 'month',
      };

      const params = {
        buildingId: selectedBuilding,
        start: startTime.format('YYYY-MM-DDTHH:mm:ss'),
        end: endTime.format('YYYY-MM-DDTHH:mm:ss'),
        granularity: granularityMap[interval],
      };

      const res = await statisticsApi.getTimeSummary(params);
      if (res.code === 0 && res.data) {
        // 将后端的 TimeSummaryDto[] 转换为前端需要的格式
        const timestamps = res.data.map(item => item.timeBucket);

        // 根据 energyType 选择对应的值
        const values = res.data.map(item => {
          switch (energyType) {
            case 'ELECTRICITY': return item.electricityKwh;
            case 'WATER': return item.waterM3;
            case 'HVAC': return item.hvacKwh;
            default: return 0;
          }
        });

        // 计算趋势
        let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
        let changeRate = 0;

        if (values.length >= 2) {
          const first = values[0];
          const last = values[values.length - 1];
          if (first > 0) {
            changeRate = ((last - first) / first) * 100;
            if (changeRate > 5) trend = 'UP';
            else if (changeRate < -5) trend = 'DOWN';
          }
        }

        setTrendData({ timestamps, values, trend, changeRate });

        // 计算对比数据
        if (values.length > 1) {
          const mid = Math.floor(values.length / 2);
          const firstHalf = values.slice(0, mid);
          const secondHalf = values.slice(mid);

          const firstSum = firstHalf.reduce((a, b) => a + b, 0);
          const secondSum = secondHalf.reduce((a, b) => a + b, 0);

          setComparisonData({
            current: secondSum,
            previous: firstSum,
            changePercent: firstSum > 0 ? ((secondSum - firstSum) / firstSum) * 100 : 0,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取能源类型名称
  const getEnergyTypeName = (type: EnergyType) => {
    const names = {
      ELECTRICITY: '电力',
      WATER: '用水',
      HVAC: 'HVAC',
    };
    return names[type];
  };

  // 获取能源单位
  const getEnergyUnit = (type: EnergyType) => {
    const units = {
      ELECTRICITY: 'kWh',
      WATER: 'm³',
      HVAC: 'kWh',
    };
    return units[type];
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    const date = dayjs(timestamp);
    switch (interval) {
      case 'HOUR':
        return date.format('MM-DD HH:00');
      case 'DAY':
        return date.format('MM-DD');
      case 'WEEK':
        return `第${date.week()}周`;
      case 'MONTH':
        return date.format('YYYY-MM');
      default:
        return date.format('MM-DD');
    }
  };

  // 主趋势图配置
  const mainChartOption: EChartsOption = trendData ? {
    title: {
      text: `${getEnergyTypeName(energyType)}消耗趋势`,
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0];
        return `${data.name}<br/>${data.seriesName}: ${data.value.toFixed(2)} ${getEnergyUnit(energyType)}`;
      },
    },
    xAxis: {
      type: 'category',
      data: trendData.timestamps.map(formatTimestamp),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: getEnergyUnit(energyType),
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: getEnergyTypeName(energyType),
        type: 'line',
        smooth: true,
        data: trendData.values,
        itemStyle: {
          color: energyType === 'ELECTRICITY' ? '#1890ff' :
                 energyType === 'WATER' ? '#52c41a' : '#fa8c16',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              {
                offset: 0,
                color: energyType === 'ELECTRICITY' ? 'rgba(24, 144, 255, 0.3)' :
                       energyType === 'WATER' ? 'rgba(82, 196, 26, 0.3)' :
                       'rgba(250, 140, 22, 0.3)',
              },
              {
                offset: 1,
                color: energyType === 'ELECTRICITY' ? 'rgba(24, 144, 255, 0.05)' :
                       energyType === 'WATER' ? 'rgba(82, 196, 26, 0.05)' :
                       'rgba(250, 140, 22, 0.05)',
              },
            ],
          },
        },
        markLine: {
          data: [
            { type: 'average', name: '平均值' },
          ],
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
  } : {};

  // 移动平均图配置
  const movingAverageOption: EChartsOption = trendData ? {
    title: {
      text: '移动平均趋势',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['实际值', '7日移动平均'],
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: trendData.timestamps.map(formatTimestamp),
      axisLabel: {
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: getEnergyUnit(energyType),
    },
    series: [
      {
        name: '实际值',
        type: 'line',
        data: trendData.values,
        itemStyle: { color: '#1890ff' },
      },
      {
        name: '7日移动平均',
        type: 'line',
        smooth: true,
        data: calculateMovingAverage(trendData.values, 7),
        itemStyle: { color: '#f5222d' },
        lineStyle: { width: 2, type: 'dashed' },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
  } : {};

  // 计算移动平均
  function calculateMovingAverage(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(data[i]);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    return result;
  }

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* 筛选条件 */}
      <Card>
        <Space size="large">
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
          <Radio.Group value={energyType} onChange={(e) => setEnergyType(e.target.value)}>
            <Radio.Button value="ELECTRICITY">电力</Radio.Button>
            <Radio.Button value="WATER">用水</Radio.Button>
            <Radio.Button value="HVAC">HVAC</Radio.Button>
          </Radio.Group>
          <Radio.Group value={interval} onChange={(e) => setInterval(e.target.value)}>
            <Radio.Button value="HOUR">小时</Radio.Button>
            <Radio.Button value="DAY">天</Radio.Button>
            <Radio.Button value="WEEK">周</Radio.Button>
            <Radio.Button value="MONTH">月</Radio.Button>
          </Radio.Group>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {trendData ? (
          <>
            {/* 统计卡片 */}
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总消耗"
                    value={trendData.values.reduce((a, b) => a + b, 0)}
                    precision={2}
                    suffix={getEnergyUnit(energyType)}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均值"
                    value={trendData.values.reduce((a, b) => a + b, 0) / trendData.values.length}
                    precision={2}
                    suffix={getEnergyUnit(energyType)}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="峰值"
                    value={Math.max(...trendData.values)}
                    precision={2}
                    suffix={getEnergyUnit(energyType)}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="趋势"
                    value={Math.abs(trendData.changeRate)}
                    precision={1}
                    prefix={trendData.trend === 'UP' ?
                      <ArrowUpOutlined style={{ color: '#f5222d' }} /> :
                      trendData.trend === 'DOWN' ?
                      <ArrowDownOutlined style={{ color: '#52c41a' }} /> :
                      null
                    }
                    suffix="%"
                    valueStyle={{
                      color: trendData.trend === 'UP' ? '#f5222d' :
                             trendData.trend === 'DOWN' ? '#52c41a' :
                             '#000',
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* 主趋势图 */}
            <Card>
              <ReactECharts option={mainChartOption} style={{ height: 400 }} />
            </Card>

            {/* 移动平均图 */}
            <Card>
              <ReactECharts option={movingAverageOption} style={{ height: 300 }} />
            </Card>

            {/* 对比分析 */}
            {comparisonData && (
              <Card title="期间对比分析">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="前期总量"
                      value={comparisonData.previous}
                      precision={2}
                      suffix={getEnergyUnit(energyType)}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="后期总量"
                      value={comparisonData.current}
                      precision={2}
                      suffix={getEnergyUnit(energyType)}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="变化率"
                      value={Math.abs(comparisonData.changePercent)}
                      precision={1}
                      prefix={comparisonData.changePercent > 0 ?
                        <ArrowUpOutlined /> : <ArrowDownOutlined />
                      }
                      suffix="%"
                      valueStyle={{
                        color: comparisonData.changePercent > 0 ? '#f5222d' : '#52c41a',
                      }}
                    />
                  </Col>
                </Row>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <Empty description="暂无数据" />
          </Card>
        )}
      </Spin>
    </Space>
  );
};

export default TrendAnalysis;