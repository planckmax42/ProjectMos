# 建筑能源智能管理系统 — 项目结构规划

## Context

比赛题目"建筑能源智能管理与运营优化关键技术研究"，需要研发一个集查询统计与智慧运维于一体的 Web 系统。5人团队协作，技术栈：Java Spring Boot + React Ant Design + PostgreSQL + Elasticsearch + DeepSeek API + MCP 协议。

---

## 1. 项目目录结构

```
Building-Energy-Intelligent-MOS/
├── docker-compose.yml                # 一键启动: PostgreSQL, Elasticsearch, 后端, 前端
├── docs/                             # 比赛文档 (需求分析、技术方案、用户手册)
│
├── data-scripts/                     # 数据集构建 (Python)
│   ├── generate_dataset.py           # 模拟数据生成 (>=1000条)
│   ├── data_cleaning.py              # 数据清洗与标准化
│   └── import_to_db.sql              # SQL 导入脚本
│
├── backend/                          # Spring Boot 后端
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/java/com/bems/
│       ├── BemsApplication.java
│       ├── config/                   # 全局配置 (CORS, Swagger, 数据源)
│       ├── common/                   # 统一响应 R<T>、异常处理、枚举、工具类
│       ├── energy/                   # 能耗数据模块 (CRUD + CSV/Excel导入)
│       ├── statistics/               # 查询统计模块 (时段汇总/COP/异常分析)
│       ├── mcp/                      # MCP 协议模块 (Spring AI MCP Server)
│       ├── ai/                       # 智慧运维模块 (DeepSeek API + ES知识库检索)
│       └── report/                   # 报表导出模块 (EasyExcel)
│
├── frontend/                         # React 前端
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── src/
│       ├── api/                      # Axios 请求封装
│       ├── components/               # ECharts图表、ChatPanel、DataTable
│       ├── layouts/MainLayout.tsx    # 侧边栏+顶栏布局
│       ├── pages/
│       │   ├── Dashboard/            # 首页仪表盘 (能耗概览)
│       │   ├── EnergyQuery/          # 能耗数据查询 (筛选+表格)
│       │   ├── Statistics/           # 统计分析 (三类分析+图表)
│       │   ├── SmartOps/             # 智慧运维 (RAG问答)
│       │   └── DataImport/           # 数据导入管理
│       ├── stores/                   # Zustand 状态管理
│       ├── hooks/                    # useSSE, useExport
│       └── types/                    # TypeScript 类型定义
│
├── es-config/                        # Elasticsearch 知识库配置
│   ├── index-mapping.json            # 索引映射定义
│   └── knowledge-docs/               # 领域知识文档 (暖通手册、能耗标准等)
```

---

## 2. 数据库表设计

### building (建筑信息)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| building_code | VARCHAR(32) UNIQUE | 建筑编号 |
| building_type | VARCHAR(20) | 类型 (办公/教育/医疗/商业/住宅) |
| building_name | VARCHAR(100) | 名称 |
| area | DECIMAL(10,2) | 面积 m² |

### monitor_device (监测设备)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| device_code | VARCHAR(32) UNIQUE | 设备编号 |
| building_id | BIGINT FK | 关联建筑 |
| status | VARCHAR(10) | NORMAL / ABNORMAL |

### energy_record (能耗记录 — 核心表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGSERIAL PK | 主键 |
| building_id | BIGINT FK | 关联建筑 |
| device_id | BIGINT FK | 关联设备 |
| record_time | TIMESTAMP | 监测时间 (精确到小时) |
| electricity_kwh | DECIMAL(12,4) | 电力能耗 kWh |
| water_m3 | DECIMAL(12,4) | 水耗 m³ |
| hvac_kwh | DECIMAL(12,4) | 空调能耗 kWh |
| hvac_supply_temp | DECIMAL(6,2) | 空调出水温度 ℃ |
| hvac_return_temp | DECIMAL(6,2) | 空调回水温度 ℃ |
| env_temperature | DECIMAL(6,2) | 环境温度 ℃ |
| humidity | DECIMAL(6,2) | 湿度 %RH |
| occupancy_density | DECIMAL(8,2) | 人员密度 人/100㎡ |
| device_status | VARCHAR(10) | 设备状态快照 |

索引: `(building_id, record_time)`, `(device_id)`, `(record_time)`, `(device_status)`

---

## 3. 后端关键模块说明

### MCP 协议 (Spring AI MCP Server)
- 将能耗查询、统计分析、设备状态查询暴露为 MCP Tool
- LLM 可通过 MCP 协议直接调用后端数据能力

### 知识库方案：Elasticsearch 混合检索
- 使用 Elasticsearch 8.x，同时支持全文检索（BM25）+ 向量检索（kNN）
- 文档处理流程：领域文档 → 分段切片 → Embedding 向量化（调用 DeepSeek/通义 Embedding API）→ 写入 ES 索引
- 检索时：用户问题同时走 BM25 关键词匹配 + 向量相似度检索，结果融合排序（RRF）
- 检索结果作为上下文注入 DeepSeek 对话 prompt，实现 RAG
- 依赖：`spring-boot-starter-data-elasticsearch` + `co.elastic.clients:elasticsearch-java`

### LLM 方案：云端 API (DeepSeek / 通义千问)
- 主选 DeepSeek API（性价比高，中文能力强，兼容 OpenAI 接口格式）
- 备选通义千问 API（阿里云生态，稳定性好）
- 后端通过 OpenAI 兼容接口调用，只需配置 `base-url` 和 `api-key`
- 支持 SSE 流式输出，前端实时渲染回答
- 依赖：`spring-ai-openai-spring-boot-starter` 或直接用 OkHttp 调用

### 三类统计分析
1. 时段汇总 — SQL `date_trunc` + GROUP BY，支持小时/日/月粒度
2. COP 计算 — COP = 制冷量 / 空调能耗，由出回水温差估算
3. 异常分析 — Z-Score > 3σ 标记异常 + 环比突变检测

### 报表导出
- Alibaba EasyExcel，直接写入 HttpServletResponse 输出流

---

## 4. 前端关键依赖

`react` + `react-router-dom` + `antd 5.x` + `echarts-for-react` + `axios` + `zustand` + `dayjs` + `vite`

可视化图表 (至少2种): 折线图 (能耗趋势) + 柱状图 (时段对比)，可加热力图 (异常分布)

---

## 5. 五人分工

| 角色 | 模块 | 职责 |
|------|------|------|
| A 后端核心 | energy/ + statistics/ + report/ | 能耗CRUD、数据导入、三类统计、报表导出、数据库设计 |
| B MCP+集成 | mcp/ + config/ + common/ + docker | MCP Server、全局配置、Docker编排、部署 |
| C AI/RAG | ai/ + es-config/ | DeepSeek API对接、Elasticsearch知识库搭建(混合检索)、对话编排、领域文档整理与索引 |
| D 前端主力 | pages/ + components/ | 仪表盘/查询/统计/导入页面、ECharts图表、布局 |
| E 前端+数据 | ChatPanel/ + stores/ + data-scripts/ | 智能问答前端(SSE)、状态管理、Python数据集生成脚本 |

协作要点:
- A+B 第1周定义好 API 接口 (Swagger)，D+E 可 mock 数据并行开发
- B 负责 docker-compose.yml 统一开发环境
- C 独立搭建 Elasticsearch 知识库，通过 Spring Data Elasticsearch 与后端集成

---

## 6. 开发里程碑

| 阶段 | 交付物 |
|------|--------|
| P0 基础搭建 | 项目骨架、建表、数据集生成、Swagger 接口定义 |
| P1 核心功能 | 能耗 CRUD + 导入、三类统计、前端查询页面 + 图表 |
| P2 智能模块 | MCP Server、Elasticsearch 知识库、智能问答、报表导出 |
| P3 集成联调 | 全链路联调、Docker 部署、文档撰写、演示视频 |

---

## 7. 验证方式

1. `docker-compose up` 一键启动所有服务 (PostgreSQL, Elasticsearch, 后端, 前端)
2. 访问 Swagger UI 验证所有 API 接口
3. 前端页面完整走通: 数据导入 → 查询 → 统计分析 → 报表导出 → 智能问答
4. MCP Server 可被 LLM 客户端连接并调用 Tool
5. 连续操作 30 分钟无崩溃 (题目性能要求)
