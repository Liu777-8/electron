// 阅读器服务
// 提供章节内容加载、阅读进度管理、书签笔记等功能

import { storageUtils, commonUtils, readerUtils } from '../utils/index.js'
import { ElMessage } from 'element-plus'

/**
 * 阅读模式枚举
 */
export const READING_MODES = {
  SCROLL: 'scroll',     // 滚动模式
  PAGE: 'page',         // 翻页模式
  TYPEWRITER: 'typewriter' // 打字机模式
}

/**
 * 章节加载状态
 */
export const CHAPTER_STATUS = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  CACHED: 'cached'
}

/**
 * 书签类型
 */
export const BOOKMARK_TYPES = {
  MANUAL: 'manual',     // 手动书签
  AUTO: 'auto',         // 自动书签
  CHAPTER: 'chapter'    // 章节书签
}

/**
 * 笔记类型
 */
export const NOTE_TYPES = {
  TEXT: 'text',         // 文本笔记
  VOICE: 'voice',       // 语音笔记
  IMAGE: 'image'        // 图片笔记
}

/**
 * 高亮类型
 */
export const HIGHLIGHT_TYPES = {
  YELLOW: 'yellow',     // 黄色高亮
  GREEN: 'green',       // 绿色高亮
  BLUE: 'blue',         // 蓝色高亮
  RED: 'red',           // 红色高亮
  PURPLE: 'purple'      // 紫色高亮
}

/**
 * 阅读器服务类
 */
class ReaderService {
  constructor() {
    this.currentNovel = null
    this.chapters = new Map()
    this.chapterCache = new Map()
    this.readingProgress = new Map()
    this.bookmarks = new Map()
    this.notes = new Map()
    this.highlights = new Map()
    this.readingStats = new Map()
    
    // 缓存配置
    this.cacheConfig = {
      maxSize: 50, // 最大缓存章节数
      preloadCount: 3, // 预加载章节数
      autoSave: true, // 自动保存进度
      saveInterval: 30000 // 保存间隔(ms)
    }
    
    // 自动保存定时器
    this.autoSaveTimer = null
    
    this.init()
  }
  
  /**
   * 初始化服务
   */
  async init() {
    try {
      // 加载配置
      const config = await storageUtils.getItem('reader_config')
      if (config) {
        this.cacheConfig = { ...this.cacheConfig, ...config }
      }
      
      // 启动自动保存
      if (this.cacheConfig.autoSave) {
        this.startAutoSave()
      }
      
      console.log('阅读器服务初始化完成')
    } catch (err) {
      console.error('阅读器服务初始化失败:', err)
    }
  }
  
  /**
   * 开始阅读小说
   */
  async startReading(novel, chapterIndex = 0) {
    try {
      this.currentNovel = novel
      
      // 加载小说数据
      await this.loadNovelData(novel.id)
      
      // 加载当前章节
      const chapter = await this.loadChapter(novel.id, chapterIndex)
      
      // 初始化阅读进度
      await this.initReadingProgress(novel.id, chapterIndex)
      
      // 预加载相邻章节
      this.preloadChapters(novel.id, chapterIndex)
      
      console.log(`开始阅读《${novel.title}》第${chapterIndex + 1}章`)
      return chapter
    } catch (err) {
      console.error('开始阅读失败:', err)
      ElMessage.error('开始阅读失败')
      throw err
    }
  }
  
  /**
   * 停止阅读
   */
  async stopReading() {
    try {
      if (this.currentNovel) {
        // 保存阅读进度
        await this.saveReadingProgress()
        
        // 更新阅读统计
        await this.updateReadingStats()
        
        console.log(`停止阅读《${this.currentNovel.title}》`)
      }
      
      this.currentNovel = null
      this.clearCache()
    } catch (err) {
      console.error('停止阅读失败:', err)
    }
  }
  
  /**
   * 加载小说数据
   */
  async loadNovelData(novelId) {
    try {
      // 加载章节列表
      const chapters = await storageUtils.getItem(`novel_chapters_${novelId}`) || []
      this.chapters.set(novelId, chapters)
      
      // 加载阅读进度
      const progress = await storageUtils.getItem(`reading_progress_${novelId}`) || {
        currentChapter: 0,
        currentPosition: 0,
        totalProgress: 0,
        readingTime: 0,
        lastReadTime: null
      }
      this.readingProgress.set(novelId, progress)
      
      // 加载书签
      const bookmarks = await storageUtils.getItem(`bookmarks_${novelId}`) || []
      this.bookmarks.set(novelId, bookmarks)
      
      // 加载笔记
      const notes = await storageUtils.getItem(`notes_${novelId}`) || []
      this.notes.set(novelId, notes)
      
      // 加载高亮
      const highlights = await storageUtils.getItem(`highlights_${novelId}`) || []
      this.highlights.set(novelId, highlights)
      
      // 加载阅读统计
      const stats = await storageUtils.getItem(`reading_stats_${novelId}`) || {
        totalReadingTime: 0,
        readCount: 0,
        averageReadingSpeed: 0,
        readingDays: [],
        favoriteChapters: []
      }
      this.readingStats.set(novelId, stats)
      
      return true
    } catch (err) {
      console.error('加载小说数据失败:', err)
      throw err
    }
  }
  
  /**
   * 加载章节内容
   */
  async loadChapter(novelId, chapterIndex) {
    try {
      const cacheKey = `${novelId}_${chapterIndex}`
      
      // 检查缓存
      if (this.chapterCache.has(cacheKey)) {
        const cached = this.chapterCache.get(cacheKey)
        cached.lastAccess = Date.now()
        return { ...cached, status: CHAPTER_STATUS.CACHED }
      }
      
      // 获取章节信息
      const chapters = this.chapters.get(novelId) || []
      const chapterInfo = chapters[chapterIndex]
      
      if (!chapterInfo) {
        throw new Error('章节不存在')
      }
      
      // 加载章节内容
      const content = await this.loadChapterContent(novelId, chapterIndex, chapterInfo)
      
      const chapter = {
        index: chapterIndex,
        title: chapterInfo.title,
        content: content,
        wordCount: content.length,
        status: CHAPTER_STATUS.LOADED,
        loadTime: Date.now(),
        lastAccess: Date.now()
      }
      
      // 添加到缓存
      this.addToCache(cacheKey, chapter)
      
      return chapter
    } catch (err) {
      console.error('加载章节失败:', err)
      return {
        index: chapterIndex,
        title: '加载失败',
        content: '章节内容加载失败，请重试。',
        wordCount: 0,
        status: CHAPTER_STATUS.ERROR,
        error: err.message
      }
    }
  }
  
  /**
   * 加载章节内容（具体实现）
   */
  async loadChapterContent(novelId, chapterIndex, chapterInfo) {
    // 从存储中加载章节内容
    const content = await storageUtils.getItem(`chapter_${novelId}_${chapterIndex}`)
    
    if (content) {
      return content
    }
    
    // 如果没有缓存，从原始文件中解析
    // 这里需要根据小说格式进行不同的处理
    throw new Error('章节内容不存在')
  }
  
  /**
   * 预加载章节
   */
  async preloadChapters(novelId, currentIndex) {
    const chapters = this.chapters.get(novelId) || []
    const preloadPromises = []
    
    // 预加载前后几章
    for (let i = 1; i <= this.cacheConfig.preloadCount; i++) {
      // 预加载后面的章节
      if (currentIndex + i < chapters.length) {
        preloadPromises.push(this.loadChapter(novelId, currentIndex + i))
      }
      
      // 预加载前面的章节
      if (currentIndex - i >= 0) {
        preloadPromises.push(this.loadChapter(novelId, currentIndex - i))
      }
    }
    
    // 异步预加载，不等待完成
    Promise.all(preloadPromises).catch(err => {
      console.warn('预加载章节失败:', err)
    })
  }
  
  /**
   * 切换到指定章节
   */
  async switchToChapter(chapterIndex) {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    try {
      // 保存当前阅读进度
      await this.saveReadingProgress()
      
      // 加载新章节
      const chapter = await this.loadChapter(this.currentNovel.id, chapterIndex)
      
      // 更新阅读进度
      const progress = this.readingProgress.get(this.currentNovel.id)
      progress.currentChapter = chapterIndex
      progress.currentPosition = 0
      progress.lastReadTime = new Date()
      
      // 预加载相邻章节
      this.preloadChapters(this.currentNovel.id, chapterIndex)
      
      return chapter
    } catch (err) {
      console.error('切换章节失败:', err)
      ElMessage.error('切换章节失败')
      throw err
    }
  }
  
  /**
   * 获取下一章
   */
  async getNextChapter() {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    const progress = this.readingProgress.get(this.currentNovel.id)
    const chapters = this.chapters.get(this.currentNovel.id) || []
    
    if (progress.currentChapter >= chapters.length - 1) {
      throw new Error('已经是最后一章')
    }
    
    return await this.switchToChapter(progress.currentChapter + 1)
  }
  
  /**
   * 获取上一章
   */
  async getPreviousChapter() {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    const progress = this.readingProgress.get(this.currentNovel.id)
    
    if (progress.currentChapter <= 0) {
      throw new Error('已经是第一章')
    }
    
    return await this.switchToChapter(progress.currentChapter - 1)
  }
  
  /**
   * 更新阅读位置
   */
  updateReadingPosition(position, totalLength) {
    if (!this.currentNovel) return
    
    const progress = this.readingProgress.get(this.currentNovel.id)
    const chapters = this.chapters.get(this.currentNovel.id) || []
    
    progress.currentPosition = position
    progress.lastReadTime = new Date()
    
    // 计算总体进度
    const chapterProgress = totalLength > 0 ? position / totalLength : 0
    const totalProgress = chapters.length > 0 ? 
      (progress.currentChapter + chapterProgress) / chapters.length * 100 : 0
    
    progress.totalProgress = Math.min(100, Math.max(0, totalProgress))
  }
  
  /**
   * 初始化阅读进度
   */
  async initReadingProgress(novelId, chapterIndex) {
    let progress = this.readingProgress.get(novelId)
    
    if (!progress) {
      progress = {
        currentChapter: chapterIndex,
        currentPosition: 0,
        totalProgress: 0,
        readingTime: 0,
        lastReadTime: new Date(),
        startTime: new Date()
      }
      this.readingProgress.set(novelId, progress)
    } else {
      progress.startTime = new Date()
    }
  }
  
  /**
   * 保存阅读进度
   */
  async saveReadingProgress() {
    if (!this.currentNovel) return
    
    try {
      const progress = this.readingProgress.get(this.currentNovel.id)
      
      if (progress) {
        // 计算本次阅读时间
        if (progress.startTime) {
          const sessionTime = (Date.now() - progress.startTime.getTime()) / 1000 / 60 // 分钟
          progress.readingTime += sessionTime
        }
        
        await storageUtils.setItem(`reading_progress_${this.currentNovel.id}`, progress)
      }
    } catch (err) {
      console.error('保存阅读进度失败:', err)
    }
  }
  
  /**
   * 获取阅读进度
   */
  getReadingProgress(novelId = null) {
    const id = novelId || (this.currentNovel ? this.currentNovel.id : null)
    if (!id) return null
    
    return this.readingProgress.get(id)
  }
  
  /**
   * 添加书签
   */
  async addBookmark(chapterIndex, position, title = '', type = BOOKMARK_TYPES.MANUAL) {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    try {
      const bookmarks = this.bookmarks.get(this.currentNovel.id) || []
      
      const bookmark = {
        id: commonUtils.generateId('bookmark_'),
        chapterIndex,
        position,
        title: title || `第${chapterIndex + 1}章书签`,
        type,
        createTime: new Date(),
        content: '' // 可以保存书签位置的文本内容
      }
      
      bookmarks.push(bookmark)
      bookmarks.sort((a, b) => {
        if (a.chapterIndex !== b.chapterIndex) {
          return a.chapterIndex - b.chapterIndex
        }
        return a.position - b.position
      })
      
      this.bookmarks.set(this.currentNovel.id, bookmarks)
      await storageUtils.setItem(`bookmarks_${this.currentNovel.id}`, bookmarks)
      
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
    if (!this.currentNovel) return
    
    try {
      const bookmarks = this.bookmarks.get(this.currentNovel.id) || []
      const index = bookmarks.findIndex(b => b.id === bookmarkId)
      
      if (index > -1) {
        bookmarks.splice(index, 1)
        this.bookmarks.set(this.currentNovel.id, bookmarks)
        await storageUtils.setItem(`bookmarks_${this.currentNovel.id}`, bookmarks)
        
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
   * 获取书签列表
   */
  getBookmarks(novelId = null) {
    const id = novelId || (this.currentNovel ? this.currentNovel.id : null)
    if (!id) return []
    
    return this.bookmarks.get(id) || []
  }
  
  /**
   * 跳转到书签
   */
  async jumpToBookmark(bookmarkId) {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    const bookmarks = this.bookmarks.get(this.currentNovel.id) || []
    const bookmark = bookmarks.find(b => b.id === bookmarkId)
    
    if (!bookmark) {
      throw new Error('书签不存在')
    }
    
    // 切换到书签所在章节
    const chapter = await this.switchToChapter(bookmark.chapterIndex)
    
    // 返回书签信息，由UI层处理位置跳转
    return {
      chapter,
      bookmark
    }
  }
  
  /**
   * 添加笔记
   */
  async addNote(chapterIndex, position, content, type = NOTE_TYPES.TEXT) {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    try {
      const notes = this.notes.get(this.currentNovel.id) || []
      
      const note = {
        id: commonUtils.generateId('note_'),
        chapterIndex,
        position,
        content,
        type,
        createTime: new Date(),
        updateTime: new Date()
      }
      
      notes.push(note)
      notes.sort((a, b) => {
        if (a.chapterIndex !== b.chapterIndex) {
          return a.chapterIndex - b.chapterIndex
        }
        return a.position - b.position
      })
      
      this.notes.set(this.currentNovel.id, notes)
      await storageUtils.setItem(`notes_${this.currentNovel.id}`, notes)
      
      ElMessage.success('笔记添加成功')
      return note
    } catch (err) {
      console.error('添加笔记失败:', err)
      ElMessage.error('添加笔记失败')
      throw err
    }
  }
  
  /**
   * 更新笔记
   */
  async updateNote(noteId, content) {
    if (!this.currentNovel) return
    
    try {
      const notes = this.notes.get(this.currentNovel.id) || []
      const note = notes.find(n => n.id === noteId)
      
      if (note) {
        note.content = content
        note.updateTime = new Date()
        
        this.notes.set(this.currentNovel.id, notes)
        await storageUtils.setItem(`notes_${this.currentNovel.id}`, notes)
        
        ElMessage.success('笔记更新成功')
        return note
      }
      
      return null
    } catch (err) {
      console.error('更新笔记失败:', err)
      ElMessage.error('更新笔记失败')
      throw err
    }
  }
  
  /**
   * 删除笔记
   */
  async deleteNote(noteId) {
    if (!this.currentNovel) return
    
    try {
      const notes = this.notes.get(this.currentNovel.id) || []
      const index = notes.findIndex(n => n.id === noteId)
      
      if (index > -1) {
        notes.splice(index, 1)
        this.notes.set(this.currentNovel.id, notes)
        await storageUtils.setItem(`notes_${this.currentNovel.id}`, notes)
        
        ElMessage.success('笔记删除成功')
        return true
      }
      
      return false
    } catch (err) {
      console.error('删除笔记失败:', err)
      ElMessage.error('删除笔记失败')
      throw err
    }
  }
  
  /**
   * 获取笔记列表
   */
  getNotes(novelId = null) {
    const id = novelId || (this.currentNovel ? this.currentNovel.id : null)
    if (!id) return []
    
    return this.notes.get(id) || []
  }
  
  /**
   * 添加高亮
   */
  async addHighlight(chapterIndex, startPos, endPos, text, type = HIGHLIGHT_TYPES.YELLOW) {
    if (!this.currentNovel) {
      throw new Error('没有正在阅读的小说')
    }
    
    try {
      const highlights = this.highlights.get(this.currentNovel.id) || []
      
      const highlight = {
        id: commonUtils.generateId('highlight_'),
        chapterIndex,
        startPos,
        endPos,
        text,
        type,
        createTime: new Date()
      }
      
      highlights.push(highlight)
      highlights.sort((a, b) => {
        if (a.chapterIndex !== b.chapterIndex) {
          return a.chapterIndex - b.chapterIndex
        }
        return a.startPos - b.startPos
      })
      
      this.highlights.set(this.currentNovel.id, highlights)
      await storageUtils.setItem(`highlights_${this.currentNovel.id}`, highlights)
      
      return highlight
    } catch (err) {
      console.error('添加高亮失败:', err)
      throw err
    }
  }
  
  /**
   * 删除高亮
   */
  async deleteHighlight(highlightId) {
    if (!this.currentNovel) return
    
    try {
      const highlights = this.highlights.get(this.currentNovel.id) || []
      const index = highlights.findIndex(h => h.id === highlightId)
      
      if (index > -1) {
        highlights.splice(index, 1)
        this.highlights.set(this.currentNovel.id, highlights)
        await storageUtils.setItem(`highlights_${this.currentNovel.id}`, highlights)
        return true
      }
      
      return false
    } catch (err) {
      console.error('删除高亮失败:', err)
      throw err
    }
  }
  
  /**
   * 获取高亮列表
   */
  getHighlights(novelId = null, chapterIndex = null) {
    const id = novelId || (this.currentNovel ? this.currentNovel.id : null)
    if (!id) return []
    
    const highlights = this.highlights.get(id) || []
    
    if (chapterIndex !== null) {
      return highlights.filter(h => h.chapterIndex === chapterIndex)
    }
    
    return highlights
  }
  
  /**
   * 更新阅读统计
   */
  async updateReadingStats() {
    if (!this.currentNovel) return
    
    try {
      const stats = this.readingStats.get(this.currentNovel.id) || {
        totalReadingTime: 0,
        readCount: 0,
        averageReadingSpeed: 0,
        readingDays: [],
        favoriteChapters: []
      }
      
      const progress = this.readingProgress.get(this.currentNovel.id)
      
      if (progress) {
        // 更新总阅读时间
        stats.totalReadingTime += progress.readingTime
        
        // 更新阅读次数
        stats.readCount += 1
        
        // 更新阅读天数
        const today = commonUtils.formatTime(new Date(), 'YYYY-MM-DD')
        if (!stats.readingDays.includes(today)) {
          stats.readingDays.push(today)
        }
        
        // 计算平均阅读速度（字/分钟）
        if (stats.totalReadingTime > 0) {
          const totalWords = this.currentNovel.totalWords || 0
          stats.averageReadingSpeed = Math.round(totalWords / stats.totalReadingTime)
        }
      }
      
      this.readingStats.set(this.currentNovel.id, stats)
      await storageUtils.setItem(`reading_stats_${this.currentNovel.id}`, stats)
    } catch (err) {
      console.error('更新阅读统计失败:', err)
    }
  }
  
  /**
   * 获取阅读统计
   */
  getReadingStats(novelId = null) {
    const id = novelId || (this.currentNovel ? this.currentNovel.id : null)
    if (!id) return null
    
    return this.readingStats.get(id)
  }
  
  /**
   * 添加到缓存
   */
  addToCache(key, chapter) {
    // 检查缓存大小
    if (this.chapterCache.size >= this.cacheConfig.maxSize) {
      this.cleanCache()
    }
    
    this.chapterCache.set(key, chapter)
  }
  
  /**
   * 清理缓存
   */
  cleanCache() {
    // 按最后访问时间排序，删除最旧的
    const entries = Array.from(this.chapterCache.entries())
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess)
    
    // 删除一半的缓存
    const deleteCount = Math.floor(this.cacheConfig.maxSize / 2)
    for (let i = 0; i < deleteCount; i++) {
      this.chapterCache.delete(entries[i][0])
    }
  }
  
  /**
   * 清空缓存
   */
  clearCache() {
    this.chapterCache.clear()
  }
  
  /**
   * 开始自动保存
   */
  startAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
    }
    
    this.autoSaveTimer = setInterval(() => {
      this.saveReadingProgress()
    }, this.cacheConfig.saveInterval)
  }
  
  /**
   * 停止自动保存
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }
  
  /**
   * 获取章节列表
   */
  getChapterList(novelId = null) {
    const id = novelId || (this.currentNovel ? this.currentNovel.id : null)
    if (!id) return []
    
    return this.chapters.get(id) || []
  }
  
  /**
   * 搜索章节
   */
  searchChapters(query, novelId = null) {
    const chapters = this.getChapterList(novelId)
    
    if (!query || query.trim() === '') {
      return chapters
    }
    
    const searchTerm = query.toLowerCase()
    return chapters.filter((chapter, index) => {
      return chapter.title && chapter.title.toLowerCase().includes(searchTerm)
    }).map((chapter, originalIndex) => ({
      ...chapter,
      index: chapters.indexOf(chapter)
    }))
  }
  
  /**
   * 销毁服务
   */
  destroy() {
    this.stopAutoSave()
    this.clearCache()
    this.currentNovel = null
    this.chapters.clear()
    this.readingProgress.clear()
    this.bookmarks.clear()
    this.notes.clear()
    this.highlights.clear()
    this.readingStats.clear()
  }
}

// 创建全局实例
const readerService = new ReaderService()

// 导出便捷接口
export const reader = {
  // 阅读控制
  startReading: (novel, chapterIndex) => readerService.startReading(novel, chapterIndex),
  stopReading: () => readerService.stopReading(),
  
  // 章节管理
  loadChapter: (novelId, chapterIndex) => readerService.loadChapter(novelId, chapterIndex),
  switchToChapter: (chapterIndex) => readerService.switchToChapter(chapterIndex),
  getNextChapter: () => readerService.getNextChapter(),
  getPreviousChapter: () => readerService.getPreviousChapter(),
  getChapterList: (novelId) => readerService.getChapterList(novelId),
  searchChapters: (query, novelId) => readerService.searchChapters(query, novelId),
  
  // 阅读进度
  updateReadingPosition: (position, totalLength) => readerService.updateReadingPosition(position, totalLength),
  getReadingProgress: (novelId) => readerService.getReadingProgress(novelId),
  saveReadingProgress: () => readerService.saveReadingProgress(),
  
  // 书签管理
  addBookmark: (chapterIndex, position, title, type) => readerService.addBookmark(chapterIndex, position, title, type),
  deleteBookmark: (bookmarkId) => readerService.deleteBookmark(bookmarkId),
  getBookmarks: (novelId) => readerService.getBookmarks(novelId),
  jumpToBookmark: (bookmarkId) => readerService.jumpToBookmark(bookmarkId),
  
  // 笔记管理
  addNote: (chapterIndex, position, content, type) => readerService.addNote(chapterIndex, position, content, type),
  updateNote: (noteId, content) => readerService.updateNote(noteId, content),
  deleteNote: (noteId) => readerService.deleteNote(noteId),
  getNotes: (novelId) => readerService.getNotes(novelId),
  
  // 高亮管理
  addHighlight: (chapterIndex, startPos, endPos, text, type) => readerService.addHighlight(chapterIndex, startPos, endPos, text, type),
  deleteHighlight: (highlightId) => readerService.deleteHighlight(highlightId),
  getHighlights: (novelId, chapterIndex) => readerService.getHighlights(novelId, chapterIndex),
  
  // 统计信息
  getReadingStats: (novelId) => readerService.getReadingStats(novelId),
  
  // 缓存管理
  clearCache: () => readerService.clearCache(),
  
  // 获取当前小说
  getCurrentNovel: () => readerService.currentNovel
}

// 导出类和常量
export {
  ReaderService,
  READING_MODES,
  CHAPTER_STATUS,
  BOOKMARK_TYPES,
  NOTE_TYPES,
  HIGHLIGHT_TYPES
}

export default reader