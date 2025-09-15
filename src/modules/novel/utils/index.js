// 工具函数统一导出
// 提供小说模块所有工具函数的统一入口

import storageUtils, { StorageManager, StorageAdapter } from './storageUtils.js'
import fileUtils, { FileProcessor, SUPPORTED_FORMATS } from './fileUtils.js'
import windowUtils, { WindowManager, ShortcutManager, WINDOW_CONFIGS, WINDOW_EVENTS } from './windowUtils.js'

/**
 * 通用工具函数
 */
export const commonUtils = {
  /**
   * 防抖函数
   */
  debounce(func, wait, immediate = false) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        timeout = null
        if (!immediate) func.apply(this, args)
      }
      const callNow = immediate && !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this, args)
    }
  },
  
  /**
   * 节流函数
   */
  throttle(func, limit) {
    let inThrottle
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },
  
  /**
   * 深拷贝
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => this.deepClone(item))
    if (typeof obj === 'object') {
      const clonedObj = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key])
        }
      }
      return clonedObj
    }
  },
  
  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },
  
  /**
   * 格式化时间
   */
  formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return ''
    
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  },
  
  /**
   * 格式化相对时间
   */
  formatRelativeTime(date) {
    if (!date) return ''
    
    const now = new Date()
    const target = new Date(date)
    const diff = now - target
    
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    const week = 7 * day
    const month = 30 * day
    const year = 365 * day
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`
    } else if (diff < month) {
      return `${Math.floor(diff / week)}周前`
    } else if (diff < year) {
      return `${Math.floor(diff / month)}个月前`
    } else {
      return `${Math.floor(diff / year)}年前`
    }
  },
  
  /**
   * 生成唯一ID
   */
  generateId(prefix = '') {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 9)
    return `${prefix}${timestamp}${random}`
  },
  
  /**
   * 生成UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  },
  
  /**
   * 检查是否为空值
   */
  isEmpty(value) {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  },
  
  /**
   * 安全的JSON解析
   */
  safeJsonParse(str, defaultValue = null) {
    try {
      return JSON.parse(str)
    } catch (err) {
      console.warn('JSON解析失败:', err)
      return defaultValue
    }
  },
  
  /**
   * 安全的JSON字符串化
   */
  safeJsonStringify(obj, defaultValue = '{}') {
    try {
      return JSON.stringify(obj)
    } catch (err) {
      console.warn('JSON字符串化失败:', err)
      return defaultValue
    }
  },
  
  /**
   * 数组去重
   */
  uniqueArray(arr, key = null) {
    if (!Array.isArray(arr)) return []
    
    if (key) {
      const seen = new Set()
      return arr.filter(item => {
        const value = item[key]
        if (seen.has(value)) {
          return false
        }
        seen.add(value)
        return true
      })
    }
    
    return [...new Set(arr)]
  },
  
  /**
   * 对象合并
   */
  mergeObjects(target, ...sources) {
    if (!target || typeof target !== 'object') return {}
    
    sources.forEach(source => {
      if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            target[key] = this.mergeObjects(target[key] || {}, source[key])
          } else {
            target[key] = source[key]
          }
        })
      }
    })
    
    return target
  },
  
  /**
   * 字符串截断
   */
  truncateString(str, length, suffix = '...') {
    if (!str || typeof str !== 'string') return ''
    if (str.length <= length) return str
    return str.substring(0, length) + suffix
  },
  
  /**
   * 字符串转驼峰
   */
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
  },
  
  /**
   * 驼峰转连字符
   */
  toKebabCase(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  },
  
  /**
   * 数字格式化
   */
  formatNumber(num, decimals = 0) {
    if (isNaN(num)) return '0'
    return Number(num).toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  },
  
  /**
   * 百分比格式化
   */
  formatPercent(value, total, decimals = 1) {
    if (!total || total === 0) return '0%'
    const percent = (value / total) * 100
    return `${percent.toFixed(decimals)}%`
  },
  
  /**
   * 颜色转换
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  },
  
  /**
   * RGB转十六进制
   */
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  },
  
  /**
   * 获取随机颜色
   */
  getRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16)
  },
  
  /**
   * 检查是否为移动设备
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },
  
  /**
   * 检查是否为Electron环境
   */
  isElectron() {
    return typeof window !== 'undefined' && window.electronAPI
  },
  
  /**
   * 获取操作系统类型
   */
  getOS() {
    const userAgent = navigator.userAgent
    if (userAgent.indexOf('Win') !== -1) return 'Windows'
    if (userAgent.indexOf('Mac') !== -1) return 'macOS'
    if (userAgent.indexOf('Linux') !== -1) return 'Linux'
    if (userAgent.indexOf('Android') !== -1) return 'Android'
    if (userAgent.indexOf('iOS') !== -1) return 'iOS'
    return 'Unknown'
  },
  
  /**
   * 复制到剪贴板
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        return true
      } else {
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return true
      }
    } catch (err) {
      console.error('复制到剪贴板失败:', err)
      return false
    }
  },
  
  /**
   * 从剪贴板读取
   */
  async readFromClipboard() {
    try {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText()
      }
      return ''
    } catch (err) {
      console.error('从剪贴板读取失败:', err)
      return ''
    }
  },
  
  /**
   * 下载文件
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  },
  
  /**
   * 读取文件
   */
  readFile(file, type = 'text') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      
      switch (type) {
        case 'text':
          reader.readAsText(file)
          break
        case 'dataURL':
          reader.readAsDataURL(file)
          break
        case 'arrayBuffer':
          reader.readAsArrayBuffer(file)
          break
        default:
          reader.readAsText(file)
      }
    })
  },
  
  /**
   * 延迟执行
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  },
  
  /**
   * 重试机制
   */
  async retry(fn, maxAttempts = 3, delay = 1000) {
    let lastError
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        if (attempt < maxAttempts) {
          await this.sleep(delay * attempt)
        }
      }
    }
    
    throw lastError
  },
  
  /**
   * 事件总线
   */
  createEventBus() {
    const events = new Map()
    
    return {
      on(event, callback) {
        if (!events.has(event)) {
          events.set(event, [])
        }
        events.get(event).push(callback)
      },
      
      off(event, callback) {
        const callbacks = events.get(event)
        if (callbacks) {
          const index = callbacks.indexOf(callback)
          if (index > -1) {
            callbacks.splice(index, 1)
          }
        }
      },
      
      emit(event, ...args) {
        const callbacks = events.get(event)
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(...args)
            } catch (err) {
              console.error('事件回调执行失败:', err)
            }
          })
        }
      },
      
      clear() {
        events.clear()
      }
    }
  }
}

/**
 * 阅读相关工具函数
 */
export const readerUtils = {
  /**
   * 计算阅读时间
   */
  calculateReadingTime(wordCount, wordsPerMinute = 200) {
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    if (minutes < 60) {
      return `${minutes}分钟`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`
  },
  
  /**
   * 计算阅读进度
   */
  calculateProgress(currentPosition, totalLength) {
    if (!totalLength || totalLength === 0) return 0
    return Math.min(Math.max((currentPosition / totalLength) * 100, 0), 100)
  },
  
  /**
   * 格式化章节标题
   */
  formatChapterTitle(title, index) {
    if (!title || title.trim() === '') {
      return `第${index}章`
    }
    return title.trim()
  },
  
  /**
   * 文本高亮
   */
  highlightText(text, keyword, className = 'highlight') {
    if (!keyword || !text) return text
    
    const regex = new RegExp(`(${keyword})`, 'gi')
    return text.replace(regex, `<span class="${className}">$1</span>`)
  },
  
  /**
   * 文本搜索
   */
  searchInText(text, keyword, caseSensitive = false) {
    if (!keyword || !text) return []
    
    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(keyword, flags)
    const matches = []
    let match
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        context: text.substring(
          Math.max(0, match.index - 20),
          Math.min(text.length, match.index + match[0].length + 20)
        )
      })
    }
    
    return matches
  },
  
  /**
   * 文本统计
   */
  getTextStats(text) {
    if (!text) return { characters: 0, words: 0, paragraphs: 0, lines: 0 }
    
    const characters = text.length
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
    const lines = text.split('\n').length
    
    return { characters, words, paragraphs, lines }
  },
  
  /**
   * 生成目录
   */
  generateTOC(chapters) {
    return chapters.map((chapter, index) => ({
      id: chapter.id || index + 1,
      title: this.formatChapterTitle(chapter.title, index + 1),
      wordCount: chapter.wordCount || 0,
      readingTime: this.calculateReadingTime(chapter.wordCount || 0),
      level: chapter.level || 1
    }))
  }
}

/**
 * 性能监控工具
 */
export const performanceUtils = {
  /**
   * 性能计时器
   */
  createTimer(name) {
    const startTime = performance.now()
    
    return {
      end() {
        const endTime = performance.now()
        const duration = endTime - startTime
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
        return duration
      }
    }
  },
  
  /**
   * 内存使用监控
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      }
    }
    return null
  },
  
  /**
   * FPS监控
   */
  createFPSMonitor(callback) {
    let frames = 0
    let lastTime = performance.now()
    
    function tick() {
      frames++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime))
        callback(fps)
        frames = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(tick)
    }
    
    requestAnimationFrame(tick)
  }
}

// 统一导出所有工具
export {
  storageUtils,
  fileUtils,
  windowUtils,
  StorageManager,
  StorageAdapter,
  FileProcessor,
  SUPPORTED_FORMATS,
  WindowManager,
  ShortcutManager,
  WINDOW_CONFIGS,
  WINDOW_EVENTS
}

// 默认导出
export default {
  storage: storageUtils,
  file: fileUtils,
  window: windowUtils,
  common: commonUtils,
  reader: readerUtils,
  performance: performanceUtils
}