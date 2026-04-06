import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import {TOKEN_KEY} from "@/common/constant/storage-key.constant.ts";
import { BASE_URL } from './runtimeConfig';

// 导出所有API方法
export * from './methods/auth.methods';
export * from './methods/flow.methods';
export * from './methods/knowledge.methods';
export * from './methods/tool.methods';
export * from './methods/course.methods';
export * from './methods/circuit.methods';
export * from './runtimeConfig';

const alova = createAlova({
  requestAdapter: adapterFetch(),
  baseURL: BASE_URL,
  statesHook: ReactHook,
  // 请求拦截器
  beforeRequest(method) {
    // 鉴权
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      method.config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 只为非文件请求设置Content-Type
    // 如果请求体是FormData，不要设置Content-Type，让浏览器自动处理
    if (!method.meta?.isFile && !(method.data instanceof FormData)) {
      method.config.headers['Content-Type'] = 'application/json';
    }
  },
  // 响应拦截器，解包
  responded: async (response) => {
    const json = await response.json();
    if (response.status !== 200) {
      throw new Error(json.message || '请求失败');
    } else {
      // 处理嵌套的响应结构
      // 后端返回格式：{code: 200, data: {code: 0, data: [...], message: "..."}}
      if (
        json.data &&
        typeof json.data === 'object' &&
        typeof json.data.code === 'number' &&
        'data' in json.data
      ) {
        // 检查内层的错误码
        if (json.data.code !== 0) {
          throw new Error(json.data.message || '业务处理失败');
        }
        // 如果是嵌套结构且成功，返回内层的 data
        return json.data.data;
      } else {
        // 如果不是嵌套结构，返回外层的 data
        return json.data;
      }
    }
  }
});

export default alova;
