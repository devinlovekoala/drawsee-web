/**
 * 用户文档VO
 */
export interface UserDocumentVO {
  /**
   * 文档ID
   */
  id: number;
  
  /**
   * 文档UUID
   */
  uuid?: string;
  
  /**
   * 所属用户ID
   */
  userId: number;
  
  /**
   * 文档标题
   */
  title: string;
  
  /**
   * 文档描述
   */
  description?: string;
  
  /**
   * 文档URL
   */
  fileUrl: string;
  
  /**
   * 文件名称（从 objectPath 提取或使用 title）
   */
  fileName?: string;
  
  /**
   * 对象路径
   */
  objectPath?: string;
  
  /**
   * 文件大小（字节）
   */
  fileSize: number;
  
  /**
   * 文件类型
   */
  fileType?: string;
  
  /**
   * 文档类型
   */
  documentType?: string;
  
  /**
   * 文档标签
   */
  tags?: string;
  
  /**
   * 创建时间
   */
  createdAt: string;
  
  /**
   * 更新时间
   */
  updatedAt: string;
  
  /**
   * 是否已删除
   */
  isDeleted?: boolean;
}

/**
 * 文档类型
 */
export enum DocumentType {
  PDF = 'application/pdf',
  WORD = 'application/msword',
  EXCEL = 'application/vnd.ms-excel',
  PPT = 'application/vnd.ms-powerpoint',
  IMAGE = 'image/',
  TEXT = 'text/plain',
  OTHER = 'other'
}

/**
 * 文档上传参数
 */
export interface DocumentUploadParams {
  file: File;
  title?: string;
  description?: string;
  tags?: string;
}

/**
 * 文档更新参数
 */
export interface DocumentUpdateParams {
  documentId: number;
  title?: string;
  description?: string;
  tags?: string;
} 