import { createAlova } from 'alova';
import adapterFetch from 'alova/fetch';
import ReactHook from 'alova/react';

const alova = createAlova({
  requestAdapter: adapterFetch(),
  baseURL: 'http://localhost:6868',
  statesHook: ReactHook,
  // 请求拦截器
  beforeRequest(method) {
    // 鉴权
    method.config.headers['Content-Type'] = 'application/json';
    //method.config.headers['Authorization'] = `Bearer ${localStorage.getItem("token")}`;
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