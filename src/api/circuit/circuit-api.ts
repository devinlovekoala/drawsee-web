import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import reactHook from 'alova/react';
import { CircuitDesign } from '../types/circuit.types';

// 创建alova实例
export const alovaInstance = createAlova({
  baseURL: '',  // 空字符串表示使用当前域名的根路径
  statesHook: reactHook,
  requestAdapter: adapterFetch(),
  responded: {
    onSuccess: async (response) => {
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      // 处理HTTP 204状态码（No Content）
      if (response.status === 204) {
        console.log('成功处理HTTP 204状态码（No Content）');
        return { success: true }; // 返回一个简单的成功对象
      }
      
      return await response.json();
    },
    onError: (error) => {
      console.error('API Request Failed:', error);
      throw error;
    }
  }
});

/**
 * 保存电路设计到后端（不启动分析）
 * @param circuitDesign 电路设计数据
 * @returns 包含Circuit ID的响应
 */
export const saveCircuitDesign = async (circuitDesign: CircuitDesign): Promise<{circuit_id: string}> => {
  try {
    console.log("调用保存电路设计API");
    const response = await alovaInstance.Post('/api/circuit/design', circuitDesign);
    console.log("保存电路设计API响应:", response);
    return response as {circuit_id: string};
  } catch (error) {
    console.error("保存电路设计失败:", error);
    throw error;
  }
};

/**
 * 启动电路分析（但不阻塞等待结果）
 * @param circuitId 已保存的电路ID
 * @returns 启动分析的响应
 */
export const startAnalysis = async (circuitId: string): Promise<{status: string, message: string}> => {
  try {
    console.log("启动分析电路:", circuitId);
    const response = await alovaInstance.Post(`/api/circuit/analyze/${circuitId}`);
    console.log("启动分析API响应:", response);
    return response as {status: string, message: string};
  } catch (error) {
    console.error("启动分析请求失败:", error);
    throw error;
  }
};

/**
 * 获取电路分析历史记录
 * @param page 页码
 * @param pageSize 每页记录数
 * @returns 历史记录列表
 */
export const getCircuitHistory = (
  page = 1,
  pageSize = 10,
): Promise<any> => {
  return alovaInstance.Get('/api/circuit/history', {
    params: {
      page,
      page_size: pageSize,
      sort_by: 'created_at',
      sort_order: 'desc'
    }
  });
};

// 存储活跃的 SSE 连接，以电路ID为键
const activeSSEConnections: Map<string, EventSource> = new Map();

/**
 * 创建电路分析流式连接
 * @param circuitId 电路ID
 */
export function createAnalysisStream(circuitId: string, onData: (data: any) => void, onComplete: () => void, onError: (error: any) => void): void {
  // 关闭之前的连接（如果有）
  closeAnalysisStream(circuitId);

  // 创建新的 SSE 连接
  const url = `/api/circuit/analysis/${circuitId}/stream?t=${Date.now()}`;
  const eventSource = new EventSource(url);
  
  // 添加事件监听器
  eventSource.addEventListener('analyzing', (event) => {
    try {
      const data = JSON.parse(event.data);
      onData({ type: 'analyzing', data });
    } catch (e) {
      console.error('解析分析中事件数据失败:', e);
    }
  });
  
  eventSource.addEventListener('content', (event) => {
    try {
      const data = JSON.parse(event.data);
      onData({ type: 'content', data });
    } catch (e) {
      console.error('解析内容事件数据失败:', e);
    }
  });
  
  eventSource.addEventListener('complete', (event) => {
    try {
      const data = JSON.parse(event.data);
      onData({ type: 'complete', data });
      onComplete();
      // 分析完成后关闭连接
      closeAnalysisStream(circuitId);
    } catch (e) {
      console.error('解析完成事件数据失败:', e);
    }
  });
  
  eventSource.addEventListener('error', (event) => {
    console.error('SSE 连接错误:', event);
    onError(event);
  });
  
  // 存储连接
  activeSSEConnections.set(circuitId, eventSource);
}

/**
 * 关闭电路分析流式连接
 * @param circuitId 电路ID
 */
export function closeAnalysisStream(circuitId: string): void {
  const connection = activeSSEConnections.get(circuitId);
  if (connection) {
    console.log(`关闭电路 ${circuitId} 的 SSE 连接`);
    connection.close();
    activeSSEConnections.delete(circuitId);
  }
}