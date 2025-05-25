/**
 * 将字节大小转换为人类可读的格式
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的大小字符串
 */
export function bytesToSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 * @param fileName 文件名
 * @returns 文件扩展名
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * 检查文件类型是否为PDF
 * @param file 文件对象
 * @returns 是否为PDF文件
 */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

/**
 * 检查文件大小是否超过限制
 * @param file 文件对象
 * @param maxSize 最大大小（MB）
 * @returns 是否超过限制
 */
export function isFileSizeExceeded(file: File, maxSize: number): boolean {
  return file.size > maxSize * 1024 * 1024;
}

/**
 * 生成随机文件名
 * @param originalName 原始文件名
 * @returns 随机文件名
 */
export function generateRandomFileName(originalName: string): string {
  const extension = getFileExtension(originalName);
  const randomStr = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  
  return `${randomStr}_${timestamp}.${extension}`;
} 