// 阅读器状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storageUtils } from '../utils/storageUtils'

export const useReaderStore = defineStore('reader', () => {
  // 状态
  const isReading = ref(false) // 是否正在阅读
  const currentNovel = ref(null) // 当前阅读的小说
  const currentChapter = ref(0) // 当前章节索引
  const currentPosition = ref(0) // 当前阅读位置 (0-1)
  const chapterContent = ref('') // 当前章节内容
  const chapters = ref([]) // 章节列表
  const loading = ref(false) // 内容加载状态
  const error = ref(null) // 错误信息
  
  // 阅读器窗口状态
  const readerWindow = ref(null) // 阅读器窗口引用
  const isFullscreen = ref(false) // 是否全屏
  const windowOpacity = ref(1) // 窗口透明度
  
  // 阅读统计
  const readingStartTime = ref(null) // 开始阅读时间
  const sessionReadingTime = ref(0) // 本次阅读时间（秒）
  const totalReadingTime = ref(0) // 总阅读时间（分钟）
  const wordsPerMinute = ref(0) // 阅读速度（字/分钟）
  
  // 书签和笔记
  const bookmarks = ref([]) // 书签列表
  const notes = ref([]) // 笔记列表
  const highlights = ref([]) // 高亮标记

  // 计算属性
  const hasNextChapter = computed(() => {
    return currentChapter.value < chapters.value.length - 1
  })

  const hasPrevChapter = computed(() => {
    return currentChapter.value > 0
  })

  const currentChapterInfo = computed(() => {
    if (chapters.value.length === 0) return null
    return chapters.value[currentChapter.value]
  })

  const readingProgress = computed(() => {
    if (chapters.value.length === 0) return 0
    return (currentChapter.value + currentPosition.value) / chapters.value.length
  })

  const formattedReadingTime = computed(() => {
    const minutes = Math.floor(sessionReadingTime.value / 60)
    const seconds = sessionReadingTime.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  // 动作
  async function startReading(novel) {
    try {
      loading.value = true
      error.value = null
      
      currentNovel.value = novel
      chapters.value = novel.chapters || []
      
      // 恢复上次阅读位置
      const progress = await storageUtils.getItem(`novel_progress_${novel.id}`)
      if (progress) {
        currentChapter.value = progress.chapterIndex || 0
        currentPosition.value = progress.progress || 0
        totalReadingTime.value = progress.readingTime || 0
      } else {
        currentChapter.value = novel.currentChapter || 0
        currentPosition.value = novel.readProgress || 0
      }
      
      // 加载当前章节内容
      await loadChapterContent(currentChapter.value)
      
      // 开始阅读计时
      readingStartTime.value = Date.now()
      sessionReadingTime.value = 0
      isReading.value = true
      
      // 加载书签和笔记
      await loadBookmarks(novel.id)
      await loadNotes(novel.id)
      await loadHighlights(novel.id)
      
      console.log('开始阅读:', novel.title)
    } catch (err) {
      error.value = '开始阅读失败: ' + err.message
      console.error('开始阅读失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function stopReading() {
    if (!isReading.value || !currentNovel.value) return
    
    try {
      // 计算本次阅读时间
      if (readingStartTime.value) {
        const sessionTime = Math.floor((Date.now() - readingStartTime.value) / 1000)
        sessionReadingTime.value = sessionTime
        totalReadingTime.value += Math.floor(sessionTime / 60)
      }
      
      // 保存阅读进度
      await saveReadingProgress()
      
      // 重置状态
      isReading.value = false
      currentNovel.value = null
      currentChapter.value = 0
      currentPosition.value = 0
      chapterContent.value = ''
      chapters.value = []
      readingStartTime.value = null
      sessionReadingTime.value = 0
      
      console.log('停止阅读')
    } catch (err) {
      console.error('停止阅读失败:', err)
    }
  }

  async function loadChapterContent(chapterIndex) {
    if (!currentNovel.value || !chapters.value[chapterIndex]) {
      throw new Error('章节不存在')
    }
    
    try {
      loading.value = true
      
      const chapter = chapters.value[chapterIndex]
      
      // 从缓存或文件加载内容
      const cacheKey = `chapter_${currentNovel.value.id}_${chapterIndex}`
      let content = await storageUtils.getItem(cacheKey)
      
      if (!content) {
        // 如果缓存中没有，从文件加载
        const { fileService } = await import('../services/fileService')
        content = await fileService.loadChapterContent(currentNovel.value, chapterIndex)
        
        // 缓存内容
        await storageUtils.setItem(cacheKey, content)
      }
      
      chapterContent.value = content
      currentChapter.value = chapterIndex
      
      console.log(`加载章节: ${chapter.title}`)
    } catch (err) {
      error.value = '加载章节失败: ' + err.message
      console.error('加载章节失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function nextChapter() {
    if (hasNextChapter.value) {
      await saveReadingProgress()
      await loadChapterContent(currentChapter.value + 1)
      currentPosition.value = 0
    }
  }

  async function prevChapter() {
    if (hasPrevChapter.value) {
      await saveReadingProgress()
      await loadChapterContent(currentChapter.value - 1)
      currentPosition.value = 0
    }
  }

  async function goToChapter(chapterIndex) {
    if (chapterIndex >= 0 && chapterIndex < chapters.value.length) {
      await saveReadingProgress()
      await loadChapterContent(chapterIndex)
      currentPosition.value = 0
    }
  }

  function updatePosition(position) {
    currentPosition.value = Math.max(0, Math.min(1, position))
  }

  async function saveReadingProgress() {
    if (!currentNovel.value) return
    
    try {
      const progress = {
        chapterIndex: currentChapter.value,
        progress: currentPosition.value,
        lastReadTime: new Date().toISOString(),
        readingTime: totalReadingTime.value
      }
      
      await storageUtils.setItem(`novel_progress_${currentNovel.value.id}`, progress)
      
      // 更新小说store中的进度
      const { useNovelStore } = await import('./novel')
      const novelStore = useNovelStore()
      await novelStore.updateReadingProgress(
        currentNovel.value.id,
        currentChapter.value,
        currentPosition.value,
        Math.floor(sessionReadingTime.value / 60)
      )
    } catch (err) {
      console.error('保存阅读进度失败:', err)
    }
  }

  // 书签管理
  async function addBookmark(title, note = '') {
    if (!currentNovel.value) return
    
    const bookmark = {
      id: Date.now().toString(),
      novelId: currentNovel.value.id,
      chapterIndex: currentChapter.value,
      position: currentPosition.value,
      title: title || `第${currentChapter.value + 1}章书签`,
      note,
      createTime: new Date().toISOString()
    }
    
    bookmarks.value.push(bookmark)
    await saveBookmarks(currentNovel.value.id)
    
    return bookmark
  }

  async function removeBookmark(bookmarkId) {
    const index = bookmarks.value.findIndex(b => b.id === bookmarkId)
    if (index > -1) {
      bookmarks.value.splice(index, 1)
      if (currentNovel.value) {
        await saveBookmarks(currentNovel.value.id)
      }
    }
  }

  async function goToBookmark(bookmark) {
    await goToChapter(bookmark.chapterIndex)
    currentPosition.value = bookmark.position
  }

  // 笔记管理
  async function addNote(content, selectedText = '') {
    if (!currentNovel.value) return
    
    const note = {
      id: Date.now().toString(),
      novelId: currentNovel.value.id,
      chapterIndex: currentChapter.value,
      position: currentPosition.value,
      content,
      selectedText,
      createTime: new Date().toISOString()
    }
    
    notes.value.push(note)
    await saveNotes(currentNovel.value.id)
    
    return note
  }

  async function removeNote(noteId) {
    const index = notes.value.findIndex(n => n.id === noteId)
    if (index > -1) {
      notes.value.splice(index, 1)
      if (currentNovel.value) {
        await saveNotes(currentNovel.value.id)
      }
    }
  }

  // 高亮管理
  async function addHighlight(selectedText, color = '#ffff00') {
    if (!currentNovel.value) return
    
    const highlight = {
      id: Date.now().toString(),
      novelId: currentNovel.value.id,
      chapterIndex: currentChapter.value,
      position: currentPosition.value,
      selectedText,
      color,
      createTime: new Date().toISOString()
    }
    
    highlights.value.push(highlight)
    await saveHighlights(currentNovel.value.id)
    
    return highlight
  }

  async function removeHighlight(highlightId) {
    const index = highlights.value.findIndex(h => h.id === highlightId)
    if (index > -1) {
      highlights.value.splice(index, 1)
      if (currentNovel.value) {
        await saveHighlights(currentNovel.value.id)
      }
    }
  }

  // 数据持久化
  async function loadBookmarks(novelId) {
    try {
      const saved = await storageUtils.getItem(`bookmarks_${novelId}`) || []
      bookmarks.value = saved
    } catch (err) {
      console.error('加载书签失败:', err)
    }
  }

  async function saveBookmarks(novelId) {
    try {
      await storageUtils.setItem(`bookmarks_${novelId}`, bookmarks.value)
    } catch (err) {
      console.error('保存书签失败:', err)
    }
  }

  async function loadNotes(novelId) {
    try {
      const saved = await storageUtils.getItem(`notes_${novelId}`) || []
      notes.value = saved
    } catch (err) {
      console.error('加载笔记失败:', err)
    }
  }

  async function saveNotes(novelId) {
    try {
      await storageUtils.setItem(`notes_${novelId}`, notes.value)
    } catch (err) {
      console.error('保存笔记失败:', err)
    }
  }

  async function loadHighlights(novelId) {
    try {
      const saved = await storageUtils.getItem(`highlights_${novelId}`) || []
      highlights.value = saved
    } catch (err) {
      console.error('加载高亮失败:', err)
    }
  }

  async function saveHighlights(novelId) {
    try {
      await storageUtils.setItem(`highlights_${novelId}`, highlights.value)
    } catch (err) {
      console.error('保存高亮失败:', err)
    }
  }

  // 阅读器窗口控制
  function setReaderWindow(window) {
    readerWindow.value = window
  }

  function setFullscreen(fullscreen) {
    isFullscreen.value = fullscreen
  }

  function setWindowOpacity(opacity) {
    windowOpacity.value = Math.max(0.1, Math.min(1, opacity))
  }

  function clearError() {
    error.value = null
  }

  // 定时更新阅读时间
  let readingTimer = null
  function startReadingTimer() {
    if (readingTimer) clearInterval(readingTimer)
    
    readingTimer = setInterval(() => {
      if (isReading.value && readingStartTime.value) {
        sessionReadingTime.value = Math.floor((Date.now() - readingStartTime.value) / 1000)
      }
    }, 1000)
  }

  function stopReadingTimer() {
    if (readingTimer) {
      clearInterval(readingTimer)
      readingTimer = null
    }
  }

  return {
    // 状态
    isReading,
    currentNovel,
    currentChapter,
    currentPosition,
    chapterContent,
    chapters,
    loading,
    error,
    readerWindow,
    isFullscreen,
    windowOpacity,
    readingStartTime,
    sessionReadingTime,
    totalReadingTime,
    wordsPerMinute,
    bookmarks,
    notes,
    highlights,
    
    // 计算属性
    hasNextChapter,
    hasPrevChapter,
    currentChapterInfo,
    readingProgress,
    formattedReadingTime,
    
    // 动作
    startReading,
    stopReading,
    loadChapterContent,
    nextChapter,
    prevChapter,
    goToChapter,
    updatePosition,
    saveReadingProgress,
    addBookmark,
    removeBookmark,
    goToBookmark,
    addNote,
    removeNote,
    addHighlight,
    removeHighlight,
    setReaderWindow,
    setFullscreen,
    setWindowOpacity,
    clearError,
    startReadingTimer,
    stopReadingTimer
  }
})