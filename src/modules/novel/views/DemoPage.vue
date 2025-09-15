<template>
  <div class="demo-page">
    <!-- 页面头部 -->
    <header class="demo-header">
      <h1>小说阅读模块功能演示</h1>
      <p>展示所有已开发的功能模块和工具</p>
      
      <!-- 主题切换 -->
      <div class="theme-controls">
        <button @click="toggleTheme" class="theme-btn">
          {{ currentTheme === 'light' ? '🌙' : '☀️' }} 
          {{ currentTheme === 'light' ? '切换到暗色' : '切换到亮色' }}
        </button>
      </div>
    </header>

    <!-- 功能演示区域 -->
    <main class="demo-content">
      <!-- 通知系统演示 -->
      <section class="demo-section">
        <h2>📢 通知系统</h2>
        <div class="demo-controls">
          <button @click="showInfoNotification" class="btn btn-info">信息通知</button>
          <button @click="showSuccessNotification" class="btn btn-success">成功通知</button>
          <button @click="showWarningNotification" class="btn btn-warning">警告通知</button>
          <button @click="showErrorNotification" class="btn btn-error">错误通知</button>
          <button @click="clearNotifications" class="btn btn-secondary">清除所有</button>
        </div>
      </section>

      <!-- 加载状态演示 -->
      <section class="demo-section">
        <h2>⏳ 加载状态管理</h2>
        <div class="demo-controls">
          <button @click="startLoading" class="btn btn-primary" :disabled="isLoading">开始加载</button>
          <button @click="endLoading" class="btn btn-secondary" :disabled="!isLoading">结束加载</button>
          <span class="loading-status">状态: {{ isLoading ? '加载中...' : '空闲' }}</span>
        </div>
      </section>

      <!-- 性能工具演示 -->
      <section class="demo-section">
        <h2>⚡ 性能优化工具</h2>
        <div class="demo-controls">
          <button @click="testDebounce" class="btn btn-info">测试防抖</button>
          <button @click="testThrottle" class="btn btn-info">测试节流</button>
          <button @click="testBatchProcess" class="btn btn-info">测试批量处理</button>
          <button @click="testMemoryManager" class="btn btn-info">测试内存管理</button>
        </div>
        <div class="performance-results" v-if="performanceResults.length > 0">
          <h3>性能测试结果:</h3>
          <ul>
            <li v-for="result in performanceResults" :key="result.id">
              {{ result.name }}: {{ result.message }}
            </li>
          </ul>
        </div>
      </section>

      <!-- 用户体验工具演示 -->
      <section class="demo-section">
        <h2>🎯 用户体验工具</h2>
        <div class="demo-controls">
          <button @click="testSmoothScroll" class="btn btn-primary">平滑滚动到底部</button>
          <button @click="testHapticFeedback" class="btn btn-primary">触觉反馈</button>
          <button @click="testCopyToClipboard" class="btn btn-primary">复制到剪贴板</button>
        </div>
        
        <!-- 手势识别演示区域 -->
        <div class="gesture-demo" ref="gestureArea">
          <p>在此区域进行手势操作 (滑动、点击、长按)</p>
          <div class="gesture-log" v-if="gestureLog.length > 0">
            <h4>手势记录:</h4>
            <ul>
              <li v-for="log in gestureLog.slice(-5)" :key="log.id">
                {{ log.type }} - {{ log.timestamp }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 虚拟滚动演示 -->
      <section class="demo-section">
        <h2>📜 虚拟滚动</h2>
        <div class="virtual-scroll-demo">
          <div ref="virtualScrollContainer" class="virtual-container">
            <div 
              v-for="item in visibleItems" 
              :key="item.id"
              class="virtual-item"
              :style="{ transform: `translateY(${item.top}px)` }"
            >
              {{ item.content }}
            </div>
          </div>
        </div>
      </section>

      <!-- 模拟数据生成演示 -->
      <section class="demo-section">
        <h2>🎲 模拟数据生成</h2>
        <div class="demo-controls">
          <button @click="generateMockNovel" class="btn btn-success">生成小说数据</button>
          <button @click="generateMockChapter" class="btn btn-success">生成章节数据</button>
          <button @click="generateMockUser" class="btn btn-success">生成用户数据</button>
        </div>
        <div class="mock-data-display" v-if="mockData">
          <h3>生成的数据:</h3>
          <pre>{{ JSON.stringify(mockData, null, 2) }}</pre>
        </div>
      </section>

      <!-- 测试工具演示 -->
      <section class="demo-section">
        <h2>🧪 测试工具</h2>
        <div class="demo-controls">
          <button @click="runPerformanceTests" class="btn btn-warning" :disabled="testRunning">运行性能测试</button>
          <button @click="runFunctionalTests" class="btn btn-warning" :disabled="testRunning">运行功能测试</button>
          <button @click="runAllTests" class="btn btn-danger" :disabled="testRunning">运行所有测试</button>
          <button @click="exportTestReport" class="btn btn-info" :disabled="testResults.length === 0">导出测试报告</button>
        </div>
        <div class="test-results" v-if="testResults.length > 0">
          <h3>测试结果:</h3>
          <div v-for="result in testResults" :key="result.id" class="test-result-item">
            <h4>{{ result.suite || result.name }}</h4>
            <p v-if="result.passed !== undefined">
              通过: {{ result.passed }} | 失败: {{ result.failed }} | 总计: {{ result.total }}
            </p>
            <p v-if="result.duration">耗时: {{ result.duration }}ms</p>
            <p v-if="result.error" class="error">错误: {{ result.error }}</p>
          </div>
        </div>
      </section>

      <!-- 设置面板演示 -->
      <section class="demo-section">
        <h2>⚙️ 设置面板</h2>
        <div class="demo-controls">
          <button @click="showSettingsPanel" class="btn btn-primary">打开设置面板</button>
        </div>
      </section>
    </main>

    <!-- 设置面板 -->
    <SettingsPanel 
      v-if="settingsPanelVisible" 
      @close="settingsPanelVisible = false"
      @interface-settings-change="handleInterfaceSettingsChange"
      @data-change="handleDataChange"
    />

    <!-- 浮动操作按钮 -->
    <div class="floating-actions">
      <button @click="scrollToTop" class="fab" title="回到顶部">
        ↑
      </button>
      <button @click="clearAllData" class="fab" title="清除所有数据">
        🗑️
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import {
  notificationManager,
  loadingManager,
  themeManager,
  smoothScrollTo,
  hapticFeedback,
  copyToClipboard,
  GestureRecognizer
} from '../utils/userExperience.js'

import {
  debounce,
  throttle,
  batchProcess,
  VirtualScroller,
  MemoryManager
} from '../utils/performance.js'

import {
  performanceTester,
  functionalTester,
  MockDataGenerator
} from '../utils/testing.js'

import { testRunner } from '../tests/comprehensive.test.js'

import SettingsPanel from './SettingsPanel.vue'

export default {
  name: 'DemoPage',
  components: {
    SettingsPanel
  },
  setup() {
    // 响应式数据
    const currentTheme = ref(themeManager.getCurrentTheme())
    const isLoading = ref(false)
    const performanceResults = ref([])
    const gestureLog = ref([])
    const mockData = ref(null)
    const testResults = ref([])
    const testRunning = ref(false)
    const settingsPanelVisible = ref(false)
    const visibleItems = ref([])
    
    // 引用
    const gestureArea = ref(null)
    const virtualScrollContainer = ref(null)
    
    // 手势识别器
    let gestureRecognizer = null
    
    // 虚拟滚动器
    let virtualScroller = null
    
    // 内存管理器
    const memoryManager = new MemoryManager()
    
    // 防抖和节流函数
    const debouncedFunction = debounce(() => {
      addPerformanceResult('防抖测试', '防抖函数执行成功')
    }, 300)
    
    const throttledFunction = throttle(() => {
      addPerformanceResult('节流测试', '节流函数执行成功')
    }, 200)
    
    // 方法
    const toggleTheme = () => {
      themeManager.toggleTheme()
      currentTheme.value = themeManager.getCurrentTheme()
    }
    
    const showInfoNotification = () => {
      notificationManager.info('这是一个信息通知')
    }
    
    const showSuccessNotification = () => {
      notificationManager.success('操作成功完成！')
    }
    
    const showWarningNotification = () => {
      notificationManager.warning('请注意这个警告信息')
    }
    
    const showErrorNotification = () => {
      notificationManager.error('发生了一个错误')
    }
    
    const clearNotifications = () => {
      notificationManager.clear()
    }
    
    const startLoading = () => {
      loadingManager.start('demo-loading', '演示加载中...')
      isLoading.value = true
    }
    
    const endLoading = () => {
      loadingManager.end('demo-loading')
      isLoading.value = false
    }
    
    const addPerformanceResult = (name, message) => {
      performanceResults.value.push({
        id: Date.now(),
        name,
        message
      })
    }
    
    const testDebounce = () => {
      // 快速调用多次，只会执行一次
      for (let i = 0; i < 5; i++) {
        debouncedFunction()
      }
    }
    
    const testThrottle = () => {
      // 快速调用多次，会被限制频率
      for (let i = 0; i < 5; i++) {
        setTimeout(() => throttledFunction(), i * 50)
      }
    }
    
    const testBatchProcess = async () => {
      const items = Array.from({ length: 100 }, (_, i) => i)
      const startTime = Date.now()
      
      await batchProcess(items, async (batch) => {
        // 模拟处理
        await new Promise(resolve => setTimeout(resolve, 10))
        return batch.map(x => x * 2)
      }, { batchSize: 10 })
      
      const duration = Date.now() - startTime
      addPerformanceResult('批量处理', `处理100个项目，耗时${duration}ms`)
    }
    
    const testMemoryManager = () => {
      // 添加一些测试数据
      for (let i = 0; i < 10; i++) {
        memoryManager.set(`test-${i}`, { data: `value-${i}` })
      }
      
      const size = memoryManager.size()
      addPerformanceResult('内存管理', `存储了${size}个项目`)
      
      // 清理
      memoryManager.clear()
    }
    
    const testSmoothScroll = () => {
      const target = document.documentElement.scrollHeight - window.innerHeight
      smoothScrollTo(document.documentElement, target, 1000)
    }
    
    const testHapticFeedback = () => {
      hapticFeedback('medium')
      notificationManager.info('触觉反馈已触发（如果设备支持）')
    }
    
    const testCopyToClipboard = async () => {
      const text = '这是复制到剪贴板的测试文本'
      try {
        await copyToClipboard(text)
        notificationManager.success('文本已复制到剪贴板')
      } catch (error) {
        notificationManager.error('复制失败: ' + error.message)
      }
    }
    
    const addGestureLog = (type) => {
      gestureLog.value.push({
        id: Date.now(),
        type,
        timestamp: new Date().toLocaleTimeString()
      })
    }
    
    const generateMockNovel = () => {
      mockData.value = MockDataGenerator.generateNovel()
    }
    
    const generateMockChapter = () => {
      mockData.value = MockDataGenerator.generateChapter()
    }
    
    const generateMockUser = () => {
      mockData.value = MockDataGenerator.generateUser()
    }
    
    const runPerformanceTests = async () => {
      testRunning.value = true
      try {
        const results = await testRunner.runPerformanceTests()
        testResults.value = results
        notificationManager.success('性能测试完成')
      } catch (error) {
        notificationManager.error('性能测试失败: ' + error.message)
      } finally {
        testRunning.value = false
      }
    }
    
    const runFunctionalTests = async () => {
      testRunning.value = true
      try {
        // 运行部分功能测试
        const result = await functionalTester.runSuite('用户体验测试')
        testResults.value = [result]
        notificationManager.success('功能测试完成')
      } catch (error) {
        notificationManager.error('功能测试失败: ' + error.message)
      } finally {
        testRunning.value = false
      }
    }
    
    const runAllTests = async () => {
      testRunning.value = true
      try {
        const results = await testRunner.runAllTests()
        testResults.value = results
        notificationManager.success('所有测试完成')
      } catch (error) {
        notificationManager.error('测试运行失败: ' + error.message)
      } finally {
        testRunning.value = false
      }
    }
    
    const exportTestReport = () => {
      testRunner.exportReport()
      notificationManager.success('测试报告已导出')
    }
    
    const showSettingsPanel = () => {
      settingsPanelVisible.value = true
    }
    
    const handleInterfaceSettingsChange = (settings) => {
      console.log('界面设置变更:', settings)
      notificationManager.info('界面设置已更新')
    }
    
    const handleDataChange = (data) => {
      console.log('数据变更:', data)
      notificationManager.info('数据操作已执行')
    }
    
    const scrollToTop = () => {
      smoothScrollTo(document.documentElement, 0, 800)
    }
    
    const clearAllData = () => {
      performanceResults.value = []
      gestureLog.value = []
      mockData.value = null
      testResults.value = []
      memoryManager.clear()
      notificationManager.clear()
      notificationManager.success('所有数据已清除')
    }
    
    // 初始化虚拟滚动数据
    const initVirtualScroll = () => {
      const items = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        content: `虚拟滚动项目 ${i + 1}`,
        top: i * 50
      }))
      
      // 只显示前20个项目作为演示
      visibleItems.value = items.slice(0, 20)
    }
    
    // 生命周期
    onMounted(() => {
      // 初始化手势识别
      if (gestureArea.value) {
        gestureRecognizer = new GestureRecognizer(gestureArea.value)
        
        gestureRecognizer.on('tap', () => addGestureLog('点击'))
        gestureRecognizer.on('longPress', () => addGestureLog('长按'))
        gestureRecognizer.on('swipeLeft', () => addGestureLog('左滑'))
        gestureRecognizer.on('swipeRight', () => addGestureLog('右滑'))
        gestureRecognizer.on('swipeUp', () => addGestureLog('上滑'))
        gestureRecognizer.on('swipeDown', () => addGestureLog('下滑'))
      }
      
      // 初始化虚拟滚动
      initVirtualScroll()
      
      // 监听主题变化
      themeManager.onChange((theme) => {
        currentTheme.value = theme
      })
      
      // 显示欢迎消息
      setTimeout(() => {
        notificationManager.info('欢迎使用小说阅读模块功能演示！')
      }, 1000)
    })
    
    onUnmounted(() => {
      // 清理手势识别器
      if (gestureRecognizer) {
        gestureRecognizer.destroy()
      }
      
      // 清理虚拟滚动器
      if (virtualScroller) {
        virtualScroller.destroy()
      }
      
      // 清理内存管理器
      memoryManager.clear()
    })
    
    return {
      // 响应式数据
      currentTheme,
      isLoading,
      performanceResults,
      gestureLog,
      mockData,
      testResults,
      testRunning,
      settingsPanelVisible,
      visibleItems,
      
      // 引用
      gestureArea,
      virtualScrollContainer,
      
      // 方法
      toggleTheme,
      showInfoNotification,
      showSuccessNotification,
      showWarningNotification,
      showErrorNotification,
      clearNotifications,
      startLoading,
      endLoading,
      testDebounce,
      testThrottle,
      testBatchProcess,
      testMemoryManager,
      testSmoothScroll,
      testHapticFeedback,
      testCopyToClipboard,
      generateMockNovel,
      generateMockChapter,
      generateMockUser,
      runPerformanceTests,
      runFunctionalTests,
      runAllTests,
      exportTestReport,
      showSettingsPanel,
      handleInterfaceSettingsChange,
      handleDataChange,
      scrollToTop,
      clearAllData
    }
  }
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: var(--bg-color, #f5f5f5);
  color: var(--text-color, #333);
  transition: all 0.3s ease;
}

.demo-header {
  background: var(--header-bg, #fff);
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.demo-header h1 {
  margin: 0 0 0.5rem 0;
  color: var(--primary-color, #007bff);
  font-size: 2.5rem;
}

.demo-header p {
  margin: 0 0 1rem 0;
  color: var(--text-secondary, #666);
  font-size: 1.1rem;
}

.theme-controls {
  margin-top: 1rem;
}

.theme-btn {
  background: var(--primary-color, #007bff);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.theme-btn:hover {
  background: var(--primary-hover, #0056b3);
  transform: translateY(-2px);
}

.demo-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 4rem 2rem;
}

.demo-section {
  background: var(--card-bg, #fff);
  margin-bottom: 2rem;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.demo-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.demo-section h2 {
  margin: 0 0 1.5rem 0;
  color: var(--heading-color, #333);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color, #007bff);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #0056b3);
}

.btn-secondary {
  background: var(--secondary-color, #6c757d);
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-success {
  background: var(--success-color, #28a745);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-warning {
  background: var(--warning-color, #ffc107);
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-error {
  background: var(--error-color, #dc3545);
  color: white;
}

.btn-error:hover:not(:disabled) {
  background: #c82333;
}

.btn-info {
  background: var(--info-color, #17a2b8);
  color: white;
}

.btn-info:hover:not(:disabled) {
  background: #138496;
}

.btn-danger {
  background: var(--danger-color, #dc3545);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.loading-status {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--info-bg, #e7f3ff);
  color: var(--info-text, #0c5460);
  border-radius: 6px;
  font-weight: 500;
}

.performance-results,
.test-results {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--code-bg, #f8f9fa);
  border-radius: 6px;
  border-left: 4px solid var(--primary-color, #007bff);
}

.performance-results h3,
.test-results h3 {
  margin: 0 0 1rem 0;
  color: var(--heading-color, #333);
}

.performance-results ul,
.test-results ul {
  margin: 0;
  padding-left: 1.5rem;
}

.performance-results li,
.test-results li {
  margin-bottom: 0.5rem;
  color: var(--text-color, #333);
}

.gesture-demo {
  margin-top: 1rem;
  padding: 2rem;
  background: var(--gesture-bg, #f0f8ff);
  border: 2px dashed var(--primary-color, #007bff);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.gesture-demo:hover {
  background: var(--gesture-hover, #e6f3ff);
}

.gesture-log {
  margin-top: 1rem;
  text-align: left;
}

.gesture-log h4 {
  margin: 0 0 0.5rem 0;
  color: var(--heading-color, #333);
}

.gesture-log ul {
  margin: 0;
  padding-left: 1.5rem;
  max-height: 150px;
  overflow-y: auto;
}

.virtual-scroll-demo {
  margin-top: 1rem;
}

.virtual-container {
  height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  position: relative;
}

.virtual-item {
  height: 50px;
  padding: 1rem;
  border-bottom: 1px solid var(--border-light, #eee);
  display: flex;
  align-items: center;
  background: var(--item-bg, #fff);
  position: absolute;
  left: 0;
  right: 0;
  transition: all 0.2s ease;
}

.virtual-item:hover {
  background: var(--item-hover, #f8f9fa);
}

.mock-data-display {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.mock-data-display h3 {
  margin: 0 0 1rem 0;
  color: var(--heading-color, #333);
}

.mock-data-display pre {
  background: var(--code-bg, #f8f9fa);
  padding: 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0;
}

.test-result-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--result-bg, #fff);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
}

.test-result-item h4 {
  margin: 0 0 0.5rem 0;
  color: var(--heading-color, #333);
}

.test-result-item p {
  margin: 0.25rem 0;
  color: var(--text-color, #333);
}

.test-result-item .error {
  color: var(--error-color, #dc3545);
  font-weight: 500;
}

.floating-actions {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  z-index: 1000;
}

.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color, #007bff);
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab:hover {
  background: var(--primary-hover, #0056b3);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

/* 暗色主题 */
:global(.theme-dark) .demo-page {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  --text-secondary: #b0b0b0;
  --header-bg: #2d2d2d;
  --card-bg: #2d2d2d;
  --heading-color: #f0f0f0;
  --border-color: #404040;
  --border-light: #353535;
  --code-bg: #1e1e1e;
  --item-bg: #2d2d2d;
  --item-hover: #353535;
  --gesture-bg: #1e2a3a;
  --gesture-hover: #243040;
  --info-bg: #1e3a4a;
  --info-text: #7dd3fc;
  --result-bg: #2d2d2d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-header {
    padding: 1.5rem 1rem;
  }
  
  .demo-header h1 {
    font-size: 2rem;
  }
  
  .demo-content {
    padding: 0 1rem 4rem 1rem;
  }
  
  .demo-section {
    padding: 1.5rem;
  }
  
  .demo-controls {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
  
  .floating-actions {
    bottom: 1rem;
    right: 1rem;
  }
}

@media (max-width: 480px) {
  .demo-header h1 {
    font-size: 1.5rem;
  }
  
  .demo-section {
    padding: 1rem;
  }
  
  .gesture-demo {
    padding: 1rem;
  }
  
  .virtual-container {
    height: 200px;
  }
}
</style>