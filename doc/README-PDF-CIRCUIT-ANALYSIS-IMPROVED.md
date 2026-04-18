# PDF电路实验任务分析AI任务改良版数据结构文档

本文档详细描述了改良后的PDF电路实验任务分析功能的前端请求格式和后端响应格式。

## 🔄 改良概述

将PDF电路实验任务分析改造成类似通用AI任务的两阶段模式：
1. **第一阶段**: 提交PDF分析任务，后端返回分析点(`PDF_ANALYSIS_POINT`)
2. **第二阶段**: 用户选择感兴趣的分析点，发送详情展开任务，生成详情内容(`PDF_ANALYSIS_DETAIL`)

## 📋 数据结构设计

### 1. 新增AI任务类型

```typescript
export type AiTaskType = 
  | "PDF_CIRCUIT_ANALYSIS"        // 第一阶段：PDF电路实验文档分析生成分析点
  | "PDF_CIRCUIT_ANALYSIS_DETAIL" // 第二阶段：展开PDF电路实验分析点的详情
  | "PDF_CIRCUIT_DESIGN";         // 保留：通过电路实验pdf任务文档获取电路分析图AI任务
```

### 2. 新增节点类型

```typescript
export type NodeType = 
  | "PDF_ANALYSIS_POINT"   // PDF分析点节点
  | "PDF_ANALYSIS_DETAIL"  // PDF分析详情节点
  // ... 其他现有节点类型
```

## 🚀 第一阶段：PDF分析生成分析点

### 前端请求格式

```json
{
  "type": "PDF_CIRCUIT_ANALYSIS",
  "prompt": "http://117.72.9.87:9046/drawsee/user/document/20250524/b3bb022fa7ea43ee9dce2eeab63e2251.pdf",
  "promptParams": {},
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": null
}
```

### 后端响应格式

#### 1. 会话标题响应
```json
{
  "type": "TITLE",
  "data": "PDF电路实验任务分析"
}
```

#### 2. PDF文档节点响应
```json
{
  "type": "NODE",
  "data": {
    "id": 12345,
    "type": "PDF_DOCUMENT",
    "data": {
      "title": "电路实验任务文档",
      "text": "PDF电路实验任务文档",
      "fileUrl": "http://117.72.9.87:9046/drawsee/user/document/20250524/b3bb022fa7ea43ee9dce2eeab63e2251.pdf",
      "fileType": "pdf"
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12344,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### 3. 总体分析节点响应
```json
{
  "type": "NODE",
  "data": {
    "id": 12346,
    "type": "ANSWER",
    "data": {
      "title": "实验任务总体分析",
      "text": "实验名称：RC振荡器设计\n\n实验目的：设计一个基于运算放大器的RC振荡器电路，理解振荡电路的工作原理和设计方法。\n\n关键器件：\n- LM358运算放大器\n- 电阻（1kΩ、10kΩ）\n- 电容（0.1μF、1μF）\n- 可变电阻（10kΩ）"
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12345,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:01.000Z",
    "updatedAt": "2025-01-15T10:30:01.000Z"
  }
}
```

#### 4. 分析点节点响应（多个）
```json
{
  "type": "NODE",
  "data": {
    "id": 12347,
    "type": "PDF_ANALYSIS_POINT",
    "data": {
      "title": "设计思路1",
      "text": "采用Wien桥振荡器结构，通过RC网络实现选频和正反馈",
      "subtype": "pdf-analysis-point"
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12346,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:02.000Z",
    "updatedAt": "2025-01-15T10:30:02.000Z"
  }
}
```

#### 5. 任务完成响应
```json
{
  "type": "DONE",
  "data": ""
}
```

## 🔍 第二阶段：展开分析点详情

### 前端请求格式

用户点击PDF_ANALYSIS_POINT节点的"继续解析"按钮时，发送以下请求：

```json
{
  "type": "PDF_CIRCUIT_ANALYSIS_DETAIL",
  "prompt": "采用Wien桥振荡器结构，通过RC网络实现选频和正反馈",
  "promptParams": null,
  "convId": 5001,
  "parentId": 12347,
  "model": "deepseekV3",
  "classId": null
}
```

### 后端响应格式

#### 1. 分析详情节点响应
```json
{
  "type": "NODE",
  "data": {
    "id": 12348,
    "type": "PDF_ANALYSIS_DETAIL",
    "data": {
      "title": "设计思路1详细解析",
      "text": "",
      "subtype": "pdf-analysis-detail",
      "angle": "设计思路1"
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12347,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:03.000Z",
    "updatedAt": "2025-01-15T10:30:03.000Z"
  }
}
```

#### 2. 文本流响应
```json
{
  "type": "TEXT",
  "data": {
    "nodeId": 12348,
    "content": "Wien桥振荡器是一种典型的RC振荡器，其工作原理基于..."
  }
}
```

#### 3. 任务完成响应
```json
{
  "type": "DONE",
  "data": ""
}
```

## 💻 前端组件实现

### 1. PdfAnalysisPointNode组件

类似于`AnswerPointNode`，支持：
- 显示分析点内容
- 提供"继续解析"按钮
- 模型选择器
- 编辑功能
- 状态管理（待生成/生成中/已完成）

### 2. PdfAnalysisDetailNode组件

类似于`AnswerDetailNode`，支持：
- 显示详情内容
- 角度标识
- 流式内容更新

### 3. 节点类型映射

```typescript
const nodeTypes = {
  // ... 其他节点类型
  'PDF_ANALYSIS_POINT': CompactPdfAnalysisPointNode,
  'PDF_ANALYSIS_DETAIL': CompactPdfAnalysisDetailNode,
};
```

## 🔄 工作流程

1. **用户上传PDF** → 前端发送`PDF_CIRCUIT_ANALYSIS`任务
2. **后端分析PDF** → 创建PDF文档节点、总体分析节点、多个分析点节点
3. **用户选择分析点** → 点击"继续解析"按钮
4. **前端发送详情任务** → 发送`PDF_CIRCUIT_ANALYSIS_DETAIL`任务
5. **后端生成详情** → 创建详情节点，流式返回详细内容
6. **实时显示** → 前端实时显示生成的详情内容

## ✨ 用户体验改进

1. **两阶段交互**: 用户可以先浏览所有分析点，再选择感兴趣的点深入了解
2. **实时反馈**: 分析点生成过程中显示状态，详情生成时实时显示内容
3. **智能聚焦**: 自动选中正在生成的详情节点并在右侧面板显示
4. **编辑支持**: 分析点内容支持编辑，增强互动性
5. **状态管理**: 清晰的状态标识（待生成/生成中/已完成）

## 🎯 技术优势

1. **模块化设计**: 分析点和详情分离，便于维护和扩展
2. **一致性**: 与现有通用AI任务保持一致的交互模式
3. **可扩展性**: 易于添加新的分析维度和功能
4. **性能优化**: 按需生成详情，减少不必要的计算
5. **用户控制**: 用户主导选择感兴趣的分析方向

## 📚 类型定义

```typescript
interface PdfAnalysisPointNodeData extends BaseNodeData {
  subtype: 'pdf-analysis-point';
  isGenerated?: boolean;
  process?: 'generating' | 'completed' | 'failed';
}

interface PdfAnalysisDetailNodeData extends BaseNodeData {
  subtype: 'pdf-analysis-detail';
  angle?: string; // 分析角度
  process?: 'generating' | 'completed' | 'failed';
}
```

这个改良方案将PDF电路实验任务分析完全对齐到通用AI任务的交互模式，提供更好的用户体验和更灵活的功能扩展能力。
