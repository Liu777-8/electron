<template>
  <div class="reading-settings">
    <div class="settings-header">
      <h3>阅读设置</h3>
      <div class="header-actions">
        <button class="reset-btn" @click="resetToDefault" title="恢复默认">
          <i class="icon-reset"></i>
          恢复默认
        </button>
      </div>
    </div>

    <div class="settings-content">
      <!-- 字体设置 -->
      <div class="setting-section">
        <h4>字体设置</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>字体族</span>
            <div class="setting-description">选择阅读时使用的字体</div>
          </label>
          <div class="setting-control">
            <select v-model="settings.fontFamily" @change="updateSettings" class="font-select">
              <option value="system">系统默认</option>
              <option value="serif">宋体 (衬线)</option>
              <option value="sans-serif">微软雅黑 (无衬线)</option>
              <option value="monospace">等宽字体</option>
              <option value="custom">自定义字体</option>
            </select>
          </div>
        </div>

        <div class="setting-item" v-if="settings.fontFamily === 'custom'">
          <label class="setting-label">
            <span>自定义字体</span>
            <div class="setting-description">输入字体名称，多个字体用逗号分隔</div>
          </label>
          <div class="setting-control">
            <input 
              type="text" 
              v-model="settings.customFont" 
              @input="updateSettings"
              placeholder="例如: 思源宋体, Source Han Serif"
              class="font-input"
            >
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>字体大小</span>
            <div class="setting-description">调整文字显示大小</div>
          </label>
          <div class="setting-control">
            <div class="size-control">
              <input 
                type="range" 
                min="12" 
                max="32" 
                step="1" 
                v-model="settings.fontSize" 
                @input="updateSettings"
                class="size-slider"
              >
              <span class="size-value">{{ settings.fontSize }}px</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>字体粗细</span>
            <div class="setting-description">调整文字粗细程度</div>
          </label>
          <div class="setting-control">
            <select v-model="settings.fontWeight" @change="updateSettings" class="weight-select">
              <option value="300">细体</option>
              <option value="400">正常</option>
              <option value="500">中等</option>
              <option value="600">半粗</option>
              <option value="700">粗体</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 布局设置 -->
      <div class="setting-section">
        <h4>布局设置</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>行间距</span>
            <div class="setting-description">调整文字行与行之间的距离</div>
          </label>
          <div class="setting-control">
            <div class="spacing-control">
              <input 
                type="range" 
                min="1.2" 
                max="3.0" 
                step="0.1" 
                v-model="settings.lineHeight" 
                @input="updateSettings"
                class="spacing-slider"
              >
              <span class="spacing-value">{{ settings.lineHeight }}</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>段落间距</span>
            <div class="setting-description">调整段落之间的间距</div>
          </label>
          <div class="setting-control">
            <div class="spacing-control">
              <input 
                type="range" 
                min="0" 
                max="40" 
                step="2" 
                v-model="settings.paragraphSpacing" 
                @input="updateSettings"
                class="spacing-slider"
              >
              <span class="spacing-value">{{ settings.paragraphSpacing }}px</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>页面宽度</span>
            <div class="setting-description">调整阅读区域的宽度</div>
          </label>
          <div class="setting-control">
            <div class="width-control">
              <input 
                type="range" 
                min="600" 
                max="1200" 
                step="50" 
                v-model="settings.pageWidth" 
                @input="updateSettings"
                class="width-slider"
              >
              <span class="width-value">{{ settings.pageWidth }}px</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>页面边距</span>
            <div class="setting-description">调整内容与边框的距离</div>
          </label>
          <div class="setting-control">
            <div class="margin-control">
              <input 
                type="range" 
                min="20" 
                max="100" 
                step="10" 
                v-model="settings.pageMargin" 
                @input="updateSettings"
                class="margin-slider"
              >
              <span class="margin-value">{{ settings.pageMargin }}px</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 颜色主题 -->
      <div class="setting-section">
        <h4>颜色主题</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>主题模式</span>
            <div class="setting-description">选择阅读界面的整体风格</div>
          </label>
          <div class="setting-control">
            <div class="theme-selector">
              <div 
                class="theme-option" 
                v-for="theme in themes" 
                :key="theme.key"
                :class="{ active: settings.theme === theme.key }"
                @click="selectTheme(theme.key)"
              >
                <div class="theme-preview" :style="getThemePreviewStyle(theme)"></div>
                <span class="theme-name">{{ theme.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="setting-item" v-if="settings.theme === 'custom'">
          <label class="setting-label">
            <span>自定义颜色</span>
            <div class="setting-description">自定义背景和文字颜色</div>
          </label>
          <div class="setting-control">
            <div class="color-controls">
              <div class="color-item">
                <label>背景色</label>
                <input 
                  type="color" 
                  v-model="settings.customColors.background" 
                  @input="updateSettings"
                  class="color-picker"
                >
              </div>
              <div class="color-item">
                <label>文字色</label>
                <input 
                  type="color" 
                  v-model="settings.customColors.text" 
                  @input="updateSettings"
                  class="color-picker"
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 阅读体验 -->
      <div class="setting-section">
        <h4>阅读体验</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>翻页模式</span>
            <div class="setting-description">选择翻页的方式</div>
          </label>
          <div class="setting-control">
            <select v-model="settings.pageMode" @change="updateSettings" class="mode-select">
              <option value="scroll">滚动翻页</option>
              <option value="page">分页翻页</option>
              <option value="slide">滑动翻页</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>自动滚动</span>
            <div class="setting-description">启用自动滚动阅读</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.autoScroll" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item" v-if="settings.autoScroll">
          <label class="setting-label">
            <span>滚动速度</span>
            <div class="setting-description">调整自动滚动的速度</div>
          </label>
          <div class="setting-control">
            <div class="speed-control">
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1" 
                v-model="settings.scrollSpeed" 
                @input="updateSettings"
                class="speed-slider"
              >
              <span class="speed-value">{{ settings.scrollSpeed }}</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>护眼模式</span>
            <div class="setting-description">减少蓝光，保护眼睛</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.eyeProtection" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>专注模式</span>
            <div class="setting-description">隐藏干扰元素，专注阅读</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.focusMode" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>全屏阅读</span>
            <div class="setting-description">启用全屏沉浸式阅读</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.fullscreen" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 快捷键设置 -->
      <div class="setting-section">
        <h4>快捷键设置</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>启用快捷键</span>
            <div class="setting-description">启用键盘快捷操作</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.enableHotkeys" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="hotkey-list" v-if="settings.enableHotkeys">
          <div class="hotkey-item" v-for="(hotkey, key) in settings.hotkeys" :key="key">
            <span class="hotkey-name">{{ getHotkeyName(key) }}</span>
            <div class="hotkey-value">{{ hotkey }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览区域 -->
    <div class="preview-section">
      <h4>预览效果</h4>
      <div class="preview-content" :style="getPreviewStyle()">
        <h3>示例标题</h3>
        <p>这是一段示例文字，用于预览当前的阅读设置效果。您可以通过调整上方的各项设置来改变文字的显示效果，包括字体、大小、颜色、间距等。</p>
        <p>第二段文字展示段落间距的效果。合适的设置能够提供更好的阅读体验，减少眼部疲劳，提高阅读效率。</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settings.js'

export default {
  name: 'ReadingSettings',
  emits: ['settings-change'],
  setup(props, { emit }) {
    const settingsStore = useSettingsStore()
    
    // 默认设置
    const defaultSettings = {
      fontFamily: 'system',
      customFont: '',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.6,
      paragraphSpacing: 16,
      pageWidth: 800,
      pageMargin: 40,
      theme: 'light',
      customColors: {
        background: '#ffffff',
        text: '#333333'
      },
      pageMode: 'scroll',
      autoScroll: false,
      scrollSpeed: 3,
      eyeProtection: false,
      focusMode: false,
      fullscreen: false,
      enableHotkeys: true,
      hotkeys: {
        nextPage: 'ArrowRight',
        prevPage: 'ArrowLeft',
        toggleFullscreen: 'F11',
        toggleFocus: 'F12',
        increaseFontSize: 'Ctrl+=',
        decreaseFontSize: 'Ctrl+-'
      }
    }
    
    // 响应式数据
    const settings = ref({ ...defaultSettings })
    
    // 主题选项
    const themes = ref([
      {
        key: 'light',
        name: '明亮',
        background: '#ffffff',
        text: '#333333'
      },
      {
        key: 'dark',
        name: '暗黑',
        background: '#1a1a1a',
        text: '#e0e0e0'
      },
      {
        key: 'sepia',
        name: '护眼',
        background: '#f7f3e9',
        text: '#5c4b37'
      },
      {
        key: 'green',
        name: '绿色',
        background: '#e8f5e8',
        text: '#2d5016'
      },
      {
        key: 'blue',
        name: '蓝色',
        background: '#e6f3ff',
        text: '#1a365d'
      },
      {
        key: 'custom',
        name: '自定义',
        background: '#ffffff',
        text: '#333333'
      }
    ])
    
    // 计算属性
    const currentTheme = computed(() => {
      return themes.value.find(theme => theme.key === settings.value.theme) || themes.value[0]
    })
    
    // 方法
    const updateSettings = () => {
      settingsStore.updateReadingSettings(settings.value)
      emit('settings-change', settings.value)
    }
    
    const selectTheme = (themeKey) => {
      settings.value.theme = themeKey
      updateSettings()
    }
    
    const resetToDefault = () => {
      if (confirm('确定要恢复默认设置吗？')) {
        Object.assign(settings.value, defaultSettings)
        updateSettings()
      }
    }
    
    const getThemePreviewStyle = (theme) => {
      return {
        backgroundColor: theme.background,
        color: theme.text,
        border: `2px solid ${theme.text}20`
      }
    }
    
    const getPreviewStyle = () => {
      const theme = currentTheme.value
      const colors = settings.value.theme === 'custom' 
        ? settings.value.customColors 
        : { background: theme.background, text: theme.text }
      
      let fontFamily = 'system-ui'
      switch (settings.value.fontFamily) {
        case 'serif':
          fontFamily = 'Georgia, "Times New Roman", serif'
          break
        case 'sans-serif':
          fontFamily = '"Microsoft YaHei", "Helvetica Neue", Arial, sans-serif'
          break
        case 'monospace':
          fontFamily = '"Courier New", Consolas, monospace'
          break
        case 'custom':
          fontFamily = settings.value.customFont || 'system-ui'
          break
      }
      
      return {
        fontFamily,
        fontSize: `${settings.value.fontSize}px`,
        fontWeight: settings.value.fontWeight,
        lineHeight: settings.value.lineHeight,
        backgroundColor: colors.background,
        color: colors.text,
        padding: `${settings.value.pageMargin}px`,
        maxWidth: `${settings.value.pageWidth}px`,
        filter: settings.value.eyeProtection ? 'sepia(0.1) brightness(0.95)' : 'none'
      }
    }
    
    const getHotkeyName = (key) => {
      const names = {
        nextPage: '下一页',
        prevPage: '上一页',
        toggleFullscreen: '全屏切换',
        toggleFocus: '专注模式',
        increaseFontSize: '增大字体',
        decreaseFontSize: '减小字体'
      }
      return names[key] || key
    }
    
    // 生命周期
    onMounted(() => {
      // 加载保存的设置
      const savedSettings = settingsStore.readingSettings
      if (savedSettings) {
        Object.assign(settings.value, savedSettings)
      }
    })
    
    // 监听设置变化
    watch(settings, (newSettings) => {
      // 应用护眼模式
      if (newSettings.eyeProtection) {
        document.body.style.filter = 'sepia(0.1) brightness(0.95)'
      } else {
        document.body.style.filter = 'none'
      }
      
      // 应用专注模式
      if (newSettings.focusMode) {
        document.body.classList.add('focus-mode')
      } else {
        document.body.classList.remove('focus-mode')
      }
    }, { deep: true })
    
    return {
      settings,
      themes,
      currentTheme,
      updateSettings,
      selectTheme,
      resetToDefault,
      getThemePreviewStyle,
      getPreviewStyle,
      getHotkeyName
    }
  }
}
</script>

<style scoped>
.reading-settings {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8f9fa;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.reset-btn {
  padding: 8px 16px;
  border: 1px solid #dc3545;
  border-radius: 6px;
  background: white;
  color: #dc3545;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #dc3545;
  color: white;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.setting-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.setting-section h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  flex: 1;
  margin-right: 20px;
}

.setting-label span {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.setting-control {
  flex-shrink: 0;
}

/* 控件样式 */
.font-select,
.weight-select,
.mode-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  min-width: 120px;
  outline: none;
}

.font-select:focus,
.weight-select:focus,
.mode-select:focus {
  border-color: #007bff;
}

.font-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  width: 200px;
  outline: none;
}

.font-input:focus {
  border-color: #007bff;
}

.size-control,
.spacing-control,
.width-control,
.margin-control,
.speed-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-slider,
.spacing-slider,
.width-slider,
.margin-slider,
.speed-slider {
  width: 120px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  outline: none;
  cursor: pointer;
}

.size-slider::-webkit-slider-thumb,
.spacing-slider::-webkit-slider-thumb,
.width-slider::-webkit-slider-thumb,
.margin-slider::-webkit-slider-thumb,
.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
}

.size-value,
.spacing-value,
.width-value,
.margin-value,
.speed-value {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  min-width: 40px;
  text-align: center;
}

/* 开关样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #007bff;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 主题选择器 */
.theme-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  border-color: #007bff;
}

.theme-option.active {
  border-color: #007bff;
  background: #f0f8ff;
}

.theme-preview {
  width: 40px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.theme-name {
  font-size: 12px;
  color: #666;
}

/* 颜色控制 */
.color-controls {
  display: flex;
  gap: 16px;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.color-item label {
  font-size: 11px;
  color: #666;
}

.color-picker {
  width: 40px;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  outline: none;
}

/* 快捷键列表 */
.hotkey-list {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.hotkey-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #e9ecef;
}

.hotkey-item:last-child {
  border-bottom: none;
}

.hotkey-name {
  font-size: 12px;
  color: #666;
}

.hotkey-value {
  font-size: 11px;
  font-family: monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  color: #495057;
}

/* 预览区域 */
.preview-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 24px;
  height: fit-content;
}

.preview-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.preview-content {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  min-height: 200px;
  transition: all 0.2s ease;
}

.preview-content h3 {
  margin: 0 0 16px 0;
  font-size: 1.2em;
}

.preview-content p {
  margin: 0 0 1em 0;
}

/* 图标 */
.icon-reset::before { content: '🔄'; }

/* 滚动条 */
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.settings-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.settings-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式 */
@media (max-width: 1200px) {
  .settings-content {
    grid-template-columns: 1fr;
  }
  
  .preview-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .settings-header {
    padding: 16px 20px;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-control {
    width: 100%;
  }
  
  .theme-selector {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 暗色主题 */
.dark-theme .reading-settings {
  background: #1a1a1a;
}

.dark-theme .settings-header,
.dark-theme .setting-section,
.dark-theme .preview-section {
  background: #2a2a2a;
  border-color: #444;
}

.dark-theme .settings-header h3,
.dark-theme .setting-section h4,
.dark-theme .preview-section h4,
.dark-theme .setting-label span {
  color: #fff;
}

.dark-theme .font-select,
.dark-theme .weight-select,
.dark-theme .mode-select,
.dark-theme .font-input,
.dark-theme .color-picker {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark-theme .hotkey-list {
  background: #333;
}

.dark-theme .hotkey-value {
  background: #444;
  color: #ccc;
}

.dark-theme .preview-content {
  border-color: #444;
}

/* 专注模式样式 */
.focus-mode .reading-settings {
  filter: contrast(1.1) brightness(0.9);
}
</style>