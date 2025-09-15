<template>
  <div class="chapter-navigation" :class="{ 'compact': isCompact, 'dark': isDark }">
    <!-- 导航头部 -->
    <div class="nav-header">
      <div class="nav-title">
        <h3>章节导航</h3>
        <span class="chapter-count">共 {{ totalChapters }} 章</span>
      </div>
      
      <div class="nav-actions">
        <button 
          class="action-btn" 
          @click="toggleCompact" 
          :title="isCompact ? '展开视图' : '紧凑视图'"
        >
          <i :class="isCompact ? 'icon-expand' : 'icon-compact'"></i>
        </button>
        
        <button 
          class="action-btn" 
          @click="toggleSort" 
          :title="sortOrder === 'asc' ? '倒序排列' : '正序排列'"
        >
          <i :class="sortOrder === 'asc' ? 'icon-sort-desc' : 'icon-sort-asc'"></i>
        </button>
        
        <button 
          class="action-btn" 
          @click="showSearch = !showSearch" 
          :title="showSearch ? '隐藏搜索' : '显示搜索'"
        >
          <i class="icon-search"></i>
        </button>
      </div>
    </div>
    
    <!-- 搜索框 -->
    <div class="search-box" v-if="showSearch">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜索章节标题..."
        class="search-input"
        @input="handleSearch"
      >
      <button class="clear-search" @click="clearSearch" v-if="searchQuery">
        <i class="icon-close"></i>
      </button>
    </div>
    
    <!-- 阅读进度 -->
    <div class="reading-progress" v-if="currentNovel">
      <div class="progress-info">
        <span class="progress-text">
          阅读进度: {{ readingProgress.percentage }}%
        </span>
        <span class="progress-chapter">
          {{ readingProgress.currentChapter }}/{{ totalChapters }}
        </span>
      </div>
      
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: readingProgress.percentage + '%' }"
        ></div>
      </div>
      
      <div class="progress-actions">
        <button 
          class="progress-btn" 
          @click="jumpToLastRead" 
          :disabled="!readingProgress.lastReadChapter"
        >
          <i class="icon-bookmark"></i>
          跳转到上次阅读
        </button>
        
        <button 
          class="progress-btn" 
          @click="markAsRead" 
          :disabled="!currentChapter"
        >
          <i class="icon-check"></i>
          标记为已读
        </button>
      </div>
    </div>
    
    <!-- 章节列表 -->
    <div class="chapter-list" ref="chapterList">
      <div 
        class="chapter-item" 
        v-for="chapter in filteredChapters" 
        :key="chapter.id"
        :class="{
          'active': chapter.id === currentChapter?.id,
          'read': chapter.isRead,
          'reading': chapter.id === readingProgress.currentChapterId,
          'bookmarked': chapter.isBookmarked
        }"
        @click="selectChapter(chapter)"
        @contextmenu.prevent="showChapterMenu(chapter, $event)"
      >
        <!-- 章节状态图标 -->
        <div class="chapter-status">
          <i v-if="chapter.isBookmarked" class="icon-bookmark-filled"></i>
          <i v-else-if="chapter.isRead" class="icon-check-circle"></i>
          <i v-else-if="chapter.id === readingProgress.currentChapterId" class="icon-reading"></i>
          <i v-else class="icon-circle"></i>
        </div>
        
        <!-- 章节信息 -->
        <div class="chapter-info">
          <div class="chapter-title" :title="chapter.title">
            {{ chapter.title }}
          </div>
          
          <div class="chapter-meta" v-if="!isCompact">
            <span class="chapter-number">第 {{ chapter.number }} 章</span>
            <span class="chapter-words" v-if="chapter.wordCount">
              {{ formatWordCount(chapter.wordCount) }}
            </span>
            <span class="chapter-time" v-if="chapter.readTime">
              {{ formatReadTime(chapter.readTime) }}
            </span>
          </div>
          
          <!-- 阅读进度条 -->
          <div class="chapter-progress" v-if="chapter.readProgress > 0">
            <div 
              class="chapter-progress-fill" 
              :style="{ width: chapter.readProgress + '%' }"
            ></div>
          </div>
        </div>
        
        <!-- 章节操作 -->
        <div class="chapter-actions" v-if="!isCompact">
          <button 
            class="chapter-action-btn" 
            @click.stop="toggleBookmark(chapter)"
            :title="chapter.isBookmarked ? '取消书签' : '添加书签'"
          >
            <i :class="chapter.isBookmarked ? 'icon-bookmark-filled' : 'icon-bookmark'"></i>
          </button>
          
          <button 
            class="chapter-action-btn" 
            @click.stop="showChapterMenu(chapter, $event)"
            title="更多操作"
          >
            <i class="icon-more"></i>
          </button>
        </div>
      </div>
      
      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMoreChapters">
        <button class="load-more-btn" @click="loadMoreChapters" :disabled="isLoading">
          <i class="icon-loading" v-if="isLoading"></i>
          {{ isLoading ? '加载中...' : '加载更多章节' }}
        </button>
      </div>
      
      <!-- 空状态 -->
      <div class="empty-state" v-if="filteredChapters.length === 0 && !isLoading">
        <i class="icon-empty"></i>
        <p>{{ searchQuery ? '未找到匹配的章节' : '暂无章节' }}</p>
      </div>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      class="context-menu" 
      v-if="contextMenu.visible" 
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="jumpToChapter(contextMenu.chapter)">
        <i class="icon-play"></i>
        跳转阅读
      </div>
      
      <div class="menu-item" @click="toggleBookmark(contextMenu.chapter)">
        <i :class="contextMenu.chapter?.isBookmarked ? 'icon-bookmark-remove' : 'icon-bookmark-add'"></i>
        {{ contextMenu.chapter?.isBookmarked ? '取消书签' : '添加书签' }}
      </div>
      
      <div class="menu-item" @click="markChapterAsRead(contextMenu.chapter)">
        <i class="icon-check"></i>
        标记为已读
      </div>
      
      <div class="menu-item" @click="markChapterAsUnread(contextMenu.chapter)">
        <i class="icon-uncheck"></i>
        标记为未读
      </div>
      
      <div class="menu-divider"></div>
      
      <div class="menu-item" @click="downloadChapter(contextMenu.chapter)">
        <i class="icon-download"></i>
        下载章节
      </div>
      
      <div class="menu-item" @click="shareChapter(contextMenu.chapter)">
        <i class="icon-share"></i>
        分享章节
      </div>
    </div>
    
    <!-- 快速跳转 -->
    <div class="quick-jump" v-if="showQuickJump">
      <div class="jump-input">
        <input 
          type="number" 
          v-model="jumpChapterNumber" 
          placeholder="章节号"
          min="1" 
          :max="totalChapters"
          @keyup.enter="quickJumpToChapter"
        >
        <button @click="quickJumpToChapter">跳转</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useNovelStore } from '../../stores/novel.js'
import { useReaderStore } from '../../stores/reader.js'

export default {
  name: 'ChapterNavigation',
  props: {
    novelId: {
      type: String,
      required: true
    },
    currentChapter: {
      type: Object,
      default: null
    },
    isDark: {
      type: Boolean,
      default: false
    }
  },
  emits: ['chapter-select', 'chapter-change', 'progress-update'],
  setup(props, { emit }) {
    const novelStore = useNovelStore()
    const progressStore = useReadingProgressStore()
    
    // 响应式数据
    const isCompact = ref(false)
    const showSearch = ref(false)
    const searchQuery = ref('')
    const sortOrder = ref('asc')
    const isLoading = ref(false)
    const hasMoreChapters = ref(false)
    const showQuickJump = ref(false)
    const jumpChapterNumber = ref('')
    
    // 章节列表
    const chapters = ref([])
    const chapterList = ref(null)
    
    // 右键菜单
    const contextMenu = ref({
      visible: false,
      x: 0,
      y: 0,
      chapter: null
    })
    
    // 计算属性
    const currentNovel = computed(() => {
      return novelStore.getNovelById(props.novelId)
    })
    
    const totalChapters = computed(() => {
      return chapters.value.length
    })
    
    const readingProgress = computed(() => {
      return progressStore.getProgress(props.novelId) || {
        percentage: 0,
        currentChapter: 0,
        currentChapterId: null,
        lastReadChapter: null
      }
    })
    
    const filteredChapters = computed(() => {
      let filtered = [...chapters.value]
      
      // 搜索过滤
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(chapter => 
          chapter.title.toLowerCase().includes(query) ||
          chapter.number.toString().includes(query)
        )
      }
      
      // 排序
      filtered.sort((a, b) => {
        const order = sortOrder.value === 'asc' ? 1 : -1
        return (a.number - b.number) * order
      })
      
      return filtered
    })
    
    // 方法
    const loadChapters = async () => {
      if (!props.novelId) return
      
      isLoading.value = true
      try {
        const novelChapters = await novelStore.getChapters(props.novelId)
        chapters.value = novelChapters.map(chapter => ({
          ...chapter,
          isRead: progressStore.isChapterRead(props.novelId, chapter.id),
          isBookmarked: progressStore.isChapterBookmarked(props.novelId, chapter.id),
          readProgress: progressStore.getChapterProgress(props.novelId, chapter.id)
        }))
        
        hasMoreChapters.value = novelChapters.length < currentNovel.value?.totalChapters
      } catch (error) {
        console.error('加载章节失败:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const loadMoreChapters = async () => {
      if (isLoading.value || !hasMoreChapters.value) return
      
      isLoading.value = true
      try {
        const offset = chapters.value.length
        const moreChapters = await novelStore.getChapters(props.novelId, { offset, limit: 50 })
        
        const processedChapters = moreChapters.map(chapter => ({
          ...chapter,
          isRead: progressStore.isChapterRead(props.novelId, chapter.id),
          isBookmarked: progressStore.isChapterBookmarked(props.novelId, chapter.id),
          readProgress: progressStore.getChapterProgress(props.novelId, chapter.id)
        }))
        
        chapters.value.push(...processedChapters)
        hasMoreChapters.value = chapters.value.length < currentNovel.value?.totalChapters
      } catch (error) {
        console.error('加载更多章节失败:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const selectChapter = (chapter) => {
      emit('chapter-select', chapter)
    }
    
    const jumpToChapter = (chapter) => {
      emit('chapter-change', chapter)
      hideContextMenu()
    }
    
    const jumpToLastRead = () => {
      const lastReadChapter = readingProgress.value.lastReadChapter
      if (lastReadChapter) {
        const chapter = chapters.value.find(c => c.id === lastReadChapter)
        if (chapter) {
          jumpToChapter(chapter)
        }
      }
    }
    
    const quickJumpToChapter = () => {
      const chapterNumber = parseInt(jumpChapterNumber.value)
      if (chapterNumber >= 1 && chapterNumber <= totalChapters.value) {
        const chapter = chapters.value.find(c => c.number === chapterNumber)
        if (chapter) {
          jumpToChapter(chapter)
          jumpChapterNumber.value = ''
        }
      }
    }
    
    const toggleBookmark = async (chapter) => {
      try {
        if (chapter.isBookmarked) {
          await progressStore.removeBookmark(props.novelId, chapter.id)
        } else {
          await progressStore.addBookmark(props.novelId, chapter.id)
        }
        
        chapter.isBookmarked = !chapter.isBookmarked
        hideContextMenu()
      } catch (error) {
        console.error('书签操作失败:', error)
      }
    }
    
    const markAsRead = async () => {
      if (!props.currentChapter) return
      
      try {
        await progressStore.markChapterAsRead(props.novelId, props.currentChapter.id)
        const chapter = chapters.value.find(c => c.id === props.currentChapter.id)
        if (chapter) {
          chapter.isRead = true
        }
        emit('progress-update')
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }
    
    const markChapterAsRead = async (chapter) => {
      try {
        await progressStore.markChapterAsRead(props.novelId, chapter.id)
        chapter.isRead = true
        hideContextMenu()
        emit('progress-update')
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }
    
    const markChapterAsUnread = async (chapter) => {
      try {
        await progressStore.markChapterAsUnread(props.novelId, chapter.id)
        chapter.isRead = false
        hideContextMenu()
        emit('progress-update')
      } catch (error) {
        console.error('标记未读失败:', error)
      }
    }
    
    const downloadChapter = async (chapter) => {
      try {
        await novelStore.downloadChapter(props.novelId, chapter.id)
        hideContextMenu()
      } catch (error) {
        console.error('下载章节失败:', error)
      }
    }
    
    const shareChapter = (chapter) => {
      const shareData = {
        title: chapter.title,
        text: `《${currentNovel.value?.title}》- ${chapter.title}`,
        url: window.location.href
      }
      
      if (navigator.share) {
        navigator.share(shareData)
      } else {
        // 复制到剪贴板
        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
      }
      
      hideContextMenu()
    }
    
    const showChapterMenu = (chapter, event) => {
      contextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        chapter
      }
    }
    
    const hideContextMenu = () => {
      contextMenu.value.visible = false
    }
    
    const toggleCompact = () => {
      isCompact.value = !isCompact.value
    }
    
    const toggleSort = () => {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    }
    
    const handleSearch = () => {
      // 搜索防抖已在计算属性中处理
    }
    
    const clearSearch = () => {
      searchQuery.value = ''
    }
    
    const scrollToCurrentChapter = () => {
      if (!props.currentChapter || !chapterList.value) return
      
      nextTick(() => {
        const activeItem = chapterList.value.querySelector('.chapter-item.active')
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      })
    }
    
    const formatWordCount = (count) => {
      if (count >= 10000) {
        return `${(count / 10000).toFixed(1)}万字`
      }
      return `${count}字`
    }
    
    const formatReadTime = (minutes) => {
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}小时${mins}分钟`
      }
      return `${minutes}分钟`
    }
    
    // 键盘快捷键
    const handleKeydown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'f':
            event.preventDefault()
            showSearch.value = true
            nextTick(() => {
              const searchInput = document.querySelector('.search-input')
              if (searchInput) searchInput.focus()
            })
            break
          case 'g':
            event.preventDefault()
            showQuickJump.value = !showQuickJump.value
            break
        }
      } else {
        switch (event.key) {
          case 'Escape':
            hideContextMenu()
            showSearch.value = false
            showQuickJump.value = false
            break
        }
      }
    }
    
    // 监听器
    watch(() => props.novelId, (newId) => {
      if (newId) {
        loadChapters()
      }
    })
    
    watch(() => props.currentChapter, () => {
      scrollToCurrentChapter()
    })
    
    // 生命周期
    onMounted(() => {
      loadChapters()
      document.addEventListener('keydown', handleKeydown)
      document.addEventListener('click', hideContextMenu)
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
      document.removeEventListener('click', hideContextMenu)
    })
    
    return {
      // 响应式数据
      isCompact,
      showSearch,
      searchQuery,
      sortOrder,
      isLoading,
      hasMoreChapters,
      showQuickJump,
      jumpChapterNumber,
      chapters,
      chapterList,
      contextMenu,
      
      // 计算属性
      currentNovel,
      totalChapters,
      readingProgress,
      filteredChapters,
      
      // 方法
      loadMoreChapters,
      selectChapter,
      jumpToChapter,
      jumpToLastRead,
      quickJumpToChapter,
      toggleBookmark,
      markAsRead,
      markChapterAsRead,
      markChapterAsUnread,
      downloadChapter,
      shareChapter,
      showChapterMenu,
      hideContextMenu,
      toggleCompact,
      toggleSort,
      handleSearch,
      clearSearch,
      formatWordCount,
      formatReadTime
    }
  }
}
</script>

<style scoped>
.chapter-navigation {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
  border-radius: 8px;
  overflow: hidden;
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chapter-count {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.nav-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #007bff;
  color: #007bff;
}

.search-box {
  position: relative;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #007bff;
}

.clear-search {
  position: absolute;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reading-progress {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.progress-chapter {
  font-size: 12px;
  color: #666;
}

.progress-bar {
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #007bff, #0056b3);
  transition: width 0.3s ease;
}

.progress-actions {
  display: flex;
  gap: 8px;
}

.progress-btn {
  padding: 6px 12px;
  border: 1px solid #007bff;
  border-radius: 4px;
  background: white;
  color: #007bff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.progress-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.progress-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  background: white;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.chapter-item:hover {
  background: #f8f9fa;
  border-color: #e0e0e0;
}

.chapter-item.active {
  background: #e3f2fd;
  border-color: #007bff;
}

.chapter-item.read {
  opacity: 0.7;
}

.chapter-item.reading {
  background: #fff3cd;
  border-color: #ffc107;
}

.chapter-item.bookmarked {
  border-left: 4px solid #dc3545;
}

.chapter-status {
  margin-right: 12px;
  color: #666;
}

.chapter-status .icon-bookmark-filled {
  color: #dc3545;
}

.chapter-status .icon-check-circle {
  color: #28a745;
}

.chapter-status .icon-reading {
  color: #ffc107;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.chapter-progress {
  height: 2px;
  background: #e9ecef;
  border-radius: 1px;
  overflow: hidden;
}

.chapter-progress-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.chapter-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chapter-item:hover .chapter-actions {
  opacity: 1;
}

.chapter-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.chapter-action-btn:hover {
  background: #e9ecef;
  color: #333;
}

.load-more {
  padding: 16px;
  text-align: center;
}

.load-more-btn {
  padding: 8px 16px;
  border: 1px solid #007bff;
  border-radius: 6px;
  background: white;
  color: #007bff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.2s ease;
}

.load-more-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.load-more-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 160px;
  overflow: hidden;
}

.menu-item {
  padding: 8px 16px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s ease;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.quick-jump {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.jump-input {
  display: flex;
  gap: 8px;
}

.jump-input input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 80px;
  text-align: center;
}

.jump-input button {
  padding: 6px 12px;
  border: 1px solid #007bff;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

/* 紧凑模式 */
.compact .chapter-item {
  padding: 8px 12px;
}

.compact .chapter-title {
  font-size: 13px;
}

.compact .chapter-meta,
.compact .chapter-actions {
  display: none;
}

/* 图标 */
.icon-expand::before { content: '📖'; }
.icon-compact::before { content: '📋'; }
.icon-sort-asc::before { content: '🔼'; }
.icon-sort-desc::before { content: '🔽'; }
.icon-search::before { content: '🔍'; }
.icon-close::before { content: '✖️'; }
.icon-bookmark::before { content: '🔖'; }
.icon-bookmark-filled::before { content: '📌'; }
.icon-check::before { content: '✅'; }
.icon-check-circle::before { content: '✅'; }
.icon-reading::before { content: '👁️'; }
.icon-circle::before { content: '⚪'; }
.icon-more::before { content: '⋯'; }
.icon-loading::before { content: '⏳'; }
.icon-empty::before { content: '📄'; }
.icon-play::before { content: '▶️'; }
.icon-bookmark-add::before { content: '➕'; }
.icon-bookmark-remove::before { content: '➖'; }
.icon-uncheck::before { content: '❌'; }
.icon-download::before { content: '⬇️'; }
.icon-share::before { content: '📤'; }

/* 滚动条 */
.chapter-list::-webkit-scrollbar {
  width: 6px;
}

.chapter-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chapter-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chapter-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 暗色主题 */
.dark {
  background: #1a1a1a;
}

.dark .nav-header,
.dark .search-box,
.dark .reading-progress,
.dark .chapter-item,
.dark .context-menu,
.dark .quick-jump {
  background: #2a2a2a;
  border-color: #444;
}

.dark .nav-title h3,
.dark .chapter-title,
.dark .progress-text,
.dark .menu-item {
  color: #fff;
}

.dark .chapter-count,
.dark .progress-chapter,
.dark .chapter-meta,
.dark .chapter-status {
  color: #ccc;
}

.dark .search-input,
.dark .jump-input input {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark .action-btn,
.dark .progress-btn,
.dark .load-more-btn,
.dark .chapter-action-btn {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark .action-btn:hover,
.dark .chapter-action-btn:hover {
  background: #444;
}

.dark .progress-bar,
.dark .chapter-progress {
  background: #444;
}

.dark .chapter-item:hover {
  background: #333;
}

.dark .chapter-item.active {
  background: #1e3a5f;
  border-color: #007bff;
}

.dark .chapter-item.reading {
  background: #3d3a1e;
  border-color: #ffc107;
}

/* 响应式 */
@media (max-width: 768px) {
  .nav-header {
    padding: 12px 16px;
  }
  
  .search-box,
  .reading-progress {
    padding: 12px 16px;
  }
  
  .chapter-list {
    padding: 4px;
  }
  
  .chapter-item {
    padding: 10px 12px;
  }
  
  .chapter-actions {
    opacity: 1;
  }
  
  .context-menu {
    min-width: 140px;
  }
}
</style>