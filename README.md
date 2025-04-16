# 项目交接文档

## 项目概述
本项目名为"昭析(DrawSee)"，是一个基于AI的思维可视化工具。它通过树状对话结构，帮助用户打破传统线性对话的局限，实现多角度、多维度的思考。主要功能包括：

- 树状对话结构：支持多分支对话，实现非线性思维
- 多模型支持：集成多种大语言模型，智能匹配最佳模型
- 知识库集成：无缝接入个人知识库，提升回答质量
- 跨设备同步：自动同步对话内容，随时随地继续思考
- 导出与分享：支持多种格式导出，方便记录与分享

## 技术栈
- **React**: 18.3.1
- **TypeScript**: 5.6.2
- **Tailwind CSS**: 3.4.13 (注意：不是最新的4.x版本)
- **Vite**: 6.0.5
- **Zustand**: 5.0.3 (状态管理)(暂时没有使用!)
- **Alova**: 3.2.8 (网络请求)
- **Framer Motion**: 12.5.0 (动画)
- **Radix UI**: 3.2.1 (UI组件库)
- **Lucide**: 0.474.0 (图标库)
- **D3.js**: 7.9.0 (数据可视化)

## 项目结构（详细版）

### 核心目录结构
```
drawsee-web/
├── src/
│   ├── about/                # 首页相关组件
│   │   ├── components/       # 首页的各个功能模块组件
│   │   │   ├── AgentModesSection.tsx  # 智能模式介绍模块
│   │   │   ├── BenefitsSection.tsx    # 用户价值展示模块
│   │   │   ├── CtaSection.tsx         # 行动号召模块
│   │   │   ├── FeaturesSection.tsx    # 功能特点展示模块
│   │   │   ├── Footer.tsx             # 页脚组件
│   │   │   ├── HeroSection.tsx        # 首页大图展示模块
│   │   │   ├── JoinCommunitySection.tsx # 社区加入模块
│   │   │   ├── NavBar.tsx             # 导航栏组件
│   │   │   ├── TestimonialsSection.tsx # 用户评价模块
│   │   │   └── TreeVisualSection.tsx  # 树状结构可视化模块
│   │   ├── styles/           # 首页的样式文件
│   │   │   └── animations.css # 动画效果样式
│   │   └── about.tsx         # 首页页面主文件
│   ├── api/                  # API请求相关
│   │   ├── methods/          # 各模块的API请求方法
│   │   │   ├── auth.methods.ts       # 认证相关API
│   │   │   ├── flow.methods.ts       # 流程相关API
│   │   │   ├── knowledge.methods.ts  # 知识库相关API
│   │   │   └── tool.methods.ts       # 工具相关API
│   │   ├── types/            # API类型定义
│   │   │   ├── auth.types.ts         # 认证相关类型
│   │   │   ├── flow.types.ts         # 流程相关类型
│   │   │   └── knowledge.types.ts    # 知识库相关类型
│   │   └── index.ts          # API配置入口文件
│   ├── app/                  # 主应用组件
│   │   ├── components/       # 应用通用组件
│   │   │   ├── AppSideBar.tsx        # 侧边栏组件
│   │   │   ├── chat-input.tsx        # 聊天输入组件
│   │   │   └── form/                 # 表单相关组件
│   │   │       └── auth-form.tsx     # 认证表单组件
│   │   └── app.tsx           # 应用主入口
│   ├── assets/               # 静态资源
│   │   ├── img/              # 图片资源
│   │   └── svg/              # SVG图标资源
│   ├── common/               # 公共工具和常量
│   │   └── constant/         # 常量定义
│   ├── components/           # 通用组件
│   ├── hooks/                # 自定义hooks
│   ├── lib/                  # 第三方库封装
│   ├── pages/                # 页面组件
│   ├── types/                # TypeScript类型定义
│   ├── main.tsx              # 应用入口
│   ├── main.css              # 全局样式
│   └── vite-env.d.ts         # Vite环境类型声明
├── doc/                      # 文档
└── package.json              # 项目依赖和脚本
```

### 关键模块说明

1. **关于页面（about/）**
   - 采用模块化设计，每个功能模块独立成组件
   - 使用Framer Motion实现丰富的交互动画
   - 包含完整的用户引导和产品介绍流程

2. **API层（api/）**
   - 使用Alova进行API请求管理
   - 按功能模块划分请求方法
   - 统一的请求拦截器和响应处理
   - 完善的类型定义

3. **应用核心（app/）**
   - 采用侧边栏+主内容区的布局
   - 包含完整的用户认证流程
   - 实现会话管理和历史记录功能
   - 使用Radix UI构建UI组件

4. **样式管理**
   - 使用Tailwind CSS作为主要样式方案
   - 自定义动画效果集中在animations.css
   - 采用CSS Modules管理组件样式

5. **状态管理**
   - 使用Zustand进行全局状态管理
   - 按功能模块划分store
   - 实现跨组件状态共享

6. **路由管理**
   - 使用React Router进行路由管理
   - 实现页面级懒加载
   - 包含完整的路由守卫逻辑

### 开发规范

1. **组件命名**
   - 使用PascalCase命名法
   - 组件文件与文件夹同名
   - 例如：`NavBar.tsx` 放在 `components/NavBar/` 下

2. **API请求**
   - 所有API请求放在 `api/` 目录下
   - 按功能模块划分文件，例如 `auth.methods.ts`
   - 使用Alova进行请求封装

3. **样式规范**
   - 优先使用Tailwind CSS
   - 自定义样式放在 `main.css` 中
   - 动画相关样式放在 `styles/animations.css`

4. **类型定义**
   - 所有TypeScript类型定义放在 `types/` 目录下
   - 按功能模块划分文件
   - 使用interface定义复杂类型

5. **代码风格**
   - 使用ESLint进行代码检查
   - 使用Prettier进行代码格式化
   - 遵循Airbnb JavaScript代码规范

## 注意事项
1. Tailwind CSS版本为3.4.13，不是最新的4.x版本，升级时需谨慎
2. 项目使用了大量的CSS动画，相关代码在 `styles/animations.css` 中
3. 项目使用了D3.js进行树状结构的可视化，相关代码在 `TreeVisualSection.tsx` 中
4. 项目使用了Framer Motion进行交互动画，相关配置在组件中
5. 项目使用了Radix UI作为基础UI组件库，相关文档请参考官方文档

## app目录结构（详细版）

### 核心目录结构

```
app/
├── components/                # 应用通用组件
│   ├── AppSideBar.tsx         # 侧边栏组件
│   ├── chat-input.tsx         # 聊天输入组件
│   ├── form/                  # 表单相关组件
│   │   ├── auth-form.tsx      # 认证表单组件
│   │   ├── login-form.tsx     # 登录表单组件
│   │   └── signup-form.tsx    # 注册表单组件
│   ├── ImageUploader.tsx      # 图片上传组件
│   ├── modal-portal.tsx       # 模态框组件
│   ├── nav-main.tsx           # 主导航组件
│   ├── nav-projects.tsx       # 项目导航组件
│   ├── nav-secondary.tsx      # 二级导航组件
│   ├── nav-user.tsx           # 用户导航组件
│   ├── text-selection/        # 文本选择工具栏
│   │   ├── TextSelectionToolbar.css
│   │   └── TextSelectionToolbar.tsx
│   └── ui/                    # UI组件库
│       ├── avatar.tsx         # 头像组件
│       ├── breadcrumb.tsx     # 面包屑组件
│       ├── button.tsx         # 按钮组件
│       ├── collapsible.tsx    # 可折叠组件
│       ├── dropdown-menu.tsx  # 下拉菜单组件
│       ├── input.tsx          # 输入框组件
│       ├── mode-selector.tsx  # 模式选择器组件
│       ├── separator.tsx      # 分隔线组件
│       ├── sheet.tsx          # 侧边抽屉组件
│       ├── sidebar.tsx        # 侧边栏组件
│       └── skeleton.tsx       # 骨架屏组件
├── contexts/                  # 应用上下文
│   ├── AppContext.tsx         # 应用全局上下文
│   └── FlowContext.tsx        # 流程相关上下文
├── hooks/                     # 自定义hooks
├── pages/                     # 页面组件
├── styles/                    # 样式文件
│   └── dialog.css             # 对话框样式
└── app.tsx                    # 应用主入口
```

### 关键模块说明

1. **components/ 组件库**
   - 采用模块化设计，每个功能模块独立成组件
   - 使用Radix UI构建基础UI组件
   - 包含完整的表单验证和交互逻辑
   - 使用Framer Motion实现丰富的交互动画

2. **contexts/ 上下文管理**
   - 使用React Context进行全局状态管理
   - AppContext管理应用全局状态（如用户信息、会话等）
   - FlowContext管理流程相关状态（如对话树、节点状态等）

3. **hooks/ 自定义hooks**
   - 封装可复用的业务逻辑
   - 包含API请求、状态管理、事件监听等hooks
   - 遵循React Hooks最佳实践

4. **pages/ 页面组件**
   - 按功能模块划分页面
   - 实现页面级懒加载
   - 包含完整的路由守卫逻辑

5. **styles/ 样式管理**
   - 使用Tailwind CSS作为主要样式方案
   - 自定义动画效果集中在animations.css
   - 采用CSS Modules管理组件样式

### 开发规范

1. **组件命名**
   - 使用PascalCase命名法
   - 组件文件与文件夹同名
   - 例如：`NavBar.tsx` 放在 `components/NavBar/` 下

2. **API请求**
   - 所有API请求放在 `api/` 目录下
   - 按功能模块划分文件，例如 `auth.methods.ts`
   - 使用Alova进行请求封装

3. **样式规范**
   - 优先使用Tailwind CSS
   - 自定义样式放在 `main.css` 中
   - 动画相关样式放在 `styles/animations.css`

4. **类型定义**
   - 所有TypeScript类型定义放在 `types/` 目录下
   - 按功能模块划分文件
   - 使用interface定义复杂类型

5. **代码风格**
   - 使用ESLint进行代码检查
   - 使用Prettier进行代码格式化
   - 遵循Airbnb JavaScript代码规范

## /app/pages 目录结构（详细版）

### 核心目录结构
```
app/pages/
├── blank/                # 空白页面相关组件
│   ├── components/       # 空白页面的各个功能模块组件
│   │   ├── ModelSelector.tsx  # 模型选择器组件
│   │   ├── ModeSelector.tsx   # 模式选择器组件
│   │   └── ...                # 其他组件
│   ├── styles/           # 空白页面的样式文件
│   │   └── scrollbar.css # 滚动条样式
│   └── blank.tsx         # 空白页面主文件
├── flow/                 # 流程图页面相关组件
│   ├── components/       # 流程图页面的各个功能模块组件
│   │   ├── button/       # 按钮相关组件
│   │   │   ├── CopyButton.tsx      # 复制按钮组件
│   │   │   ├── DownloadImgButton.tsx # 下载图片按钮组件
│   │   │   └── ...                # 其他按钮组件
│   │   ├── input/        # 输入相关组件
│   │   │   ├── FlowInputPanel.tsx  # 流程图输入面板组件
│   │   │   ├── ModelIcons.tsx      # 模型图标组件
│   │   │   ├── SelectDropdown.tsx  # 选择下拉框组件
│   │   │   └── ...                # 其他输入组件
│   │   ├── loading/      # 加载相关组件
│   │   │   └── LoadingSpinner.tsx  # 加载动画组件
│   │   ├── markdown/     # Markdown相关组件
│   │   │   ├── HtmlPreviewModal.tsx # HTML预览模态框组件
│   │   │   ├── MarkdownWithLatex.tsx # 支持LaTeX的Markdown组件
│   │   │   ├── styles/   # Markdown样式文件
│   │   │   │   ├── highlight-atom-one-dark.css # 代码高亮样式
│   │   │   │   ├── katex.min.css    # KaTeX样式
│   │   │   │   └── starry-night-style-light.css # 代码高亮主题
│   │   │   └── ...                # 其他Markdown组件
│   │   ├── node/         # 节点相关组件
│   │   │   ├── AnswerNode.tsx      # 答案节点组件
│   │   │   ├── base/     # 基础节点组件
│   │   │   │   └── BaseNode.tsx    # 基础节点组件
│   │   │   ├── KnowledgeDetailNode.tsx # 知识详情节点组件
│   │   │   ├── KnowledgeHeadNode.tsx # 知识头节点组件
│   │   │   ├── QueryNode.tsx       # 查询节点组件
│   │   │   ├── resource/ # 资源相关组件
│   │   │   │   ├── components/     # 资源组件
│   │   │   │   │   ├── AnimationContent.tsx # 动画内容组件
│   │   │   │   │   ├── BilibiliContent.tsx # B站视频内容组件
│   │   │   │   │   └── ...        # 其他资源组件
│   │   │   │   └── ...            # 其他资源组件
│   │   │   └── ...                # 其他节点组件
│   │   ├── FlowLeftToolBar.tsx     # 左侧工具栏组件
│   │   ├── FlowRightToolBar.tsx    # 右侧工具栏组件
│   │   └── ...                    # 其他组件
│   └── flow.tsx           # 流程图页面主文件
```

### 关键模块说明

1. **blank/ 空白页面**
   - 提供模型和模式选择功能
   - 包含丰富的交互组件
   - 使用自定义滚动条样式

2. **flow/ 流程图页面**
   - 实现流程图的可视化与交互
   - 包含多种节点类型（答案节点、知识节点、查询节点等）
   - 支持Markdown渲染和LaTeX数学公式
   - 提供丰富的工具栏功能（复制、下载、重新布局等）
   - 支持B站视频和自定义动画的嵌入

3. **components/ 组件库**
   - 采用模块化设计，每个功能模块独立成组件
   - 使用Radix UI构建基础UI组件
   - 包含完整的表单验证和交互逻辑
   - 使用Framer Motion实现丰富的交互动画

4. **styles/ 样式管理**
   - 使用Tailwind CSS作为主要样式方案
   - 自定义动画效果集中在animations.css
   - 采用CSS Modules管理组件样式

### 开发规范

1. **组件命名**
   - 使用PascalCase命名法
   - 组件文件与文件夹同名
   - 例如：`NavBar.tsx` 放在 `components/NavBar/` 下

2. **API请求**
   - 所有API请求放在 `api/` 目录下
   - 按功能模块划分文件，例如 `auth.methods.ts`
   - 使用Alova进行请求封装

3. **样式规范**
   - 优先使用Tailwind CSS
   - 自定义样式放在 `main.css` 中
   - 动画相关样式放在 `styles/animations.css`

4. **类型定义**
   - 所有TypeScript类型定义放在 `types/` 目录下
   - 按功能模块划分文件
   - 使用interface定义复杂类型

5. **代码风格**
   - 使用ESLint进行代码检查
   - 使用Prettier进行代码格式化
   - 遵循Airbnb JavaScript代码规范

# "昭析"智能体通用会话页面 - 知识问答模式开关

## 功能说明

在"昭析"智能体的通用会话页面输入区添加了一个知识问答模式开关选钮组件：

1. 在输入区底部工具栏中增加了一个名为"知识问答模式"的开关选钮
2. 默认情况下，开关处于关闭状态，此时发送消息使用"GENERAL"类型创建AI任务
3. 当开关打开时，系统会切换到"KNOWLEDGE"类型，发送消息时创建的AI任务类型为"KNOWLEDGE"
4. 开关状态会影响页面顶部显示的标题，关闭时显示"通用对话"，打开时显示"知识问答"
5. 开关状态会影响输入框的占位提示文字，针对不同模式显示不同的提示

## 技术实现

1. 创建了一个通用的 Switch 组件，支持标签、开关状态、回调函数等功能
2. 在 Blank 页面中添加了 isKnowledgeMode 状态变量，控制开关的状态
3. 使用 useEffect 监听 isKnowledgeMode 变化，当状态变化时自动更新 queryForm.type
4. 在输入区底部工具栏中添加 Switch 组件，并将其状态与 isKnowledgeMode 绑定
5. queryForm.type 的变化会自动影响页面标题和输入框占位提示文字

## 使用方法

用户在通用会话页面中，可以通过底部工具栏中的"知识问答模式"开关来切换是否启用知识问答模式：

- 关闭状态：使用通用对话模式，没有知识库支持
- 开启状态：使用知识问答模式，回答会基于知识库内容