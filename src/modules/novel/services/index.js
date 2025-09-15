// 小说模块服务层统一入口
// 整合所有服务，提供统一的API接口

import importService from './importService.js'
import novelService from './novelService.js'
import readerService from './readerService.js'
import onlineService from './onlineService.js'

/**
 * 服务管理器
 */
class ServiceManager {
  constructor() {
    this.services = new Map()
    this.initialized = false
    
    this.registerServices()
  }
  
  /**
   * 注册所有服务
   */
  registerServices() {
    // 注册导入服务
    this.services.set('import', importService)
    
    // 注册小说数据服务
    this.services.set('novel', novelService)
    
    // 注册阅读器服务
    this.services.set('reader', readerService)
    
    // 注册在线阅读服务
    this.services.set('online', onlineService)
  }
  
  /**
   * 初始化所有服务
   */
  async init() {
    if (this.initialized) {
      return
    }
    
    try {
      console.log('开始初始化小说模块服务...')
      
      // 初始化各个服务
      const initPromises = []
      
      // 小说数据服务需要先初始化
      await novelService.loadNovels()
      console.log('✓ 小说数据服务初始化完成')
      
      // 其他服务可以并行初始化
      if (importService.init) {
        initPromises.push(importService.init())
      }
      
      if (readerService.init) {
        initPromises.push(readerService.init())
      }
      
      if (onlineService.init) {
        initPromises.push(onlineService.init())
      }
      
      await Promise.all(initPromises)
      
      this.initialized = true
      console.log('✓ 小说模块所有服务初始化完成')
      
      return true
    } catch (err) {
      console.error('服务初始化失败:', err)
      throw err
    }
  }
  
  /**
   * 获取服务
   */
  getService(name) {
    return this.services.get(name)
  }
  
  /**
   * 获取所有服务
   */
  getAllServices() {
    return Object.fromEntries(this.services)
  }
  
  /**
   * 销毁所有服务
   */
  destroy() {
    this.services.forEach(service => {
      if (service.destroy && typeof service.destroy === 'function') {
        try {
          service.destroy()
        } catch (err) {
          console.error('销毁服务失败:', err)
        }
      }
    })
    
    this.services.clear()
    this.initialized = false
    
    console.log('所有服务已销毁')
  }
  
  /**
   * 重启所有服务
   */
  async restart() {
    this.destroy()
    this.registerServices()
    await this.init()
  }
}

// 创建全局服务管理器实例
const serviceManager = new ServiceManager()

/**
 * 统一的服务接口
 */
export const services = {
  // 服务管理
  init: () => serviceManager.init(),
  destroy: () => serviceManager.destroy(),
  restart: () => serviceManager.restart(),
  getService: (name) => serviceManager.getService(name),
  getAllServices: () => serviceManager.getAllServices(),
  
  // 导入服务接口
  import: {
    selectFiles: importService.selectFiles,
    importFile: importService.importFile,
    importFiles: importService.importFiles,
    validateFile: importService.validateFile,
    getImportHistory: importService.getImportHistory,
    clearImportHistory: importService.clearImportHistory,
    getSupportedFormats: importService.getSupportedFormats,
    updateSettings: importService.updateSettings
  },
  
  // 小说数据服务接口
  novel: {
    // 数据管理
    loadNovels: novelService.loadNovels,
    saveNovels: novelService.saveNovels,
    getAllNovels: novelService.getAllNovels,
    getNovelById: novelService.getNovelById,
    addNovel: novelService.addNovel,
    updateNovel: novelService.updateNovel,
    deleteNovel: novelService.deleteNovel,
    deleteNovels: novelService.deleteNovels,
    
    // 搜索和筛选
    searchNovels: novelService.searchNovels,
    advancedSearch: novelService.advancedSearch,
    sortNovels: novelService.sortNovels,
    
    // 分类和标签
    getCategories: novelService.getCategories,
    getTags: novelService.getTags,
    
    // 统计信息
    getStatistics: novelService.getStatistics,
    
    // 导入导出
    exportNovels: novelService.exportNovels,
    importNovels: novelService.importNovels
  },
  
  // 阅读器服务接口
  reader: {
    // 阅读控制
    startReading: readerService.startReading,
    stopReading: readerService.stopReading,
    
    // 章节管理
    loadChapter: readerService.loadChapter,
    switchToChapter: readerService.switchToChapter,
    getNextChapter: readerService.getNextChapter,
    getPreviousChapter: readerService.getPreviousChapter,
    getChapterList: readerService.getChapterList,
    searchChapters: readerService.searchChapters,
    
    // 阅读进度
    updateReadingPosition: readerService.updateReadingPosition,
    getReadingProgress: readerService.getReadingProgress,
    saveReadingProgress: readerService.saveReadingProgress,
    
    // 书签管理
    addBookmark: readerService.addBookmark,
    deleteBookmark: readerService.deleteBookmark,
    getBookmarks: readerService.getBookmarks,
    jumpToBookmark: readerService.jumpToBookmark,
    
    // 笔记管理
    addNote: readerService.addNote,
    updateNote: readerService.updateNote,
    deleteNote: readerService.deleteNote,
    getNotes: readerService.getNotes,
    
    // 高亮管理
    addHighlight: readerService.addHighlight,
    deleteHighlight: readerService.deleteHighlight,
    getHighlights: readerService.getHighlights,
    
    // 统计信息
    getReadingStats: readerService.getReadingStats,
    
    // 缓存管理
    clearCache: readerService.clearCache,
    
    // 获取当前小说
    getCurrentNovel: readerService.getCurrentNovel
  },
  
  // 在线阅读服务接口
  online: {
    // 网站管理
    getAllSites: onlineService.getAllSites,
    addCustomSite: onlineService.addCustomSite,
    updateCustomSite: onlineService.updateCustomSite,
    deleteCustomSite: onlineService.deleteCustomSite,
    identifySite: onlineService.identifySite,
    
    // 在线阅读
    openUrl: onlineService.openUrl,
    startOnlineReading: onlineService.startOnlineReading,
    stopOnlineReading: onlineService.stopOnlineReading,
    
    // 自动滚动
    startAutoScroll: onlineService.startAutoScroll,
    stopAutoScroll: onlineService.stopAutoScroll,
    setScrollSpeed: onlineService.setScrollSpeed,
    
    // 内容抓取
    scrapeContent: onlineService.scrapeContent,
    getContentCache: onlineService.getContentCache,
    clearContentCache: onlineService.clearContentCache,
    
    // 搜索
    searchNovel: onlineService.searchNovel,
    
    // 历史记录
    getHistory: onlineService.getHistory,
    searchHistory: onlineService.searchHistory,
    clearHistory: onlineService.clearHistory,
    
    // 书签
    addBookmark: onlineService.addBookmark,
    deleteBookmark: onlineService.deleteBookmark,
    getBookmarks: onlineService.getBookmarks,
    searchBookmarks: onlineService.searchBookmarks,
    
    // 状态
    getStatus: onlineService.getStatus
  }
}

/**
 * 便捷的组合操作接口
 */
export const compositeServices = {
  /**
   * 完整的小说导入流程
   */
  async importNovelComplete(filePath, options = {}) {
    try {
      // 1. 验证文件
      const validation = await services.import.validateFile(filePath)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }
      
      // 2. 导入文件
      const importResult = await services.import.importFile(filePath, options)
      
      // 3. 添加到小说库
      const novel = await services.novel.addNovel(importResult.novel)
      
      return {
        success: true,
        novel,
        importResult
      }
    } catch (err) {
      console.error('完整导入流程失败:', err)
      throw err
    }
  },
  
  /**
   * 开始阅读小说（包含完整初始化）
   */
  async startReadingComplete(novelId, chapterIndex = 0) {
    try {
      // 1. 获取小说信息
      const novel = await services.novel.getNovelById(novelId)
      if (!novel) {
        throw new Error('小说不存在')
      }
      
      // 2. 开始阅读
      const chapter = await services.reader.startReading(novel, chapterIndex)
      
      // 3. 更新小说状态
      await services.novel.updateNovel(novelId, {
        status: 'reading',
        lastReadTime: new Date()
      })
      
      return {
        novel,
        chapter,
        progress: services.reader.getReadingProgress(novelId)
      }
    } catch (err) {
      console.error('开始阅读失败:', err)
      throw err
    }
  },
  
  /**
   * 停止阅读并保存所有数据
   */
  async stopReadingComplete() {
    try {
      const currentNovel = services.reader.getCurrentNovel()
      
      if (currentNovel) {
        // 1. 停止阅读器
        await services.reader.stopReading()
        
        // 2. 获取最终进度
        const progress = services.reader.getReadingProgress(currentNovel.id)
        
        // 3. 更新小说信息
        await services.novel.updateNovel(currentNovel.id, {
          readingProgress: progress,
          lastReadTime: new Date()
        })
        
        // 4. 保存所有数据
        await services.novel.saveNovels()
        
        return {
          novel: currentNovel,
          finalProgress: progress
        }
      }
      
      return null
    } catch (err) {
      console.error('停止阅读失败:', err)
      throw err
    }
  },
  
  /**
   * 获取阅读统计汇总
   */
  async getReadingSummary() {
    try {
      // 1. 获取小说统计
      const novelStats = await services.novel.getStatistics()
      
      // 2. 获取当前阅读状态
      const currentNovel = services.reader.getCurrentNovel()
      const currentProgress = currentNovel ? 
        services.reader.getReadingProgress(currentNovel.id) : null
      
      // 3. 获取在线阅读状态
      const onlineStatus = services.online.getStatus()
      
      return {
        novels: novelStats,
        currentReading: {
          novel: currentNovel,
          progress: currentProgress
        },
        online: onlineStatus,
        summary: {
          totalNovels: novelStats.total,
          readingNovels: novelStats.statusStats.reading || 0,
          completedNovels: novelStats.statusStats.completed || 0,
          totalReadingTime: novelStats.totalReadingTime,
          isCurrentlyReading: !!currentNovel || onlineStatus.isReading
        }
      }
    } catch (err) {
      console.error('获取阅读统计失败:', err)
      throw err
    }
  }
}

// 导出所有服务相关的内容
export {
  serviceManager,
  importService,
  novelService,
  readerService,
  onlineService
}

// 默认导出统一服务接口
export default services