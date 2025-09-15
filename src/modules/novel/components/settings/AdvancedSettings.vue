<template>
  <div class="advanced-settings">
    <div class="settings-header">
      <h3>高级设置</h3>
      <p class="settings-description">性能优化、调试选项等高级功能</p>
    </div>

    <div class="settings-content">
      <!-- 性能优化 -->
      <div class="settings-section">
        <h4>性能优化</h4>
        
        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">渲染模式</label>
            <p class="setting-description">选择页面渲染方式，影响性能和兼容性</p>
          </div>
          <select v-model="renderMode" @change="updateRenderMode" class="setting-select">
            <option value="canvas">Canvas渲染（推荐）</option>
            <option value="svg">SVG渲染</option>
            <option value="dom">DOM渲染</option>
          </select>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">预加载页数</label>
            <p class="setting-description">提前加载的页面数量，增加可提升翻页速度</p>
          </div>
          <div class="setting-input-group">
            <input 
              type="range" 
              v-model="preloadPages" 
              @input="updatePreloadPages"
              min="1" 
              max="10" 
              class="setting-range"
            >
            <span class="setting-value">{{ preloadPages }}页</span>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">缓存大小限制</label>
            <p class="setting-description">限制内存中缓存的最大大小</p>
          </div>
          <div class="setting-input-group">
            <input 
              type="range" 
              v-model="cacheSize" 
              @input="updateCacheSize"
              min="50" 
              max="500" 
              step="50"
              class="setting-range"
            >
            <span class="setting-value">{{ cacheSize }}MB</span>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableGPUAcceleration"
              @change="updateGPUAcceleration"
            >
            <span>启用GPU加速</span>
          </label>
          <p class="setting-description">使用显卡加速渲染，可能提升性能但增加功耗</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableLazyLoading"
              @change="updateLazyLoading"
            >
            <span>启用懒加载</span>
          </label>
          <p class="setting-description">仅在需要时加载内容，节省内存和网络流量</p>
        </div>
      </div>

      <!-- 调试选项 -->
      <div class="settings-section">
        <h4>调试选项</h4>
        
        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableDebugMode"
              @change="updateDebugMode"
            >
            <span>启用调试模式</span>
          </label>
          <p class="setting-description">显示详细的调试信息和性能指标</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="showPerformanceStats"
              @change="updatePerformanceStats"
            >
            <span>显示性能统计</span>
          </label>
          <p class="setting-description">在界面上显示FPS、内存使用等性能数据</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableConsoleLogging"
              @change="updateConsoleLogging"
            >
            <span>启用控制台日志</span>
          </label>
          <p class="setting-description">在浏览器控制台输出详细日志信息</p>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <label class="setting-label">日志级别</label>
            <p class="setting-description">设置日志输出的详细程度</p>
          </div>
          <select v-model="logLevel" @change="updateLogLevel" class="setting-select">
            <option value="error">错误</option>
            <option value="warn">警告</option>
            <option value="info">信息</option>
            <option value="debug">调试</option>
            <option value="trace">跟踪</option>
          </select>
        </div>
      </div>

      <!-- 实验性功能 -->
      <div class="settings-section">
        <h4>实验性功能</h4>
        <div class="warning-notice">
          <i class="icon-warning"></i>
          <span>以下功能仍在开发中，可能不稳定或导致问题</span>
        </div>
        
        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableWebGL"
              @change="updateWebGL"
            >
            <span>WebGL渲染引擎</span>
          </label>
          <p class="setting-description">使用WebGL进行高性能渲染（实验性）</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableWorkerThreads"
              @change="updateWorkerThreads"
            >
            <span>Web Worker多线程</span>
          </label>
          <p class="setting-description">使用Web Worker进行后台处理（实验性）</p>
        </div>

        <div class="setting-item">
          <label class="setting-checkbox">
            <input 
              type="checkbox" 
              v-model="enableOffscreenCanvas"
              @change="updateOffscreenCanvas"
            >
            <span>离屏Canvas</span>
          </label>
          <p class="setting-description">使用OffscreenCanvas提升渲染性能（实验性）</p>
        </div>
      </div>

      <!-- 开发者工具 -->
      <div class="settings-section">
        <h4>开发者工具</h4>
        
        <div class="developer-actions">
          <button class="btn btn-secondary" @click="clearAllCache">
            <i class="icon-trash"></i>
            清除所有缓存
          </button>
          
          <button class="btn btn-secondary" @click="exportDebugInfo">
            <i class="icon-export"></i>
            导出调试信息
          </button>
          
          <button class="btn btn-secondary" @click="runPerformanceTest">
            <i class="icon-speedometer"></i>
            性能测试
          </button>
          
          <button class="btn btn-danger" @click="resetToFactory">
            <i class="icon-reset"></i>
            恢复出厂设置
          </button>
        </div>
      </div>

      <!-- 系统信息 -->
      <div class="settings-section">
        <h4>系统信息</h4>
        
        <div class="system-info">
          <div class="info-item">
            <span class="info-label">浏览器:</span>
            <span class="info-value">{{ systemInfo.browser }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">操作系统:</span>
            <span class="info-value">{{ systemInfo.os }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">屏幕分辨率:</span>
            <span class="info-value">{{ systemInfo.screenResolution }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">可用内存:</span>
            <span class="info-value">{{ systemInfo.memory }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">GPU信息:</span>
            <span class="info-value">{{ systemInfo.gpu }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '../../stores/settings.js'

export default {
  name: 'AdvancedSettings',
  setup() {
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const renderMode = ref('canvas')
    const preloadPages = ref(3)
    const cacheSize = ref(200)
    const enableGPUAcceleration = ref(true)
    const enableLazyLoading = ref(true)
    const enableDebugMode = ref(false)
    const showPerformanceStats = ref(false)
    const enableConsoleLogging = ref(false)
    const logLevel = ref('info')
    const enableWebGL = ref(false)
    const enableWorkerThreads = ref(false)
    const enableOffscreenCanvas = ref(false)
    
    // 系统信息
    const systemInfo = ref({
      browser: '',
      os: '',
      screenResolution: '',
      memory: '',
      gpu: ''
    })
    
    // 方法
    const updateRenderMode = () => {
      settingsStore.updateSettings({ renderMode: renderMode.value })
    }
    
    const updatePreloadPages = () => {
      settingsStore.updateSettings({ preloadPages: preloadPages.value })
    }
    
    const updateCacheSize = () => {
      settingsStore.updateSettings({ cacheSize: cacheSize.value })
    }
    
    const updateGPUAcceleration = () => {
      settingsStore.updateSettings({ enableGPUAcceleration: enableGPUAcceleration.value })
    }
    
    const updateLazyLoading = () => {
      settingsStore.updateSettings({ enableLazyLoading: enableLazyLoading.value })
    }
    
    const updateDebugMode = () => {
      settingsStore.updateSettings({ enableDebugMode: enableDebugMode.value })
      
      // 根据调试模式状态调整其他设置
      if (enableDebugMode.value) {
        enableConsoleLogging.value = true
        updateConsoleLogging()
      }
    }
    
    const updatePerformanceStats = () => {
      settingsStore.updateSettings({ showPerformanceStats: showPerformanceStats.value })
    }
    
    const updateConsoleLogging = () => {
      settingsStore.updateSettings({ enableConsoleLogging: enableConsoleLogging.value })
    }
    
    const updateLogLevel = () => {
      settingsStore.updateSettings({ logLevel: logLevel.value })
    }
    
    const updateWebGL = () => {
      settingsStore.updateSettings({ enableWebGL: enableWebGL.value })
    }
    
    const updateWorkerThreads = () => {
      settingsStore.updateSettings({ enableWorkerThreads: enableWorkerThreads.value })
    }
    
    const updateOffscreenCanvas = () => {
      settingsStore.updateSettings({ enableOffscreenCanvas: enableOffscreenCanvas.value })
    }
    
    const clearAllCache = () => {
      if (confirm('确定要清除所有缓存吗？这将删除所有已缓存的内容。')) {
        // 清除各种缓存
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name)
            })
          })
        }
        
        // 清除localStorage
        localStorage.clear()
        
        // 清除sessionStorage
        sessionStorage.clear()
        
        alert('缓存已清除完成')
      }
    }
    
    const exportDebugInfo = () => {
      const debugInfo = {
        timestamp: new Date().toISOString(),
        settings: settingsStore.settings,
        systemInfo: systemInfo.value,
        performance: {
          memory: performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          } : null,
          timing: performance.timing,
          navigation: performance.navigation
        },
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        }
      }
      
      const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `debug-info-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
    
    const runPerformanceTest = () => {
      const startTime = performance.now()
      
      // 模拟一些计算密集型操作
      let result = 0
      for (let i = 0; i < 1000000; i++) {
        result += Math.random() * Math.sin(i)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      alert(`性能测试完成\n执行时间: ${duration.toFixed(2)}ms\n计算结果: ${result.toFixed(6)}`)
    }
    
    const resetToFactory = () => {
      if (confirm('确定要恢复出厂设置吗？这将清除所有自定义配置。')) {
        settingsStore.resetSettings()
        loadSettings()
        alert('已恢复出厂设置')
      }
    }
    
    const detectSystemInfo = () => {
      // 检测浏览器
      const ua = navigator.userAgent
      let browser = 'Unknown'
      if (ua.includes('Chrome')) browser = 'Chrome'
      else if (ua.includes('Firefox')) browser = 'Firefox'
      else if (ua.includes('Safari')) browser = 'Safari'
      else if (ua.includes('Edge')) browser = 'Edge'
      
      // 检测操作系统
      let os = 'Unknown'
      if (ua.includes('Windows')) os = 'Windows'
      else if (ua.includes('Mac')) os = 'macOS'
      else if (ua.includes('Linux')) os = 'Linux'
      else if (ua.includes('Android')) os = 'Android'
      else if (ua.includes('iOS')) os = 'iOS'
      
      // 屏幕分辨率
      const screenResolution = `${screen.width}x${screen.height}`
      
      // 内存信息
      let memory = 'Unknown'
      if (performance.memory) {
        const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)
        const total = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(1)
        memory = `${used}MB / ${total}MB`
      }
      
      // GPU信息
      let gpu = 'Unknown'
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          if (debugInfo) {
            gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          }
        }
      } catch (e) {
        // GPU信息获取失败
      }
      
      systemInfo.value = {
        browser,
        os,
        screenResolution,
        memory,
        gpu
      }
    }
    
    const loadSettings = () => {
      const settings = settingsStore.settings
      
      renderMode.value = settings.renderMode || 'canvas'
      preloadPages.value = settings.preloadPages || 3
      cacheSize.value = settings.cacheSize || 200
      enableGPUAcceleration.value = settings.enableGPUAcceleration !== false
      enableLazyLoading.value = settings.enableLazyLoading !== false
      enableDebugMode.value = settings.enableDebugMode || false
      showPerformanceStats.value = settings.showPerformanceStats || false
      enableConsoleLogging.value = settings.enableConsoleLogging || false
      logLevel.value = settings.logLevel || 'info'
      enableWebGL.value = settings.enableWebGL || false
      enableWorkerThreads.value = settings.enableWorkerThreads || false
      enableOffscreenCanvas.value = settings.enableOffscreenCanvas || false
    }
    
    // 生命周期
    onMounted(() => {
      loadSettings()
      detectSystemInfo()
    })
    
    return {
      renderMode,
      preloadPages,
      cacheSize,
      enableGPUAcceleration,
      enableLazyLoading,
      enableDebugMode,
      showPerformanceStats,
      enableConsoleLogging,
      logLevel,
      enableWebGL,
      enableWorkerThreads,
      enableOffscreenCanvas,
      systemInfo,
      updateRenderMode,
      updatePreloadPages,
      updateCacheSize,
      updateGPUAcceleration,
      updateLazyLoading,
      updateDebugMode,
      updatePerformanceStats,
      updateConsoleLogging,
      updateLogLevel,
      updateWebGL,
      updateWorkerThreads,
      updateOffscreenCanvas,
      clearAllCache,
      exportDebugInfo,
      runPerformanceTest,
      resetToFactory
    }
  }
}
</script>

<style scoped>
.advanced-settings {
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

.settings-section {
  margin-bottom: 40px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.settings-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color-light);
}

.setting-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.setting-info {
  flex: 1;
  margin-right: 20px;
}

.setting-label {
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.setting-description {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.setting-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
}

.setting-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-width: 160px;
}

.setting-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-range {
  width: 120px;
}

.setting-value {
  font-weight: 500;
  color: var(--text-primary);
  min-width: 50px;
}

.warning-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--warning-color-light);
  border: 1px solid var(--warning-color);
  border-radius: 6px;
  margin-bottom: 20px;
  color: var(--warning-color-dark);
  font-size: 14px;
}

.developer-actions {
  display: flex;
  flex-wrap: wrap;
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

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-danger {
  background: var(--danger-color);
  color: white;
}

.btn-danger:hover {
  background: var(--danger-color-dark);
}

.system-info {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.info-label {
  font-weight: 500;
  color: var(--text-secondary);
}

.info-value {
  font-family: monospace;
  color: var(--text-primary);
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .setting-info {
    margin-right: 0;
  }
  
  .developer-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>