/**
 * 用户体验优化工具函数
 * 提供各种提升用户体验的功能
 */

// 平滑滚动
export function smoothScrollTo(element, targetPosition, duration = 300) {
  const startPosition = element.scrollTop
  const distance = targetPosition - startPosition
  const startTime = performance.now()
  
  function animation(currentTime) {
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    
    // 使用缓动函数
    const easeInOutCubic = progress < 0.5 
      ? 4 * progress * progress * progress 
      : (progress - 1) * (2 * progress - 2) * (2 * progress - 2) + 1
    
    element.scrollTop = startPosition + distance * easeInOutCubic
    
    if (progress < 1) {
      requestAnimationFrame(animation)
    }
  }
  
  requestAnimationFrame(animation)
}

// 触觉反馈（如果支持）
export function hapticFeedback(type = 'light') {
  if (navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      error: [50, 100, 50],
      warning: [20, 50, 20]
    }
    
    navigator.vibrate(patterns[type] || patterns.light)
  }
}

// 键盘导航支持
export class KeyboardNavigation {
  constructor(container, options = {}) {
    this.container = container
    this.focusableSelector = options.focusableSelector || 
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    this.currentIndex = 0
    this.elements = []
    
    this.init()
  }
  
  init() {
    this.updateElements()
    this.bindEvents()
  }
  
  updateElements() {
    this.elements = Array.from(
      this.container.querySelectorAll(this.focusableSelector)
    ).filter(el => !el.disabled && el.offsetParent !== null)
  }
  
  bindEvents() {
    this.container.addEventListener('keydown', this.handleKeydown.bind(this))
  }
  
  handleKeydown(event) {
    const { key } = event
    
    switch (key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        this.focusNext()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        this.focusPrevious()
        break
      case 'Home':
        event.preventDefault()
        this.focusFirst()
        break
      case 'End':
        event.preventDefault()
        this.focusLast()
        break
      case 'Enter':
      case ' ':
        if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'TEXTAREA') {
          event.preventDefault()
          this.activateElement(event.target)
        }
        break
    }
  }
  
  focusNext() {
    this.updateElements()
    this.currentIndex = (this.currentIndex + 1) % this.elements.length
    this.focusCurrent()
  }
  
  focusPrevious() {
    this.updateElements()
    this.currentIndex = this.currentIndex === 0 
      ? this.elements.length - 1 
      : this.currentIndex - 1
    this.focusCurrent()
  }
  
  focusFirst() {
    this.updateElements()
    this.currentIndex = 0
    this.focusCurrent()
  }
  
  focusLast() {
    this.updateElements()
    this.currentIndex = this.elements.length - 1
    this.focusCurrent()
  }
  
  focusCurrent() {
    if (this.elements[this.currentIndex]) {
      this.elements[this.currentIndex].focus()
    }
  }
  
  activateElement(element) {
    if (element.click) {
      element.click()
    }
  }
  
  destroy() {
    this.container.removeEventListener('keydown', this.handleKeydown)
  }
}

// 手势识别
export class GestureRecognizer {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      threshold: 50, // 最小滑动距离
      timeout: 300,  // 最大滑动时间
      ...options
    }
    
    this.startX = 0
    this.startY = 0
    this.startTime = 0
    this.isTracking = false
    
    this.callbacks = {
      swipeLeft: [],
      swipeRight: [],
      swipeUp: [],
      swipeDown: [],
      tap: [],
      longPress: []
    }
    
    this.init()
  }
  
  init() {
    // 触摸事件
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
    
    // 鼠标事件（用于桌面端测试）
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this))
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this))
  }
  
  handleTouchStart(event) {
    const touch = event.touches[0]
    this.startTracking(touch.clientX, touch.clientY)
  }
  
  handleTouchEnd(event) {
    const touch = event.changedTouches[0]
    this.endTracking(touch.clientX, touch.clientY)
  }
  
  handleMouseDown(event) {
    this.startTracking(event.clientX, event.clientY)
  }
  
  handleMouseUp(event) {
    this.endTracking(event.clientX, event.clientY)
  }
  
  startTracking(x, y) {
    this.startX = x
    this.startY = y
    this.startTime = Date.now()
    this.isTracking = true
    
    // 长按检测
    this.longPressTimer = setTimeout(() => {
      if (this.isTracking) {
        this.trigger('longPress', { x, y })
      }
    }, 500)
  }
  
  endTracking(x, y) {
    if (!this.isTracking) return
    
    this.isTracking = false
    clearTimeout(this.longPressTimer)
    
    const deltaX = x - this.startX
    const deltaY = y - this.startY
    const deltaTime = Date.now() - this.startTime
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // 判断是否为点击
    if (distance < 10 && deltaTime < 200) {
      this.trigger('tap', { x, y })
      return
    }
    
    // 判断是否为滑动
    if (distance > this.options.threshold && deltaTime < this.options.timeout) {
      const angle = Math.atan2(Math.abs(deltaY), Math.abs(deltaX)) * 180 / Math.PI
      
      if (angle < 45) {
        // 水平滑动
        if (deltaX > 0) {
          this.trigger('swipeRight', { distance, deltaTime })
        } else {
          this.trigger('swipeLeft', { distance, deltaTime })
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          this.trigger('swipeDown', { distance, deltaTime })
        } else {
          this.trigger('swipeUp', { distance, deltaTime })
        }
      }
    }
  }
  
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }
  
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback)
      if (index > -1) {
        this.callbacks[event].splice(index, 1)
      }
    }
  }
  
  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }
  
  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart)
    this.element.removeEventListener('touchend', this.handleTouchEnd)
    this.element.removeEventListener('mousedown', this.handleMouseDown)
    this.element.removeEventListener('mouseup', this.handleMouseUp)
    clearTimeout(this.longPressTimer)
  }
}

// 通知系统
export class NotificationManager {
  constructor() {
    this.container = null
    this.notifications = []
    this.maxNotifications = 5
    this.defaultDuration = 4000
    
    this.init()
  }
  
  init() {
    this.createContainer()
  }
  
  createContainer() {
    this.container = document.createElement('div')
    this.container.className = 'notification-container'
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `
    document.body.appendChild(this.container)
  }
  
  show(message, type = 'info', duration = this.defaultDuration) {
    const notification = this.createNotification(message, type, duration)
    this.notifications.push(notification)
    
    // 限制通知数量
    if (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications.shift()
      this.removeNotification(oldest)
    }
    
    this.container.appendChild(notification.element)
    
    // 触发入场动画
    requestAnimationFrame(() => {
      notification.element.classList.add('show')
    })
    
    // 自动移除
    if (duration > 0) {
      notification.timer = setTimeout(() => {
        this.remove(notification)
      }, duration)
    }
    
    return notification
  }
  
  createNotification(message, type, duration) {
    const element = document.createElement('div')
    element.className = `notification notification-${type}`
    element.style.cssText = `
      background: ${this.getTypeColor(type)};
      color: white;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
      cursor: pointer;
      max-width: 300px;
      word-wrap: break-word;
    `
    
    element.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span>${message}</span>
        <button style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          margin-left: 8px;
          font-size: 16px;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">&times;</button>
      </div>
    `
    
    const notification = {
      element,
      type,
      message,
      duration,
      timer: null
    }
    
    // 点击关闭
    element.addEventListener('click', () => {
      this.remove(notification)
    })
    
    return notification
  }
  
  getTypeColor(type) {
    const colors = {
      info: '#007bff',
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545'
    }
    return colors[type] || colors.info
  }
  
  remove(notification) {
    const index = this.notifications.indexOf(notification)
    if (index > -1) {
      this.notifications.splice(index, 1)
    }
    
    this.removeNotification(notification)
  }
  
  removeNotification(notification) {
    if (notification.timer) {
      clearTimeout(notification.timer)
    }
    
    notification.element.classList.remove('show')
    notification.element.style.transform = 'translateX(100%)'
    
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element)
      }
    }, 300)
  }
  
  clear() {
    this.notifications.forEach(notification => {
      this.removeNotification(notification)
    })
    this.notifications = []
  }
  
  // 便捷方法
  info(message, duration) {
    return this.show(message, 'info', duration)
  }
  
  success(message, duration) {
    return this.show(message, 'success', duration)
  }
  
  warning(message, duration) {
    return this.show(message, 'warning', duration)
  }
  
  error(message, duration) {
    return this.show(message, 'error', duration)
  }
}

// 加载状态管理
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map()
    this.overlay = null
    this.callbacks = {
      start: [],
      end: [],
      change: []
    }
  }
  
  start(key, message = '加载中...') {
    this.loadingStates.set(key, { message, startTime: Date.now() })
    this.updateUI()
    this.trigger('start', { key, message })
    this.trigger('change', { key, isLoading: true })
  }
  
  end(key) {
    if (this.loadingStates.has(key)) {
      const state = this.loadingStates.get(key)
      const duration = Date.now() - state.startTime
      this.loadingStates.delete(key)
      this.updateUI()
      this.trigger('end', { key, duration })
      this.trigger('change', { key, isLoading: false })
    }
  }
  
  isLoading(key) {
    return key ? this.loadingStates.has(key) : this.loadingStates.size > 0
  }
  
  updateUI() {
    if (this.loadingStates.size > 0) {
      this.showOverlay()
    } else {
      this.hideOverlay()
    }
  }
  
  showOverlay() {
    if (!this.overlay) {
      this.overlay = document.createElement('div')
      this.overlay.className = 'loading-overlay'
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
      `
      
      const spinner = document.createElement('div')
      spinner.style.cssText = `
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `
      
      // 添加旋转动画
      if (!document.getElementById('loading-keyframes')) {
        const style = document.createElement('style')
        style.id = 'loading-keyframes'
        style.textContent = `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
        document.head.appendChild(style)
      }
      
      this.overlay.appendChild(spinner)
      document.body.appendChild(this.overlay)
    }
    
    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1'
    })
  }
  
  hideOverlay() {
    if (this.overlay) {
      this.overlay.style.opacity = '0'
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay)
          this.overlay = null
        }
      }, 300)
    }
  }
  
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback)
    }
  }
  
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback)
      if (index > -1) {
        this.callbacks[event].splice(index, 1)
      }
    }
  }
  
  trigger(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }
}

// 主题管理
export class ThemeManager {
  constructor() {
    this.currentTheme = 'light'
    this.themes = new Map()
    this.callbacks = []
    
    this.init()
  }
  
  init() {
    // 检测系统主题偏好
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.currentTheme = mediaQuery.matches ? 'dark' : 'light'
      
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme-preference')) {
          this.setTheme(e.matches ? 'dark' : 'light')
        }
      })
    }
    
    // 从本地存储恢复主题
    const savedTheme = localStorage.getItem('theme-preference')
    if (savedTheme) {
      this.currentTheme = savedTheme
    }
    
    this.applyTheme()
  }
  
  registerTheme(name, variables) {
    this.themes.set(name, variables)
  }
  
  setTheme(name) {
    if (this.themes.has(name) || ['light', 'dark'].includes(name)) {
      this.currentTheme = name
      localStorage.setItem('theme-preference', name)
      this.applyTheme()
      this.notifyChange()
    }
  }
  
  applyTheme() {
    const root = document.documentElement
    
    // 移除所有主题类
    root.classList.remove('theme-light', 'theme-dark')
    
    // 添加当前主题类
    root.classList.add(`theme-${this.currentTheme}`)
    
    // 应用自定义主题变量
    if (this.themes.has(this.currentTheme)) {
      const variables = this.themes.get(this.currentTheme)
      Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value)
      })
    }
  }
  
  getCurrentTheme() {
    return this.currentTheme
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
  }
  
  onChange(callback) {
    this.callbacks.push(callback)
  }
  
  offChange(callback) {
    const index = this.callbacks.indexOf(callback)
    if (index > -1) {
      this.callbacks.splice(index, 1)
    }
  }
  
  notifyChange() {
    this.callbacks.forEach(callback => callback(this.currentTheme))
  }
}

// 导出默认实例
export const notificationManager = new NotificationManager()
export const loadingManager = new LoadingManager()
export const themeManager = new ThemeManager()

// 工具函数
export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    return new Promise((resolve, reject) => {
      if (document.execCommand('copy')) {
        resolve()
      } else {
        reject(new Error('Copy failed'))
      }
      document.body.removeChild(textArea)
    })
  }
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}