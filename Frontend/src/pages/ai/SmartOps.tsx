import React, { useState } from 'react';
import { Alert, Button, Card, Input, List, Space, Switch, Typography, message } from 'antd';
import { RobotOutlined, SendOutlined } from '@ant-design/icons';
import { aiApi } from '@/api/ai';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

const SmartOps: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(`frontend-${Date.now()}`);

  const handleAsk = async () => {
    if (!question.trim()) {
      message.warning('请输入问题');
      return;
    }

    setLoading(true);
    try {
      const res = await aiApi.chatSync({
        conversationId,
        question: question.trim(),
        useKnowledgeBase,
      });
      setAnswer(res.answer || '');
      setSources(res.sources || []);
      if (res.conversationId) {
        setConversationId(res.conversationId);
      }
    } catch (error) {
      console.error('AI chat failed:', error);
      message.error('AI 服务调用失败，请检查后端配置');
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationId(`frontend-${Date.now()}`);
    setQuestion('');
    setAnswer('');
    setSources([]);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="MVP 联调模式"
        description="当前页面只走最小链路：前端提问 -> /api/ai/chat/sync -> 返回答案。"
      />

      <Card title={<Space><RobotOutlined /> 智慧问答</Space>}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space>
            <Text type="secondary">会话ID：{conversationId}</Text>
          </Space>
          <Space>
            <Text>启用知识库</Text>
            <Switch checked={useKnowledgeBase} onChange={setUseKnowledgeBase} />
          </Space>
          <TextArea
            rows={6}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="请输入你的问题，例如：请分析今天的能耗异常原因"
          />
          <Space>
            <Button type="primary" icon={<SendOutlined />} loading={loading} onClick={handleAsk}>
              发送
            </Button>
            <Button onClick={handleNewConversation}>新建会话</Button>
          </Space>
        </Space>
      </Card>

      {answer && (
        <Card title="回答结果">
          <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{answer}</Paragraph>
          <List
            size="small"
            bordered
            header="来源"
            dataSource={sources.length > 0 ? sources : ['无']}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Card>
      )}
    </Space>
  );
};

export default SmartOps;
