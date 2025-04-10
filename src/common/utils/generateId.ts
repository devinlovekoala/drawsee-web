/**
 * 生成指定长度的随机ID
 * @param length ID长度，默认为8
 * @returns 随机ID字符串
 */
export function generateRandomId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成基于时间戳的ID
 * @param prefix 可选前缀
 * @returns 时间戳ID字符串
 */
export function generateTimeBasedId(prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix || ''}${timestamp}${random}`;
}

/**
 * 生成UUID (v4)
 * @returns UUID字符串
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}