<template>
  <div class="reader-toolbar" :class="{ 'toolbar-hidden': !visible }">
    <!-- 顶部工具栏 -->
    <div class="toolbar-top">
      <!-- 左侧控制 -->
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="$emit('back')" title="返回">
          <i class="icon-arrow-left"></i>
        </button>
        <button class="toolbar-btn" @click="toggleSidebar" title="目录">
          <i class="icon-menu"></i>
        </button>
        <div class="novel-info">
          <span class="novel-title">{{ novelTitle }}</span>
          <span class="chapter-title">{{ chapterTitle }}</span>
        </div>
      </div>

      <!-- 右侧控制 -->
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="toggleBookmark" :class="{ active: isBookmarked }" title="书签">
          <i class="icon-bookmark"></i>
        </button>
        <button class="toolbar-btn" @click="showSettings = !showSettings" title="设置">
          <i class="icon-settings"></i>
        </button>
        <button class="toolbar-btn" @click="toggleFullscreen" title="全屏">
          <i class="icon-fullscreen"></i>
        </button>
        <button class="toolbar-btn" @click="$emit('minimize')" title="最小化">
          <i class="icon-minimize"></i>
        </button>
        <button class="toolbar-btn close-btn" @click="$emit('close')" title="关闭">
          <i class="icon-close"></i>
        </button>
      </div>
    </div>

    <!-- 底部工具栏 -->
    <div class="toolbar-bottom">
      <!-- 章节导航 -->
      <div class="chapter-nav">
        <button class="nav-btn" @click="$emit('prev-chapter')" :disabled="!hasPrevChapter" title="上一章">
          <i class="icon-chevron-left"></i>
          上一章
        </button>
        
        <div class="progress-container">
          <div class="progress-info">
            <span>{{ currentChapter }}/{{ totalChapters }}</span>
            <span>{{ readingProgress }}%</span>
          </div>
          <div class="progress-bar" @click="onProgressClick">
            <div class="progress-fill" :style="{ width: readingProgress + '%' }"></div>
            <div class="progress-thumb" :style="{ left: readingProgress + '%' }"></div>
          </div>
        </div>

        <button class="nav-btn" @click="$emit('next-chapter')" :disabled="!hasNextChapter" title="下一章">
          下一章
          <i class="icon-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel" v-show="showSettings" @click.stop>
      <div class="settings-section">
        <h4>字体设置</h4>
        <div class="setting-item">
          <label>字体大小</label>
          <div class="font-size-controls">
            <button @click="decreaseFontSize">A-</button>
            <span>{{ fontSize }}px</span>
            <button @click="increaseFontSize">A+</button>
          </div>
        </div>
        <div class="setting-item">
          <label>字体类型</label>
          <select v-model="fontFamily" @change="updateFontFamily">
            <option value="system">系统默认</option>
            <option value="serif">宋体</option>
            <option value="sans-serif">微软雅黑</option>
            <option value="monospace">等宽字体</option>
          </select>
        </div>
        <div class="setting-item">
          <label>行间距</label>
          <input type="range" v-model="lineHeight" min="1.2" max="2.5" step="0.1" @input="updateLineHeight">
          <span>{{ lineHeight }}</span>
        </div>
      </div>

      <div class="settings-section">
        <h4>主题设置</h4>
        <div class="theme-options">
          <div class="theme-item" 
               v-for="theme in themes" 
               :key="theme.name"
               :class="{ active: currentTheme === theme.name }"
               @click="changeTheme(theme.name)">
            <div class="theme-preview" :style="{ backgroundColor: theme.bg, color: theme.color }"></div>
            <span>{{ theme.label }}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h4>阅读设置</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="autoScroll" @change="updateAutoScroll">
            自动滚动
          </label>
        </div>
        <div class="setting-item" v-if="autoScroll">
          <label>滚动速度</label>
          <input type="range" v-model="scrollSpeed" min="1" max="10" @input="updateScrollSpeed">
          <span>{{ scrollSpeed }}</span>
        </div>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="eyeProtection" @change="updateEyeProtection">
            护眼模式
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h4>摸鱼设置</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="stealthMode" @change="updateStealthMode">
            隐身模式
          </label>
        </div>
        <div class="setting-item">
          <label>透明度</label>
          <input type="range" v-model="opacity" min="0.1" max="1" step="0.1" @input="updateOpacity">
          <span>{{ Math.round(opacity * 100) }}%</span>
        </div>
        <div class="setting-item">
          <label>快速隐藏快捷键</label>
          <input type="text" v-model="hideHotkey" @keydown="recordHotkey" placeholder="按下快捷键">
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div class="settings-overlay" v-show="showSettings" @click="showSettings = false"></div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useReaderStore } from '../../stores/reader.js'
import { useSettingsStore } from '../../stores/settings.js'

export default {
  name: 'ReaderToolbar',
  props: {
    visible: {
      type: Boolean,
      default: true
    },
    novelTitle: {
      type: String,
      default: ''
    },
    chapterTitle: {
      type: String,
      default: ''
    },
    currentChapter: {
      type: Number,
      default: 1
    },
    totalChapters: {
      type: Number,
      default: 1
    },
    readingProgress: {
      type: Number,
      default: 0
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    hasPrevChapter: {
      type: Boolean,
      default: false
    },
    hasNextChapter: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'back',
    'minimize', 
    'close',
    'prev-chapter',
    'next-chapter',
    'toggle-sidebar',
    'toggle-bookmark',
    'progress-change',
    'settings-change'
  ],
  setup(props, { emit }) {
    const readerStore = useReaderStore()
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const showSettings = ref(false)
    const fontSize = ref(16)
    const fontFamily = ref('system')
    const lineHeight = ref(1.6)
    const currentTheme = ref('light')
    const autoScroll = ref(false)
    const scrollSpeed = ref(3)
    const eyeProtection = ref(false)
    const stealthMode = ref(false)
    const opacity = ref(1)
    const hideHotkey = ref('Ctrl+H')
    
    // 主题配置
    const themes = ref([
      { name: 'light', label: '日间', bg: '#ffffff', color: '#333333' },
      { name: 'dark', label: '夜间', bg: '#1a1a1a', color: '#e0e0e0' },
      { name: 'sepia', label: '护眼', bg: '#f7f3e9', color: '#5c4b37' },
      { name: 'green', label: '绿色', bg: '#cce8cc', color: '#2d5a2d' }
    ])
    
    // 计算属性
    const isFullscreen = computed(() => {
      return document.fullscreenElement !== null
    })
    
    // 方法
    const toggleSidebar = () => {
      emit('toggle-sidebar')
    }
    
    const toggleBookmark = () => {
      emit('toggle-bookmark')
    }
    
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
    
    const onProgressClick = (event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const percent = ((event.clientX - rect.left) / rect.width) * 100
      emit('progress-change', Math.max(0, Math.min(100, percent)))
    }
    
    // 字体设置
    const increaseFontSize = () => {
      if (fontSize.value < 24) {
        fontSize.value += 1
        updateFontSize()
      }
    }
    
    const decreaseFontSize = () => {
      if (fontSize.value > 12) {
        fontSize.value -= 1
        updateFontSize()
      }
    }
    
    const updateFontSize = () => {
      const settings = {
        fontSize: fontSize.value
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    const updateFontFamily = () => {
      const settings = {
        fontFamily: fontFamily.value
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    const updateLineHeight = () => {
      const settings = {
        lineHeight: lineHeight.value
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    // 主题设置
    const changeTheme = (themeName) => {
      currentTheme.value = themeName
      const settings = {
        theme: themeName
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    // 阅读设置
    const updateAutoScroll = () => {
      const settings = {
        autoScroll: autoScroll.value
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    const updateScrollSpeed = () => {
      const settings = {
        scrollSpeed: scrollSpeed.value
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    const updateEyeProtection = () => {
      const settings = {
        eyeProtection: eyeProtection.value
      }
      emit('settings-change', settings)
      settingsStore.updateReaderSettings(settings)
    }
    
    // 摸鱼设置
    const updateStealthMode = () => {
      const settings = {
        stealthMode: stealthMode.value
      }
      emit('settings-change', settings)
      settingsStore.updateStealthSettings(settings)
    }
    
    const updateOpacity = () => {
      const settings = {
        opacity: opacity.value
      }
      emit('settings-change', settings)
      settingsStore.updateStealthSettings(settings)
    }
    
    const recordHotkey = (event) => {
      event.preventDefault()
      const keys = []
      if (event.ctrlKey) keys.push('Ctrl')
      if (event.altKey) keys.push('Alt')
      if (event.shiftKey) keys.push('Shift')
      if (event.key && !['Control', 'Alt', 'Shift'].includes(event.key)) {
        keys.push(event.key.toUpperCase())
      }
      hideHotkey.value = keys.join('+')
      
      const settings = {
        hideHotkey: hideHotkey.value
      }
      emit('settings-change', settings)
      settingsStore.updateStealthSettings(settings)
    }
    
    // 初始化设置
    const initializeSettings = () => {
      const readerSettings = settingsStore.readerSettings
      const stealthSettings = settingsStore.stealthSettings
      
      fontSize.value = readerSettings.fontSize || 16
      fontFamily.value = readerSettings.fontFamily || 'system'
      lineHeight.value = readerSettings.lineHeight || 1.6
      currentTheme.value = readerSettings.theme || 'light'
      autoScroll.value = readerSettings.autoScroll || false
      scrollSpeed.value = readerSettings.scrollSpeed || 3
      eyeProtection.value = readerSettings.eyeProtection || false
      
      stealthMode.value = stealthSettings.stealthMode || false
      opacity.value = stealthSettings.opacity || 1
      hideHotkey.value = stealthSettings.hideHotkey || 'Ctrl+H'
    }
    
    // 生命周期
    onMounted(() => {
      initializeSettings()
    })
    
    return {
      showSettings,
      fontSize,
      fontFamily,
      lineHeight,
      currentTheme,
      autoScroll,
      scrollSpeed,
      eyeProtection,
      stealthMode,
      opacity,
      hideHotkey,
      themes,
      isFullscreen,
      toggleSidebar,
      toggleBookmark,
      toggleFullscreen,
      onProgressClick,
      increaseFontSize,
      decreaseFontSize,
      updateFontFamily,
      updateLineHeight,
      changeTheme,
      updateAutoScroll,
      updateScrollSpeed,
      updateEyeProtection,
      updateStealthMode,
      updateOpacity,
      recordHotkey
    }
  }
}
</script>

<style scoped>
.reader-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  transition: transform 0.3s ease;
}

.toolbar-hidden {
  transform: translateY(-100%);
}

.toolbar-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 0 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.toolbar-btn.active {
  background: #007bff;
  color: white;
}

.close-btn:hover {
  background: #ff4757;
  color: white;
}

.novel-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.novel-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.chapter-title {
  font-size: 12px;
  color: #666;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-bottom {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.chapter-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.nav-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #007bff;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  cursor: pointer;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-thumb {
  position: absolute;
  top: -3px;
  width: 12px;
  height: 12px;
  background: #007bff;
  border-radius: 50%;
  transform: translateX(-50%);
  transition: left 0.3s ease;
}

.settings-panel {
  position: absolute;
  top: 100%;
  right: 16px;
  width: 320px;
  max-height: 500px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  z-index: 1001;
}

.settings-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.font-size-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-size-controls button {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 12px;
}

.font-size-controls span {
  min-width: 40px;
  text-align: center;
  font-size: 12px;
}

.setting-item select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.setting-item input[type="range"] {
  width: 100px;
}

.setting-item input[type="text"] {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  width: 120px;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-item:hover {
  border-color: #007bff;
}

.theme-item.active {
  border-color: #007bff;
  background: #f8f9ff;
}

.theme-preview {
  width: 40px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.theme-item span {
  font-size: 12px;
  color: #666;
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 图标样式 */
.icon-arrow-left::before { content: '←'; }
.icon-menu::before { content: '☰'; }
.icon-bookmark::before { content: '🔖'; }
.icon-settings::before { content: '⚙️'; }
.icon-fullscreen::before { content: '⛶'; }
.icon-minimize::before { content: '−'; }
.icon-close::before { content: '×'; }
.icon-chevron-left::before { content: '‹'; }
.icon-chevron-right::before { content: '›'; }

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-top {
    padding: 0 12px;
  }
  
  .novel-info {
    display: none;
  }
  
  .settings-panel {
    width: 280px;
    right: 12px;
  }
  
  .chapter-nav {
    gap: 12px;
  }
  
  .nav-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}

/* 暗色主题 */
.dark-theme .reader-toolbar {
  background: rgba(26, 26, 26, 0.95);
  border-bottom-color: #333;
}

.dark-theme .toolbar-btn {
  color: #ccc;
}

.dark-theme .toolbar-btn:hover {
  background: #333;
  color: #fff;
}

.dark-theme .novel-title {
  color: #fff;
}

.dark-theme .chapter-title {
  color: #ccc;
}

.dark-theme .settings-panel {
  background: #2a2a2a;
  border-color: #444;
}

.dark-theme .settings-section {
  border-bottom-color: #444;
}

.dark-theme .settings-section h4 {
  color: #fff;
}

.dark-theme .setting-item label {
  color: #ccc;
}
</style>