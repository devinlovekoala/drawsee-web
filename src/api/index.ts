import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

//export const BASE_URL = 'http://42.193.107.127:6868';
export const BASE_URL = 'http://localhost:6868';

// 创建alova实例
const alova = createAlova({
  baseURL: import.meta.env.VITE_API_BASE_URL || BASE_URL,
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  responded: (response: Response) => {
    // 全局响应拦截器
    if (response.status >= 400) {
      return Promise.reject(response.statusText);
    }
    
    return response.json();
  }
});

export default alova;