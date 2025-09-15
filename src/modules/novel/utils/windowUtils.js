// 窗口管理工具函数
// 提供阅读窗口创建、管理、通信等功能

/**
 * 窗口配置常量
 */
export const WINDOW_CONFIGS = {
  READER: {
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false, // 创建时不显示，等待内容加载完成
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff',
    icon: null // 可以设置应用图标
  },
  STEALTH: {
    width: 400,
    height: 300,
    minWidth: 200,
    minHeight: 150,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    show: false,
    frame: false, // 无边框窗口
    transparent: true, // 透明窗口
    alwaysOnTop: true, // 始终置顶
    skipTaskbar: true, // 不在任务栏显示
    resizable: true,
    movable: true
  },
  BROWSER: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false, // 允许跨域访问
      allowRunningInsecureContent: true
    },
    show: false,
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#ffffff'
  }
}

/**
 * 窗口事件类型
 */
export const WINDOW_EVENTS = {
  // 窗口生命周期
  CREATED: 'window-created',
  READY: 'window-ready',
  CLOSED: 'window-closed',
  MINIMIZED: 'window-minimized',
  MAXIMIZED: 'window-maximized',
  RESTORED: 'window-restored',
  
  // 阅读器事件
  READER_OPENED: 'reader-opened',
  READER_CLOSED: 'reader-closed',
  CHAPTER_CHANGED: 'chapter-changed',
  PROGRESS_UPDATED: 'progress-updated',
  SETTINGS_CHANGED: 'settings-changed',
  
  // 摸鱼模式事件
  STEALTH_ACTIVATED: 'stealth-activated',
  STEALTH_DEACTIVATED: 'stealth-deactivated',
  OPACITY_CHANGED: 'opacity-changed',
  HIDDEN: 'window-hidden',
  SHOWN: 'window-shown',
  
  // 浏览器事件
  BROWSER_OPENED: 'browser-opened',
  BROWSER_CLOSED: 'browser-closed',
  URL_CHANGED: 'url-changed',
  PAGE_LOADED: 'page-loaded'
}

/**
 * 窗口管理器类
 */
class WindowManager {
  constructor() {
    this.windows = new Map()
    this.eventListeners = new Map()
    this.isElectron = typeof window !== 'undefined' && window.electronAPI
    
    if (this.isElectron) {
      this.initElectronAPI()
    }
  }
  
  /**
   * 初始化 Electron API
   */
  initElectronAPI() {
    // 监听来自主进程的窗口事件
    if (window.electronAPI.onWindowEvent) {
      window.electronAPI.onWindowEvent((event, data) => {
        this.handleWindowEvent(event, data)
      })
    }
  }
  
  /**
   * 创建阅读器窗口
   */
  async createReaderWindow(options = {}) {
    if (!this.isElectron) {
      console.warn('阅读器窗口需要在 Electron 环境中创建')
      return null
    }
    
    try {
      const config = {
        ...WINDOW_CONFIGS.READER,
        ...options,
        webPreferences: {
          ...WINDOW_CONFIGS.READER.webPreferences,
          ...options.webPreferences
        }
      }
      
      const windowId = await window.electronAPI.createWindow({
        type: 'reader',
        config,
        url: '/novel/reader' // 阅读器页面路由
      })
      
      const windowInfo = {
        id: windowId,
        type: 'reader',
        config,
        created: new Date(),
        isVisible: false,
        isMinimized: false,
        isMaximized: false
      }
      
      this.windows.set(windowId, windowInfo)
      this.emit(WINDOW_EVENTS.READER_OPENED, { windowId, windowInfo })
      
      return windowId
    } catch (err) {
      console.error('创建阅读器窗口失败:', err)
      throw err
    }
  }
  
  /**
   * 创建摸鱼窗口
   */
  async createStealthWindow(options = {}) {
    if (!this.isElectron) {
      console.warn('摸鱼窗口需要在 Electron 环境中创建')
      return null
    }
    
    try {
      const config = {
        ...WINDOW_CONFIGS.STEALTH,
        ...options,
        webPreferences: {
          ...WINDOW_CONFIGS.STEALTH.webPreferences,
          ...options.webPreferences
        }
      }
      
      const windowId = await window.electronAPI.createWindow({
        type: 'stealth',
        config,
        url: '/novel/stealth' // 摸鱼模式页面路由
      })
      
      const windowInfo = {
        id: windowId,
        type: 'stealth',
        config,
        created: new Date(),
        isVisible: false,
        opacity: 1.0,
        isAlwaysOnTop: true
      }
      
      this.windows.set(windowId, windowInfo)
      this.emit(WINDOW_EVENTS.STEALTH_ACTIVATED, { windowId, windowInfo })
      
      return windowId
    } catch (err) {
      console.error('创建摸鱼窗口失败:', err)
      throw err
    }
  }
  
  /**
   * 创建浏览器窗口
   */
  async createBrowserWindow(url, options = {}) {
    if (!this.isElectron) {
      console.warn('浏览器窗口需要在 Electron 环境中创建')
      return null
    }
    
    try {
      const config = {
        ...WINDOW_CONFIGS.BROWSER,
        ...options,
        webPreferences: {
          ...WINDOW_CONFIGS.BROWSER.webPreferences,
          ...options.webPreferences
        }
      }
      
      const windowId = await window.electronAPI.createWindow({
        type: 'browser',
        config,
        url: url || '/novel/browser' // 浏览器页面路由
      })
      
      const windowInfo = {
        id: windowId,
        type: 'browser',
        config,
        created: new Date(),
        currentUrl: url,
        isVisible: false
      }
      
      this.windows.set(windowId, windowInfo)
      this.emit(WINDOW_EVENTS.BROWSER_OPENED, { windowId, windowInfo, url })
      
      return windowId
    } catch (err) {
      console.error('创建浏览器窗口失败:', err)
      throw err
    }
  }
  
  /**
   * 显示窗口
   */
  async showWindow(windowId) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.showWindow(windowId)
      
      const windowInfo = this.windows.get(windowId)
      if (windowInfo) {
        windowInfo.isVisible = true
        this.emit(WINDOW_EVENTS.SHOWN, { windowId, windowInfo })
      }
      
      return true
    } catch (err) {
      console.error('显示窗口失败:', err)
      return false
    }
  }
  
  /**
   * 隐藏窗口
   */
  async hideWindow(windowId) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.hideWindow(windowId)
      
      const windowInfo = this.windows.get(windowId)
      if (windowInfo) {
        windowInfo.isVisible = false
        this.emit(WINDOW_EVENTS.HIDDEN, { windowId, windowInfo })
      }
      
      return true
    } catch (err) {
      console.error('隐藏窗口失败:', err)
      return false
    }
  }
  
  /**
   * 关闭窗口
   */
  async closeWindow(windowId) {
    if (!this.isElectron) return false
    
    try {
      const windowInfo = this.windows.get(windowId)
      
      await window.electronAPI.closeWindow(windowId)
      
      if (windowInfo) {
        this.windows.delete(windowId)
        
        // 发送对应的关闭事件
        switch (windowInfo.type) {
          case 'reader':
            this.emit(WINDOW_EVENTS.READER_CLOSED, { windowId, windowInfo })
            break
          case 'stealth':
            this.emit(WINDOW_EVENTS.STEALTH_DEACTIVATED, { windowId, windowInfo })
            break
          case 'browser':
            this.emit(WINDOW_EVENTS.BROWSER_CLOSED, { windowId, windowInfo })
            break
        }
        
        this.emit(WINDOW_EVENTS.CLOSED, { windowId, windowInfo })
      }
      
      return true
    } catch (err) {
      console.error('关闭窗口失败:', err)
      return false
    }
  }
  
  /**
   * 设置窗口透明度
   */
  async setWindowOpacity(windowId, opacity) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.setWindowOpacity(windowId, opacity)
      
      const windowInfo = this.windows.get(windowId)
      if (windowInfo) {
        windowInfo.opacity = opacity
        this.emit(WINDOW_EVENTS.OPACITY_CHANGED, { windowId, opacity, windowInfo })
      }
      
      return true
    } catch (err) {
      console.error('设置窗口透明度失败:', err)
      return false
    }
  }
  
  /**
   * 设置窗口置顶
   */
  async setWindowAlwaysOnTop(windowId, alwaysOnTop) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.setWindowAlwaysOnTop(windowId, alwaysOnTop)
      
      const windowInfo = this.windows.get(windowId)
      if (windowInfo) {
        windowInfo.isAlwaysOnTop = alwaysOnTop
      }
      
      return true
    } catch (err) {
      console.error('设置窗口置顶失败:', err)
      return false
    }
  }
  
  /**
   * 发送消息到窗口
   */
  async sendToWindow(windowId, channel, data) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.sendToWindow(windowId, channel, data)
      return true
    } catch (err) {
      console.error('发送消息到窗口失败:', err)
      return false
    }
  }
  
  /**
   * 广播消息到所有窗口
   */
  async broadcastToWindows(channel, data, excludeWindowId = null) {
    const promises = []
    
    for (const [windowId] of this.windows) {
      if (windowId !== excludeWindowId) {
        promises.push(this.sendToWindow(windowId, channel, data))
      }
    }
    
    try {
      await Promise.all(promises)
      return true
    } catch (err) {
      console.error('广播消息失败:', err)
      return false
    }
  }
  
  /**
   * 获取窗口信息
   */
  getWindowInfo(windowId) {
    return this.windows.get(windowId)
  }
  
  /**
   * 获取所有窗口
   */
  getAllWindows() {
    return Array.from(this.windows.values())
  }
  
  /**
   * 根据类型获取窗口
   */
  getWindowsByType(type) {
    return Array.from(this.windows.values()).filter(window => window.type === type)
  }
  
  /**
   * 处理窗口事件
   */
  handleWindowEvent(event, data) {
    const { windowId, type, ...eventData } = data
    
    switch (event) {
      case 'window-ready':
        const windowInfo = this.windows.get(windowId)
        if (windowInfo) {
          windowInfo.isReady = true
          this.emit(WINDOW_EVENTS.READY, { windowId, windowInfo })
        }
        break
        
      case 'window-closed':
        this.windows.delete(windowId)
        this.emit(WINDOW_EVENTS.CLOSED, { windowId, ...eventData })
        break
        
      case 'window-minimized':
        const minWindowInfo = this.windows.get(windowId)
        if (minWindowInfo) {
          minWindowInfo.isMinimized = true
          this.emit(WINDOW_EVENTS.MINIMIZED, { windowId, windowInfo: minWindowInfo })
        }
        break
        
      case 'window-maximized':
        const maxWindowInfo = this.windows.get(windowId)
        if (maxWindowInfo) {
          maxWindowInfo.isMaximized = true
          this.emit(WINDOW_EVENTS.MAXIMIZED, { windowId, windowInfo: maxWindowInfo })
        }
        break
        
      case 'window-restored':
        const restoreWindowInfo = this.windows.get(windowId)
        if (restoreWindowInfo) {
          restoreWindowInfo.isMinimized = false
          restoreWindowInfo.isMaximized = false
          this.emit(WINDOW_EVENTS.RESTORED, { windowId, windowInfo: restoreWindowInfo })
        }
        break
        
      default:
        this.emit(event, { windowId, ...eventData })
    }
  }
  
  /**
   * 事件监听
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(listener)
  }
  
  /**
   * 移除事件监听
   */
  off(event, listener) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }
  
  /**
   * 触发事件
   */
  emit(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (err) {
          console.error('事件监听器执行失败:', err)
        }
      })
    }
  }
  
  /**
   * 清理所有窗口
   */
  async cleanup() {
    const closePromises = []
    
    for (const [windowId] of this.windows) {
      closePromises.push(this.closeWindow(windowId))
    }
    
    try {
      await Promise.all(closePromises)
      this.windows.clear()
      this.eventListeners.clear()
    } catch (err) {
      console.error('清理窗口失败:', err)
    }
  }
}

/**
 * 快捷键管理器
 */
class ShortcutManager {
  constructor(windowManager) {
    this.windowManager = windowManager
    this.shortcuts = new Map()
    this.isElectron = typeof window !== 'undefined' && window.electronAPI
    
    if (this.isElectron) {
      this.initShortcuts()
    }
  }
  
  /**
   * 初始化快捷键
   */
  initShortcuts() {
    // 监听快捷键事件
    if (window.electronAPI.onShortcut) {
      window.electronAPI.onShortcut((shortcut, data) => {
        this.handleShortcut(shortcut, data)
      })
    }
  }
  
  /**
   * 注册快捷键
   */
  async registerShortcut(accelerator, action, options = {}) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.registerShortcut(accelerator, {
        action,
        ...options
      })
      
      this.shortcuts.set(accelerator, { action, options })
      return true
    } catch (err) {
      console.error('注册快捷键失败:', err)
      return false
    }
  }
  
  /**
   * 注销快捷键
   */
  async unregisterShortcut(accelerator) {
    if (!this.isElectron) return false
    
    try {
      await window.electronAPI.unregisterShortcut(accelerator)
      this.shortcuts.delete(accelerator)
      return true
    } catch (err) {
      console.error('注销快捷键失败:', err)
      return false
    }
  }
  
  /**
   * 处理快捷键
   */
  handleShortcut(accelerator, data) {
    const shortcut = this.shortcuts.get(accelerator)
    if (!shortcut) return
    
    const { action, options } = shortcut
    
    switch (action) {
      case 'toggle-stealth':
        this.toggleStealthMode()
        break
        
      case 'hide-all-windows':
        this.hideAllWindows()
        break
        
      case 'show-all-windows':
        this.showAllWindows()
        break
        
      case 'toggle-reader':
        this.toggleReaderWindow()
        break
        
      default:
        console.warn('未知的快捷键动作:', action)
    }
  }
  
  /**
   * 切换摸鱼模式
   */
  async toggleStealthMode() {
    const stealthWindows = this.windowManager.getWindowsByType('stealth')
    
    if (stealthWindows.length > 0) {
      // 已有摸鱼窗口，切换显示状态
      const window = stealthWindows[0]
      if (window.isVisible) {
        await this.windowManager.hideWindow(window.id)
      } else {
        await this.windowManager.showWindow(window.id)
      }
    } else {
      // 创建新的摸鱼窗口
      const windowId = await this.windowManager.createStealthWindow()
      if (windowId) {
        await this.windowManager.showWindow(windowId)
      }
    }
  }
  
  /**
   * 隐藏所有窗口
   */
  async hideAllWindows() {
    const windows = this.windowManager.getAllWindows()
    const hidePromises = windows
      .filter(window => window.isVisible)
      .map(window => this.windowManager.hideWindow(window.id))
    
    await Promise.all(hidePromises)
  }
  
  /**
   * 显示所有窗口
   */
  async showAllWindows() {
    const windows = this.windowManager.getAllWindows()
    const showPromises = windows
      .filter(window => !window.isVisible)
      .map(window => this.windowManager.showWindow(window.id))
    
    await Promise.all(showPromises)
  }
  
  /**
   * 切换阅读器窗口
   */
  async toggleReaderWindow() {
    const readerWindows = this.windowManager.getWindowsByType('reader')
    
    if (readerWindows.length > 0) {
      const window = readerWindows[0]
      if (window.isVisible) {
        await this.windowManager.hideWindow(window.id)
      } else {
        await this.windowManager.showWindow(window.id)
      }
    }
  }
}

// 创建全局实例
const windowManager = new WindowManager()
const shortcutManager = new ShortcutManager(windowManager)

// 导出便捷接口
export const windowUtils = {
  // 窗口管理
  createReaderWindow: (options) => windowManager.createReaderWindow(options),
  createStealthWindow: (options) => windowManager.createStealthWindow(options),
  createBrowserWindow: (url, options) => windowManager.createBrowserWindow(url, options),
  
  showWindow: (windowId) => windowManager.showWindow(windowId),
  hideWindow: (windowId) => windowManager.hideWindow(windowId),
  closeWindow: (windowId) => windowManager.closeWindow(windowId),
  
  setWindowOpacity: (windowId, opacity) => windowManager.setWindowOpacity(windowId, opacity),
  setWindowAlwaysOnTop: (windowId, alwaysOnTop) => windowManager.setWindowAlwaysOnTop(windowId, alwaysOnTop),
  
  sendToWindow: (windowId, channel, data) => windowManager.sendToWindow(windowId, channel, data),
  broadcastToWindows: (channel, data, excludeWindowId) => windowManager.broadcastToWindows(channel, data, excludeWindowId),
  
  getWindowInfo: (windowId) => windowManager.getWindowInfo(windowId),
  getAllWindows: () => windowManager.getAllWindows(),
  getWindowsByType: (type) => windowManager.getWindowsByType(type),
  
  // 事件监听
  on: (event, listener) => windowManager.on(event, listener),
  off: (event, listener) => windowManager.off(event, listener),
  
  // 快捷键管理
  registerShortcut: (accelerator, action, options) => shortcutManager.registerShortcut(accelerator, action, options),
  unregisterShortcut: (accelerator) => shortcutManager.unregisterShortcut(accelerator),
  
  // 清理
  cleanup: () => windowManager.cleanup()
}

// 导出类供高级用法
export {
  WindowManager,
  ShortcutManager,
  WINDOW_CONFIGS,
  WINDOW_EVENTS
}

export default windowUtils