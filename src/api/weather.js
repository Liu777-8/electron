// src/api/weather.js
// 高德地图天气API接口

import axios from 'axios'

// 高德地图API密钥
const AMAP_APP_KEY = '0c78c4d25609df9afa5d6f18ffd42d67'

// 高德地图天气API基础URL
const WEATHER_BASE_URL = 'https://restapi.amap.com/v3/weather/weatherInfo'

/**
 * 创建天气API请求实例
 */
const weatherService = axios.create({
  baseURL: WEATHER_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器 - 自动添加API密钥
 */
weatherService.interceptors.request.use(
  (config) => {
    // 自动添加key参数
    config.params = {
      ...config.params,
      key: AMAP_APP_KEY
    }
    console.log('发送天气API请求:', config)
    return config
  },
  (error) => {
    console.error('天气API请求错误:', error)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 - 处理响应数据
 */
weatherService.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 检查高德API返回状态
    if (data.status === '1') {
      console.log('天气API请求成功:', data)
      return data
    } else {
      console.error('高德API返回错误:', data.info)
      return Promise.reject(new Error(data.info || '天气数据获取失败'))
    }
  },
  (error) => {
    console.error('天气API响应错误:', error)
    return Promise.reject(error)
  }
)

/**
 * 获取天气信息
 * @param {string} city - 城市名称或城市编码（如：北京、110000）
 * @param {string} extensions - 返回数据类型：base(实况天气) 或 all(预报天气)
 * @returns {Promise} 天气数据
 */
export const getWeatherInfo = async (city, extensions = 'base') => {
  try {
    const response = await weatherService.get('', {
      params: {
        city: city,
        extensions: extensions
      }
    })
    return response
  } catch (error) {
    console.error('获取天气信息失败:', error)
    throw error
  }
}

/**
 * 获取实时天气
 * @param {string} city - 城市名称或城市编码
 * @returns {Promise} 实时天气数据
 */
export const getCurrentWeather = async (city) => {
  return await getWeatherInfo(city, 'base')
}

/**
 * 获取天气预报（未来4天）
 * @param {string} city - 城市名称或城市编码
 * @returns {Promise} 天气预报数据
 */
export const getWeatherForecast = async (city) => {
  return await getWeatherInfo(city, 'all')
}

/**
 * 根据IP获取当前位置的天气
 * @param {string} extensions - 返回数据类型：base(实况天气) 或 all(预报天气)
 * @returns {Promise} 天气数据
 */
export const getWeatherByIP = async (extensions = 'base') => {
  try {
    const response = await weatherService.get('', {
      params: {
        city: '110000', // 默认北京，实际使用时可以通过IP定位获取
        extensions: extensions
      }
    })
    return response
  } catch (error) {
    console.error('根据IP获取天气失败:', error)
    throw error
  }
}

// 导出配置常量
export const WEATHER_CONFIG = {
  APP_KEY: AMAP_APP_KEY,
  BASE_URL: WEATHER_BASE_URL,
  EXTENSIONS: {
    BASE: 'base',    // 实况天气
    ALL: 'all'       // 预报天气
  }
}

// 默认导出天气服务实例
export default weatherService