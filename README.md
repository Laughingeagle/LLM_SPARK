# AI 对话应用

基于星火大模型的实时对话应用，采用Vue3技术栈实现。

## 技术栈
- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5
- **UI 组件库**: Element Plus 2.4
- **核心依赖**: 
  - CryptoJS 4.2（加密算法）
  - Axios 1.6（HTTP客户端）
- **代码规范**: ESLint + Prettier

## 功能特性
1. 实时对话交互
2. 消息时间戳显示
3. 自动滚动到底部
4. 连接心跳检测（30秒间隔）
5. 异常断开重试机制
6. 安全的API鉴权机制

## 快速开始

### 环境要求
- Node.js >= 16.x
- npm >= 8.x

### 安装运行
```bash
npm install
npm run dev
