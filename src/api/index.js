// src/api/index.js

import axios from 'axios'

const service = axios.create({
  baseURL: '', // api 的 base_url
  timeout: 5000, // 请求超时时间
})

// request 拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里可以做一些请求前的处理
    return config
  },
  (error) => {
    // 处理请求错误
    Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  (response) => {
    // 在这里可以做一些响应后的处理
    return response.data
  },
  (error) => {
    // 处理响应错误
    return Promise.reject(error)
  }
)

export default service