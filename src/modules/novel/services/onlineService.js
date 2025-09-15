// 在线阅读服务
// 提供在线小说网站支持、网页浏览、内容抓取等功能

import { storageUtils, commonUtils } from '../utils/index.js'
import { ElMessage } from 'element-plus'

/**
 * 支持的小说网站配置
 */
export const NOVEL_SITES = {
  QIDIAN: {
    id: 'qidian',
    name: '起点中文网',
    domain: 'qidian.com',
    baseUrl: 'https://www.qidian.com',
    searchUrl: 'https://www.qidian.com/search',
    enabled: true,
    selectors: {
      title: '.book-info h1',
      author: '.book-info .writer',
      content: '.read-content',
      chapter: '.volume-wrap .cf',
      nextPage: '.read-page .page-next'
    }
  },
  ZONGHENG: {
    id: 'zongheng',
    name: '纵横中文网',
    domain: 'zongheng.com',
    baseUrl: 'https://www.zongheng.com',
    searchUrl: 'https://search.zongheng.com',
    enabled: true,
    selectors: {
      title: '.book-name',
      author: '.au-name',
      content: '.content',
      chapter: '.chapter-list li',
      nextPage: '.page-next'
    }
  },
  JINJIANG: {
    id: 'jinjiang',
    name: '晋江文学城',
    domain: 'jjwxc.net',
    baseUrl: 'http://www.jjwxc.net',
    searchUrl: 'http://www.jjwxc.net/search.php',
    enabled: true,
    selectors: {
      title: '.novelname',
      author: '.authorname',
      content: '.noveltext',
      chapter: '.chapterlist tr',
      nextPage: '.next'
    }
  },
  CUSTOM: {
    id: 'custom',
    name: '自定义网站',
    domain: '',
    baseUrl: '',
    searchUrl: '',
    enabled: true,
    selectors: {
      title: '',
      author: '',
      content: '',
      chapter: '',
      nextPage: ''
    }
  }
}

/**
 * 浏览器状态
 */
export const BROWSER_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
}

/**
 * 内容抓取状态
 */
export const SCRAPE_STATUS = {
  IDLE: 'idle',
  SCRAPING: 'scraping',
  SUCCESS: 'success',
  ERROR: 'error'
}

/**
 * 在线阅读服务类
 */
class OnlineReadingService {
  constructor() {
    this.browserWindow = null
    this.currentUrl = ''
    this.currentSite = null
    this.isReading = false
    this.autoScroll = false
    this.scrollSpeed = 50
    this.scrollTimer = null
    
    // 网站配置
    this.sites = new Map()
    this.customSites = new Map()
    
    // 阅读历史
    this.readingHistory = []
    this.bookmarks = []
    
    // 内容缓存
    this.contentCache = new Map()
    
    this.init()
  }
  
  /**
   * 初始化服务
   */
  async init() {
    try {
      // 加载网站配置
      this.loadSiteConfigs()
      
      // 加载自定义网站
      await this.loadCustomSites()
      
      // 加载阅读历史
      await this.loadReadingHistory()
      
      // 加载书签
      await this.loadBookmarks()
      
      console.log('在线阅读服务初始化完成')
    } catch (err) {
      console.error('在线阅读服务初始化失败:', err)
    }
  }
  
  /**
   * 加载网站配置
   */
  loadSiteConfigs() {
    Object.values(NOVEL_SITES).forEach(site => {
      this.sites.set(site.id, { ...site })
    })
  }
  
  /**
   * 加载自定义网站
   */
  async loadCustomSites() {
    try {
      const customSites = await storageUtils.getItem('custom_novel_sites') || []
      customSites.forEach(site => {
        this.customSites.set(site.id, site)
      })
    } catch (err) {
      console.error('加载自定义网站失败:', err)
    }
  }
  
  /**
   * 保存自定义网站
   */
  async saveCustomSites() {
    try {
      const sites = Array.from(this.customSites.values())
      await storageUtils.setItem('custom_novel_sites', sites)
    } catch (err) {
      console.error('保存自定义网站失败:', err)
    }
  }
  
  /**
   * 添加自定义网站
   */
  async addCustomSite(siteConfig) {
    try {
      const site = {
        id: siteConfig.id || commonUtils.generateId('site_'),
        name: siteConfig.name,
        domain: siteConfig.domain,
        baseUrl: siteConfig.baseUrl,
        searchUrl: siteConfig.searchUrl || '',
        enabled: siteConfig.enabled !== false,
        selectors: {
          title: siteConfig.selectors?.title || '',
          author: siteConfig.selectors?.author || '',
          content: siteConfig.selectors?.content || '',
          chapter: siteConfig.selectors?.chapter || '',
          nextPage: siteConfig.selectors?.nextPage || ''
        },
        createTime: new Date()
      }
      
      this.customSites.set(site.id, site)
      await this.saveCustomSites()
      
      ElMessage.success(`网站《${site.name}》添加成功`)
      return site
    } catch (err) {
      console.error('添加自定义网站失败:', err)
      ElMessage.error('添加自定义网站失败')
      throw err
    }
  }
  
  /**
   * 更新自定义网站
   */
  async updateCustomSite(siteId, updates) {
    try {
      const site = this.customSites.get(siteId)
      if (!site) {
        throw new Error('网站不存在')
      }
      
      const updatedSite = {
        ...site,
        ...updates,
        updateTime: new Date()
      }
      
      this.customSites.set(siteId, updatedSite)
      await this.saveCustomSites()
      
      ElMessage.success('网站配置更新成功')
      return updatedSite
    } catch (err) {
      console.error('更新自定义网站失败:', err)
      ElMessage.error('更新自定义网站失败')
      throw err
    }
  }
  
  /**
   * 删除自定义网站
   */
  async deleteCustomSite(siteId) {
    try {
      const site = this.customSites.get(siteId)
      if (!site) {
        throw new Error('网站不存在')
      }
      
      this.customSites.delete(siteId)
      await this.saveCustomSites()
      
      ElMessage.success(`网站《${site.name}》删除成功`)
      return true
    } catch (err) {
      console.error('删除自定义网站失败:', err)
      ElMessage.error('删除自定义网站失败')
      throw err
    }
  }
  
  /**
   * 获取所有网站
   */
  getAllSites() {
    const allSites = []
    
    // 添加内置网站
    this.sites.forEach(site => {
      if (site.enabled) {
        allSites.push({ ...site, type: 'builtin' })
      }
    })
    
    // 添加自定义网站
    this.customSites.forEach(site => {
      if (site.enabled) {
        allSites.push({ ...site, type: 'custom' })
      }
    })
    
    return allSites
  }
  
  /**
   * 根据URL识别网站
   */
  identifySite(url) {
    // 检查内置网站
    for (const site of this.sites.values()) {
      if (url.includes(site.domain)) {
        return { ...site, type: 'builtin' }
      }
    }
    
    // 检查自定义网站
    for (const site of this.customSites.values()) {
      if (site.domain && url.includes(site.domain)) {
        return { ...site, type: 'custom' }
      }
    }
    
    return null
  }
  
  /**
   * 打开网页
   */
  async openUrl(url, options = {}) {
    try {
      this.currentUrl = url
      this.currentSite = this.identifySite(url)
      
      // 添加到历史记录
      await this.addToHistory(url)
      
      // 如果是Electron环境，创建新窗口
      if (window.electronAPI) {
        const windowOptions = {
          width: options.width || 1200,
          height: options.height || 800,
          webSecurity: false,
          nodeIntegration: false,
          contextIsolation: true,
          ...options
        }
        
        this.browserWindow = await window.electronAPI.createWindow({
          url,
          options: windowOptions
        })
        
        return this.browserWindow
      } else {
        // 在浏览器环境中打开新标签页
        window.open(url, '_blank')
        return { url }
      }
    } catch (err) {
      console.error('打开网页失败:', err)
      ElMessage.error('打开网页失败')
      throw err
    }
  }
  
  /**
   * 开始在线阅读
   */
  async startOnlineReading(url, options = {}) {
    try {
      this.isReading = true
      
      const window = await this.openUrl(url, {
        ...options,
        title: '在线阅读 - 小说阅读器'
      })
      
      // 注入阅读辅助脚本
      if (window && window.webContents) {
        await this.injectReadingScript(window.webContents)
      }
      
      console.log('开始在线阅读:', url)
      return window
    } catch (err) {
      console.error('开始在线阅读失败:', err)
      ElMessage.error('开始在线阅读失败')
      throw err
    }
  }
  
  /**
   * 停止在线阅读
   */
  stopOnlineReading() {
    this.isReading = false
    this.stopAutoScroll()
    
    if (this.browserWindow && this.browserWindow.close) {
      this.browserWindow.close()
      this.browserWindow = null
    }
    
    console.log('停止在线阅读')
  }
  
  /**
   * 注入阅读辅助脚本
   */
  async injectReadingScript(webContents) {
    try {
      const script = `
        // 阅读辅助功能
        (function() {
          // 自动滚动功能
          let autoScrollTimer = null;
          let scrollSpeed = 50;
          
          // 开始自动滚动
          window.startAutoScroll = function(speed = 50) {
            scrollSpeed = speed;
            if (autoScrollTimer) clearInterval(autoScrollTimer);
            
            autoScrollTimer = setInterval(() => {
              window.scrollBy(0, 1);
              
              // 检查是否到达页面底部
              if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
                // 尝试点击下一页
                const nextButton = document.querySelector('${this.currentSite?.selectors?.nextPage || '.next, .page-next'}');
                if (nextButton) {
                  nextButton.click();
                }
              }
            }, scrollSpeed);
          };
          
          // 停止自动滚动
          window.stopAutoScroll = function() {
            if (autoScrollTimer) {
              clearInterval(autoScrollTimer);
              autoScrollTimer = null;
            }
          };
          
          // 调整滚动速度
          window.setScrollSpeed = function(speed) {
            scrollSpeed = speed;
          };
          
          // 提取页面内容
          window.extractContent = function() {
            const site = ${JSON.stringify(this.currentSite)};
            if (!site || !site.selectors) return null;
            
            const title = document.querySelector(site.selectors.title)?.textContent?.trim() || '';
            const author = document.querySelector(site.selectors.author)?.textContent?.trim() || '';
            const content = document.querySelector(site.selectors.content)?.textContent?.trim() || '';
            
            return {
              title,
              author,
              content,
              url: window.location.href,
              timestamp: new Date().toISOString()
            };
          };
          
          // 快捷键支持
          document.addEventListener('keydown', function(e) {
            // Ctrl + 上箭头：加快滚动
            if (e.ctrlKey && e.key === 'ArrowUp') {
              e.preventDefault();
              scrollSpeed = Math.max(10, scrollSpeed - 10);
            }
            
            // Ctrl + 下箭头：减慢滚动
            if (e.ctrlKey && e.key === 'ArrowDown') {
              e.preventDefault();
              scrollSpeed = Math.min(200, scrollSpeed + 10);
            }
            
            // 空格键：开始/停止自动滚动
            if (e.key === ' ' && !e.target.matches('input, textarea')) {
              e.preventDefault();
              if (autoScrollTimer) {
                window.stopAutoScroll();
              } else {
                window.startAutoScroll(scrollSpeed);
              }
            }
          });
          
          console.log('阅读辅助脚本已注入');
        })();
      `
      
      await webContents.executeJavaScript(script)
    } catch (err) {
      console.error('注入阅读脚本失败:', err)
    }
  }
  
  /**
   * 开始自动滚动
   */
  startAutoScroll(speed = 50) {
    this.autoScroll = true
    this.scrollSpeed = speed
    
    if (this.browserWindow && this.browserWindow.webContents) {
      this.browserWindow.webContents.executeJavaScript(`
        window.startAutoScroll(${speed});
      `).catch(err => {
        console.error('启动自动滚动失败:', err)
      })
    }
  }
  
  /**
   * 停止自动滚动
   */
  stopAutoScroll() {
    this.autoScroll = false
    
    if (this.browserWindow && this.browserWindow.webContents) {
      this.browserWindow.webContents.executeJavaScript(`
        window.stopAutoScroll();
      `).catch(err => {
        console.error('停止自动滚动失败:', err)
      })
    }
  }
  
  /**
   * 调整滚动速度
   */
  setScrollSpeed(speed) {
    this.scrollSpeed = speed
    
    if (this.browserWindow && this.browserWindow.webContents) {
      this.browserWindow.webContents.executeJavaScript(`
        window.setScrollSpeed(${speed});
      `).catch(err => {
        console.error('设置滚动速度失败:', err)
      })
    }
  }
  
  /**
   * 抓取页面内容
   */
  async scrapeContent() {
    if (!this.browserWindow || !this.browserWindow.webContents) {
      throw new Error('没有活动的浏览器窗口')
    }
    
    try {
      const content = await this.browserWindow.webContents.executeJavaScript(`
        window.extractContent();
      `)
      
      if (content) {
        // 添加到缓存
        this.contentCache.set(content.url, {
          ...content,
          cacheTime: Date.now()
        })
        
        return content
      }
      
      return null
    } catch (err) {
      console.error('抓取内容失败:', err)
      throw err
    }
  }
  
  /**
   * 搜索小说
   */
  async searchNovel(keyword, siteId = null) {
    try {
      const sites = siteId ? [this.sites.get(siteId) || this.customSites.get(siteId)] : this.getAllSites()
      const results = []
      
      for (const site of sites) {
        if (!site || !site.searchUrl) continue
        
        try {
          const searchUrl = `${site.searchUrl}?q=${encodeURIComponent(keyword)}`
          
          // 这里可以实现具体的搜索逻辑
          // 由于涉及跨域和反爬虫，实际实现可能需要后端支持
          
          results.push({
            site: site.name,
            siteId: site.id,
            searchUrl,
            keyword
          })
        } catch (err) {
          console.warn(`在${site.name}搜索失败:`, err)
        }
      }
      
      return results
    } catch (err) {
      console.error('搜索小说失败:', err)
      throw err
    }
  }
  
  /**
   * 添加到历史记录
   */
  async addToHistory(url, title = '') {
    try {
      const historyItem = {
        id: commonUtils.generateId('history_'),
        url,
        title: title || url,
        visitTime: new Date(),
        site: this.currentSite?.name || '未知网站'
      }
      
      // 检查是否已存在
      const existingIndex = this.readingHistory.findIndex(item => item.url === url)
      if (existingIndex > -1) {
        // 更新访问时间
        this.readingHistory[existingIndex].visitTime = new Date()
      } else {
        // 添加新记录
        this.readingHistory.unshift(historyItem)
        
        // 限制历史记录数量
        if (this.readingHistory.length > 1000) {
          this.readingHistory = this.readingHistory.slice(0, 1000)
        }
      }
      
      await this.saveReadingHistory()
    } catch (err) {
      console.error('添加历史记录失败:', err)
    }
  }
  
  /**
   * 加载阅读历史
   */
  async loadReadingHistory() {
    try {
      this.readingHistory = await storageUtils.getItem('online_reading_history') || []
    } catch (err) {
      console.error('加载阅读历史失败:', err)
    }
  }
  
  /**
   * 保存阅读历史
   */
  async saveReadingHistory() {
    try {
      await storageUtils.setItem('online_reading_history', this.readingHistory)
    } catch (err) {
      console.error('保存阅读历史失败:', err)
    }
  }
  
  /**
   * 清空历史记录
   */
  async clearHistory() {
    try {
      this.readingHistory = []
      await this.saveReadingHistory()
      ElMessage.success('历史记录已清空')
    } catch (err) {
      console.error('清空历史记录失败:', err)
      ElMessage.error('清空历史记录失败')
    }
  }
  
  /**
   * 获取历史记录
   */
  getHistory(limit = 100) {
    return this.readingHistory.slice(0, limit)
  }
  
  /**
   * 搜索历史记录
   */
  searchHistory(keyword) {
    if (!keyword || keyword.trim() === '') {
      return this.readingHistory
    }
    
    const searchTerm = keyword.toLowerCase()
    return this.readingHistory.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.url.toLowerCase().includes(searchTerm) ||
      item.site.toLowerCase().includes(searchTerm)
    )
  }
  
  /**
   * 添加书签
   */
  async addBookmark(url, title = '', description = '') {
    try {
      const bookmark = {
        id: commonUtils.generateId('bookmark_'),
        url,
        title: title || url,
        description,
        site: this.currentSite?.name || '未知网站',
        createTime: new Date()
      }
      
      // 检查是否已存在
      const exists = this.bookmarks.some(item => item.url === url)
      if (exists) {
        ElMessage.warning('书签已存在')
        return null
      }
      
      this.bookmarks.unshift(bookmark)
      await this.saveBookmarks()
      
      ElMessage.success('书签添加成功')
      return bookmark
    } catch (err) {
      console.error('添加书签失败:', err)
      ElMessage.error('添加书签失败')
      throw err
    }
  }
  
  /**
   * 删除书签
   */
  async deleteBookmark(bookmarkId) {
    try {
      const index = this.bookmarks.findIndex(item => item.id === bookmarkId)
      if (index > -1) {
        this.bookmarks.splice(index, 1)
        await this.saveBookmarks()
        ElMessage.success('书签删除成功')
        return true
      }
      return false
    } catch (err) {
      console.error('删除书签失败:', err)
      ElMessage.error('删除书签失败')
      throw err
    }
  }
  
  /**
   * 加载书签
   */
  async loadBookmarks() {
    try {
      this.bookmarks = await storageUtils.getItem('online_reading_bookmarks') || []
    } catch (err) {
      console.error('加载书签失败:', err)
    }
  }
  
  /**
   * 保存书签
   */
  async saveBookmarks() {
    try {
      await storageUtils.setItem('online_reading_bookmarks', this.bookmarks)
    } catch (err) {
      console.error('保存书签失败:', err)
    }
  }
  
  /**
   * 获取书签列表
   */
  getBookmarks() {
    return this.bookmarks
  }
  
  /**
   * 搜索书签
   */
  searchBookmarks(keyword) {
    if (!keyword || keyword.trim() === '') {
      return this.bookmarks
    }
    
    const searchTerm = keyword.toLowerCase()
    return this.bookmarks.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.url.toLowerCase().includes(searchTerm)
    )
  }
  
  /**
   * 获取内容缓存
   */
  getContentCache(url) {
    return this.contentCache.get(url)
  }
  
  /**
   * 清空内容缓存
   */
  clearContentCache() {
    this.contentCache.clear()
  }
  
  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isReading: this.isReading,
      currentUrl: this.currentUrl,
      currentSite: this.currentSite,
      autoScroll: this.autoScroll,
      scrollSpeed: this.scrollSpeed,
      hasWindow: !!this.browserWindow
    }
  }
  
  /**
   * 销毁服务
   */
  destroy() {
    this.stopOnlineReading()
    this.clearContentCache()
    this.readingHistory = []
    this.bookmarks = []
    this.sites.clear()
    this.customSites.clear()
  }
}

// 创建全局实例
const onlineReadingService = new OnlineReadingService()

// 导出便捷接口
export const onlineService = {
  // 网站管理
  getAllSites: () => onlineReadingService.getAllSites(),
  addCustomSite: (config) => onlineReadingService.addCustomSite(config),
  updateCustomSite: (id, updates) => onlineReadingService.updateCustomSite(id, updates),
  deleteCustomSite: (id) => onlineReadingService.deleteCustomSite(id),
  identifySite: (url) => onlineReadingService.identifySite(url),
  
  // 在线阅读
  openUrl: (url, options) => onlineReadingService.openUrl(url, options),
  startOnlineReading: (url, options) => onlineReadingService.startOnlineReading(url, options),
  stopOnlineReading: () => onlineReadingService.stopOnlineReading(),
  
  // 自动滚动
  startAutoScroll: (speed) => onlineReadingService.startAutoScroll(speed),
  stopAutoScroll: () => onlineReadingService.stopAutoScroll(),
  setScrollSpeed: (speed) => onlineReadingService.setScrollSpeed(speed),
  
  // 内容抓取
  scrapeContent: () => onlineReadingService.scrapeContent(),
  getContentCache: (url) => onlineReadingService.getContentCache(url),
  clearContentCache: () => onlineReadingService.clearContentCache(),
  
  // 搜索
  searchNovel: (keyword, siteId) => onlineReadingService.searchNovel(keyword, siteId),
  
  // 历史记录
  getHistory: (limit) => onlineReadingService.getHistory(limit),
  searchHistory: (keyword) => onlineReadingService.searchHistory(keyword),
  clearHistory: () => onlineReadingService.clearHistory(),
  
  // 书签
  addBookmark: (url, title, description) => onlineReadingService.addBookmark(url, title, description),
  deleteBookmark: (id) => onlineReadingService.deleteBookmark(id),
  getBookmarks: () => onlineReadingService.getBookmarks(),
  searchBookmarks: (keyword) => onlineReadingService.searchBookmarks(keyword),
  
  // 状态
  getStatus: () => onlineReadingService.getStatus()
}

// 导出类和常量
export {
  OnlineReadingService,
  NOVEL_SITES,
  BROWSER_STATUS,
  SCRAPE_STATUS
}

export default onlineService