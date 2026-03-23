import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  TimePicker,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { energyApi } from '@/api/energy';
import {
  reportApi,
  type ReportSchedule,
  type ReportScheduleRequest,
  type ScheduleRunHistory,
  type ScheduleFrequency,
  type Granularity,
} from '@/api/report';
import type { Building } from '@/types/api';

const ScheduledReport: React.FC = () => {
  const [tasks, setTasks] = useState<ReportSchedule[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState<ScheduleRunHistory[]>([]);
  const [historyTargetScheduleId, setHistoryTargetScheduleId] = useState<number | undefined>(undefined);
  const [historyPagination, setHistoryPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [editingTask, setEditingTask] = useState<ReportSchedule | null>(null);
  const [form] = Form.useForm();

  const loadRunHistory = async (scheduleId: number, page = 1, pageSize = 10) => {
    setHistoryLoading(true);
    try {
      const res = await reportApi.getScheduleRuns(scheduleId, {
        page: page - 1,
        size: pageSize,
      });
      if (res.code === 0 && res.data) {
        setHistoryRows(res.data.content || []);
        setHistoryPagination({
          current: res.data.number + 1,
          pageSize: res.data.size,
          total: res.data.totalElements,
        });
      }
    } catch (error) {
      message.error('加载执行历史失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getSchedules();
      if (res.code === 0 && res.data) {
        setTasks(res.data);

        const targetId = historyTargetScheduleId ?? res.data[0]?.id;
        if (targetId) {
          setHistoryTargetScheduleId(targetId);
          loadRunHistory(targetId, 1, historyPagination.pageSize);
        } else {
          setHistoryRows([]);
          setHistoryPagination((prev) => ({ ...prev, current: 1, total: 0 }));
        }
      }
    } catch (error) {
      message.error('加载定时报表任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async () => {
    try {
      const res = await energyApi.getBuildings();
      if (res.code === 0 && res.data) {
        setBuildings(res.data);
      }
    } catch (error) {
      message.error('加载建筑列表失败');
    }
  };

  useEffect(() => {
    loadTasks();
    loadBuildings();
  }, []);

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({
      frequency: 'DAILY',
      granularity: 'day',
      runTime: dayjs('09:00', 'HH:mm'),
      enabled: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (task: ReportSchedule) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      runTime: dayjs(task.runTime, 'HH:mm'),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: ReportScheduleRequest = {
        name: values.name,
        buildingId: values.buildingId,
        frequency: values.frequency,
        granularity: values.granularity,
        runTime: values.runTime.format('HH:mm'),
        receivers: values.receivers,
        enabled: values.enabled,
      };

      if (editingTask) {
        await reportApi.updateSchedule(editingTask.id, payload);
        message.success('任务更新成功');
      } else {
        await reportApi.createSchedule(payload);
        message.success('任务创建成功');
      }

      setModalOpen(false);
      loadTasks();
    } catch (error) {
      // 表单校验失败时不做额外处理
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (id: number, enabled: boolean) => {
    try {
      await reportApi.updateScheduleEnabled(id, enabled);
      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, enabled } : item)));
      message.success(enabled ? '任务已启用' : '任务已停用');
    } catch (error) {
      message.error('更新状态失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await reportApi.deleteSchedule(id);
      message.success('任务已删除');
      loadTasks();
    } catch (error) {
      message.error('删除任务失败');
    }
  };

  const handleRunNow = async (task: ReportSchedule) => {
    try {
      setRunningId(task.id);
      const runRes = await reportApi.runScheduleNow(task.id);
      if (runRes.code !== 0 || !runRes.data) {
        return;
      }

      const exportBlob = await reportApi.exportReport({
        buildingId: runRes.data.buildingId,
        start: runRes.data.start,
        end: runRes.data.end,
        granularity: runRes.data.granularity,
      });

      const url = window.URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${task.name}_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('已执行并下载报表');
      loadTasks();
      if (historyTargetScheduleId === task.id) {
        loadRunHistory(task.id, 1, historyPagination.pageSize);
      }
    } catch (error) {
      message.error('执行失败，请稍后重试');
    } finally {
      setRunningId(null);
    }
  };

  const frequencyLabelMap: Record<ScheduleFrequency, string> = {
    DAILY: '每天',
    WEEKLY: '每周',
    MONTHLY: '每月',
  };

  const granularityLabelMap: Record<Granularity, string> = {
    hour: '小时',
    day: '天',
    month: '月',
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => Number(b.enabled) - Number(a.enabled));
  }, [tasks]);

  const columns = [
    { title: '任务名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '建筑', dataIndex: 'buildingName', key: 'buildingName', width: 140 },
    {
      title: '频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 100,
      render: (value: ScheduleFrequency) => frequencyLabelMap[value],
    },
    {
      title: '粒度',
      dataIndex: 'granularity',
      key: 'granularity',
      width: 100,
      render: (value: Granularity) => granularityLabelMap[value],
    },
    { title: '执行时间', dataIndex: 'runTime', key: 'runTime', width: 100 },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean) => (enabled ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    {
      title: '最近执行',
      dataIndex: 'lastRunAt',
      key: 'lastRunAt',
      width: 180,
      render: (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 320,
      render: (_: unknown, row: ReportSchedule) => (
        <Space>
          <Switch
            size="small"
            checked={row.enabled}
            checkedChildren="启用"
            unCheckedChildren="停用"
            onChange={(checked) => handleToggleEnabled(row.id, checked)}
          />
          <Button size="small" onClick={() => openEditModal(row)}>编辑</Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            loading={runningId === row.id}
            onClick={() => handleRunNow(row)}
          >
            立即执行
          </Button>
          <Popconfirm title="确定删除该任务吗？" onConfirm={() => handleDelete(row.id)} okText="确定" cancelText="取消">
            <Button size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    {
      title: '触发时间',
      dataIndex: 'triggeredAt',
      key: 'triggeredAt',
      width: 180,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value: ScheduleRunHistory['status']) => (
        value === 'SUCCESS' ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>
      ),
    },
    {
      title: '触发来源',
      dataIndex: 'triggerSource',
      key: 'triggerSource',
      width: 100,
      render: (value: ScheduleRunHistory['triggerSource']) => (
        value === 'AUTO' ? <Tag color="blue">自动</Tag> : <Tag color="purple">手动</Tag>
      ),
    },
    {
      title: '统计窗口',
      key: 'window',
      width: 360,
      render: (_: unknown, row: ScheduleRunHistory) => (
        `${dayjs(row.windowStart).format('YYYY-MM-DD HH:mm:ss')} ~ ${dayjs(row.windowEnd).format('YYYY-MM-DD HH:mm:ss')}`
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (value?: string) => value || '-',
    },
  ];

  return (
    <>
      <Card
        title="定时报表"
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建任务
          </Button>
        )}
      >
        <p style={{ marginBottom: 0, color: '#666' }}>
          当前版本支持后端任务持久化管理，任务可启停、编辑、删除，并可立即执行导出报表。
        </p>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={sortedTasks}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1200 }}
          locale={{ emptyText: '暂无定时报表任务，点击“新建任务”开始' }}
        />
      </Card>

      <Card
        title="执行历史"
        style={{ marginTop: 16 }}
        extra={(
          <Space>
            <Select
              placeholder="选择任务查看历史"
              style={{ width: 260 }}
              value={historyTargetScheduleId}
              onChange={(value) => {
                setHistoryTargetScheduleId(value);
                loadRunHistory(value, 1, historyPagination.pageSize);
              }}
              options={tasks.map((task) => ({ label: task.name, value: task.id }))}
            />
            <Button
              onClick={() => {
                if (historyTargetScheduleId) {
                  loadRunHistory(historyTargetScheduleId, historyPagination.current, historyPagination.pageSize);
                }
              }}
              disabled={!historyTargetScheduleId}
            >
              刷新历史
            </Button>
          </Space>
        )}
      >
        <Table
          rowKey="id"
          loading={historyLoading}
          columns={historyColumns}
          dataSource={historyRows}
          pagination={{
            ...historyPagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条执行记录`,
            onChange: (page, pageSize) => {
              if (historyTargetScheduleId) {
                loadRunHistory(historyTargetScheduleId, page, pageSize);
              }
            },
          }}
          locale={{ emptyText: historyTargetScheduleId ? '暂无执行记录' : '请选择任务后查看执行历史' }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑定时报表任务' : '新建定时报表任务'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="任务名称" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="例如：办公楼日报" maxLength={50} />
          </Form.Item>
          <Form.Item name="buildingId" label="建筑" rules={[{ required: true, message: '请选择建筑' }]}>
            <Select
              placeholder="选择建筑"
              options={buildings.map((b) => ({ label: b.buildingName, value: b.id }))}
            />
          </Form.Item>
          <Form.Item name="frequency" label="执行频率" rules={[{ required: true, message: '请选择执行频率' }]}>
            <Select
              options={[
                { label: '每天', value: 'DAILY' },
                { label: '每周', value: 'WEEKLY' },
                { label: '每月', value: 'MONTHLY' },
              ]}
            />
          </Form.Item>
          <Form.Item name="granularity" label="统计粒度" rules={[{ required: true, message: '请选择粒度' }]}>
            <Select
              options={[
                { label: '小时', value: 'hour' },
                { label: '天', value: 'day' },
                { label: '月', value: 'month' },
              ]}
            />
          </Form.Item>
          <Form.Item name="runTime" label="执行时间" rules={[{ required: true, message: '请选择执行时间' }]}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="receivers" label="接收人（可选）">
            <Input placeholder="多个邮箱可用逗号分隔" />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ScheduledReport;

