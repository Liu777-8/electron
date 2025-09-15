// 小说数据管理服务
// 提供小说的增删改查、分类管理、搜索等功能

import { storageUtils, commonUtils, readerUtils } from '../utils/index.js'
import { ElMessage } from 'element-plus'

/**
 * 小说状态枚举
 */
export const NOVEL_STATUS = {
  UNREAD: 'unread',        // 未读
  READING: 'reading',      // 阅读中
  COMPLETED: 'completed',  // 已完成
  PAUSED: 'paused',       // 暂停
  DROPPED: 'dropped'      // 弃读
}

/**
 * 小说分类
 */
export const NOVEL_CATEGORIES = {
  FANTASY: 'fantasy',           // 玄幻
  ROMANCE: 'romance',           // 言情
  URBAN: 'urban',              // 都市
  HISTORY: 'history',          // 历史
  SCIFI: 'scifi',             // 科幻
  MYSTERY: 'mystery',          // 悬疑
  MARTIAL_ARTS: 'martial_arts', // 武侠
  GAME: 'game',               // 游戏
  FANFICTION: 'fanfiction',    // 同人
  OTHER: 'other'              // 其他
}

/**
 * 排序方式
 */
export const SORT_OPTIONS = {
  TITLE_ASC: 'title_asc',           // 标题升序
  TITLE_DESC: 'title_desc',         // 标题降序
  AUTHOR_ASC: 'author_asc',         // 作者升序
  AUTHOR_DESC: 'author_desc',       // 作者降序
  IMPORT_TIME_ASC: 'import_time_asc',   // 导入时间升序
  IMPORT_TIME_DESC: 'import_time_desc', // 导入时间降序
  UPDATE_TIME_ASC: 'update_time_asc',   // 更新时间升序
  UPDATE_TIME_DESC: 'update_time_desc', // 更新时间降序
  SIZE_ASC: 'size_asc',             // 文件大小升序
  SIZE_DESC: 'size_desc',           // 文件大小降序
  PROGRESS_ASC: 'progress_asc',     // 阅读进度升序
  PROGRESS_DESC: 'progress_desc'    // 阅读进度降序
}

/**
 * 小说数据管理服务类
 */
class NovelDataService {
  constructor() {
    this.novels = []
    this.categories = new Map()
    this.tags = new Set()
    this.searchIndex = new Map()
    this.isLoaded = false
    
    // 初始化分类
    this.initCategories()
  }
  
  /**
   * 初始化分类
   */
  initCategories() {
    const categoryNames = {
      [NOVEL_CATEGORIES.FANTASY]: '玄幻',
      [NOVEL_CATEGORIES.ROMANCE]: '言情',
      [NOVEL_CATEGORIES.URBAN]: '都市',
      [NOVEL_CATEGORIES.HISTORY]: '历史',
      [NOVEL_CATEGORIES.SCIFI]: '科幻',
      [NOVEL_CATEGORIES.MYSTERY]: '悬疑',
      [NOVEL_CATEGORIES.MARTIAL_ARTS]: '武侠',
      [NOVEL_CATEGORIES.GAME]: '游戏',
      [NOVEL_CATEGORIES.FANFICTION]: '同人',
      [NOVEL_CATEGORIES.OTHER]: '其他'
    }
    
    Object.entries(categoryNames).forEach(([key, name]) => {
      this.categories.set(key, {
        id: key,
        name,
        count: 0,
        novels: []
      })
    })
  }
  
  /**
   * 加载小说数据
   */
  async loadNovels() {
    try {
      this.novels = await storageUtils.getItem('novels') || []
      this.updateCategories()
      this.updateTags()
      this.buildSearchIndex()
      this.isLoaded = true
      
      console.log(`加载了 ${this.novels.length} 本小说`)
      return this.novels
    } catch (err) {
      console.error('加载小说数据失败:', err)
      ElMessage.error('加载小说数据失败')
      return []
    }
  }
  
  /**
   * 保存小说数据
   */
  async saveNovels() {
    try {
      await storageUtils.setItem('novels', this.novels)
      return true
    } catch (err) {
      console.error('保存小说数据失败:', err)
      ElMessage.error('保存小说数据失败')
      return false
    }
  }
  
  /**
   * 获取所有小说
   */
  async getAllNovels() {
    if (!this.isLoaded) {
      await this.loadNovels()
    }
    return [...this.novels]
  }
  
  /**
   * 根据ID获取小说
   */
  async getNovelById(id) {
    if (!this.isLoaded) {
      await this.loadNovels()
    }
    return this.novels.find(novel => novel.id === id)
  }
  
  /**
   * 添加小说
   */
  async addNovel(novelData) {
    try {
      // 确保必要字段
      const novel = {
        id: novelData.id || commonUtils.generateId('novel_'),
        title: novelData.title || '未知标题',
        author: novelData.author || '未知作者',
        description: novelData.description || '',
        category: novelData.category || NOVEL_CATEGORIES.OTHER,
        tags: novelData.tags || [],
        status: novelData.status || NOVEL_STATUS.UNREAD,
        chapters: novelData.chapters || [],
        totalChapters: novelData.totalChapters || 0,
        totalWords: novelData.totalWords || 0,
        format: novelData.format || 'TXT',
        size: novelData.size || 0,
        encoding: novelData.encoding || 'utf-8',
        importTime: novelData.importTime || new Date(),
        updateTime: novelData.updateTime || new Date(),
        lastModified: novelData.lastModified || new Date(),
        filePath: novelData.filePath || '',
        originalFile: novelData.originalFile || null,
        
        // 阅读相关
        readingProgress: {
          currentChapter: 0,
          currentPosition: 0,
          totalProgress: 0,
          readingTime: 0,
          lastReadTime: null,
          bookmarks: [],
          notes: [],
          highlights: []
        },
        
        // 统计信息
        stats: {
          readCount: 0,
          totalReadingTime: 0,
          averageReadingSpeed: 0,
          favoriteChapters: [],
          readingDays: []
        },
        
        // 自定义字段
        customFields: novelData.customFields || {},
        
        ...novelData
      }
      
      // 检查是否已存在
      const existingIndex = this.novels.findIndex(n => n.id === novel.id)
      if (existingIndex > -1) {
        // 更新现有小说
        this.novels[existingIndex] = novel
      } else {
        // 添加新小说
        this.novels.push(novel)
      }
      
      // 更新相关数据
      this.updateCategories()
      this.updateTags()
      this.updateSearchIndex(novel)
      
      // 保存到存储
      await this.saveNovels()
      
      ElMessage.success(`《${novel.title}》添加成功`)
      return novel
    } catch (err) {
      console.error('添加小说失败:', err)
      ElMessage.error('添加小说失败')
      throw err
    }
  }
  
  /**
   * 更新小说
   */
  async updateNovel(id, updates) {
    try {
      const index = this.novels.findIndex(novel => novel.id === id)
      if (index === -1) {
        throw new Error('小说不存在')
      }
      
      const novel = this.novels[index]
      const updatedNovel = {
        ...novel,
        ...updates,
        updateTime: new Date()
      }
      
      this.novels[index] = updatedNovel
      
      // 更新相关数据
      this.updateCategories()
      this.updateTags()
      this.updateSearchIndex(updatedNovel)
      
      // 保存到存储
      await this.saveNovels()
      
      return updatedNovel
    } catch (err) {
      console.error('更新小说失败:', err)
      ElMessage.error('更新小说失败')
      throw err
    }
  }
  
  /**
   * 删除小说
   */
  async deleteNovel(id) {
    try {
      const index = this.novels.findIndex(novel => novel.id === id)
      if (index === -1) {
        throw new Error('小说不存在')
      }
      
      const novel = this.novels[index]
      this.novels.splice(index, 1)
      
      // 删除章节数据
      await storageUtils.removeItem(`novel_chapters_${id}`)
      
      // 删除阅读进度
      await storageUtils.removeItem(`reading_progress_${id}`)
      
      // 更新相关数据
      this.updateCategories()
      this.updateTags()
      this.removeFromSearchIndex(id)
      
      // 保存到存储
      await this.saveNovels()
      
      ElMessage.success(`《${novel.title}》删除成功`)
      return true
    } catch (err) {
      console.error('删除小说失败:', err)
      ElMessage.error('删除小说失败')
      throw err
    }
  }
  
  /**
   * 批量删除小说
   */
  async deleteNovels(ids) {
    try {
      const deletePromises = ids.map(id => this.deleteNovel(id))
      await Promise.all(deletePromises)
      
      ElMessage.success(`成功删除 ${ids.length} 本小说`)
      return true
    } catch (err) {
      console.error('批量删除小说失败:', err)
      ElMessage.error('批量删除小说失败')
      throw err
    }
  }
  
  /**
   * 搜索小说
   */
  async searchNovels(query, options = {}) {
    if (!this.isLoaded) {
      await this.loadNovels()
    }
    
    if (!query || query.trim() === '') {
      return this.novels
    }
    
    const {
      fields = ['title', 'author', 'description'],
      caseSensitive = false,
      exactMatch = false
    } = options
    
    const searchTerm = caseSensitive ? query : query.toLowerCase()
    
    return this.novels.filter(novel => {
      return fields.some(field => {
        const value = novel[field]
        if (!value) return false
        
        const searchValue = caseSensitive ? value : value.toLowerCase()
        
        if (exactMatch) {
          return searchValue === searchTerm
        } else {
          return searchValue.includes(searchTerm)
        }
      })
    })
  }
  
  /**
   * 高级搜索
   */
  async advancedSearch(criteria) {
    if (!this.isLoaded) {
      await this.loadNovels()
    }
    
    let results = [...this.novels]
    
    // 文本搜索
    if (criteria.query) {
      results = results.filter(novel => {
        const searchFields = ['title', 'author', 'description']
        const query = criteria.query.toLowerCase()
        return searchFields.some(field => 
          novel[field] && novel[field].toLowerCase().includes(query)
        )
      })
    }
    
    // 分类筛选
    if (criteria.category && criteria.category !== 'all') {
      results = results.filter(novel => novel.category === criteria.category)
    }
    
    // 状态筛选
    if (criteria.status && criteria.status !== 'all') {
      results = results.filter(novel => novel.status === criteria.status)
    }
    
    // 标签筛选
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(novel => 
        criteria.tags.some(tag => novel.tags && novel.tags.includes(tag))
      )
    }
    
    // 格式筛选
    if (criteria.format && criteria.format !== 'all') {
      results = results.filter(novel => novel.format === criteria.format)
    }
    
    // 文件大小筛选
    if (criteria.minSize !== undefined) {
      results = results.filter(novel => novel.size >= criteria.minSize)
    }
    if (criteria.maxSize !== undefined) {
      results = results.filter(novel => novel.size <= criteria.maxSize)
    }
    
    // 字数筛选
    if (criteria.minWords !== undefined) {
      results = results.filter(novel => novel.totalWords >= criteria.minWords)
    }
    if (criteria.maxWords !== undefined) {
      results = results.filter(novel => novel.totalWords <= criteria.maxWords)
    }
    
    // 时间范围筛选
    if (criteria.startDate) {
      const startDate = new Date(criteria.startDate)
      results = results.filter(novel => new Date(novel.importTime) >= startDate)
    }
    if (criteria.endDate) {
      const endDate = new Date(criteria.endDate)
      results = results.filter(novel => new Date(novel.importTime) <= endDate)
    }
    
    return results
  }
  
  /**
   * 排序小说
   */
  sortNovels(novels, sortBy = SORT_OPTIONS.IMPORT_TIME_DESC) {
    const sortedNovels = [...novels]
    
    switch (sortBy) {
      case SORT_OPTIONS.TITLE_ASC:
        return sortedNovels.sort((a, b) => a.title.localeCompare(b.title))
      case SORT_OPTIONS.TITLE_DESC:
        return sortedNovels.sort((a, b) => b.title.localeCompare(a.title))
      case SORT_OPTIONS.AUTHOR_ASC:
        return sortedNovels.sort((a, b) => a.author.localeCompare(b.author))
      case SORT_OPTIONS.AUTHOR_DESC:
        return sortedNovels.sort((a, b) => b.author.localeCompare(a.author))
      case SORT_OPTIONS.IMPORT_TIME_ASC:
        return sortedNovels.sort((a, b) => new Date(a.importTime) - new Date(b.importTime))
      case SORT_OPTIONS.IMPORT_TIME_DESC:
        return sortedNovels.sort((a, b) => new Date(b.importTime) - new Date(a.importTime))
      case SORT_OPTIONS.UPDATE_TIME_ASC:
        return sortedNovels.sort((a, b) => new Date(a.updateTime) - new Date(b.updateTime))
      case SORT_OPTIONS.UPDATE_TIME_DESC:
        return sortedNovels.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime))
      case SORT_OPTIONS.SIZE_ASC:
        return sortedNovels.sort((a, b) => a.size - b.size)
      case SORT_OPTIONS.SIZE_DESC:
        return sortedNovels.sort((a, b) => b.size - a.size)
      case SORT_OPTIONS.PROGRESS_ASC:
        return sortedNovels.sort((a, b) => a.readingProgress.totalProgress - b.readingProgress.totalProgress)
      case SORT_OPTIONS.PROGRESS_DESC:
        return sortedNovels.sort((a, b) => b.readingProgress.totalProgress - a.readingProgress.totalProgress)
      default:
        return sortedNovels
    }
  }
  
  /**
   * 获取分类统计
   */
  getCategories() {
    return Array.from(this.categories.values())
  }
  
  /**
   * 获取标签列表
   */
  getTags() {
    return Array.from(this.tags)
  }
  
  /**
   * 获取统计信息
   */
  async getStatistics() {
    if (!this.isLoaded) {
      await this.loadNovels()
    }
    
    const total = this.novels.length
    const statusStats = {}
    const formatStats = {}
    const categoryStats = {}
    let totalSize = 0
    let totalWords = 0
    let totalReadingTime = 0
    
    this.novels.forEach(novel => {
      // 状态统计
      statusStats[novel.status] = (statusStats[novel.status] || 0) + 1
      
      // 格式统计
      formatStats[novel.format] = (formatStats[novel.format] || 0) + 1
      
      // 分类统计
      categoryStats[novel.category] = (categoryStats[novel.category] || 0) + 1
      
      // 大小和字数统计
      totalSize += novel.size || 0
      totalWords += novel.totalWords || 0
      totalReadingTime += novel.stats?.totalReadingTime || 0
    })
    
    return {
      total,
      statusStats,
      formatStats,
      categoryStats,
      totalSize: commonUtils.formatFileSize(totalSize),
      totalWords: commonUtils.formatNumber(totalWords),
      averageWords: total > 0 ? Math.round(totalWords / total) : 0,
      totalReadingTime: this.formatReadingTime(totalReadingTime),
      averageReadingTime: total > 0 ? this.formatReadingTime(totalReadingTime / total) : '0分钟'
    }
  }
  
  /**
   * 更新分类统计
   */
  updateCategories() {
    // 重置计数
    this.categories.forEach(category => {
      category.count = 0
      category.novels = []
    })
    
    // 统计每个分类的小说数量
    this.novels.forEach(novel => {
      const category = this.categories.get(novel.category)
      if (category) {
        category.count++
        category.novels.push(novel.id)
      }
    })
  }
  
  /**
   * 更新标签列表
   */
  updateTags() {
    this.tags.clear()
    this.novels.forEach(novel => {
      if (novel.tags && Array.isArray(novel.tags)) {
        novel.tags.forEach(tag => this.tags.add(tag))
      }
    })
  }
  
  /**
   * 构建搜索索引
   */
  buildSearchIndex() {
    this.searchIndex.clear()
    this.novels.forEach(novel => {
      this.updateSearchIndex(novel)
    })
  }
  
  /**
   * 更新搜索索引
   */
  updateSearchIndex(novel) {
    const searchText = [
      novel.title,
      novel.author,
      novel.description,
      ...(novel.tags || [])
    ].join(' ').toLowerCase()
    
    this.searchIndex.set(novel.id, searchText)
  }
  
  /**
   * 从搜索索引中移除
   */
  removeFromSearchIndex(novelId) {
    this.searchIndex.delete(novelId)
  }
  
  /**
   * 格式化阅读时间
   */
  formatReadingTime(minutes) {
    if (minutes < 60) {
      return `${Math.round(minutes)}分钟`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}小时${remainingMinutes > 0 ? remainingMinutes + '分钟' : ''}`
  }
  
  /**
   * 导出小说数据
   */
  async exportNovels(format = 'json') {
    try {
      const data = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        novels: this.novels,
        categories: Array.from(this.categories.values()),
        tags: Array.from(this.tags)
      }
      
      let content
      let mimeType
      let filename
      
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2)
          mimeType = 'application/json'
          filename = `novels_export_${commonUtils.formatTime(new Date(), 'YYYYMMDD_HHmmss')}.json`
          break
        case 'csv':
          content = this.convertToCSV(this.novels)
          mimeType = 'text/csv'
          filename = `novels_export_${commonUtils.formatTime(new Date(), 'YYYYMMDD_HHmmss')}.csv`
          break
        default:
          throw new Error('不支持的导出格式')
      }
      
      commonUtils.downloadFile(content, filename, mimeType)
      ElMessage.success('导出成功')
      return true
    } catch (err) {
      console.error('导出失败:', err)
      ElMessage.error('导出失败')
      return false
    }
  }
  
  /**
   * 转换为CSV格式
   */
  convertToCSV(novels) {
    const headers = [
      '标题', '作者', '分类', '状态', '格式', '章节数', '字数', 
      '文件大小', '导入时间', '阅读进度', '标签'
    ]
    
    const rows = novels.map(novel => [
      novel.title,
      novel.author,
      novel.category,
      novel.status,
      novel.format,
      novel.totalChapters,
      novel.totalWords,
      novel.size,
      commonUtils.formatTime(novel.importTime),
      `${novel.readingProgress?.totalProgress || 0}%`,
      (novel.tags || []).join(';')
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    return csvContent
  }
  
  /**
   * 导入小说数据
   */
  async importNovels(file) {
    try {
      const content = await commonUtils.readFile(file, 'text')
      const data = JSON.parse(content)
      
      if (!data.novels || !Array.isArray(data.novels)) {
        throw new Error('无效的导入文件格式')
      }
      
      let importCount = 0
      for (const novelData of data.novels) {
        try {
          await this.addNovel(novelData)
          importCount++
        } catch (err) {
          console.warn(`导入小说失败: ${novelData.title}`, err)
        }
      }
      
      ElMessage.success(`成功导入 ${importCount} 本小说`)
      return importCount
    } catch (err) {
      console.error('导入小说数据失败:', err)
      ElMessage.error('导入小说数据失败')
      throw err
    }
  }
}

// 创建全局实例
const novelDataService = new NovelDataService()

// 导出便捷接口
export const novelService = {
  // 数据加载和保存
  loadNovels: () => novelDataService.loadNovels(),
  saveNovels: () => novelDataService.saveNovels(),
  
  // 小说管理
  getAllNovels: () => novelDataService.getAllNovels(),
  getNovelById: (id) => novelDataService.getNovelById(id),
  addNovel: (novelData) => novelDataService.addNovel(novelData),
  updateNovel: (id, updates) => novelDataService.updateNovel(id, updates),
  deleteNovel: (id) => novelDataService.deleteNovel(id),
  deleteNovels: (ids) => novelDataService.deleteNovels(ids),
  
  // 搜索和筛选
  searchNovels: (query, options) => novelDataService.searchNovels(query, options),
  advancedSearch: (criteria) => novelDataService.advancedSearch(criteria),
  sortNovels: (novels, sortBy) => novelDataService.sortNovels(novels, sortBy),
  
  // 分类和标签
  getCategories: () => novelDataService.getCategories(),
  getTags: () => novelDataService.getTags(),
  
  // 统计信息
  getStatistics: () => novelDataService.getStatistics(),
  
  // 导入导出
  exportNovels: (format) => novelDataService.exportNovels(format),
  importNovels: (file) => novelDataService.importNovels(file)
}

// 导出类和常量
export {
  NovelDataService,
  NOVEL_STATUS,
  NOVEL_CATEGORIES,
  SORT_OPTIONS
}

export default novelService