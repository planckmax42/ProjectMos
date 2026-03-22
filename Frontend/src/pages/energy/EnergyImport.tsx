import React, { useState } from 'react';
import {
  Card, Upload, Button, message, Alert, Table, Tag, Space, Progress, Typography
} from 'antd';
import {
  InboxOutlined, CloudUploadOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined
} from '@ant-design/icons';
import type { UploadProps, ColumnsType } from 'antd/es/table';
import type { RcFile } from 'antd/es/upload';
import { energyApi } from '@/api/energy';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

interface ImportResult {
  fileName: string;
  totalRows: number;
  imported: number;
  failed: number;
  errors: string[];
  status: 'success' | 'error' | 'partial';
  timestamp: string;
}

const EnergyImport: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [importHistory, setImportHistory] = useState<ImportResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  const handleUpload = async (file: RcFile) => {
    // 验证文件类型
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    if (!isCSV) {
      message.error('只支持CSV文件格式！');
      return false;
    }

    // 验证文件大小 (10MB)
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过10MB！');
      return false;
    }

    setUploading(true);
    setCurrentProgress(30);

    try {
      const result = await energyApi.importCsv(file);
      setCurrentProgress(100);

      if (result.success && result.data) {
        const { imported, failed, errors } = result.data;
        const totalRows = imported + failed;

        let status: 'success' | 'error' | 'partial' = 'success';
        if (failed > 0 && imported === 0) {
          status = 'error';
        } else if (failed > 0) {
          status = 'partial';
        }

        const importResult: ImportResult = {
          fileName: file.name,
          totalRows,
          imported,
          failed,
          errors: errors || [],
          status,
          timestamp: new Date().toLocaleString(),
        };

        setImportHistory([importResult, ...importHistory]);

        if (status === 'success') {
          message.success(`成功导入 ${imported} 条记录`);
        } else if (status === 'partial') {
          message.warning(`部分导入成功: ${imported} 条成功，${failed} 条失败`);
        } else {
          message.error(`导入失败: 所有 ${failed} 条记录均失败`);
        }
      }
    } catch (error) {
      message.error('文件上传失败，请检查文件格式');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setCurrentProgress(0);
    }

    return false; // 阻止自动上传
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.csv',
    showUploadList: false,
    beforeUpload: handleUpload,
  };

  const columns: ColumnsType<ImportResult> = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName',
      render: (text) => (
        <Space>
          <FileTextOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = {
          success: { color: 'success', text: '成功', icon: <CheckCircleOutlined /> },
          error: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
          partial: { color: 'warning', text: '部分成功', icon: <CheckCircleOutlined /> },
        };
        const { color, text, icon } = config[status];
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: '总行数',
      dataIndex: 'totalRows',
      key: 'totalRows',
      align: 'center',
    },
    {
      title: '成功',
      dataIndex: 'imported',
      key: 'imported',
      align: 'center',
      render: (value) => <Text type="success">{value}</Text>,
    },
    {
      title: '失败',
      dataIndex: 'failed',
      key: 'failed',
      align: 'center',
      render: (value) => value > 0 ? <Text type="danger">{value}</Text> : <Text>0</Text>,
    },
    {
      title: '导入时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: '错误信息',
      dataIndex: 'errors',
      key: 'errors',
      width: 300,
      render: (errors) => {
        if (!errors || errors.length === 0) {
          return <Text type="secondary">无</Text>;
        }
        return (
          <Paragraph
            ellipsis={{
              rows: 2,
              expandable: true,
              symbol: '展开',
            }}
            style={{ marginBottom: 0 }}
          >
            {errors.join('; ')}
          </Paragraph>
        );
      },
    },
  ];

  // 下载模板
  const downloadTemplate = () => {
    const headers = [
      'buildingId',
      'deviceId',
      'recordTime',
      'electricityConsumption',
      'waterConsumption',
      'hvacEnergyConsumption',
      'hvacSupplyTemp',
      'hvacReturnTemp',
      'outdoorTemp',
      'indoorTemp',
      'humidity',
      'occupancyDensity',
      'deviceStatus'
    ];

    const sampleData = [
      '1',
      '1',
      '2024-01-01 00:00:00',
      '150.5',
      '12.3',
      '80.2',
      '7.0',
      '12.0',
      '5.0',
      '22.0',
      '60.0',
      '0.8',
      'NORMAL'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'energy_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success('模板下载成功');
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* 使用说明 */}
      <Card>
        <Alert
          message="CSV文件导入说明"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>支持CSV格式文件，文件大小不超过10MB</li>
              <li>请按照模板格式准备数据，确保字段名称和格式正确</li>
              <li>时间格式：YYYY-MM-DD HH:mm:ss</li>
              <li>设备状态可选值：NORMAL（正常）、ABNORMAL（异常）、OFFLINE（离线）</li>
              <li>系统会自动验证数据格式，跳过错误的记录</li>
            </ul>
          }
          type="info"
          showIcon
        />
        <Button
          icon={<DownloadOutlined />}
          onClick={downloadTemplate}
          style={{ marginTop: 16 }}
        >
          下载CSV模板
        </Button>
      </Card>

      {/* 文件上传区域 */}
      <Card title="文件上传">
        <Dragger {...uploadProps} disabled={uploading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持CSV格式文件，单个文件最大10MB
          </p>
        </Dragger>

        {uploading && (
          <Progress
            percent={currentProgress}
            status="active"
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      {/* 导入历史记录 */}
      {importHistory.length > 0 && (
        <Card title="导入历史">
          <Table
            columns={columns}
            dataSource={importHistory}
            rowKey={(record, index) => `${record.fileName}-${index}`}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {/* 注意事项 */}
      <Card title="注意事项">
        <Alert
          message="数据导入注意事项"
          description={
            <div>
              <p><strong>数据验证规则：</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                <li>buildingId 和 deviceId 必须为存在的有效ID</li>
                <li>recordTime 不能为空，且格式必须正确</li>
                <li>能耗数值必须为非负数</li>
                <li>温度范围：-50°C 到 100°C</li>
                <li>湿度范围：0% 到 100%</li>
                <li>人员密度必须为非负数</li>
              </ul>
              <p><strong>批量导入限制：</strong></p>
              <ul style={{ paddingLeft: 20 }}>
                <li>单次导入最多支持10000条记录</li>
                <li>导入过程中请勿关闭页面</li>
                <li>如有大量数据需要导入，建议分批进行</li>
              </ul>
            </div>
          }
          type="warning"
          showIcon
        />
      </Card>
    </Space>
  );
};

export default EnergyImport;