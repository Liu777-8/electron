<template>
  <div class="novel-reader">
    <!-- 阅读器主界面 -->
    <div class="reader-container" :class="{ 'fullscreen': isFullscreen }">
      <!-- 工具栏 -->
      <ReaderToolbar
        v-if="!isFullscreen || showToolbar"
        :current-chapter="currentChapter"
        :total-chapters="totalChapters"
        :reading-progress="readingProgress"
        @toggle-sidebar="toggleSidebar"
        @toggle-fullscreen="toggleFullscreen"
        @prev-chapter="prevChapter"
        @next-chapter="nextChapter"
        @toggle-settings="toggleSettings"
      />

      <div class="reader-main">
        <!-- 侧边栏 -->
        <ReaderSidebar
          v-if="showSidebar && !isFullscreen"
          :chapters="chapters"
          :current-chapter="currentChapter"
          @select-chapter="selectChapter"
          @close="closeSidebar"
        />

        <!-- 阅读窗口 -->
        <ReaderWindow
          :content="currentContent"
          :settings="readerSettings"
          :loading="isLoading"
          @scroll="handleScroll"
          @click="handleReaderClick"
        />
      </div>
    </div>

    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettings"
      @close="closeSettings"
    />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import ReaderWindow from './reader/ReaderWindow.vue'
import ReaderToolbar from './reader/ReaderToolbar.vue'
import ReaderSidebar from './reader/ReaderSidebar.vue'
import SettingsPanel from '../views/SettingsPanel.vue'
import { useNovelStore } from '../store/novelStore'
import { useSettingsStore } from '../store/settingsStore'

export default {
  name: 'NovelReader',
  components: {
    ReaderWindow,
    ReaderToolbar,
    ReaderSidebar,
    SettingsPanel
  },
  props: {
    novelId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const novelStore = useNovelStore()
    const settingsStore = useSettingsStore()

    // 响应式数据
    const isLoading = ref(false)
    const showSidebar = ref(false)
    const showSettings = ref(false)
    const isFullscreen = ref(false)
    const showToolbar = ref(true)
    const currentChapter = ref(0)
    const readingProgress = ref(0)

    // 小说数据
    const novel = ref(null)
    const chapters = ref([])
    const currentContent = ref('')

    // 阅读器设置
    const readerSettings = computed(() => settingsStore.readerSettings)

    // 计算属性
    const totalChapters = computed(() => chapters.value.length)

    // 方法
    const loadNovel = async () => {
      try {
        isLoading.value = true
        novel.value = await novelStore.getNovel(props.novelId)
        chapters.value = novel.value?.chapters || []
        if (chapters.value.length > 0) {
          await loadChapter(0)
        }
      } catch (error) {
        console.error('加载小说失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const loadChapter = async (chapterIndex) => {
      try {
        isLoading.value = true
        currentChapter.value = chapterIndex
        const chapter = chapters.value[chapterIndex]
        if (chapter) {
          currentContent.value = chapter.content || ''
          // 更新阅读进度
          await novelStore.updateReadingProgress(props.novelId, chapterIndex)
        }
      } catch (error) {
        console.error('加载章节失败:', error)
      } finally {
        isLoading.value = false
      }
    }

    const selectChapter = (chapterIndex) => {
      loadChapter(chapterIndex)
      closeSidebar()
    }

    const prevChapter = () => {
      if (currentChapter.value > 0) {
        loadChapter(currentChapter.value - 1)
      }
    }

    const nextChapter = () => {
      if (currentChapter.value < totalChapters.value - 1) {
        loadChapter(currentChapter.value + 1)
      }
    }

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
    }

    const closeSidebar = () => {
      showSidebar.value = false
    }

    const toggleSettings = () => {
      showSettings.value = !showSettings.value
    }

    const closeSettings = () => {
      showSettings.value = false
    }

    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value
      if (isFullscreen.value) {
        document.documentElement.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    }

    const handleScroll = (progress) => {
      readingProgress.value = progress
    }

    const handleReaderClick = (event) => {
      if (isFullscreen.value) {
        // 全屏模式下点击切换工具栏显示
        showToolbar.value = !showToolbar.value
        // 3秒后自动隐藏工具栏
        if (showToolbar.value) {
          setTimeout(() => {
            showToolbar.value = false
          }, 3000)
        }
      }
    }

    // 键盘快捷键
    const handleKeydown = (event) => {
      switch (event.key) {
        case 'ArrowLeft':
          prevChapter()
          break
        case 'ArrowRight':
          nextChapter()
          break
        case 'F11':
          event.preventDefault()
          toggleFullscreen()
          break
        case 'Escape':
          if (isFullscreen.value) {
            toggleFullscreen()
          }
          break
      }
    }

    // 生命周期
    onMounted(() => {
      loadNovel()
      document.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      // 响应式数据
      isLoading,
      showSidebar,
      showSettings,
      isFullscreen,
      showToolbar,
      currentChapter,
      readingProgress,
      novel,
      chapters,
      currentContent,
      readerSettings,
      totalChapters,
      // 方法
      selectChapter,
      prevChapter,
      nextChapter,
      toggleSidebar,
      closeSidebar,
      toggleSettings,
      closeSettings,
      toggleFullscreen,
      handleScroll,
      handleReaderClick
    }
  }
}
</script>

<style scoped>
.novel-reader {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #333333);
}

.reader-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: var(--bg-color, #ffffff);
}

.reader-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-main {
    flex-direction: column;
  }
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .novel-reader {
    --bg-color: #1a1a1a;
    --text-color: #e0e0e0;
  }
}
</style>