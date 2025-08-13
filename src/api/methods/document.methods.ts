import alova from '@/api';
import { UserDocumentVO } from '@/api/types/document.types';

/**
 * 获取用户PDF文档列表
 * @returns PDF文档列表
 */
export const getUserPdfDocuments = async (): Promise<UserDocumentVO[]> => {
  try {
    const response = await alova.Get<UserDocumentVO[]>('/user/document/pdf/list');
    return response;
  } catch (error) {
    console.error('获取用户PDF文档列表失败:', error);
    throw error;
  }
};

/**
 * 获取用户所有文档列表
 * @returns 所有文档列表
 */
export const getUserDocuments = async (): Promise<UserDocumentVO[]> => {
  try {
    const response = await alova.Get<UserDocumentVO[]>('/user/document/list');
    return response;
  } catch (error) {
    console.error('获取用户文档列表失败:', error);
    throw error;
  }
};

/**
 * 获取文档详情
 * @param documentId 文档ID
 * @returns 文档详情
 */
export const getDocumentById = async (documentId: number): Promise<UserDocumentVO> => {
  try {
    const response = await alova.Get<UserDocumentVO>(`/user/document/${documentId}`);
    return response;
  } catch (error) {
    console.error('获取文档详情失败:', error);
    throw error;
  }
};

/**
 * 上传用户文档
 * @param file 文件
 * @param title 标题
 * @param description 描述
 * @param tags 标签
 * @returns 上传结果
 */
export const uploadUserDocument = async (
  file: File,
  title?: string,
  description?: string,
  tags?: string
): Promise<UserDocumentVO> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);
  if (tags) formData.append('tags', tags);

  try {
    const response = await alova.Post<UserDocumentVO>('/user/document/upload', formData, {
      // 标记为文件上传请求，避免拦截器设置错误的Content-Type
      meta: { isFile: true }
    });
    return response;
  } catch (error) {
    console.error('上传文档失败:', error);
    throw error;
  }
};

/**
 * 删除文档
 * @param documentId 文档ID
 * @returns 删除结果
 */
export const deleteDocument = async (documentId: number): Promise<boolean> => {
  try {
    await alova.Delete(`/user/document/${documentId}`);
    return true;
  } catch (error) {
    console.error('删除文档失败:', error);
    throw error;
  }
};

/**
 * 更新文档信息
 * @param documentId 文档ID
 * @param title 标题
 * @param description 描述
 * @param tags 标签
 * @returns 更新结果
 */
export const updateDocument = async (
  documentId: number,
  title?: string,
  description?: string,
  tags?: string
): Promise<UserDocumentVO> => {
  try {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (description) params.append('description', description);
    if (tags) params.append('tags', tags);

    const response = await alova.Put<UserDocumentVO>(`/user/document/${documentId}`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response;
  } catch (error) {
    console.error('更新文档失败:', error);
    throw error;
  }
}; 