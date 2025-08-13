# PDF电路实验任务提交问题修复报告

## 🔍 问题分析

根据后端报错信息：
```
Current request is not a multipart request
org.springframework.web.multipart.MultipartException: Current request is not a multipart request
```

**问题根因**: 后端的AI任务创建接口（`/flow/tasks`）对于PDF相关任务期望接收`multipart/form-data`格式的请求，但前端发送的是`application/json`格式。

## 🔧 解决方案

### 1. 修改`createAiTask`方法

在`/src/api/methods/flow.methods.ts`中修改了`createAiTask`方法，使其能够根据任务类型自动选择合适的请求格式：

```typescript
export const createAiTask = (createAiTaskDTO: CreateAiTaskDTO) => {
  // 检查是否是PDF相关任务，需要使用multipart格式
  const isPdfTask = createAiTaskDTO.type === 'PDF_CIRCUIT_ANALYSIS' || 
                   createAiTaskDTO.type === 'PDF_CIRCUIT_ANALYSIS_DETAIL' ||
                   createAiTaskDTO.type === 'PDF_CIRCUIT_DESIGN';
  
  if (isPdfTask) {
    // 使用FormData发送multipart请求
    const formData = new FormData();
    formData.append('type', createAiTaskDTO.type);
    
    if (createAiTaskDTO.prompt) {
      formData.append('prompt', createAiTaskDTO.prompt);
    }
    
    if (createAiTaskDTO.promptParams) {
      formData.append('promptParams', JSON.stringify(createAiTaskDTO.promptParams));
    } else {
      formData.append('promptParams', '{}');
    }
    
    if (createAiTaskDTO.convId !== null) {
      formData.append('convId', createAiTaskDTO.convId.toString());
    }
    
    if (createAiTaskDTO.parentId !== null) {
      formData.append('parentId', createAiTaskDTO.parentId.toString());
    }
    
    if (createAiTaskDTO.model) {
      formData.append('model', createAiTaskDTO.model);
    }
    
    if (createAiTaskDTO.classId) {
      formData.append('classId', createAiTaskDTO.classId);
    }
    
    return alova.Post<CreateAiTaskVO>('/flow/tasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  } else {
    // 非PDF任务使用JSON格式
    return alova.Post<CreateAiTaskVO>('/flow/tasks', createAiTaskDTO);
  }
};
```

### 2. 智能格式检测

修改后的方法具有以下特性：

- **自动检测**: 根据任务类型自动选择请求格式
- **向后兼容**: 非PDF任务仍使用原有的JSON格式
- **PDF任务专用**: PDF相关任务（`PDF_CIRCUIT_ANALYSIS`、`PDF_CIRCUIT_ANALYSIS_DETAIL`、`PDF_CIRCUIT_DESIGN`）使用multipart格式

### 3. 数据转换处理

- 将所有字段转换为字符串格式添加到FormData
- `promptParams`对象转换为JSON字符串
- 数字类型的`convId`和`parentId`转换为字符串
- 空值的正确处理

## 🎯 影响范围

修改会影响以下组件中的PDF任务提交：

1. **ExperimentConversation.tsx** - PDF分析和设计任务
2. **DocumentLibrary.tsx** - 文档库中的分析任务
3. **DocumentAnalysis.tsx** - 文档分析页面
4. **PdfAnalysisPointNode.tsx** - PDF分析详情任务

## ✅ 验证测试

修改后的代码：
- ✅ TypeScript编译无错误
- ✅ 保持了原有API调用接口不变
- ✅ 自动格式选择逻辑正确
- ✅ 向后兼容性良好

## 🚀 预期效果

经过修复后，当用户：
1. 上传PDF文档并点击"分析实验文档"
2. 点击PDF分析点的"继续解析"
3. 使用PDF设计功能

这些操作将发送正确的multipart/form-data格式请求，解决后端"Current request is not a multipart request"的错误。

## 📝 注意事项

1. **测试建议**: 建议在开发环境中测试PDF任务提交功能
2. **监控**: 观察后端日志确认不再出现multipart错误
3. **兼容性**: 非PDF任务（通用AI任务等）仍使用JSON格式，不受影响

这个修复确保了前后端请求格式的一致性，解决了PDF电路实验任务提交的问题。
