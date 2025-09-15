<template>
  <div class="hotkey-settings">
    <div class="settings-header">
      <h3>快捷键设置</h3>
      <p class="settings-description">自定义键盘快捷键和手势操作</p>
    </div>

    <div class="settings-content">
      <!-- 快捷键分类 -->
      <div class="hotkey-categories">
        <div 
          v-for="category in hotkeyCategories" 
          :key="category.key"
          class="category-item"
          :class="{ active: activeCategory === category.key }"
          @click="activeCategory = category.key"
        >
          <i :class="category.icon"></i>
          <span>{{ category.name }}</span>
        </div>
      </div>

      <!-- 快捷键列表 -->
      <div class="hotkey-list">
        <div 
          v-for="hotkey in filteredHotkeys" 
          :key="hotkey.key"
          class="hotkey-item"
        >
          <div class="hotkey-info">
            <div class="hotkey-name">{{ hotkey.name }}</div>
            <div class="hotkey-description">{{ hotkey.description }}</div>
          </div>
          
          <div class="hotkey-input">
            <div 
              class="key-combination"
              :class="{ recording: recordingKey === hotkey.key }"
              @click="startRecording(hotkey.key)"
            >
              <span v-if="hotkey.combination" class="keys">
                <span 
                  v-for="key in hotkey.combination.split('+')"
                  :key="key"
                  class="key"
                >{{ key }}</span>
              </span>
              <span v-else class="placeholder">点击设置</span>
            </div>
            
            <button 
              v-if="hotkey.combination"
              class="clear-btn"
              @click="clearHotkey(hotkey.key)"
              title="清除快捷键"
            >
              <i class="icon-close"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- 全局设置 -->
      <div class="global-settings">
        <h4>全局设置</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <input 
              type="checkbox" 
              v-model="globalHotkeys"
              @change="updateGlobalHotkeys"
            >
            <span>启用全局快捷键</span>
          </label>
          <p class="setting-description">允许在其他应用程序中使用快捷键</p>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <input 
              type="checkbox" 
              v-model="preventConflicts"
              @change="updatePreventConflicts"
            >
            <span>防止快捷键冲突</span>
          </label>
          <p class="setting-description">自动检测并避免与系统快捷键冲突</p>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="resetToDefault">
          <i class="icon-reset"></i>
          恢复默认
        </button>
        
        <button class="btn btn-primary" @click="exportHotkeys">
          <i class="icon-export"></i>
          导出配置
        </button>
        
        <button class="btn btn-primary" @click="importHotkeys">
          <i class="icon-import"></i>
          导入配置
        </button>
      </div>
    </div>

    <!-- 录制快捷键提示 -->
    <div v-if="recordingKey" class="recording-overlay">
      <div class="recording-dialog">
        <h4>录制快捷键</h4>
        <p>请按下要设置的快捷键组合</p>
        <div class="current-keys">{{ currentKeys.join(' + ') }}</div>
        <div class="recording-actions">
          <button class="btn btn-secondary" @click="cancelRecording">取消</button>
          <button class="btn btn-primary" @click="confirmRecording" :disabled="!currentKeys.length">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../../stores/settings.js'

export default {
  name: 'HotkeySettings',
  setup() {
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const activeCategory = ref('reading')
    const recordingKey = ref(null)
    const currentKeys = ref([])
    const globalHotkeys = ref(true)
    const preventConflicts = ref(true)
    
    // 快捷键分类
    const hotkeyCategories = ref([
      { key: 'reading', name: '阅读操作', icon: 'icon-book' },
      { key: 'navigation', name: '导航控制', icon: 'icon-navigation' },
      { key: 'interface', name: '界面控制', icon: 'icon-layout' },
      { key: 'stealth', name: '摸鱼功能', icon: 'icon-stealth' }
    ])
    
    // 快捷键配置
    const hotkeys = ref([
      // 阅读操作
      { key: 'nextPage', name: '下一页', description: '翻到下一页', category: 'reading', combination: 'ArrowRight' },
      { key: 'prevPage', name: '上一页', description: '翻到上一页', category: 'reading', combination: 'ArrowLeft' },
      { key: 'nextChapter', name: '下一章', description: '跳转到下一章', category: 'reading', combination: 'Ctrl+ArrowRight' },
      { key: 'prevChapter', name: '上一章', description: '跳转到上一章', category: 'reading', combination: 'Ctrl+ArrowLeft' },
      { key: 'toggleBookmark', name: '添加书签', description: '在当前位置添加或移除书签', category: 'reading', combination: 'Ctrl+B' },
      
      // 导航控制
      { key: 'goHome', name: '返回首页', description: '返回到主页面', category: 'navigation', combination: 'Ctrl+H' },
      { key: 'openLibrary', name: '打开书库', description: '打开本地书库', category: 'navigation', combination: 'Ctrl+L' },
      { key: 'openSearch', name: '搜索', description: '打开搜索功能', category: 'navigation', combination: 'Ctrl+F' },
      
      // 界面控制
      { key: 'toggleFullscreen', name: '全屏切换', description: '切换全屏显示模式', category: 'interface', combination: 'F11' },
      { key: 'toggleSidebar', name: '侧边栏', description: '显示或隐藏侧边栏', category: 'interface', combination: 'Ctrl+\\' },
      { key: 'toggleSettings', name: '设置面板', description: '打开或关闭设置面板', category: 'interface', combination: 'Ctrl+,' },
      
      // 摸鱼功能
      { key: 'quickHide', name: '快速隐藏', description: '快速隐藏应用窗口', category: 'stealth', combination: 'Ctrl+Shift+H' },
      { key: 'bossKey', name: '老板键', description: '紧急切换到伪装界面', category: 'stealth', combination: 'Ctrl+Shift+B' },
      { key: 'toggleTransparency', name: '透明度切换', description: '切换窗口透明度', category: 'stealth', combination: 'Ctrl+Shift+T' }
    ])
    
    // 计算属性
    const filteredHotkeys = computed(() => {
      return hotkeys.value.filter(hotkey => hotkey.category === activeCategory.value)
    })
    
    // 方法
    const startRecording = (hotkeyKey) => {
      recordingKey.value = hotkeyKey
      currentKeys.value = []
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keyup', handleKeyUp)
    }
    
    const handleKeyDown = (event) => {
      event.preventDefault()
      
      const key = event.key
      const modifiers = []
      
      if (event.ctrlKey) modifiers.push('Ctrl')
      if (event.shiftKey) modifiers.push('Shift')
      if (event.altKey) modifiers.push('Alt')
      if (event.metaKey) modifiers.push('Meta')
      
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
        currentKeys.value = [...modifiers, key]
      } else {
        currentKeys.value = modifiers
      }
    }
    
    const handleKeyUp = (event) => {
      // 可以在这里处理按键释放逻辑
    }
    
    const confirmRecording = () => {
      if (currentKeys.value.length > 0) {
        const hotkey = hotkeys.value.find(h => h.key === recordingKey.value)
        if (hotkey) {
          hotkey.combination = currentKeys.value.join('+')
          saveHotkeys()
        }
      }
      cancelRecording()
    }
    
    const cancelRecording = () => {
      recordingKey.value = null
      currentKeys.value = []
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    }
    
    const clearHotkey = (hotkeyKey) => {
      const hotkey = hotkeys.value.find(h => h.key === hotkeyKey)
      if (hotkey) {
        hotkey.combination = ''
        saveHotkeys()
      }
    }
    
    const saveHotkeys = () => {
      // 保存快捷键配置到store
      const hotkeyConfig = {}
      hotkeys.value.forEach(hotkey => {
        if (hotkey.combination) {
          hotkeyConfig[hotkey.key] = hotkey.combination
        }
      })
      settingsStore.updateSettings({ hotkeys: hotkeyConfig })
    }
    
    const updateGlobalHotkeys = () => {
      settingsStore.updateSettings({ globalHotkeys: globalHotkeys.value })
    }
    
    const updatePreventConflicts = () => {
      settingsStore.updateSettings({ preventConflicts: preventConflicts.value })
    }
    
    const resetToDefault = () => {
      // 重置为默认快捷键
      hotkeys.value.forEach(hotkey => {
        // 这里可以设置默认的快捷键组合
      })
      saveHotkeys()
    }
    
    const exportHotkeys = () => {
      const config = {
        hotkeys: hotkeys.value,
        globalHotkeys: globalHotkeys.value,
        preventConflicts: preventConflicts.value
      }
      
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'hotkeys-config.json'
      a.click()
      URL.revokeObjectURL(url)
    }
    
    const importHotkeys = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = (event) => {
        const file = event.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            try {
              const config = JSON.parse(e.target.result)
              if (config.hotkeys) {
                hotkeys.value = config.hotkeys
              }
              if (typeof config.globalHotkeys === 'boolean') {
                globalHotkeys.value = config.globalHotkeys
              }
              if (typeof config.preventConflicts === 'boolean') {
                preventConflicts.value = config.preventConflicts
              }
              saveHotkeys()
            } catch (error) {
              console.error('导入配置失败:', error)
            }
          }
          reader.readAsText(file)
        }
      }
      input.click()
    }
    
    // 生命周期
    onMounted(() => {
      // 从store加载快捷键配置
      const settings = settingsStore.settings
      if (settings.hotkeys) {
        Object.entries(settings.hotkeys).forEach(([key, combination]) => {
          const hotkey = hotkeys.value.find(h => h.key === key)
          if (hotkey) {
            hotkey.combination = combination
          }
        })
      }
      
      if (typeof settings.globalHotkeys === 'boolean') {
        globalHotkeys.value = settings.globalHotkeys
      }
      
      if (typeof settings.preventConflicts === 'boolean') {
        preventConflicts.value = settings.preventConflicts
      }
    })
    
    onUnmounted(() => {
      // 清理事件监听器
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
    })
    
    return {
      activeCategory,
      recordingKey,
      currentKeys,
      globalHotkeys,
      preventConflicts,
      hotkeyCategories,
      filteredHotkeys,
      startRecording,
      confirmRecording,
      cancelRecording,
      clearHotkey,
      updateGlobalHotkeys,
      updatePreventConflicts,
      resetToDefault,
      exportHotkeys,
      importHotkeys
    }
  }
}
</script>

<style scoped>
.hotkey-settings {
  padding: 20px;
}

.settings-header {
  margin-bottom: 30px;
}

.settings-header h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.hotkey-categories {
  display: flex;
  gap: 12px;
  margin-bottom: 30px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
}

.category-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.category-item.active {
  background: var(--primary-color);
  color: white;
}

.hotkey-list {
  margin-bottom: 30px;
}

.hotkey-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
  background: var(--bg-primary);
}

.hotkey-info {
  flex: 1;
}

.hotkey-name {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.hotkey-description {
  font-size: 14px;
  color: var(--text-secondary);
}

.hotkey-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-combination {
  display: flex;
  align-items: center;
  min-width: 120px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.key-combination:hover {
  border-color: var(--primary-color);
}

.key-combination.recording {
  border-color: var(--primary-color);
  background: var(--primary-color-light);
}

.keys {
  display: flex;
  gap: 4px;
}

.key {
  padding: 2px 6px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.placeholder {
  color: var(--text-secondary);
  font-style: italic;
}

.clear-btn {
  padding: 4px;
  border: none;
  background: var(--danger-color);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: var(--danger-color-dark);
}

.global-settings {
  margin-bottom: 30px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.global-settings h4 {
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.setting-item {
  margin-bottom: 16px;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-primary);
}

.setting-description {
  margin: 4px 0 0 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-color-dark);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.recording-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.recording-dialog {
  background: var(--bg-primary);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 300px;
}

.recording-dialog h4 {
  margin: 0 0 12px 0;
  color: var(--text-primary);
}

.recording-dialog p {
  margin: 0 0 20px 0;
  color: var(--text-secondary);
}

.current-keys {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
  color: var(--primary-color);
  min-height: 20px;
}

.recording-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>