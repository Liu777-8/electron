// 小说阅读模块入口文件
// 提供统一的模块导出和初始化

import { createNovelRoutes } from './router'
import { createNovelStores } from './stores'
import NovelHome from './views/NovelHome.vue'

// 导出小说模块的所有组件
export { default as NovelHome } from './views/NovelHome.vue'
export { default as NovelLibrary } from './views/NovelLibrary.vue'
export { default as NovelSettings } from './views/NovelSettings.vue'
export { default as OnlineReading } from './views/OnlineReading.vue'

// 导出核心服务
export { fileService } from './services/fileService'
export { parserService } from './services/parserService'
export { readerService } from './services/readerService'
export { stealthService } from './services/stealthService'

// 导出工具函数
export * from './utils'

// 导出性能优化工具
export { 
  debounce, 
  throttle, 
  delayExecution, 
  batchProcess,
  VirtualScroller,
  LazyImageLoader,
  MemoryManager,
  PerformanceMonitor,
  ResourcePreloader
} from './utils/performance'

// 导出用户体验工具
export {
  notificationManager,
  loadingManager,
  themeManager,
  smoothScrollTo,
  hapticFeedback,
  copyToClipboard,
  KeyboardNavigation,
  GestureRecognizer
} from './utils/userExperience'

// 导出测试工具
export {
  performanceTester,
  functionalTester,
  uiTester,
  testReporter,
  Assertions,
  MockDataGenerator
} from './utils/testing'

// 导出综合测试运行器
export { testRunner } from './tests/comprehensive.test'

// 模块初始化函数
export function initNovelModule(app) {
  // 注册小说相关的全局组件（如果需要）
  // app.component('NovelCard', NovelCard)
  
  console.log('小说阅读模块已初始化')
}

// 获取小说模块路由
export function getNovelRoutes() {
  return createNovelRoutes()
}

// 获取小说模块状态管理
export function getNovelStores() {
  return createNovelStores()
}

// 模块配置
export const novelModuleConfig = {
  name: 'novel',
  version: '1.0.0',
  description: '小说阅读模块',
  features: [
    'local-import',    // 本地导入
    'online-reading',  // 在线阅读
    'stealth-mode',    // 摸鱼模式
    'reading-window',  // 独立阅读窗口
    'progress-save',   // 进度保存
    'chapter-nav'      // 章节导航
  ]
}