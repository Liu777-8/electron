// 小说数据状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fileService } from '../services/fileService'
import { storageUtils } from '../utils/storageUtils'

export const useNovelStore = defineStore('novel', () => {
  // 状态
  const novels = ref([]) // 小说列表
  const currentNovel = ref(null) // 当前选中的小说
  const loading = ref(false) // 加载状态
  const error = ref(null) // 错误信息
  const searchQuery = ref('') // 搜索关键词
  const sortBy = ref('lastRead') // 排序方式: lastRead, title, author, addTime
  const filterBy = ref('all') // 筛选方式: all, local, online, favorite

  // 计算属性
  const filteredNovels = computed(() => {
    let result = novels.value

    // 按类型筛选
    if (filterBy.value !== 'all') {
      result = result.filter(novel => {
        switch (filterBy.value) {
          case 'local':
            return novel.type === 'local'
          case 'online':
            return novel.type === 'online'
          case 'favorite':
            return novel.isFavorite
          default:
            return true
        }
      })
    }

    // 按关键词搜索
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(novel => 
        novel.title.toLowerCase().includes(query) ||
        novel.author.toLowerCase().includes(query) ||
        (novel.description && novel.description.toLowerCase().includes(query))
      )
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy.value) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'author':
          return a.author.localeCompare(b.author)
        case 'addTime':
          return new Date(b.addTime) - new Date(a.addTime)
        case 'lastRead':
        default:
          return new Date(b.lastReadTime || b.addTime) - new Date(a.lastReadTime || a.addTime)
      }
    })

    return result
  })

  const novelCount = computed(() => novels.value.length)
  const favoriteCount = computed(() => novels.value.filter(n => n.isFavorite).length)
  const localCount = computed(() => novels.value.filter(n => n.type === 'local').length)
  const onlineCount = computed(() => novels.value.filter(n => n.type === 'online').length)

  // 动作
  async function loadLibrary() {
    try {
      loading.value = true
      error.value = null
      
      const savedNovels = await storageUtils.getItem('novels') || []
      novels.value = savedNovels
      
      console.log(`已加载 ${novels.value.length} 本小说`)
    } catch (err) {
      error.value = '加载小说库失败: ' + err.message
      console.error('加载小说库失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function addNovel(novelData) {
    try {
      const novel = {
        id: Date.now().toString(),
        title: novelData.title,
        author: novelData.author || '未知作者',
        description: novelData.description || '',
        cover: novelData.cover || '',
        type: novelData.type, // 'local' | 'online'
        filePath: novelData.filePath, // 本地文件路径
        url: novelData.url, // 在线地址
        chapters: novelData.chapters || [],
        totalChapters: novelData.chapters?.length || 0,
        currentChapter: 0,
        readProgress: 0, // 当前章节阅读进度 (0-1)
        totalProgress: 0, // 整本书阅读进度 (0-1)
        isFavorite: false,
        tags: novelData.tags || [],
        addTime: new Date().toISOString(),
        lastReadTime: null,
        readingTime: 0, // 总阅读时间（分钟）
        wordCount: novelData.wordCount || 0,
        fileSize: novelData.fileSize || 0,
        format: novelData.format || 'txt'
      }

      novels.value.unshift(novel)
      await saveLibrary()
      
      console.log('小说添加成功:', novel.title)
      return novel
    } catch (err) {
      error.value = '添加小说失败: ' + err.message
      console.error('添加小说失败:', err)
      throw err
    }
  }

  async function removeNovel(novelId) {
    try {
      const index = novels.value.findIndex(n => n.id === novelId)
      if (index > -1) {
        const novel = novels.value[index]
        novels.value.splice(index, 1)
        
        // 如果是当前小说，清除选择
        if (currentNovel.value?.id === novelId) {
          currentNovel.value = null
        }
        
        // 删除相关的阅读进度和缓存
        await storageUtils.removeItem(`novel_progress_${novelId}`)
        await storageUtils.removeItem(`novel_content_${novelId}`)
        
        await saveLibrary()
        console.log('小说删除成功:', novel.title)
      }
    } catch (err) {
      error.value = '删除小说失败: ' + err.message
      console.error('删除小说失败:', err)
      throw err
    }
  }

  async function updateNovel(novelId, updates) {
    try {
      const novel = novels.value.find(n => n.id === novelId)
      if (novel) {
        Object.assign(novel, updates)
        await saveLibrary()
        console.log('小说更新成功:', novel.title)
      }
    } catch (err) {
      error.value = '更新小说失败: ' + err.message
      console.error('更新小说失败:', err)
      throw err
    }
  }

  async function toggleFavorite(novelId) {
    const novel = novels.value.find(n => n.id === novelId)
    if (novel) {
      novel.isFavorite = !novel.isFavorite
      await saveLibrary()
    }
  }

  function selectNovel(novel) {
    currentNovel.value = novel
    console.log('选中小说:', novel.title)
  }

  function clearSelection() {
    currentNovel.value = null
  }

  async function updateReadingProgress(novelId, chapterIndex, progress, readingTime = 0) {
    try {
      const novel = novels.value.find(n => n.id === novelId)
      if (novel) {
        novel.currentChapter = chapterIndex
        novel.readProgress = progress
        novel.lastReadTime = new Date().toISOString()
        novel.readingTime += readingTime
        
        // 计算总进度
        if (novel.totalChapters > 0) {
          novel.totalProgress = (chapterIndex + progress) / novel.totalChapters
        }
        
        await saveLibrary()
        
        // 保存详细的阅读进度
        await storageUtils.setItem(`novel_progress_${novelId}`, {
          chapterIndex,
          progress,
          lastReadTime: novel.lastReadTime,
          readingTime: novel.readingTime
        })
      }
    } catch (err) {
      console.error('更新阅读进度失败:', err)
    }
  }

  async function saveLibrary() {
    try {
      await storageUtils.setItem('novels', novels.value)
    } catch (err) {
      console.error('保存小说库失败:', err)
      throw err
    }
  }

  function setSearchQuery(query) {
    searchQuery.value = query
  }

  function setSortBy(sort) {
    sortBy.value = sort
  }

  function setFilterBy(filter) {
    filterBy.value = filter
  }

  function clearError() {
    error.value = null
  }

  return {
    // 状态
    novels,
    currentNovel,
    loading,
    error,
    searchQuery,
    sortBy,
    filterBy,
    
    // 计算属性
    filteredNovels,
    novelCount,
    favoriteCount,
    localCount,
    onlineCount,
    
    // 动作
    loadLibrary,
    addNovel,
    removeNovel,
    updateNovel,
    toggleFavorite,
    selectNovel,
    clearSelection,
    updateReadingProgress,
    saveLibrary,
    setSearchQuery,
    setSortBy,
    setFilterBy,
    clearError
  }
})