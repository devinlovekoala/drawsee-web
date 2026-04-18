# AI任务类型及API调用示例

## AI任务类型规范

### 命名规范
- **请求体中**：统一使用 `UPPER_SNAKE_CASE` 格式（大写字母+下划线）
- **项目代码中**：统一使用 `AiTaskType` 类型，保持与请求体一致的命名

### 支持的AI任务类型

#### 1. 基础对话任务
- `GENERAL` - 常规问答模式
- `GENERAL_CONTINUE` - 常规对话继续
- `GENERAL_DETAIL` - 常规对话详情展开

#### 2. 知识库任务
- `KNOWLEDGE` - 知识问答模式
- `KNOWLEDGE_DETAIL` - 知识点详情展开

#### 3. 动画生成任务  
- `ANIMATION` - 动画生成模式
- `ANIMATION_DETAIL` - 动画详情展开

#### 4. 解题推理任务
- `SOLVER_FIRST` - 推理解题首次请求
- `SOLVER_CONTINUE` - 推理解题继续
- `SOLVER_SUMMARY` - 推理解题总结

#### 5. 电路分析任务
- `CIRCUIT_ANALYSIS` - 电路分析模式
- `CIRCUIT_DETAIL` - 电路分析详情展开

#### 6. PDF电路实验任务
- `PDF_CIRCUIT_ANALYSIS` - PDF电路实验文档分析（生成分析点）
- `PDF_CIRCUIT_ANALYSIS_DETAIL` - PDF电路实验分析点详情展开
- `PDF_CIRCUIT_DESIGN` - PDF电路实验任务获取电路分析图

## API请求示例

### 数据结构定义

```typescript
interface CreateAiTaskDTO {
  type: AiTaskType;                    // AI任务类型
  prompt: string | null;               // 用户输入的提示文本
  promptParams: Record<string, string> | null;  // 提示参数对象
  convId: number | null;               // 会话ID（可选）
  parentId: number | null;             // 父节点ID（可选）
  model: string | null;                // AI模型名称（可选）
  classId: string | null;              // 班级ID（可选）
}
```

### 1. 常规问答任务

```json
{
  "type": "GENERAL",
  "prompt": "请解释一下量子力学的基本原理",
  "promptParams": {},
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": null
}
```

### 2. 知识库问答任务

```json
{
  "type": "KNOWLEDGE",
  "prompt": "什么是机器学习？",
  "promptParams": {},
  "convId": 12345,
  "parentId": null,
  "model": "deepseekV3",
  "classId": "class_001"
}
```

### 3. 推理解题任务

```json
{
  "type": "SOLVER_FIRST",
  "prompt": "求解二次方程 x² + 5x + 6 = 0",
  "promptParams": {
    "method": "因式分解法"
  },
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": null
}
```

### 4. 推理解题继续

```json
{
  "type": "SOLVER_CONTINUE",
  "prompt": "",
  "promptParams": {},
  "convId": 12345,
  "parentId": 67890,
  "model": "deepseekV3",
  "classId": null
}
```

### 5. 动画生成任务

```json
{
  "type": "ANIMATION",
  "prompt": "请生成一个展示牛顿第二定律的动画",
  "promptParams": {},
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": "physics_101"
}
```

### 6. 电路分析任务

```json
{
  "type": "CIRCUIT_ANALYSIS",
  "prompt": "分析这个RLC串联电路的频率响应",
  "promptParams": {},
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": "circuit_lab"
}
```

### 7. PDF电路实验分析

```json
{
  "type": "PDF_CIRCUIT_ANALYSIS",
  "prompt": "http://117.72.9.87:9046/drawsee/user-documents/14/1755520951080_2024%20Experiment%201-2-3.pdf?response-content-disposition=inline&response-accept-ranges=bytes&response-content-length=599206&response-content-type=application%2Fpdf&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=1r6Dfs4muAO6JfKFnkqH%2F20250818%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250818T124241Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=04ab72fe2267d1869350cb411569a4cb9846bc2934a2e37d1d202cce54fbb7c8",
  "promptParams": null,
  "convId": null,
  "parentId": null,
  "model": "deepseekV3",
  "classId": "circuit_lab"
}
```

### 8. PDF电路实验详情展开

```json
{
  "type": "PDF_CIRCUIT_ANALYSIS_DETAIL",
  "prompt": "",
  "promptParams": {
    "angle": "电路原理分析"
  },
  "convId": 12345,
  "parentId": 67890,
  "model": "deepseekV3",
  "classId": "circuit_lab"
}
```

## 参数说明

### 必填参数
- `type`: AI任务类型，必须是预定义的 `AiTaskType` 之一
- `prompt`: 用户输入文本，部分继续类任务可以为空字符串

### 可选参数
- `promptParams`: 额外参数对象
  - 解题任务中可包含 `method` 字段指定解题方法
  - PDF分析任务中可包含 `fileUrl`, `fileType` 等文件相关参数
  - 详情展开任务中可包含 `angle` 字段指定分析角度
- `convId`: 会话ID，用于关联到特定会话
- `parentId`: 父节点ID，用于构建对话树结构
- `model`: 指定使用的AI模型，如 "deepseek-chat"
- `classId`: 班级ID，用于教学场景的数据隔离

## 响应格式

### 成功响应
```json
{
  "taskId": 123456,
  "conversation": {
    "id": 12345,
    "title": "量子力学讨论",
    "userId": 1001,
    "createdAt": 1703123456000,
    "updatedAt": 1703123456000
  }
}
```

### 错误响应
- 参数验证失败：返回具体的验证错误信息
- 不支持的任务类型：`不支持的任务类型: INVALID_TYPE`
- 服务器错误：返回相应的错误状态码和消息

## 注意事项

1. **类型安全**: 所有任务类型必须严格按照 `AiTaskType` 定义使用
2. **参数格式**: `promptParams` 应为键值对对象，避免使用 `null` 值
3. **模型兼容**: 不同任务类型可能对应不同的AI模型，系统会自动选择合适的模型
4. **会话管理**: 使用 `convId` 和 `parentId` 可以构建复杂的对话树结构
5. **权限控制**: `classId` 用于多租户场景下的数据隔离

## 前端使用示例

```typescript
import { createAiTask } from '@/api/methods/flow.methods';
import type { CreateAiTaskDTO } from '@/api/types/flow.types';

// 创建常规问答任务
const createGeneralTask = async (userInput: string) => {
  const taskDto: CreateAiTaskDTO = {
    type: 'GENERAL',
    prompt: userInput,
    promptParams: {},
    convId: null,
    parentId: null,
    model: 'deepseekV3',
    classId: null
  };
  
  try {
    const response = await createAiTask(taskDto);
    console.log('任务创建成功:', response);
    return response;
  } catch (error) {
    console.error('任务创建失败:', error);
    throw error;
  }
};
```