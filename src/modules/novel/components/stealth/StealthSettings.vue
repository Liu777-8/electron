<template>
  <div class="stealth-settings">
    <div class="settings-header">
      <h3>摸鱼模式设置</h3>
      <div class="header-actions">
        <button class="toggle-btn" :class="{ active: stealthEnabled }" @click="toggleStealth">
          <i class="icon-stealth"></i>
          {{ stealthEnabled ? '关闭摸鱼' : '开启摸鱼' }}
        </button>
      </div>
    </div>

    <div class="settings-content">
      <!-- 基础设置 -->
      <div class="setting-section">
        <h4>基础设置</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>启用摸鱼模式</span>
            <div class="setting-description">隐藏界面元素，快速切换到工作界面</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.enabled" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>窗口透明度</span>
            <div class="setting-description">调整窗口透明度，便于快速切换</div>
          </label>
          <div class="setting-control">
            <div class="opacity-control">
              <input 
                type="range" 
                min="0.1" 
                max="1" 
                step="0.1" 
                v-model="settings.opacity" 
                @input="updateOpacity"
                class="opacity-slider"
              >
              <span class="opacity-value">{{ Math.round(settings.opacity * 100) }}%</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>窗口置顶</span>
            <div class="setting-description">保持窗口在最前面</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.alwaysOnTop" @change="updateSettings">
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
            <span>切换摸鱼模式</span>
            <div class="setting-description">快速开启/关闭摸鱼模式</div>
          </label>
          <div class="setting-control">
            <div class="hotkey-input" @click="recordHotkey('toggle')">
              <span v-if="settings.hotkeys.toggle">{{ formatHotkey(settings.hotkeys.toggle) }}</span>
              <span v-else class="placeholder">点击设置快捷键</span>
              <i class="icon-keyboard"></i>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>老板键</span>
            <div class="setting-description">快速切换到工作界面</div>
          </label>
          <div class="setting-control">
            <div class="hotkey-input" @click="recordHotkey('boss')">
              <span v-if="settings.hotkeys.boss">{{ formatHotkey(settings.hotkeys.boss) }}</span>
              <span v-else class="placeholder">点击设置快捷键</span>
              <i class="icon-keyboard"></i>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>隐藏窗口</span>
            <div class="setting-description">快速隐藏整个窗口</div>
          </label>
          <div class="setting-control">
            <div class="hotkey-input" @click="recordHotkey('hide')">
              <span v-if="settings.hotkeys.hide">{{ formatHotkey(settings.hotkeys.hide) }}</span>
              <span v-else class="placeholder">点击设置快捷键</span>
              <i class="icon-keyboard"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 界面伪装 -->
      <div class="setting-section">
        <h4>界面伪装</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>伪装模式</span>
            <div class="setting-description">选择伪装成的工作界面</div>
          </label>
          <div class="setting-control">
            <select v-model="settings.disguiseMode" @change="updateSettings" class="disguise-select">
              <option value="none">无伪装</option>
              <option value="code">代码编辑器</option>
              <option value="excel">Excel表格</option>
              <option value="word">Word文档</option>
              <option value="email">邮件客户端</option>
              <option value="browser">浏览器</option>
              <option value="terminal">终端命令行</option>
            </select>
          </div>
        </div>

        <div class="setting-item" v-if="settings.disguiseMode !== 'none'">
          <label class="setting-label">
            <span>伪装内容</span>
            <div class="setting-description">自定义伪装界面的内容</div>
          </label>
          <div class="setting-control">
            <textarea 
              v-model="settings.disguiseContent" 
              @input="updateSettings"
              class="disguise-content"
              rows="4"
              :placeholder="getDisguisePlaceholder()"
            ></textarea>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>自动伪装</span>
            <div class="setting-description">检测到特定窗口时自动启用伪装</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.autoDisguise" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item" v-if="settings.autoDisguise">
          <label class="setting-label">
            <span>触发窗口</span>
            <div class="setting-description">检测到这些窗口标题时自动伪装</div>
          </label>
          <div class="setting-control">
            <div class="trigger-windows">
              <div class="window-tag" v-for="(window, index) in settings.triggerWindows" :key="index">
                <span>{{ window }}</span>
                <button class="remove-btn" @click="removeTriggerWindow(index)">
                  <i class="icon-close"></i>
                </button>
              </div>
              <input 
                type="text" 
                v-model="newTriggerWindow" 
                @keyup.enter="addTriggerWindow"
                placeholder="输入窗口标题关键词"
                class="window-input"
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 高级设置 -->
      <div class="setting-section">
        <h4>高级设置</h4>
        
        <div class="setting-item">
          <label class="setting-label">
            <span>鼠标穿透</span>
            <div class="setting-description">允许鼠标点击穿透到下层窗口</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.mouseThrough" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>自动隐藏时间</span>
            <div class="setting-description">无操作后自动隐藏的时间（秒）</div>
          </label>
          <div class="setting-control">
            <input 
              type="number" 
              v-model="settings.autoHideDelay" 
              @input="updateSettings"
              min="0" 
              max="300" 
              class="number-input"
            >
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>启动时启用</span>
            <div class="setting-description">程序启动时自动开启摸鱼模式</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.startWithStealth" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            <span>系统托盘</span>
            <div class="setting-description">最小化到系统托盘而不是任务栏</div>
          </label>
          <div class="setting-control">
            <label class="switch">
              <input type="checkbox" v-model="settings.systemTray" @change="updateSettings">
              <span class="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- 预设方案 -->
      <div class="setting-section">
        <h4>预设方案</h4>
        
        <div class="preset-buttons">
          <button class="preset-btn" @click="applyPreset('office')">
            <i class="icon-office"></i>
            <span>办公室模式</span>
            <small>适合办公环境，快速切换</small>
          </button>
          
          <button class="preset-btn" @click="applyPreset('home')">
            <i class="icon-home"></i>
            <span>居家模式</span>
            <small>适合在家办公，轻度伪装</small>
          </button>
          
          <button class="preset-btn" @click="applyPreset('stealth')">
            <i class="icon-ninja"></i>
            <span>隐身模式</span>
            <small>最大程度隐藏，适合严格环境</small>
          </button>
          
          <button class="preset-btn" @click="applyPreset('custom')">
            <i class="icon-custom"></i>
            <span>自定义</span>
            <small>根据个人需求调整</small>
          </button>
        </div>
      </div>
    </div>

    <!-- 快捷键录制对话框 -->
    <div class="hotkey-dialog" v-if="recordingHotkey" @click.self="cancelHotkeyRecord">
      <div class="dialog-content">
        <div class="dialog-header">
          <h4>设置快捷键</h4>
          <button class="close-btn" @click="cancelHotkeyRecord">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="recording-area">
            <i class="icon-keyboard-large"></i>
            <p>请按下要设置的快捷键组合</p>
            <div class="current-keys" v-if="currentKeys.length > 0">
              <span class="key" v-for="key in currentKeys" :key="key">{{ key }}</span>
            </div>
            <small>支持 Ctrl、Alt、Shift 组合键</small>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelHotkeyRecord">取消</button>
          <button class="btn btn-primary" @click="saveHotkey" :disabled="currentKeys.length === 0">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../../stores/settings.js'

export default {
  name: 'StealthSettings',
  emits: ['stealth-toggle', 'settings-change'],
  setup(props, { emit }) {
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const settings = ref({
      enabled: false,
      opacity: 0.9,
      alwaysOnTop: false,
      hotkeys: {
        toggle: 'Ctrl+Shift+H',
        boss: 'Ctrl+Shift+B',
        hide: 'Ctrl+Shift+X'
      },
      disguiseMode: 'none',
      disguiseContent: '',
      autoDisguise: false,
      triggerWindows: ['钉钉', '企业微信', '腾讯会议', 'Zoom'],
      mouseThrough: false,
      autoHideDelay: 30,
      startWithStealth: false,
      systemTray: true
    })
    
    const recordingHotkey = ref(false)
    const recordingType = ref('')
    const currentKeys = ref([])
    const newTriggerWindow = ref('')
    
    // 计算属性
    const stealthEnabled = computed(() => settings.value.enabled)
    
    // 方法
    const toggleStealth = () => {
      settings.value.enabled = !settings.value.enabled
      updateSettings()
      emit('stealth-toggle', settings.value.enabled)
    }
    
    const updateSettings = () => {
      settingsStore.updateStealthSettings(settings.value)
      emit('settings-change', settings.value)
    }
    
    const updateOpacity = () => {
      updateSettings()
      // 实时更新窗口透明度
      if (window.electronAPI) {
        window.electronAPI.setWindowOpacity(settings.value.opacity)
      }
    }
    
    // 快捷键相关
    const recordHotkey = (type) => {
      recordingHotkey.value = true
      recordingType.value = type
      currentKeys.value = []
    }
    
    const cancelHotkeyRecord = () => {
      recordingHotkey.value = false
      recordingType.value = ''
      currentKeys.value = []
    }
    
    const saveHotkey = () => {
      if (currentKeys.value.length > 0) {
        settings.value.hotkeys[recordingType.value] = currentKeys.value.join('+')
        updateSettings()
      }
      cancelHotkeyRecord()
    }
    
    const formatHotkey = (hotkey) => {
      return hotkey.replace(/\+/g, ' + ')
    }
    
    const handleKeyDown = (event) => {
      if (!recordingHotkey.value) return
      
      event.preventDefault()
      event.stopPropagation()
      
      const keys = []
      
      if (event.ctrlKey) keys.push('Ctrl')
      if (event.altKey) keys.push('Alt')
      if (event.shiftKey) keys.push('Shift')
      if (event.metaKey) keys.push('Meta')
      
      const key = event.key
      if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
        keys.push(key.toUpperCase())
      }
      
      currentKeys.value = keys
    }
    
    // 伪装相关
    const getDisguisePlaceholder = () => {
      const placeholders = {
        code: '// 这是一段示例代码\nfunction example() {\n    console.log("Hello World");\n}',
        excel: 'A1: 项目名称\tB1: 进度\tC1: 负责人\nA2: 项目A\tB2: 80%\tC2: 张三',
        word: '工作报告\n\n本周工作总结：\n1. 完成项目需求分析\n2. 制定开发计划',
        email: '收件人: boss@company.com\n主题: 工作进度汇报\n\n尊敬的领导，\n本周工作进展如下...',
        browser: 'https://www.baidu.com\n搜索: 工作相关内容',
        terminal: 'C:\\Users\\Username> dir\nC:\\Users\\Username> npm install'
      }
      return placeholders[settings.value.disguiseMode] || ''
    }
    
    // 触发窗口管理
    const addTriggerWindow = () => {
      if (newTriggerWindow.value.trim()) {
        settings.value.triggerWindows.push(newTriggerWindow.value.trim())
        newTriggerWindow.value = ''
        updateSettings()
      }
    }
    
    const removeTriggerWindow = (index) => {
      settings.value.triggerWindows.splice(index, 1)
      updateSettings()
    }
    
    // 预设方案
    const applyPreset = (preset) => {
      const presets = {
        office: {
          enabled: true,
          opacity: 0.8,
          alwaysOnTop: true,
          disguiseMode: 'excel',
          autoDisguise: true,
          mouseThrough: false,
          autoHideDelay: 10,
          systemTray: true
        },
        home: {
          enabled: true,
          opacity: 0.9,
          alwaysOnTop: false,
          disguiseMode: 'browser',
          autoDisguise: false,
          mouseThrough: false,
          autoHideDelay: 60,
          systemTray: false
        },
        stealth: {
          enabled: true,
          opacity: 0.3,
          alwaysOnTop: true,
          disguiseMode: 'terminal',
          autoDisguise: true,
          mouseThrough: true,
          autoHideDelay: 5,
          systemTray: true
        },
        custom: {
          // 保持当前设置
        }
      }
      
      if (preset !== 'custom' && presets[preset]) {
        Object.assign(settings.value, presets[preset])
        updateSettings()
      }
    }
    
    // 生命周期
    onMounted(() => {
      // 加载设置
      const savedSettings = settingsStore.stealthSettings
      if (savedSettings) {
        Object.assign(settings.value, savedSettings)
      }
      
      // 监听键盘事件
      document.addEventListener('keydown', handleKeyDown)
      
      // 注册全局快捷键
      if (window.electronAPI) {
        Object.entries(settings.value.hotkeys).forEach(([type, hotkey]) => {
          window.electronAPI.registerGlobalShortcut(hotkey, () => {
            handleGlobalShortcut(type)
          })
        })
      }
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // 注销全局快捷键
      if (window.electronAPI) {
        Object.values(settings.value.hotkeys).forEach(hotkey => {
          window.electronAPI.unregisterGlobalShortcut(hotkey)
        })
      }
    })
    
    const handleGlobalShortcut = (type) => {
      switch (type) {
        case 'toggle':
          toggleStealth()
          break
        case 'boss':
          // 切换到伪装界面
          if (settings.value.disguiseMode !== 'none') {
            emit('boss-key-pressed')
          }
          break
        case 'hide':
          // 隐藏窗口
          if (window.electronAPI) {
            window.electronAPI.hideWindow()
          }
          break
      }
    }
    
    // 监听设置变化
    watch(settings, (newSettings) => {
      // 应用窗口设置
      if (window.electronAPI) {
        window.electronAPI.setWindowOpacity(newSettings.opacity)
        window.electronAPI.setAlwaysOnTop(newSettings.alwaysOnTop)
      }
    }, { deep: true })
    
    return {
      settings,
      stealthEnabled,
      recordingHotkey,
      currentKeys,
      newTriggerWindow,
      toggleStealth,
      updateSettings,
      updateOpacity,
      recordHotkey,
      cancelHotkeyRecord,
      saveHotkey,
      formatHotkey,
      getDisguisePlaceholder,
      addTriggerWindow,
      removeTriggerWindow,
      applyPreset
    }
  }
}
</script>

<style scoped>
.stealth-settings {
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

.toggle-btn {
  padding: 8px 16px;
  border: 1px solid #007bff;
  border-radius: 6px;
  background: white;
  color: #007bff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.toggle-btn:hover {
  background: #f0f8ff;
}

.toggle-btn.active {
  background: #007bff;
  color: white;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
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

/* 透明度控制 */
.opacity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.opacity-slider {
  width: 120px;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
}

.opacity-value {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  min-width: 35px;
}

/* 快捷键输入 */
.hotkey-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  min-width: 150px;
  transition: all 0.2s ease;
}

.hotkey-input:hover {
  border-color: #007bff;
}

.hotkey-input .placeholder {
  color: #999;
  font-size: 12px;
}

/* 选择框 */
.disguise-select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  min-width: 120px;
  outline: none;
}

.disguise-select:focus {
  border-color: #007bff;
}

/* 文本域 */
.disguise-content {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
  resize: vertical;
  outline: none;
}

.disguise-content:focus {
  border-color: #007bff;
}

/* 数字输入 */
.number-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  outline: none;
}

.number-input:focus {
  border-color: #007bff;
}

/* 触发窗口 */
.trigger-windows {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.window-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 12px;
}

.remove-btn {
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
}

.remove-btn:hover {
  background: #dc3545;
  color: white;
}

.window-input {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  min-width: 120px;
  outline: none;
}

.window-input:focus {
  border-color: #007bff;
}

/* 预设按钮 */
.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.preset-btn:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.preset-btn i {
  font-size: 24px;
  color: #007bff;
}

.preset-btn span {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.preset-btn small {
  font-size: 11px;
  color: #666;
  line-height: 1.3;
}

/* 快捷键录制对话框 */
.hotkey-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.dialog-content {
  width: 400px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #e9ecef;
}

.dialog-body {
  padding: 24px;
}

.recording-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.icon-keyboard-large {
  font-size: 48px;
  color: #007bff;
}

.recording-area p {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.current-keys {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.key {
  padding: 4px 8px;
  background: #007bff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.recording-area small {
  font-size: 11px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

/* 图标 */
.icon-stealth::before { content: '👁️'; }
.icon-keyboard::before { content: '⌨️'; }
.icon-keyboard-large::before { content: '⌨️'; }
.icon-close::before { content: '×'; }
.icon-office::before { content: '🏢'; }
.icon-home::before { content: '🏠'; }
.icon-ninja::before { content: '🥷'; }
.icon-custom::before { content: '⚙️'; }

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
  
  .preset-buttons {
    grid-template-columns: 1fr;
  }
  
  .dialog-content {
    width: 90vw;
  }
}

/* 暗色主题 */
.dark-theme .stealth-settings {
  background: #1a1a1a;
}

.dark-theme .settings-header,
.dark-theme .setting-section {
  background: #2a2a2a;
  border-color: #444;
}

.dark-theme .settings-header h3,
.dark-theme .setting-section h4,
.dark-theme .setting-label span {
  color: #fff;
}

.dark-theme .toggle-btn {
  background: #333;
  border-color: #007bff;
  color: #007bff;
}

.dark-theme .toggle-btn:hover {
  background: #1a1a2e;
}

.dark-theme .hotkey-input,
.dark-theme .disguise-select,
.dark-theme .disguise-content,
.dark-theme .number-input,
.dark-theme .window-input {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark-theme .preset-btn {
  background: #333;
  border-color: #555;
}

.dark-theme .preset-btn span {
  color: #ccc;
}

.dark-theme .dialog-content {
  background: #2a2a2a;
}

.dark-theme .dialog-header,
.dark-theme .dialog-footer {
  background: #333;
  border-color: #444;
}
</style>