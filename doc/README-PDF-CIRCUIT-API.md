# PDF电路实验任务分析API文档

本文档详细描述了PDF电路实验任务分析功能的前端请求格式和后端响应格式。

## 功能概述

系统支持两种PDF电路实验任务处理类型：
1. **PDF_CIRCUIT_ANALYSIS** - PDF电路实验任务解析分析
2. **PDF_CIRCUIT_DESIGN** - PDF电路设计生成

## 前端请求格式

### 1. PDF电路实验任务分析请求

```json
{
  "type": "PDF_CIRCUIT_ANALYSIS",
  "prompt": "http://117.72.9.87:9046/drawsee/user/document/20250524/b3bb022fa7ea43ee9dce2eeab63e2251.pdf?response-content-disposition=inline&response-accept-ranges=bytes&response-content-length=1364599&response-content-type=application%2Fpdf&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=1r6Dfs4muAO6JfKFnkqH%2F20250524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250524T155136Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=c37000b76170c09eae94a876f20bef82dae6abf1fba28b95bf4bd941ec1bc5e2",
  "promptParams": {},
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": null
}
```

### 2. PDF电路设计生成请求

```json
{
  "type": "PDF_CIRCUIT_DESIGN",
  "prompt": "http://117.72.9.87:9046/drawsee/user/document/20250524/b3bb022fa7ea43ee9dce2eeab63e2251.pdf?response-content-disposition=inline&response-accept-ranges=bytes&response-content-length=1364599&response-content-type=application%2Fpdf&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=1r6Dfs4muAO6JfKFnkqH%2F20250524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250524T155136Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=c37000b76170c09eae94a876f20bef82dae6abf1fba28b95bf4bd941ec1bc5e2",
  "promptParams": {},
  "convId": null,
  "parentId": null,
  "model": "gpt-4o",
  "classId": null
}
```

### 请求参数说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | String | 是 | 任务类型，PDF_CIRCUIT_ANALYSIS 或 PDF_CIRCUIT_DESIGN |
| prompt | String | 是 | PDF文件的URL地址 |
| promptParams | Object | 否 | 提示词参数，可为空对象 |
| convId | Long | 否 | 会话ID，可为null，系统会自动创建 |
| parentId | Long | 否 | 父节点ID，可为null，系统会自动创建根节点 |
| model | String | 否 | AI模型名称，如不指定使用系统默认模型 |
| classId | String | 否 | 班级ID，用于知识库选择 |

## 后端响应格式

### 通用响应结构

后端通过SSE（Server-Sent Events）实时推送处理结果，每个事件包含以下结构：

```json
{
  "type": "消息类型",
  "data": "消息数据"
}
```

### 消息类型说明

| 类型 | 说明 |
|------|------|
| TITLE | 会话标题更新 |
| NODE | 新节点创建 |
| DONE | 任务完成 |
| ERROR | 错误信息 |

## PDF电路实验任务分析响应示例

### 1. 会话标题响应

```json
{
  "type": "TITLE",
  "data": "PDF电路实验任务分析"
}
```

### 2. PDF文档节点响应

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

### 3. 总体分析节点响应

```json
{
  "type": "NODE",
  "data": {
    "id": 12346,
    "type": "ANSWER",
    "data": {
      "title": "实验任务总体分析",
      "text": "实验名称：RC振荡器设计\n\n实验目的：设计一个基于运算放大器的RC振荡器电路，理解振荡电路的工作原理和设计方法。\n\n关键器件：\n- LM358运算放大器\n- 电阻（1kΩ、10kΩ）\n- 电容（0.1μF、1μF）\n- 可变电阻（10kΩ）\n\n实验原理：\nRC振荡器基于运算放大器的正反馈原理工作。当满足幅度条件和相位条件时，电路将产生自激振荡。\n\n设计思路：\n- 思路1：采用Wien桥振荡器结构，通过RC网络实现选频和正反馈\n- 思路2：使用积分器和比较器组合，构成弛张振荡器\n- 思路3：基于多级RC移相网络，实现180度相移的正反馈振荡\n\n实现难点：\n- 难点1：振荡频率的精确控制和调节\n- 难点2：振荡幅度的稳定性保证\n- 难点3：温度和器件参数变化对振荡性能的影响\n\n注意事项：\n- 注意点1：确保运算放大器的电源供电稳定\n- 注意点2：选择合适的RC参数以获得期望频率\n- 注意点3：注意信号的幅度限制，避免饱和失真"
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

### 4. 分析点节点响应

```json
{
  "type": "NODE",
  "data": {
    "id": 12347,
    "type": "PDF_ANALYSIS_POINT",
    "data": {
      "title": "设计思路1",
      "text": "采用Wien桥振荡器结构，通过RC网络实现选频和正反馈。Wien桥网络在特定频率下提供0度相移，结合运算放大器的180度相移，总相移为360度，满足振荡的相位条件。",
      "subtype": "pdf-analysis-point"
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12345,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:02.000Z",
    "updatedAt": "2025-01-15T10:30:02.000Z"
  }
}
```

### 5. 任务完成响应

```json
{
  "type": "DONE",
  "data": ""
}
```

## PDF电路设计生成响应示例

### 1. 电路设计方案节点

```json
{
  "type": "NODE",
  "data": {
    "id": 12348,
    "type": "ANSWER",
    "data": {
      "title": "电路设计方案",
      "text": "根据PDF实验任务要求，设计了一个基于LM358运算放大器的Wien桥RC振荡器电路。\n\n设计特点：\n1. 采用Wien桥网络作为选频和正反馈网络\n2. 使用运算放大器提供足够的增益\n3. 通过可变电阻调节振荡频率\n4. 设计输出缓冲级保证负载能力\n\n电路参数：\n- 振荡频率：f = 1/(2πRC) ≈ 1kHz\n- 电阻R1 = R2 = 1.6kΩ\n- 电容C1 = C2 = 0.1μF\n- 反馈电阻Rf = 20kΩ\n- 输入电阻Ri = 10kΩ",
      "subtype": "circuit-design-description"
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12345,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:03.000Z",
    "updatedAt": "2025-01-15T10:30:03.000Z"
  }
}
```

### 2. 电路画布节点

```json
{
  "type": "NODE",
  "data": {
    "id": 12349,
    "type": "CIRCUIT_CANVAS",
    "data": {
      "title": "电路设计",
      "text": "电路设计图",
      "mode": "design",
      "circuitDesign": {
        "components": [
          {
            "id": "opamp1",
            "type": "opamp",
            "value": "LM358",
            "position": {"x": 300, "y": 200},
            "rotation": 0,
            "label": "U1"
          },
          {
            "id": "r1",
            "type": "resistor",
            "value": "1.6k",
            "position": {"x": 150, "y": 150},
            "rotation": 0,
            "label": "R1"
          },
          {
            "id": "r2",
            "type": "resistor",
            "value": "1.6k",
            "position": {"x": 150, "y": 250},
            "rotation": 0,
            "label": "R2"
          },
          {
            "id": "c1",
            "type": "capacitor",
            "value": "0.1uF",
            "position": {"x": 200, "y": 150},
            "rotation": 0,
            "label": "C1"
          },
          {
            "id": "c2",
            "type": "capacitor",
            "value": "0.1uF",
            "position": {"x": 200, "y": 250},
            "rotation": 0,
            "label": "C2"
          },
          {
            "id": "rf",
            "type": "resistor",
            "value": "20k",
            "position": {"x": 350, "y": 120},
            "rotation": 90,
            "label": "Rf"
          },
          {
            "id": "ri",
            "type": "resistor",
            "value": "10k",
            "position": {"x": 250, "y": 220},
            "rotation": 0,
            "label": "Ri"
          },
          {
            "id": "vcc",
            "type": "voltage_source",
            "value": "12V",
            "position": {"x": 100, "y": 100},
            "rotation": 0,
            "label": "VCC"
          },
          {
            "id": "gnd1",
            "type": "ground",
            "value": "",
            "position": {"x": 100, "y": 300},
            "rotation": 0,
            "label": "GND"
          }
        ],
        "connections": [
          {
            "id": "conn1",
            "from": {"componentId": "r1", "pin": "p2"},
            "to": {"componentId": "c1", "pin": "p1"}
          },
          {
            "id": "conn2",
            "from": {"componentId": "c1", "pin": "p2"},
            "to": {"componentId": "opamp1", "pin": "in+"}
          },
          {
            "id": "conn3",
            "from": {"componentId": "r2", "pin": "p2"},
            "to": {"componentId": "c2", "pin": "p1"}
          },
          {
            "id": "conn4",
            "from": {"componentId": "c2", "pin": "p2"},
            "to": {"componentId": "gnd1", "pin": "p1"}
          },
          {
            "id": "conn5",
            "from": {"componentId": "ri", "pin": "p1"},
            "to": {"componentId": "opamp1", "pin": "in-"}
          },
          {
            "id": "conn6",
            "from": {"componentId": "ri", "pin": "p2"},
            "to": {"componentId": "gnd1", "pin": "p1"}
          },
          {
            "id": "conn7",
            "from": {"componentId": "rf", "pin": "p1"},
            "to": {"componentId": "opamp1", "pin": "out"}
          },
          {
            "id": "conn8",
            "from": {"componentId": "rf", "pin": "p2"},
            "to": {"componentId": "opamp1", "pin": "in-"}
          }
        ]
      }
    },
    "position": {"x": 0, "y": 0},
    "parentId": 12345,
    "userId": 1001,
    "convId": 5001,
    "isVisible": true,
    "createdAt": "2025-01-15T10:30:04.000Z",
    "updatedAt": "2025-01-15T10:30:04.000Z"
  }
}
```

## 错误响应示例

### 1. 文件无法访问错误

```json
{
  "type": "NODE",
  "data": {
    "id": 12350,
    "type": "ANSWER",
    "data": {
      "title": "温馨提示",
      "text": "无法读取PDF文件，请确保文件可访问且为有效的PDF格式"
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

### 2. 非电路实验任务错误

```json
{
  "type": "NODE",
  "data": {
    "id": 12351,
    "type": "ANSWER",
    "data": {
      "title": "温馨提示",
      "text": "此文档不包含电路实验任务内容，请提供正确的电路实验任务文档。"
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

## 前端集成说明

### 1. 发送请求

```javascript
// 发送PDF电路实验任务分析请求
const response = await fetch('/api/ai-tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    type: 'PDF_CIRCUIT_ANALYSIS',
    prompt: pdfFileUrl,
    promptParams: {},
    convId: null,
    parentId: null,
    model: 'deepseekV3',
    classId: null
  })
});

const result = await response.json();
const taskId = result.taskId;
```

### 2. 接收实时响应

```javascript
// 建立SSE连接接收实时响应
const eventSource = new EventSource(`/api/ai-tasks/${taskId}/stream`);

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'TITLE':
      // 更新会话标题
      updateConversationTitle(data.data);
      break;
      
    case 'NODE':
      // 添加新节点到画布
      addNodeToCanvas(data.data);
      break;
      
    case 'DONE':
      // 任务完成
      eventSource.close();
      onTaskComplete();
      break;
      
    case 'ERROR':
      // 处理错误
      eventSource.close();
      onTaskError(data.data);
      break;
  }
};

eventSource.onerror = function(event) {
  console.error('SSE连接错误:', event);
  eventSource.close();
};
```

## 兼容性保证

根据最新的工作流实现，系统已经能够：

1. ✅ **自动处理null值**：当convId和parentId为null时，系统会自动创建会话和根节点
2. ✅ **URL格式验证**：检查PDF文件URL格式的有效性
3. ✅ **PDF内容验证**：验证文档是否包含电路实验任务内容
4. ✅ **错误处理**：提供友好的错误提示信息
5. ✅ **完整流程**：从PDF解析到节点创建的完整处理流程
6. ✅ **日志记录**：详细的日志记录便于问题排查

前端按照上述格式发送请求，后端将能够万无一失地处理PDF文档解读分析并成功返回相应节点。 