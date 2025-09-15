<template>
  <div class="reader-window" :class="readerClasses">
    <!-- 阅读器头部 -->
    <div class="reader-header" :class="{ 'reader-header--hidden': !showControls }">
      <div class="header-left">
        <el-button
          type="text"
          :icon="ArrowLeft"
          @click="handleBack"
        >
          返回
        </el-button>
        
        <div class="novel-info">
          <span class="novel-title">{{ currentNovel?.title || '未知小说' }}</span>
          <span v-if="currentChapter" class="chapter-title">
            - {{ currentChapter.title }}
          </span>
        </div>
      </div>
      
      <div class="header-center">
        <div class="reading-progress">
          <span class="progress-text">
            {{ readingProgressText }}
          </span>
          <el-progress
            :percentage="readingProgress"
            :show-text="false"
            :stroke-width="4"
            class="progress-bar"
          />
        </div>
      </div>
      
      <div class="header-right">
        <el-button
          type="text"
          :icon="List"
          @click="toggleChapterList"
        >
          目录
        </el-button>
        
        <el-button
          type="text"
          :icon="Bookmark"
          @click="toggleBookmarks"
        >
          书签
        </el-button>
        
        <el-button
          type="text"
          :icon="Setting"
          @click="toggleSettings"
        >
          设置
        </el-button>
        
        <el-dropdown trigger="click">
          <el-button type="text" :icon="More" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="toggleFullscreen">
                <el-icon><FullScreen /></el-icon>
                {{ isFullscreen ? '退出全屏' : '全屏阅读' }}
              </el-dropdown-item>
              <el-dropdown-item @click="toggleStealth">
                <el-icon><View /></el-icon>
                {{ stealthMode ? '退出摸鱼' : '摸鱼模式' }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="closeReader">
                <el-icon><Close /></el-icon>
                关闭阅读器
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 阅读内容区域 -->
    <div class="reader-content" @click="handleContentClick">
      <!-- 章节导航按钮 -->
      <div class="nav-buttons">
        <el-button
          v-if="canGoPrevChapter"
          class="nav-button nav-button--prev"
          :class="{ 'nav-button--visible': showNavButtons }"
          type="primary"
          :icon="ArrowLeft"
          @click="gotoPrevChapter"
        >
          上一章
        </el-button>
        
        <el-button
          v-if="canGoNextChapter"
          class="nav-button nav-button--next"
          :class="{ 'nav-button--visible': showNavButtons }"
          type="primary"
          :icon="ArrowRight"
          @click="gotoNextChapter"
        >
          下一章
        </el-button>
      </div>
      
      <!-- 阅读文本 -->
      <div
        ref="contentRef"
        class="reading-text"
        :style="contentStyles"
        @scroll="handleScroll"
      >
        <div v-if="loading" class="content-loading">
          <el-skeleton :rows="10" animated />
        </div>
        
        <div v-else-if="error" class="content-error">
          <el-result
            icon="error"
            title="加载失败"
            :sub-title="error"
          >
            <template #extra>
              <el-button type="primary" @click="reloadChapter">
                重新加载
              </el-button>
            </template>
          </el-result>
        </div>
        
        <div v-else-if="chapterContent" class="content-text">
          <!-- 章节标题 -->
          <h1 v-if="currentChapter?.title" class="chapter-title">
            {{ currentChapter.title }}
          </h1>
          
          <!-- 章节内容 -->
          <div
            v-for="(paragraph, index) in contentParagraphs"
            :key="index"
            class="content-paragraph"
            :class="{
              'content-paragraph--highlighted': paragraph.highlighted,
              'content-paragraph--bookmarked': paragraph.bookmarked
            }"
            @mouseup="handleTextSelection($event, index)"
            @contextmenu="handleContextMenu($event, index)"
          >
            {{ paragraph.text }}
          </div>
          
          <!-- 章节结束 -->
          <div class="chapter-end">
            <el-divider>
              <span class="end-text">本章结束</span>
            </el-divider>
            
            <div class="chapter-actions">
              <el-button
                v-if="canGoPrevChapter"
                :icon="ArrowLeft"
                @click="gotoPrevChapter"
              >
                上一章
              </el-button>
              
              <el-button
                v-if="canGoNextChapter"
                type="primary"
                :icon="ArrowRight"
                @click="gotoNextChapter"
              >
                下一章
              </el-button>
            </div>
          </div>
        </div>
        
        <div v-else class="content-empty">
          <el-empty description="暂无内容" />
        </div>
      </div>
    </div>
    
    <!-- 侧边栏 -->
    <div class="reader-sidebar" :class="{ 'reader-sidebar--visible': showSidebar }">
      <!-- 章节列表 -->
      <div v-if="sidebarType === 'chapters'" class="sidebar-content">
        <div class="sidebar-header">
          <h3>章节目录</h3>
          <el-button type="text" :icon="Close" @click="closeSidebar" />
        </div>
        
        <div class="chapters-list">
          <div
            v-for="(chapter, index) in chapters"
            :key="chapter.id || index"
            class="chapter-item"
            :class="{
              'chapter-item--current': currentChapterIndex === index,
              'chapter-item--read': chapter.isRead
            }"
            @click="gotoChapter(index)"
          >
            <div class="chapter-info">
              <div class="chapter-title">{{ chapter.title }}</div>
              <div class="chapter-meta">
                <span class="chapter-index">第 {{ index + 1 }} 章</span>
                <span v-if="chapter.wordCount" class="chapter-words">
                  {{ chapter.wordCount }} 字
                </span>
              </div>
            </div>
            
            <div class="chapter-status">
              <el-icon v-if="currentChapterIndex === index" class="current-icon">
                <Reading />
              </el-icon>
              <el-icon v-else-if="chapter.isRead" class="read-icon">
                <Check />
              </el-icon>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 书签列表 -->
      <div v-else-if="sidebarType === 'bookmarks'" class="sidebar-content">
        <div class="sidebar-header">
          <h3>书签笔记</h3>
          <el-button type="text" :icon="Close" @click="closeSidebar" />
        </div>
        
        <div class="bookmarks-list">
          <div
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="bookmark-item"
            @click="gotoBookmark(bookmark)"
          >
            <div class="bookmark-content">
              <div class="bookmark-text">{{ bookmark.text }}</div>
              <div class="bookmark-note" v-if="bookmark.note">
                {{ bookmark.note }}
              </div>
            </div>
            
            <div class="bookmark-meta">
              <span class="bookmark-chapter">{{ bookmark.chapterTitle }}</span>
              <span class="bookmark-time">{{ formatTime(bookmark.createTime) }}</span>
            </div>
            
            <div class="bookmark-actions">
              <el-button
                type="text"
                size="small"
                :icon="Edit"
                @click.stop="editBookmark(bookmark)"
              />
              <el-button
                type="text"
                size="small"
                :icon="Delete"
                @click.stop="deleteBookmark(bookmark)"
              />
            </div>
          </div>
          
          <div v-if="bookmarks.length === 0" class="empty-bookmarks">
            <el-empty description="暂无书签" />
          </div>
        </div>
      </div>
      
      <!-- 阅读设置 -->
      <div v-else-if="sidebarType === 'settings'" class="sidebar-content">
        <div class="sidebar-header">
          <h3>阅读设置</h3>
          <el-button type="text" :icon="Close" @click="closeSidebar" />
        </div>
        
        <ReaderSettings @settings-change="handleSettingsChange" />
      </div>
    </div>
    
    <!-- 遮罩层 -->
    <div
      v-if="showSidebar"
      class="sidebar-overlay"
      @click="closeSidebar"
    />
    
    <!-- 右键菜单 -->
    <ContextMenu
      v-model="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      :items="contextMenuItems"
      @select="handleContextMenuSelect"
    />
    
    <!-- 文本选择工具栏 -->
    <TextSelectionToolbar
      v-model="showSelectionToolbar"
      :x="selectionToolbarX"
      :y="selectionToolbarY"
      :selected-text="selectedText"
      @highlight="handleHighlight"
      @bookmark="handleBookmark"
      @note="handleNote"
      @copy="handleCopy"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  List,
  Bookmark,
  Setting,
  More,
  FullScreen,
  View,
  Close,
  Reading,
  Check,
  Edit,
  Delete
} from '@element-plus/icons-vue'
import { useReaderStore } from '../../stores/reader.js'
import { useSettingsStore } from '../../stores/settings.js'
import { useStealthStore } from '../../stores/stealth.js'
import { services } from '../../services/index.js'
import { commonUtils } from '../../utils/index.js'
import ReaderSettings from './ReaderSettings.vue'
import ContextMenu from './ContextMenu.vue'
import TextSelectionToolbar from './TextSelectionToolbar.vue'

// Props
const props = defineProps({
  novelId: {
    type: String,
    required: true
  },
  chapterIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits([
  'close',
  'chapter-change',
  'progress-update'
])

// 路由
const router = useRouter()

// 状态管理
const readerStore = useReaderStore()
const settingsStore = useSettingsStore()
const stealthStore = useStealthStore()

// 响应式数据
const contentRef = ref(null)
const loading = ref(false)
const error = ref('')
const showControls = ref(true)
const showSidebar = ref(false)
const showNavButtons = ref(false)
const sidebarType = ref('chapters') // chapters, bookmarks, settings
const isFullscreen = ref(false)

// 右键菜单
const showContextMenu = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuParagraphIndex = ref(-1)

// 文本选择
const showSelectionToolbar = ref(false)
const selectionToolbarX = ref(0)
const selectionToolbarY = ref(0)
const selectedText = ref('')
const selectedParagraphIndex = ref(-1)

// 控制显示/隐藏的定时器
let controlsTimer = null
let navButtonsTimer = null

// 计算属性
const currentNovel = computed(() => readerStore.currentNovel)
const currentChapter = computed(() => readerStore.currentChapter)
const currentChapterIndex = computed(() => readerStore.currentChapterIndex)
const chapterContent = computed(() => readerStore.chapterContent)
const chapters = computed(() => readerStore.chapters)
const bookmarks = computed(() => readerStore.bookmarks)
const readingProgress = computed(() => readerStore.readingProgress)
const stealthMode = computed(() => stealthStore.isStealthMode)

const canGoPrevChapter = computed(() => currentChapterIndex.value > 0)
const canGoNextChapter = computed(() => {
  return currentChapterIndex.value < chapters.value.length - 1
})

const readingProgressText = computed(() => {
  if (!currentChapter.value) return ''
  
  const current = currentChapterIndex.value + 1
  const total = chapters.value.length
  return `${current}/${total} (${readingProgress.value}%)`
})

const contentParagraphs = computed(() => {
  if (!chapterContent.value) return []
  
  return chapterContent.value.split('\n')
    .filter(p => p.trim())
    .map((text, index) => ({
      text: text.trim(),
      highlighted: false, // TODO: 从store获取高亮状态
      bookmarked: false   // TODO: 从store获取书签状态
    }))
})

const readerClasses = computed(() => {
  return {
    'reader-window--fullscreen': isFullscreen.value,
    'reader-window--stealth': stealthMode.value,
    'reader-window--controls-hidden': !showControls.value
  }
})

const contentStyles = computed(() => {
  const settings = settingsStore.reader
  
  return {
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    fontFamily: settings.fontFamily,
    color: settings.textColor,
    backgroundColor: settings.backgroundColor,
    padding: `${settings.padding}px`,
    textAlign: settings.textAlign,
    letterSpacing: `${settings.letterSpacing}px`,
    wordSpacing: `${settings.wordSpacing}px`
  }
})

const contextMenuItems = computed(() => {
  return [
    { label: '添加书签', icon: 'Bookmark', action: 'bookmark' },
    { label: '高亮文本', icon: 'Brush', action: 'highlight' },
    { label: '添加笔记', icon: 'EditPen', action: 'note' },
    { type: 'divider' },
    { label: '复制文本', icon: 'CopyDocument', action: 'copy' }
  ]
})

// 方法
const loadChapter = async (chapterIndex) => {
  try {
    loading.value = true
    error.value = ''
    
    await readerStore.loadChapter(props.novelId, chapterIndex)
    
    // 滚动到顶部
    if (contentRef.value) {
      contentRef.value.scrollTop = 0
    }
    
    emit('chapter-change', chapterIndex)
    
  } catch (err) {
    console.error('加载章节失败:', err)
    error.value = err.message || '加载章节失败'
  } finally {
    loading.value = false
  }
}

const reloadChapter = () => {
  loadChapter(currentChapterIndex.value)
}

const gotoChapter = (chapterIndex) => {
  if (chapterIndex >= 0 && chapterIndex < chapters.value.length) {
    loadChapter(chapterIndex)
    closeSidebar()
  }
}

const gotoPrevChapter = () => {
  if (canGoPrevChapter.value) {
    gotoChapter(currentChapterIndex.value - 1)
  }
}

const gotoNextChapter = () => {
  if (canGoNextChapter.value) {
    gotoChapter(currentChapterIndex.value + 1)
  }
}

const gotoBookmark = (bookmark) => {
  // 跳转到书签位置
  gotoChapter(bookmark.chapterIndex)
  
  // TODO: 滚动到具体位置
  nextTick(() => {
    // 实现滚动到书签位置的逻辑
  })
  
  closeSidebar()
}

const handleBack = () => {
  emit('close')
}

const closeReader = () => {
  emit('close')
}

const toggleChapterList = () => {
  if (showSidebar.value && sidebarType.value === 'chapters') {
    closeSidebar()
  } else {
    sidebarType.value = 'chapters'
    showSidebar.value = true
  }
}

const toggleBookmarks = () => {
  if (showSidebar.value && sidebarType.value === 'bookmarks') {
    closeSidebar()
  } else {
    sidebarType.value = 'bookmarks'
    showSidebar.value = true
  }
}

const toggleSettings = () => {
  if (showSidebar.value && sidebarType.value === 'settings') {
    closeSidebar()
  } else {
    sidebarType.value = 'settings'
    showSidebar.value = true
  }
}

const closeSidebar = () => {
  showSidebar.value = false
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const toggleStealth = () => {
  stealthStore.toggleStealthMode()
}

const handleContentClick = () => {
  // 点击内容区域时的处理
  showControls.value = !showControls.value
  
  // 重置控制栏自动隐藏定时器
  resetControlsTimer()
}

const handleScroll = (event) => {
  const element = event.target
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
  // 计算阅读进度
  const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
  readerStore.updateReadingProgress(progress)
  
  emit('progress-update', progress)
  
  // 显示导航按钮
  showNavButtons.value = true
  resetNavButtonsTimer()
  
  // 自动保存阅读位置
  readerStore.saveReadingPosition({
    chapterIndex: currentChapterIndex.value,
    scrollTop,
    progress
  })
}

const handleTextSelection = (event, paragraphIndex) => {
  const selection = window.getSelection()
  const text = selection.toString().trim()
  
  if (text) {
    selectedText.value = text
    selectedParagraphIndex.value = paragraphIndex
    
    // 显示选择工具栏
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    selectionToolbarX.value = rect.left + rect.width / 2
    selectionToolbarY.value = rect.top - 10
    showSelectionToolbar.value = true
  } else {
    showSelectionToolbar.value = false
  }
}

const handleContextMenu = (event, paragraphIndex) => {
  event.preventDefault()
  
  contextMenuParagraphIndex.value = paragraphIndex
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  showContextMenu.value = true
}

const handleContextMenuSelect = (action) => {
  const paragraphIndex = contextMenuParagraphIndex.value
  const paragraph = contentParagraphs.value[paragraphIndex]
  
  if (!paragraph) return
  
  switch (action) {
    case 'bookmark':
      handleBookmark(paragraph.text, paragraphIndex)
      break
    case 'highlight':
      handleHighlight(paragraph.text, paragraphIndex)
      break
    case 'note':
      handleNote(paragraph.text, paragraphIndex)
      break
    case 'copy':
      handleCopy(paragraph.text)
      break
  }
  
  showContextMenu.value = false
}

const handleHighlight = async (text, paragraphIndex) => {
  try {
    await readerStore.addHighlight({
      novelId: props.novelId,
      chapterIndex: currentChapterIndex.value,
      paragraphIndex,
      text,
      color: '#ffeb3b' // 默认黄色高亮
    })
    
    ElMessage.success('已添加高亮')
  } catch (err) {
    console.error('添加高亮失败:', err)
    ElMessage.error('添加高亮失败')
  }
}

const handleBookmark = async (text, paragraphIndex) => {
  try {
    await readerStore.addBookmark({
      novelId: props.novelId,
      chapterIndex: currentChapterIndex.value,
      chapterTitle: currentChapter.value?.title || '',
      paragraphIndex,
      text: text.substring(0, 100), // 限制长度
      note: ''
    })
    
    ElMessage.success('已添加书签')
  } catch (err) {
    console.error('添加书签失败:', err)
    ElMessage.error('添加书签失败')
  }
}

const handleNote = async (text, paragraphIndex) => {
  try {
    const { value: note } = await ElMessageBox.prompt(
      '请输入笔记内容',
      '添加笔记',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '在此输入笔记内容...'
      }
    )
    
    if (note) {
      await readerStore.addNote({
        novelId: props.novelId,
        chapterIndex: currentChapterIndex.value,
        chapterTitle: currentChapter.value?.title || '',
        paragraphIndex,
        text: text.substring(0, 100),
        note
      })
      
      ElMessage.success('已添加笔记')
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('添加笔记失败:', err)
      ElMessage.error('添加笔记失败')
    }
  }
}

const handleCopy = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

const editBookmark = (bookmark) => {
  // TODO: 实现编辑书签功能
  ElMessage.info('编辑书签功能开发中...')
}

const deleteBookmark = async (bookmark) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个书签吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await readerStore.deleteBookmark(bookmark.id)
    ElMessage.success('已删除书签')
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除书签失败:', err)
      ElMessage.error('删除书签失败')
    }
  }
}

const handleSettingsChange = (settings) => {
  // 设置变更时的处理
  settingsStore.updateReaderSettings(settings)
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const resetControlsTimer = () => {
  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }
  
  controlsTimer = setTimeout(() => {
    showControls.value = false
  }, 3000) // 3秒后自动隐藏
}

const resetNavButtonsTimer = () => {
  if (navButtonsTimer) {
    clearTimeout(navButtonsTimer)
  }
  
  navButtonsTimer = setTimeout(() => {
    showNavButtons.value = false
  }, 2000) // 2秒后自动隐藏
}

// 键盘快捷键处理
const handleKeydown = (event) => {
  switch (event.key) {
    case 'ArrowLeft':
      if (event.ctrlKey) {
        gotoPrevChapter()
        event.preventDefault()
      }
      break
    case 'ArrowRight':
      if (event.ctrlKey) {
        gotoNextChapter()
        event.preventDefault()
      }
      break
    case 'Escape':
      if (showSidebar.value) {
        closeSidebar()
      } else if (isFullscreen.value) {
        toggleFullscreen()
      } else {
        handleBack()
      }
      event.preventDefault()
      break
    case 'F11':
      toggleFullscreen()
      event.preventDefault()
      break
    case 't':
    case 'T':
      if (event.ctrlKey) {
        toggleChapterList()
        event.preventDefault()
      }
      break
    case 'b':
    case 'B':
      if (event.ctrlKey) {
        toggleBookmarks()
        event.preventDefault()
      }
      break
    case 's':
    case 'S':
      if (event.ctrlKey) {
        toggleSettings()
        event.preventDefault()
      }
      break
  }
}

// 监听器
watch(() => props.chapterIndex, (newIndex) => {
  if (newIndex !== currentChapterIndex.value) {
    loadChapter(newIndex)
  }
})

// 生命周期
onMounted(async () => {
  try {
    // 初始化阅读器
    await readerStore.initReader(props.novelId)
    
    // 加载指定章节
    await loadChapter(props.chapterIndex)
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeydown)
    
    // 开始控制栏自动隐藏定时器
    resetControlsTimer()
    
  } catch (err) {
    console.error('初始化阅读器失败:', err)
    error.value = '初始化阅读器失败'
  }
})

onUnmounted(() => {
  // 清理定时器
  if (controlsTimer) {
    clearTimeout(controlsTimer)
  }
  if (navButtonsTimer) {
    clearTimeout(navButtonsTimer)
  }
  
  // 移除事件监听
  document.removeEventListener('keydown', handleKeydown)
  
  // 保存阅读状态
  readerStore.saveReadingState()
})
</script>

<style scoped>
.reader-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--el-bg-color);
  position: relative;
  overflow: hidden;
}

.reader-window--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.reader-window--stealth {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.reader-window--stealth:hover {
  opacity: 1;
}

.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background-color: var(--el-bg-color-page);
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: transform 0.3s ease;
  z-index: 100;
}

.reader-header--hidden {
  transform: translateY(-100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.novel-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.novel-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-title {
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-center {
  flex: 1;
  max-width: 300px;
  margin: 0 20px;
}

.reading-progress {
  text-align: center;
}

.progress-text {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
  display: block;
}

.progress-bar {
  width: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.reader-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.nav-buttons {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
  z-index: 10;
}

.nav-button {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
  pointer-events: auto;
}

.nav-button--visible {
  opacity: 0.8;
  transform: scale(1);
}

.nav-button:hover {
  opacity: 1;
  transform: scale(1.05);
}

.reading-text {
  height: 100%;
  overflow-y: auto;
  padding: 40px;
  scroll-behavior: smooth;
}

.content-loading,
.content-error,
.content-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.content-text {
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.8;
}

.chapter-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin: 0 0 40px 0;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--el-border-color-lighter);
}

.content-paragraph {
  margin-bottom: 16px;
  text-indent: 2em;
  cursor: text;
  user-select: text;
  transition: background-color 0.2s ease;
}

.content-paragraph:hover {
  background-color: var(--el-bg-color-page);
}

.content-paragraph--highlighted {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
  padding-left: 12px;
}

.content-paragraph--bookmarked {
  position: relative;
}

.content-paragraph--bookmarked::before {
  content: '🔖';
  position: absolute;
  left: -20px;
  top: 0;
}

.chapter-end {
  margin-top: 60px;
  text-align: center;
}

.end-text {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.chapter-actions {
  margin-top: 20px;
  display: flex;
  gap: 16px;
  justify-content: center;
}

.reader-sidebar {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background-color: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
  transition: right 0.3s ease;
  z-index: 200;
  overflow: hidden;
}

.reader-sidebar--visible {
  right: 0;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color-page);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.chapters-list,
.bookmarks-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.chapter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.chapter-item:hover {
  background-color: var(--el-bg-color-page);
}

.chapter-item--current {
  background-color: var(--el-color-primary-light-9);
  border-left: 3px solid var(--el-color-primary);
}

.chapter-item--read {
  opacity: 0.7;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-item .chapter-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.chapter-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.chapter-status {
  margin-left: 12px;
}

.current-icon {
  color: var(--el-color-primary);
}

.read-icon {
  color: var(--el-color-success);
}

.bookmark-item {
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.bookmark-item:hover {
  background-color: var(--el-bg-color-page);
}

.bookmark-content {
  margin-bottom: 8px;
}

.bookmark-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.bookmark-note {
  font-size: 12px;
  color: var(--el-text-color-regular);
  font-style: italic;
}

.bookmark-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 8px;
}

.bookmark-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.empty-bookmarks {
  padding: 40px 20px;
  text-align: center;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 150;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-header {
    padding: 8px 16px;
  }
  
  .header-center {
    max-width: 200px;
    margin: 0 12px;
  }
  
  .reading-text {
    padding: 20px 16px;
  }
  
  .reader-sidebar {
    width: 100vw;
    right: -100vw;
  }
  
  .nav-buttons {
    padding: 0 16px;
  }
  
  .content-text {
    max-width: none;
  }
}

/* 滚动条样式 */
.reading-text::-webkit-scrollbar,
.chapters-list::-webkit-scrollbar,
.bookmarks-list::-webkit-scrollbar {
  width: 6px;
}

.reading-text::-webkit-scrollbar-track,
.chapters-list::-webkit-scrollbar-track,
.bookmarks-list::-webkit-scrollbar-track {
  background: var(--el-bg-color-page);
}

.reading-text::-webkit-scrollbar-thumb,
.chapters-list::-webkit-scrollbar-thumb,
.bookmarks-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.reading-text::-webkit-scrollbar-thumb:hover,
.chapters-list::-webkit-scrollbar-thumb:hover,
.bookmarks-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>