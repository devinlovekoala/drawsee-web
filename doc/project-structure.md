# DrawSee Web 项目结构详细文档

## 目录
1. [项目概述](#项目概述)
2. [目录结构](#目录结构)
3. [详细分析](#详细分析)

## 项目概述
DrawSee Web 是一个基于 React + TypeScript + Vite 构建的现代化 Web 应用程序。本文档详细记录了项目的源代码结构和各个组件的功能。

## 目录结构
以下是 `src` 目录的主要结构：

```
src/
├── app/                  # 应用程序核心代码
│   ├── pages/           # 应用内页面组件
│   ├── contexts/        # React Context 上下文
│   ├── components/      # 应用级组件
│   ├── styles/         # 样式文件
│   ├── globals.css     # 全局样式
│   ├── app.tsx         # 主应用组件
│   └── dialog.css      # 对话框样式
│
├── components/          # 全局共享组件
│   └── ui/             # UI 组件库
│
├── api/                 # API 相关代码
│   ├── types/          # API 类型定义
│   ├── methods/        # API 方法实现
│   ├── course.ts       # 课程相关 API
│   └── index.ts        # API 入口文件
│
├── common/             # 公共工具和组件
├── types/              # 全局类型定义
├── pages/              # 路由页面
├── lib/                # 工具库
├── hooks/              # 自定义 Hooks
├── assets/             # 静态资源
├── about/              # 关于页面相关
├── main.tsx            # 应用入口文件
├── main.css            # 全局样式
└── modules.d.ts        # 模块声明文件
```

## 详细分析

### 1. app 目录
应用程序的核心代码目录，包含主要的应用逻辑和组件。

#### 核心文件
- `app.tsx`: 应用程序的主组件，包含路由配置和全局布局
- `globals.css`: 全局样式定义
- `dialog.css`: 对话框相关的样式定义

#### 子目录
- `pages/`: 应用内部的页面组件
- `contexts/`: React Context 相关的上下文管理
- `components/`: 应用级别的组件
- `styles/`: 样式文件目录

### 2. components 目录
全局共享的组件库。

#### 子目录
- `ui/`: 包含基础 UI 组件，如按钮、输入框等
  - `select.tsx`: 自定义选择器组件实现

### 3. api 目录
处理所有与后端通信相关的代码。

#### 核心文件
- `index.ts`: API 的主入口文件，定义基础配置和通用方法
- `course.ts`: 课程相关的 API 定义

#### 子目录
- `types/`: API 相关的类型定义
- `methods/`: API 方法的具体实现

### 4. 其他重要目录
- `common/`: 存放公共工具和组件
- `types/`: 全局类型定义
- `pages/`: 路由页面组件
- `auth/`: 认证相关页面
- `admin/`: 管理后台页面
- `lib/`: 工具库和辅助函数
- `hooks/`: React 自定义 Hooks
- `assets/`: 静态资源文件
- `about/`: 关于页面相关的组件和资源

#### hooks 目录
- `use-mobile.tsx`: 移动设备检测的自定义 Hook

#### lib 目录
- `utils.ts`: 通用工具函数集合

### 5. 核心文件

#### main.tsx
应用程序的入口文件，主要功能包括：
- 初始化 React 应用
- 配置路由系统
- 设置全局 Providers
- 定义主要路由结构：
  - `/`: 主应用页面
  - `/blank`: 空白页面
  - `/flow`: 流程图页面
  - `/course`: 课程页面
  - `/circuit`: 电路图页面
  - `/about`: 关于页面

#### main.css
全局样式文件，定义了应用级别的样式规则。

#### modules.d.ts
TypeScript 模块声明文件，用于定义外部模块的类型。

## 开发指南

### 文件命名规范
- 组件文件使用 PascalCase（如 `Button.tsx`）
- 工具函数文件使用 camelCase（如 `utils.ts`）
- 样式文件使用小写并以 `.css` 结尾
- 类型定义文件使用 `.d.ts` 后缀

### 代码组织原则
1. 组件应该放在适当的目录层级中
2. 共享组件放在 `components` 目录
3. 页面组件放在 `pages` 目录
4. API 相关代码统一放在 `api` 目录
5. 工具函数放在 `lib` 目录
6. 类型定义放在相应目录的 `types` 子目录 