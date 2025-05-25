# PDF电路实验任务分析与设计工作流数据结构

## 一、任务结构

### 1. PdfCircuitTaskAnalysisWorkFlow（PDF电路实验任务分析）

**输入任务结构**:
```json
{
  "taskId": 1002,
  "userId": 2001,
  "convId": 3001,
  "parentId": 4001,
  "type": "PDF_CIRCUIT_ANALYSIS",
  "prompt": null,
  "promptParams": {
    "fileUrl": "https://drawsee-storage.minio.io/user/document/circuit_experiment_task.pdf"
  },
  "model": "deepseekV3",
  "classId": null
}
```

**关键字段说明**:
- `taskId`: AI任务ID
- `userId`: 用户ID
- `convId`: 会话ID
- `parentId`: 父节点ID
- `type`: 任务类型（电路PDF分析）
- `prompt`: 引导模型方向提示词
- `promptParams`: 内含"fileUrl"字段，传递文档访问链接的信息
- `model`: 使用的AI模型

### 2. PdfCircuitDesignGenerateWorkFlow（PDF电路设计生成）

**输入任务结构**:
```json
{
  "taskId": 1002,
  "userId": 2001,
  "convId": 3001,
  "parentId": 4001,
  "type": "PDF_CIRCUIT_DESIGN",
  "prompt": null,
  "promptParams": {
    "fileUrl": "https://drawsee-storage.minio.io/user/document/circuit_experiment_task.pdf"
  },
  "model": "deepseekV3",
  "classId": null
}
```

## 二、节点数据结构

### 1. PDF文档节点（PDF_DOCUMENT）

**数据结构**:
```json
{
  "id": 5001,
  "type": "pdf-document",
  "data": {
    "title": "电路实验任务文档",
    "text": "PDF电路实验任务文档",
    "fileUrl": "https://drawsee-storage.minio.io/user/document/circuit_experiment_task.pdf",
    "fileType": "pdf"
  },
  "position": {"x": 0, "y": 0},
  "parentId": 4001,
  "userId": 2001,
  "convId": 3001,
  "isActive": true
}
```

### 2. 总体分析节点（ANSWER）

**数据结构**:
```json
{
  "id": 5002,
  "type": "answer",
  "data": {
    "title": "实验任务总体分析",
    "text": "这是一个关于RC低通滤波器的实验，主要目标是设计并测试一个截止频率为1kHz的RC低通滤波器...[完整分析内容]"
  },
  "position": {"x": 0, "y": 0},
  "parentId": 5001,
  "userId": 2001,
  "convId": 3001,
  "isActive": true
}
```

### 3. PDF分析点节点（PDF_ANALYSIS_POINT）

**数据结构**:
```json
{
  "id": 5003,
  "type": "pdf-analysis-point",
  "data": {
    "title": "实验目标分析",
    "text": "本实验旨在设计一个RC低通滤波电路，要求截止频率为1kHz...",
    "subtype": "pdf-analysis-point"
  },
  "position": {"x": 0, "y": 0},
  "parentId": 5001,
  "userId": 2001,
  "convId": 3001,
  "isActive": true
}
```

### 4. 电路设计说明节点（ANSWER）

**数据结构**:
```json
{
  "id": 5004,
  "type": "answer",
  "data": {
    "title": "电路设计方案",
    "text": "基于实验要求，我设计了一个RC低通滤波器，使用10kΩ电阻和15.9nF电容...",
    "subtype": "circuit-design-description"
  },
  "position": {"x": 0, "y": 0},
  "parentId": 5001,
  "userId": 2001,
  "convId": 3001,
  "isActive": true
}
```

### 5. 电路设计画布节点（CIRCUIT_CANVAS）

**数据结构**:
```json
{
  "id": 5005,
  "type": "circuit-canvas",
  "data": {
    "title": "电路设计",
    "text": "电路设计图",
    "circuitDesign": {
      "nodes": [
        {
          "id": "1",
          "type": "resistor",
          "position": {"x": 150, "y": 100},
          "properties": {"resistance": "10kΩ", "label": "R1"}
        },
        {
          "id": "2",
          "type": "capacitor",
          "position": {"x": 250, "y": 150},
          "properties": {"capacitance": "15.9nF", "label": "C1"}
        },
        {
          "id": "3",
          "type": "voltage_source",
          "position": {"x": 100, "y": 150},
          "properties": {"voltage": "5V", "label": "V1"}
        }
      ],
      "edges": [
        {"source": "1", "target": "2", "id": "e1"},
        {"source": "3", "target": "1", "id": "e2"}
      ]
    },
    "mode": "design"
  },
  "position": {"x": 0, "y": 0},
  "parentId": 5001,
  "userId": 2001,
  "convId": 3001,
  "isActive": true
}
```

## 三、节点树状结构示例

### 1. PDF电路实验任务分析

```
PDF_DOCUMENT (电路实验任务文档)
├── ANSWER (实验任务总体分析)
├── PDF_ANALYSIS_POINT (实验目标分析)
├── PDF_ANALYSIS_POINT (电路原理分析)
├── PDF_ANALYSIS_POINT (实验步骤分析)
└── PDF_ANALYSIS_POINT (关键参数计算)
```

### 2. PDF电路设计生成

```
PDF_DOCUMENT (电路实验任务文档)
├── ANSWER (电路设计方案)
└── CIRCUIT_CANVAS (电路设计图)
```

## 四、工作流处理流程

### 1. PdfCircuitTaskAnalysisWorkFlow

1. 接收PDF文件URL
2. 提取PDF文本内容
3. 验证是否为有效电路实验任务
4. 创建PDF文档节点作为父节点
5. 调用AI生成分析内容
6. 解析AI回答，创建总体分析节点
7. 识别并提取分析点，创建多个分析点子节点

### 2. PdfCircuitDesignGenerateWorkFlow

1. 接收PDF文件URL
2. 提取PDF文本内容
3. 验证是否为有效电路实验任务
4. 创建PDF文档节点作为父节点
5. 调用AI生成电路设计内容
6. 从AI回答中提取文本说明，创建设计说明节点
7. 从AI回答中提取电路设计JSON，创建电路画布节点

通过这种树状结构设计，用户可以方便地查看电路实验任务的分析内容和设计方案，并直接在平台上操作电路设计。
