import alova from '@/api';
import { CircuitDesign } from '@/api/types/circuit.types';

/**
 * 保存电路设计到服务器
 * @param circuitDesign 电路设计数据
 * @param title 电路设计标题
 * @param description 电路设计描述
 * @returns 保存结果
 */
export const saveCircuitDesign = async (
  circuitDesign: CircuitDesign,
  title: string = '电路设计',
  description: string = '使用DrawSee创建的电路'
): Promise<{ id: string; success: boolean }> => {
  try {
    const payload = {
      ...circuitDesign,
      metadata: {
        ...circuitDesign.metadata,
        title,
        description,
        updatedAt: new Date().toISOString()
      }
    };

    const response = await alova.Post<{ id: string; success: boolean }>('/api/circuits', payload);
    return response;
  } catch (error) {
    console.error('保存电路设计失败:', error);
    throw error;
  }
};

/**
 * 获取电路设计列表
 * @returns 电路设计列表
 */
export const getCircuitDesigns = async () => {
  try {
    const response = await alova.Get<{ designs: Array<{ id: string; title: string; createdAt: string; updatedAt: string }> }>('/api/circuits');
    return response;
  } catch (error) {
    console.error('获取电路设计列表失败:', error);
    throw error;
  }
};

/**
 * 获取特定电路设计详情
 * @param id 电路设计ID
 * @returns 电路设计详情
 */
export const getCircuitDesignById = async (id: string) => {
  try {
    const response = await alova.Get<CircuitDesign>(`/api/circuits/${id}`);
    return response;
  } catch (error) {
    console.error('获取电路设计详情失败:', error);
    throw error;
  }
};

/**
 * 删除电路设计
 * @param id 电路设计ID
 * @returns 删除结果
 */
export const deleteCircuitDesign = async (id: string) => {
  try {
    const response = await alova.Delete<{ success: boolean }>(`/api/circuits/${id}`);
    return response;
  } catch (error) {
    console.error('删除电路设计失败:', error);
    throw error;
  }
}; 