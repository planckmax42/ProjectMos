# 建筑能源智能管理系统 - 前端

基于 React + TypeScript + Ant Design + ECharts 的建筑能源管理系统前端。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design 5
- **图表**: ECharts
- **路由**: React Router 6
- **HTTP客户端**: Axios
- **日期处理**: Day.js

## 功能模块

### 已实现功能

1. **仪表盘**: 能源消耗总览、趋势图表、设备状态监控
2. **能源管理**:
   - 能源记录: CRUD操作、分页查询、筛选导出
   - 数据导入: CSV文件批量导入、模板下载
3. **统计分析**:
   - 趋势分析: 多维度能源消耗趋势、移动平均分析
   - 能源汇总、COP分析、异常检测（占位页面）
4. **报表管理**: 报表生成和定时报表（占位页面）
5. **建筑管理**: 建筑列表和设备管理（占位页面）
6. **用户认证**: 登录页面（模拟认证）

## 开始使用

### 前置要求

- Node.js >= 16
- npm 或 yarn
- 后端服务运行在 `http://localhost:8888`

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 生产构建

```bash
npm run build
```

构建产物将在 `dist` 目录

### 预览生产构建

```bash
npm run preview
```

## 默认登录账号

- 用户名: admin
- 密码: admin123

## 项目结构

```
src/
├── api/              # API接口定义
│   ├── energy.ts    # 能源数据接口
│   ├── statistics.ts # 统计分析接口
│   ├── report.ts    # 报表接口
│   └── common.ts    # 通用接口(建筑、设备)
├── assets/          # 静态资源
├── components/      # 公共组件
│   └── layout/      # 布局组件
├── hooks/           # 自定义Hooks
├── pages/           # 页面组件
│   ├── Dashboard.tsx # 仪表盘
│   ├── energy/      # 能源管理页面
│   ├── statistics/  # 统计分析页面
│   ├── report/      # 报表页面
│   └── building/    # 建筑管理页面
├── router/          # 路由配置
├── services/        # 业务逻辑服务
├── store/           # 状态管理
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
│   └── request.ts   # axios请求封装
├── App.tsx          # 应用入口组件
└── main.tsx         # 应用入口文件
```

## 环境变量

在项目根目录创建环境文件：

### 开发环境 (.env.development)
```
VITE_API_BASE_URL=http://localhost:8888
VITE_APP_TITLE=建筑能源智能管理系统
```

### 生产环境 (.env.production)
```
VITE_API_BASE_URL=http://your-production-api.com
VITE_APP_TITLE=建筑能源智能管理系统
```

## API代理配置

开发环境下，Vite配置了API代理，将 `/api` 路径的请求转发到后端服务：

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:8888',
    changeOrigin: true,
  },
}
```

## 主要特性

1. **响应式设计**: 适配不同屏幕尺寸
2. **路由懒加载**: 提升首屏加载速度
3. **请求拦截**: 统一的错误处理和token管理
4. **数据可视化**: 丰富的图表展示
5. **国际化支持**: 已配置中文语言包

## 后续开发计划

1. 完善占位页面功能
2. 添加更多数据可视化图表
3. 实现真实的用户认证和权限管理
4. 添加实时数据推送(WebSocket)
5. 优化移动端体验
6. 添加单元测试
7. 集成ElasticSearch知识库
8. 添加AI智能问答功能

## 构建和部署

### Docker部署

```dockerfile
# 使用多阶段构建
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### nginx配置示例

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 故障排除

### 常见问题

1. **无法连接后端服务**
   - 确保后端服务运行在 `http://localhost:8888`
   - 检查代理配置是否正确

2. **路径别名不生效**
   - 确保 tsconfig.json 和 vite.config.ts 中都配置了路径映射

3. **图表不显示**
   - 检查是否正确安装了 echarts 和 echarts-for-react

## License

MIT
