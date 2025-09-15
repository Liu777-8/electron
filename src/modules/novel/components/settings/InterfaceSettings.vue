<template>
  <div class="interface-settings">
    <!-- 设置头部 -->
    <div class="settings-header">
      <h3>界面设置</h3>
      <p>自定义应用程序的外观和交互体验</p>
    </div>
    
    <!-- 主题设置 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>主题设置</h4>
        <p>选择您喜欢的界面主题</p>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">主题模式</label>
        <div class="theme-selector">
          <div 
            class="theme-option" 
            v-for="theme in themes" 
            :key="theme.key"
            :class="{ 'active': settings.theme === theme.key }"
            @click="updateTheme(theme.key)"
          >
            <div class="theme-preview" :style="theme.preview"></div>
            <div class="theme-info">
              <span class="theme-name">{{ theme.name }}</span>
              <span class="theme-desc">{{ theme.description }}</span>
            </div>
            <i class="check-icon" v-if="settings.theme === theme.key">✓</i>
          </div>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">自动切换主题</label>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.autoTheme"
              @change="updateSettings"
            >
            <span class="slider"></span>
          </label>
          <span class="setting-desc">根据系统时间自动切换明暗主题</span>
        </div>
      </div>
      
      <div class="setting-group" v-if="settings.autoTheme">
        <label class="setting-label">切换时间</label>
        <div class="time-range">
          <div class="time-input">
            <label>深色主题开始时间</label>
            <input 
              type="time" 
              v-model="settings.darkStartTime"
              @change="updateSettings"
            >
          </div>
          <div class="time-input">
            <label>浅色主题开始时间</label>
            <input 
              type="time" 
              v-model="settings.lightStartTime"
              @change="updateSettings"
            >
          </div>
        </div>
      </div>
    </div>
    
    <!-- 布局设置 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>布局设置</h4>
        <p>调整界面布局和窗口行为</p>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">窗口模式</label>
        <div class="radio-group">
          <label 
            class="radio-option" 
            v-for="mode in windowModes" 
            :key="mode.key"
          >
            <input 
              type="radio" 
              :value="mode.key" 
              v-model="settings.windowMode"
              @change="updateSettings"
            >
            <span class="radio-label">
              <i :class="mode.icon"></i>
              {{ mode.name }}
            </span>
            <span class="radio-desc">{{ mode.description }}</span>
          </label>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">侧边栏位置</label>
        <div class="position-selector">
          <button 
            class="position-btn" 
            v-for="position in sidebarPositions" 
            :key="position.key"
            :class="{ 'active': settings.sidebarPosition === position.key }"
            @click="updateSidebarPosition(position.key)"
            :title="position.name"
          >
            <i :class="position.icon"></i>
          </button>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">界面缩放</label>
        <div class="zoom-control">
          <input 
            type="range" 
            min="0.8" 
            max="1.5" 
            step="0.1" 
            v-model="settings.zoomLevel"
            @input="updateZoom"
            class="zoom-slider"
          >
          <span class="zoom-value">{{ Math.round(settings.zoomLevel * 100) }}%</span>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">紧凑模式</label>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.compactMode"
              @change="updateSettings"
            >
            <span class="slider"></span>
          </label>
          <span class="setting-desc">减少界面元素间距，显示更多内容</span>
        </div>
      </div>
    </div>
    
    <!-- 动画设置 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>动画设置</h4>
        <p>控制界面动画效果和性能</p>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">启用动画</label>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.enableAnimations"
              @change="updateSettings"
            >
            <span class="slider"></span>
          </label>
          <span class="setting-desc">启用界面过渡动画和视觉效果</span>
        </div>
      </div>
      
      <div class="setting-group" v-if="settings.enableAnimations">
        <label class="setting-label">动画速度</label>
        <div class="speed-selector">
          <button 
            class="speed-btn" 
            v-for="speed in animationSpeeds" 
            :key="speed.key"
            :class="{ 'active': settings.animationSpeed === speed.key }"
            @click="updateAnimationSpeed(speed.key)"
          >
            {{ speed.name }}
          </button>
        </div>
      </div>
      
      <div class="setting-group" v-if="settings.enableAnimations">
        <label class="setting-label">减少动画</label>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.reduceMotion"
              @change="updateSettings"
            >
            <span class="slider"></span>
          </label>
          <span class="setting-desc">减少动画效果，适合对动画敏感的用户</span>
        </div>
      </div>
    </div>
    
    <!-- 字体设置 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>界面字体</h4>
        <p>设置界面文字的字体和大小</p>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">界面字体</label>
        <select 
          v-model="settings.interfaceFont" 
          @change="updateSettings"
          class="font-select"
        >
          <option 
            v-for="font in interfaceFonts" 
            :key="font.value" 
            :value="font.value"
          >
            {{ font.name }}
          </option>
        </select>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">字体大小</label>
        <div class="font-size-control">
          <input 
            type="range" 
            min="12" 
            max="18" 
            step="1" 
            v-model="settings.interfaceFontSize"
            @input="updateSettings"
            class="font-size-slider"
          >
          <span class="font-size-value">{{ settings.interfaceFontSize }}px</span>
        </div>
      </div>
      
      <div class="font-preview">
        <div 
          class="preview-text" 
          :style="{
            fontFamily: settings.interfaceFont,
            fontSize: settings.interfaceFontSize + 'px'
          }"
        >
          这是界面字体预览效果 - Interface Font Preview
        </div>
      </div>
    </div>
    
    <!-- 颜色设置 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>颜色设置</h4>
        <p>自定义界面主色调和强调色</p>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">主色调</label>
        <div class="color-palette">
          <div 
            class="color-option" 
            v-for="color in primaryColors" 
            :key="color.value"
            :class="{ 'active': settings.primaryColor === color.value }"
            @click="updatePrimaryColor(color.value)"
            :style="{ backgroundColor: color.value }"
            :title="color.name"
          >
            <i class="check-icon" v-if="settings.primaryColor === color.value">✓</i>
          </div>
          
          <div class="color-option custom" @click="showColorPicker = true">
            <i class="icon-palette"></i>
          </div>
        </div>
      </div>
      
      <div class="setting-group" v-if="showColorPicker">
        <label class="setting-label">自定义颜色</label>
        <div class="custom-color">
          <input 
            type="color" 
            v-model="customColor"
            @change="updateCustomColor"
            class="color-picker"
          >
          <input 
            type="text" 
            v-model="customColor"
            @change="updateCustomColor"
            class="color-input"
            placeholder="#007bff"
          >
          <button class="apply-btn" @click="applyCustomColor">应用</button>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">色彩饱和度</label>
        <div class="saturation-control">
          <input 
            type="range" 
            min="0.5" 
            max="1.5" 
            step="0.1" 
            v-model="settings.colorSaturation"
            @input="updateSettings"
            class="saturation-slider"
          >
          <span class="saturation-value">{{ Math.round(settings.colorSaturation * 100) }}%</span>
        </div>
      </div>
    </div>
    
    <!-- 高级设置 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>高级设置</h4>
        <p>更多界面定制选项</p>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">硬件加速</label>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.hardwareAcceleration"
              @change="updateSettings"
            >
            <span class="slider"></span>
          </label>
          <span class="setting-desc">启用GPU硬件加速，提升渲染性能</span>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">高DPI支持</label>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              v-model="settings.highDpiSupport"
              @change="updateSettings"
            >
            <span class="slider"></span>
          </label>
          <span class="setting-desc">优化高分辨率显示器的显示效果</span>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="setting-label">界面语言</label>
        <select 
          v-model="settings.language" 
          @change="updateLanguage"
          class="language-select"
        >
          <option 
            v-for="lang in languages" 
            :key="lang.code" 
            :value="lang.code"
          >
            {{ lang.name }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- 预设方案 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>预设方案</h4>
        <p>快速应用预定义的界面配置</p>
      </div>
      
      <div class="preset-grid">
        <div 
          class="preset-card" 
          v-for="preset in presets" 
          :key="preset.key"
          @click="applyPreset(preset)"
        >
          <div class="preset-preview">
            <div 
              class="preview-item" 
              v-for="(color, index) in preset.colors" 
              :key="index"
              :style="{ backgroundColor: color }"
            ></div>
          </div>
          <div class="preset-info">
            <h5>{{ preset.name }}</h5>
            <p>{{ preset.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 重置按钮 -->
    <div class="setting-actions">
      <button class="reset-btn" @click="resetToDefaults">
        <i class="icon-reset"></i>
        重置为默认设置
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, onMounted } from 'vue'

export default {
  name: 'InterfaceSettings',
  emits: ['interface-change'],
  setup(props, { emit }) {
    // 响应式数据
    const settings = reactive({
      theme: 'auto',
      autoTheme: false,
      darkStartTime: '18:00',
      lightStartTime: '06:00',
      windowMode: 'windowed',
      sidebarPosition: 'left',
      zoomLevel: 1.0,
      compactMode: false,
      enableAnimations: true,
      animationSpeed: 'normal',
      reduceMotion: false,
      interfaceFont: 'system',
      interfaceFontSize: 14,
      primaryColor: '#007bff',
      colorSaturation: 1.0,
      hardwareAcceleration: true,
      highDpiSupport: true,
      language: 'zh-CN'
    })
    
    const showColorPicker = ref(false)
    const customColor = ref('#007bff')
    
    // 主题选项
    const themes = ref([
      {
        key: 'light',
        name: '浅色主题',
        description: '明亮清爽的界面风格',
        preview: {
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid #e0e0e0'
        }
      },
      {
        key: 'dark',
        name: '深色主题',
        description: '护眼的深色界面风格',
        preview: {
          background: 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
          border: '1px solid #444'
        }
      },
      {
        key: 'auto',
        name: '跟随系统',
        description: '根据系统设置自动切换',
        preview: {
          background: 'linear-gradient(135deg, #ffffff 0%, #2a2a2a 100%)',
          border: '1px solid #999'
        }
      }
    ])
    
    // 窗口模式
    const windowModes = ref([
      {
        key: 'windowed',
        name: '窗口模式',
        description: '普通窗口显示',
        icon: 'icon-window'
      },
      {
        key: 'maximized',
        name: '最大化',
        description: '启动时最大化窗口',
        icon: 'icon-maximize'
      },
      {
        key: 'fullscreen',
        name: '全屏模式',
        description: '沉浸式全屏体验',
        icon: 'icon-fullscreen'
      }
    ])
    
    // 侧边栏位置
    const sidebarPositions = ref([
      { key: 'left', name: '左侧', icon: 'icon-sidebar-left' },
      { key: 'right', name: '右侧', icon: 'icon-sidebar-right' },
      { key: 'hidden', name: '隐藏', icon: 'icon-sidebar-hidden' }
    ])
    
    // 动画速度
    const animationSpeeds = ref([
      { key: 'slow', name: '慢速' },
      { key: 'normal', name: '正常' },
      { key: 'fast', name: '快速' }
    ])
    
    // 界面字体
    const interfaceFonts = ref([
      { name: '系统默认', value: 'system' },
      { name: '微软雅黑', value: 'Microsoft YaHei' },
      { name: '苹方', value: 'PingFang SC' },
      { name: 'Segoe UI', value: 'Segoe UI' },
      { name: 'Roboto', value: 'Roboto' },
      { name: 'Noto Sans', value: 'Noto Sans SC' }
    ])
    
    // 主色调选项
    const primaryColors = ref([
      { name: '蓝色', value: '#007bff' },
      { name: '绿色', value: '#28a745' },
      { name: '紫色', value: '#6f42c1' },
      { name: '红色', value: '#dc3545' },
      { name: '橙色', value: '#fd7e14' },
      { name: '青色', value: '#20c997' },
      { name: '粉色', value: '#e83e8c' },
      { name: '灰色', value: '#6c757d' }
    ])
    
    // 语言选项
    const languages = ref([
      { code: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', name: '繁體中文' },
      { code: 'en-US', name: 'English' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' }
    ])
    
    // 预设方案
    const presets = ref([
      {
        key: 'default',
        name: '默认方案',
        description: '系统默认的界面配置',
        colors: ['#007bff', '#f8f9fa', '#ffffff']
      },
      {
        key: 'dark-blue',
        name: '深蓝夜间',
        description: '深色主题配蓝色强调',
        colors: ['#1a1a1a', '#2a2a2a', '#007bff']
      },
      {
        key: 'green-nature',
        name: '自然绿意',
        description: '清新的绿色主题',
        colors: ['#f8fff8', '#e8f5e8', '#28a745']
      },
      {
        key: 'purple-elegant',
        name: '优雅紫调',
        description: '高雅的紫色配色',
        colors: ['#faf9ff', '#f0ebff', '#6f42c1']
      }
    ])
    
    // 方法
    const updateSettings = () => {
      emit('interface-change', { ...settings })
    }
    
    const updateTheme = (theme) => {
      settings.theme = theme
      updateSettings()
    }
    
    const updateSidebarPosition = (position) => {
      settings.sidebarPosition = position
      updateSettings()
    }
    
    const updateZoom = () => {
      document.documentElement.style.fontSize = `${settings.zoomLevel * 16}px`
      updateSettings()
    }
    
    const updateAnimationSpeed = (speed) => {
      settings.animationSpeed = speed
      
      // 应用动画速度到CSS变量
      const speedMap = {
        slow: '0.5s',
        normal: '0.3s',
        fast: '0.15s'
      }
      
      document.documentElement.style.setProperty(
        '--animation-duration',
        speedMap[speed]
      )
      
      updateSettings()
    }
    
    const updatePrimaryColor = (color) => {
      settings.primaryColor = color
      showColorPicker.value = false
      
      // 应用主色调到CSS变量
      document.documentElement.style.setProperty('--primary-color', color)
      
      updateSettings()
    }
    
    const updateCustomColor = () => {
      // 验证颜色格式
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      if (colorRegex.test(customColor.value)) {
        updatePrimaryColor(customColor.value)
      }
    }
    
    const applyCustomColor = () => {
      updateCustomColor()
      showColorPicker.value = false
    }
    
    const updateLanguage = () => {
      // 这里可以集成国际化库
      updateSettings()
    }
    
    const applyPreset = (preset) => {
      const presetConfigs = {
        default: {
          theme: 'auto',
          primaryColor: '#007bff',
          enableAnimations: true,
          animationSpeed: 'normal',
          compactMode: false
        },
        'dark-blue': {
          theme: 'dark',
          primaryColor: '#007bff',
          enableAnimations: true,
          animationSpeed: 'normal',
          compactMode: false
        },
        'green-nature': {
          theme: 'light',
          primaryColor: '#28a745',
          enableAnimations: true,
          animationSpeed: 'slow',
          compactMode: false
        },
        'purple-elegant': {
          theme: 'light',
          primaryColor: '#6f42c1',
          enableAnimations: true,
          animationSpeed: 'normal',
          compactMode: true
        }
      }
      
      const config = presetConfigs[preset.key]
      if (config) {
        Object.assign(settings, config)
        updateSettings()
      }
    }
    
    const resetToDefaults = () => {
      Object.assign(settings, {
        theme: 'auto',
        autoTheme: false,
        darkStartTime: '18:00',
        lightStartTime: '06:00',
        windowMode: 'windowed',
        sidebarPosition: 'left',
        zoomLevel: 1.0,
        compactMode: false,
        enableAnimations: true,
        animationSpeed: 'normal',
        reduceMotion: false,
        interfaceFont: 'system',
        interfaceFontSize: 14,
        primaryColor: '#007bff',
        colorSaturation: 1.0,
        hardwareAcceleration: true,
        highDpiSupport: true,
        language: 'zh-CN'
      })
      
      updateSettings()
    }
    
    // 监听设置变化
    watch(
      () => settings.colorSaturation,
      (newValue) => {
        document.documentElement.style.setProperty(
          '--color-saturation',
          newValue
        )
      }
    )
    
    // 生命周期
    onMounted(() => {
      // 初始化CSS变量
      document.documentElement.style.setProperty(
        '--primary-color',
        settings.primaryColor
      )
      document.documentElement.style.setProperty(
        '--color-saturation',
        settings.colorSaturation
      )
      
      // 加载保存的设置
      const savedSettings = localStorage.getItem('interface-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          Object.assign(settings, parsed)
        } catch (error) {
          console.error('加载界面设置失败:', error)
        }
      }
    })
    
    // 监听设置变化并保存
    watch(
      settings,
      (newSettings) => {
        localStorage.setItem('interface-settings', JSON.stringify(newSettings))
      },
      { deep: true }
    )
    
    return {
      settings,
      showColorPicker,
      customColor,
      themes,
      windowModes,
      sidebarPositions,
      animationSpeeds,
      interfaceFonts,
      primaryColors,
      languages,
      presets,
      updateSettings,
      updateTheme,
      updateSidebarPosition,
      updateZoom,
      updateAnimationSpeed,
      updatePrimaryColor,
      updateCustomColor,
      applyCustomColor,
      updateLanguage,
      applyPreset,
      resetToDefaults
    }
  }
}
</script>

<style scoped>
.interface-settings {
  padding: 0;
}

.settings-header {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.settings-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.setting-section {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-section:last-child {
  border-bottom: none;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-header p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.setting-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-desc {
  font-size: 13px;
  color: #666;
}

/* 主题选择器 */
.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.theme-option:hover {
  border-color: #007bff;
}

.theme-option.active {
  border-color: #007bff;
  background: #f8f9ff;
}

.theme-preview {
  width: 40px;
  height: 30px;
  border-radius: 4px;
  margin-right: 12px;
}

.theme-info {
  flex: 1;
}

.theme-name {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.theme-desc {
  font-size: 12px;
  color: #666;
}

.check-icon {
  color: #007bff;
  font-weight: bold;
}

/* 开关 */
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

/* 单选按钮组 */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-option:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.radio-option input {
  margin-right: 12px;
  margin-top: 2px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.radio-desc {
  font-size: 12px;
  color: #666;
  margin-left: 24px;
}

/* 位置选择器 */
.position-selector {
  display: flex;
  gap: 8px;
}

.position-btn {
  width: 48px;
  height: 48px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #666;
  transition: all 0.2s ease;
}

.position-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.position-btn.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
}

/* 缩放控制 */
.zoom-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
}

.zoom-value {
  min-width: 40px;
  text-align: right;
  font-weight: 500;
  color: #333;
}

/* 速度选择器 */
.speed-selector {
  display: flex;
  gap: 8px;
}

.speed-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s ease;
}

.speed-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.speed-btn.active {
  border-color: #007bff;
  background: #007bff;
  color: white;
}

/* 字体选择 */
.font-select,
.language-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  outline: none;
}

.font-select:focus,
.language-select:focus {
  border-color: #007bff;
}

/* 字体大小控制 */
.font-size-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.font-size-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e0e0e0;
  outline: none;
  -webkit-appearance: none;
}

.font-size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #007bff;
  cursor: pointer;
}

.font-size-value {
  min-width: 40px;
  text-align: right;
  font-weight: 500;
  color: #333;
}

/* 字体预览 */
.font-preview {
  margin-top: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.preview-text {
  color: #333;
  line-height: 1.5;
}

/* 颜色调色板 */
.color-palette {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: #333;
}

.color-option.custom {
  background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  border: 2px solid #e0e0e0;
}

.color-option .check-icon {
  color: white;
  font-weight: bold;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

/* 自定义颜色 */
.custom-color {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.color-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
  font-family: monospace;
}

.apply-btn {
  padding: 8px 16px;
  border: 1px solid #007bff;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.apply-btn:hover {
  background: #0056b3;
}

/* 饱和度控制 */
.saturation-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.saturation-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #ccc 0%, #007bff 100%);
  outline: none;
  -webkit-appearance: none;
}

.saturation-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2px solid #007bff;
  cursor: pointer;
}

.saturation-value {
  min-width: 40px;
  text-align: right;
  font-weight: 500;
  color: #333;
}

/* 预设方案 */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.preset-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.preset-preview {
  display: flex;
  height: 20px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.preview-item {
  flex: 1;
}

.preset-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.preset-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

/* 操作按钮 */
.setting-actions {
  padding: 24px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.reset-btn {
  padding: 10px 20px;
  border: 1px solid #dc3545;
  border-radius: 6px;
  background: white;
  color: #dc3545;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.reset-btn:hover {
  background: #dc3545;
  color: white;
}

/* 时间范围 */
.time-range {
  display: flex;
  gap: 16px;
}

.time-input {
  flex: 1;
}

.time-input label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;
}

.time-input input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

/* 图标 */
.icon-window::before { content: '🪟'; }
.icon-maximize::before { content: '⬜'; }
.icon-fullscreen::before { content: '⛶'; }
.icon-sidebar-left::before { content: '◧'; }
.icon-sidebar-right::before { content: '◨'; }
.icon-sidebar-hidden::before { content: '▢'; }
.icon-palette::before { content: '🎨'; }
.icon-reset::before { content: '🔄'; }

/* 响应式 */
@media (max-width: 768px) {
  .setting-section {
    padding: 16px;
  }
  
  .theme-selector {
    gap: 6px;
  }
  
  .theme-option {
    padding: 8px;
  }
  
  .color-palette {
    gap: 6px;
  }
  
  .color-option {
    width: 32px;
    height: 32px;
  }
  
  .preset-grid {
    grid-template-columns: 1fr;
  }
  
  .time-range {
    flex-direction: column;
    gap: 12px;
  }
}
</style>