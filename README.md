# AI 招聘猎头系统 - 前端

## 项目简介
基于 Vue 3 + Vite + Element Plus 的前端应用，为求职者与 HR 提供招聘全流程交互界面，对接后端接口文档 V1.13。

**核心功能**  
- 求职者：注册登录、完善信息、浏览岗位（按匹配度排序）、投递简历、查看投递记录、处理面试邀请  
- HR：注册登录、完善企业信息、发布/编辑/上下线/删除岗位、查看投递列表（按匹配度排序）、更新投递状态、发送面试邀请、招聘数据统计  

**技术栈**  
- Vue 3 (Composition API)  
- Vite 4.x  
- Element Plus 2.3+  
- Pinia 2.x  
- Vue Router 4.x  
- Axios 1.4+  

## 环境要求
- Node.js 16+（推荐 18 LTS）  
- npm 8+ 或 yarn / pnpm  

## 快速开始

### 1. 克隆代码
    git clone <your-repo-url>
    cd recruit-frontend

### 2. 安装依赖
bash
npm install

### 3. 配置后端代理（已默认配置）
vite.config.js 中已设置代理 http://localhost:8080，如后端地址不同请修改 target。

### 4. 启动开发服务器
bash
npm run dev
访问 http://localhost:5173

### 5. 打包生产
bash
npm run build
生成 dist/ 目录，可部署至 Nginx 或其他静态服务器。

### 6.项目结构
src/
├── api/
│   ├── modules/
│   │   ├── seeker.js          # 求职者相关接口
│   │   ├── hr.js              # HR相关接口
│   │   ├── resume.js          # 简历管理
│   │   ├── delivery.js        # 投递管理
│   │   ├── job.js             # 岗位管理（求职者端 + HR端）
│   │   ├── interview.js       # 面试邀请与消息
│   │   ├── ai.js              # AI能力接口
│   │   └── common.js          # 公共接口（文件上传、验证码、刷新token）
│   ├── request.js             # Axios实例 + 拦截器
│   └── index.js               # 统一导出所有API
├── assets/                    # 静态资源
├── components/                # 全局组件
│   ├── JobCard.vue
│   ├── DeliveryStatusTag.vue
│   ├── MatchScore.vue
│   └── FileUploader.vue
├── composables/
│   ├── useRequest.js          # 封装loading、错误处理
│   └── useRole.js             # 角色判断
├── router/
│   ├── index.js               # 路由实例 + 守卫
│   └── routes.js              # 路由配置
├── stores/
│   └── user.js                # 用户状态管理
├── utils/
│   ├── auth.js                # token存储、解析、刷新定时器
│   ├── errorCodes.js          # 业务错误码映射
│   ├── validator.js           # 表单校验正则
│   ├── format.js              # 日期、薪资、匹配度格式化
│   └── upload.js              # 文件类型/大小校验
├── views/                     # 页面（按角色划分）
├── App.vue
├── main.js
└── env.d.ts
开发过程中可根据实际情况微调，但尽量保证全员统一

### 7.核心功能与页面
角色	页面	功能
公共	角色选择	选择求职者或 HR 身份
公共	注册/登录	账号密码注册登录，获取 JWT
求职者	个人信息	完善/查看个人资料（学历、期望薪资等）
求职者	岗位列表	浏览上线岗位，支持按匹配度/时间/薪资排序，投递简历
求职者	我的投递	查看投递记录及匹配度、状态
求职者	面试邀请	查看收到的面试邀请，接受或拒绝
HR	企业信息	完善/查看公司信息
HR	岗位管理	发布、编辑、上下线、删除岗位
HR	投递管理	查看某岗位的投递列表（按匹配度排序），更新状态（通过/淘汰），发送面试邀请
HR	消息通知	查看发出的面试邀请及求职者回复