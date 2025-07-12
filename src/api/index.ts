import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';
import {TOKEN_KEY} from "@/common/constant/storage-key.constant.ts";

export const BASE_URL = 'http://42.193.107.127:6868';
// export const BASE_URL = 'http://localhost:6868';

// 导出所有API方法
export * from './methods/auth.methods';
export * from './methods/flow.methods';
export * from './methods/knowledge.methods';
export * from './methods/tool.methods';
export * from './methods/course.methods';
export * from './methods/circuit.methods';

const alova = createAlova({
  requestAdapter: adapterFetch(),
  baseURL: BASE_URL,
  statesHook: ReactHook,
  // 请求拦截器
  beforeRequest(method) {
    // 鉴权
    if (!method.meta?.isFile) {
      method.config.headers['Content-Type'] = 'application/json';
    }
    method.config.headers['Authorization'] = `Bearer ${localStorage.getItem(TOKEN_KEY)}`;
  },
  // 响应拦截器，解包
  responded: async (response) => {
    const json = await response.json();
    if (response.status !== 200) {
      throw new Error(json.message);
    } else {
      return json.data;
    }
  }
});

export default alova;