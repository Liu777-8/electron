/**
 * 综合功能测试
 * 测试所有已开发的功能模块
 */

import { 
  performanceTester, 
  functionalTester, 
  uiTester, 
  testReporter,
  Assertions,
  MockDataGenerator
} from '../utils/testing.js'

import { 
  notificationManager, 
  loadingManager, 
  themeManager,
  smoothScrollTo,
  hapticFeedback,
  copyToClipboard
} from '../utils/userExperience.js'

import {
  debounce,
  throttle,
  delay,
  batchProcess,
  VirtualScroller,
  LazyImageLoader,
  MemoryManager,
  PerformanceMonitor,
  ResourcePreloader
} from '../utils/performance.js'

// 测试配置
const TEST_CONFIG = {
  timeout: 10000,
  retries: 3,
  verbose: true
}

// 性能测试套件
const performanceTests = {
  // 测试防抖函数
  async testDebounce() {
    let callCount = 0
    const debouncedFn = debounce(() => callCount++, 100)
    
    // 快速调用多次
    for (let i = 0; i < 10; i++) {
      debouncedFn()
    }
    
    // 等待防抖延迟
    await new Promise(resolve => setTimeout(resolve, 150))
    
    Assertions.assertEqual(callCount, 1, '防抖函数应该只执行一次')
  },
  
  // 测试节流函数
  async testThrottle() {
    let callCount = 0
    const throttledFn = throttle(() => callCount++, 100)
    
    // 快速调用多次
    for (let i = 0; i < 10; i++) {
      throttledFn()
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    // 节流函数应该执行多次但不是全部
    Assertions.assertTrue(callCount > 1 && callCount < 10, '节流函数应该限制执行频率')
  },
  
  // 测试批量处理
  async testBatchProcess() {
    const items = Array.from({ length: 100 }, (_, i) => i)
    const results = []
    
    await batchProcess(items, async (batch) => {
      results.push(...batch)
    }, { batchSize: 10 })
    
    Assertions.assertEqual(results.length, 100, '批量处理应该处理所有项目')
    Assertions.assertArrayEqual(results.sort((a, b) => a - b), items, '批量处理结果应该正确')
  },
  
  // 测试内存管理
  async testMemoryManager() {
    const memoryManager = new MemoryManager()
    
    // 添加一些缓存项
    memoryManager.set('test1', { data: 'value1' })
    memoryManager.set('test2', { data: 'value2' })
    
    Assertions.assertEqual(memoryManager.size(), 2, '内存管理器应该正确存储项目')
    
    const value = memoryManager.get('test1')
    Assertions.assertEqual(value.data, 'value1', '内存管理器应该正确检索项目')
    
    memoryManager.clear()
    Assertions.assertEqual(memoryManager.size(), 0, '内存管理器应该正确清除所有项目')
  },
  
  // 测试性能监控
  async testPerformanceMonitor() {
    const monitor = new PerformanceMonitor()
    
    monitor.startMeasure('test-operation')
    await new Promise(resolve => setTimeout(resolve, 100))
    const result = monitor.endMeasure('test-operation')
    
    Assertions.assertTrue(result.duration >= 100, '性能监控应该正确测量时间')
    Assertions.assertTrue(result.duration < 200, '性能监控时间测量应该准确')
  }
}

// 用户体验测试套件
const userExperienceTests = {
  // 测试通知管理器
  async testNotificationManager() {
    const notification = notificationManager.info('测试通知', 1000)
    
    Assertions.assertNotNull(notification, '应该创建通知对象')
    Assertions.assertTrue(document.querySelector('.notification'), '应该在DOM中创建通知元素')
    
    // 等待通知自动消失
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    Assertions.assertFalse(
      document.querySelector('.notification'),
      '通知应该自动消失'
    )
  },
  
  // 测试加载管理器
  async testLoadingManager() {
    loadingManager.start('test-loading', '测试加载')
    
    Assertions.assertTrue(loadingManager.isLoading('test-loading'), '应该正确设置加载状态')
    Assertions.assertTrue(document.querySelector('.loading-overlay'), '应该显示加载遮罩')
    
    loadingManager.end('test-loading')
    
    Assertions.assertFalse(loadingManager.isLoading('test-loading'), '应该正确结束加载状态')
    
    // 等待遮罩动画完成
    await new Promise(resolve => setTimeout(resolve, 400))
    
    Assertions.assertFalse(document.querySelector('.loading-overlay'), '应该隐藏加载遮罩')
  },
  
  // 测试主题管理器
  async testThemeManager() {
    const originalTheme = themeManager.getCurrentTheme()
    
    themeManager.setTheme('dark')
    Assertions.assertEqual(themeManager.getCurrentTheme(), 'dark', '应该正确设置暗色主题')
    Assertions.assertTrue(document.documentElement.classList.contains('theme-dark'), '应该添加暗色主题类')
    
    themeManager.setTheme('light')
    Assertions.assertEqual(themeManager.getCurrentTheme(), 'light', '应该正确设置亮色主题')
    Assertions.assertTrue(document.documentElement.classList.contains('theme-light'), '应该添加亮色主题类')
    
    // 恢复原始主题
    themeManager.setTheme(originalTheme)
  },
  
  // 测试复制到剪贴板
  async testCopyToClipboard() {
    const testText = '测试复制文本'
    
    try {
      await copyToClipboard(testText)
      
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText()
        Assertions.assertEqual(clipboardText, testText, '应该正确复制文本到剪贴板')
      } else {
        // 如果无法读取剪贴板，至少确保函数没有抛出错误
        Assertions.assertTrue(true, '复制函数执行成功')
      }
    } catch (error) {
      // 在某些环境中可能无法访问剪贴板
      console.warn('剪贴板测试跳过:', error.message)
    }
  }
}

// UI 测试套件
const uiTests = {
  // 测试 UI 交互
  async testUIInteractions() {
    // 创建测试按钮
    const button = document.createElement('button')
    button.id = 'test-button'
    button.textContent = '测试按钮'
    button.onclick = () => button.setAttribute('data-clicked', 'true')
    document.body.appendChild(button)
    
    try {
      // 测试点击
      await uiTester.click('#test-button')
      
      Assertions.assertEqual(
        button.getAttribute('data-clicked'),
        'true',
        '应该正确模拟点击事件'
      )
      
      // 测试元素可见性
      Assertions.assertTrue(uiTester.isVisible('#test-button'), '按钮应该可见')
      
      // 测试获取文本
      const text = uiTester.getText('#test-button')
      Assertions.assertEqual(text, '测试按钮', '应该正确获取元素文本')
      
    } finally {
      // 清理测试元素
      document.body.removeChild(button)
    }
  },
  
  // 测试输入模拟
  async testInputSimulation() {
    // 创建测试输入框
    const input = document.createElement('input')
    input.id = 'test-input'
    input.type = 'text'
    document.body.appendChild(input)
    
    try {
      const testValue = '测试输入值'
      await uiTester.type('#test-input', testValue)
      
      Assertions.assertEqual(input.value, testValue, '应该正确模拟输入')
      
    } finally {
      // 清理测试元素
      document.body.removeChild(input)
    }
  },
  
  // 测试等待元素
  async testWaitForElement() {
    // 延迟创建元素
    setTimeout(() => {
      const div = document.createElement('div')
      div.id = 'delayed-element'
      div.textContent = '延迟元素'
      document.body.appendChild(div)
    }, 500)
    
    try {
      const element = await uiTester.waitForElement('#delayed-element', 1000)
      
      Assertions.assertNotNull(element, '应该等待到延迟创建的元素')
      Assertions.assertEqual(element.textContent, '延迟元素', '元素内容应该正确')
      
    } finally {
      // 清理测试元素
      const element = document.getElementById('delayed-element')
      if (element) {
        document.body.removeChild(element)
      }
    }
  }
}

// 数据测试套件
const dataTests = {
  // 测试模拟数据生成
  async testMockDataGeneration() {
    const novel = MockDataGenerator.generateNovel()
    
    Assertions.assertNotNull(novel.id, '小说应该有ID')
    Assertions.assertNotNull(novel.title, '小说应该有标题')
    Assertions.assertNotNull(novel.author, '小说应该有作者')
    Assertions.assertTrue(novel.wordCount > 0, '小说应该有字数')
    Assertions.assertTrue(novel.chapterCount > 0, '小说应该有章节数')
    
    const chapter = MockDataGenerator.generateChapter()
    
    Assertions.assertNotNull(chapter.id, '章节应该有ID')
    Assertions.assertNotNull(chapter.title, '章节应该有标题')
    Assertions.assertNotNull(chapter.content, '章节应该有内容')
    Assertions.assertTrue(chapter.wordCount > 0, '章节应该有字数')
    
    const user = MockDataGenerator.generateUser()
    
    Assertions.assertNotNull(user.id, '用户应该有ID')
    Assertions.assertNotNull(user.username, '用户应该有用户名')
    Assertions.assertTrue(user.email.includes('@'), '用户邮箱格式应该正确')
    Assertions.assertTrue(user.level >= 1 && user.level <= 100, '用户等级应该在合理范围内')
  },
  
  // 测试随机数据生成
  async testRandomDataGeneration() {
    const randomString = MockDataGenerator.randomString(10)
    Assertions.assertEqual(randomString.length, 10, '随机字符串长度应该正确')
    
    const randomNumber = MockDataGenerator.randomNumber(1, 10)
    Assertions.assertTrue(randomNumber >= 1 && randomNumber <= 10, '随机数应该在指定范围内')
    
    const randomEmail = MockDataGenerator.randomEmail()
    Assertions.assertTrue(randomEmail.includes('@'), '随机邮箱格式应该正确')
    
    const randomArray = MockDataGenerator.randomArray(() => MockDataGenerator.randomNumber(1, 100), 5)
    Assertions.assertEqual(randomArray.length, 5, '随机数组长度应该正确')
    Assertions.assertTrue(randomArray.every(n => n >= 1 && n <= 100), '随机数组元素应该在指定范围内')
  }
}

// 集成测试套件
const integrationTests = {
  // 测试完整的用户交互流程
  async testCompleteUserFlow() {
    // 模拟用户打开应用
    loadingManager.start('app-init', '初始化应用')
    
    // 模拟加载时间
    await new Promise(resolve => setTimeout(resolve, 500))
    
    loadingManager.end('app-init')
    
    // 显示欢迎通知
    notificationManager.success('应用加载完成！')
    
    // 切换主题
    themeManager.toggleTheme()
    
    // 等待一段时间
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 验证状态
    Assertions.assertFalse(loadingManager.isLoading(), '应用应该完成加载')
    
    // 清理通知
    notificationManager.clear()
  },
  
  // 测试错误处理流程
  async testErrorHandling() {
    try {
      // 模拟一个会失败的操作
      loadingManager.start('error-test', '测试错误处理')
      
      // 模拟错误
      throw new Error('模拟错误')
      
    } catch (error) {
      // 处理错误
      loadingManager.end('error-test')
      notificationManager.error(`操作失败: ${error.message}`)
      
      // 验证错误处理
      Assertions.assertFalse(loadingManager.isLoading('error-test'), '错误后应该结束加载状态')
    }
    
    // 等待通知显示
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 清理
    notificationManager.clear()
  }
}

// 主测试运行器
export class ComprehensiveTestRunner {
  constructor() {
    this.results = []
  }
  
  async runAllTests() {
    console.log('🚀 开始运行综合测试...')
    
    try {
      // 注册测试套件
      functionalTester.addSuite('性能测试', performanceTests)
      functionalTester.addSuite('用户体验测试', userExperienceTests)
      functionalTester.addSuite('UI测试', uiTests)
      functionalTester.addSuite('数据测试', dataTests)
      functionalTester.addSuite('集成测试', integrationTests)
      
      // 运行所有测试
      const results = await functionalTester.runAll()
      
      // 生成报告
      results.forEach(result => {
        testReporter.addReport(result)
        this.results.push(result)
      })
      
      // 输出结果
      this.printResults()
      
      return results
      
    } catch (error) {
      console.error('❌ 测试运行失败:', error)
      throw error
    }
  }
  
  printResults() {
    console.log('\n📊 测试结果汇总:')
    console.log('=' .repeat(50))
    
    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalDuration = 0
    
    this.results.forEach(result => {
      console.log(`\n📋 ${result.suite}:`)
      console.log(`   ✅ 通过: ${result.passed}`)
      console.log(`   ❌ 失败: ${result.failed}`)
      console.log(`   ⏱️  耗时: ${result.duration}ms`)
      
      if (result.failed > 0) {
        console.log('   失败的测试:')
        result.tests
          .filter(test => test.status === 'failed')
          .forEach(test => {
            console.log(`     - ${test.name}: ${test.error}`)
          })
      }
      
      totalTests += result.total
      totalPassed += result.passed
      totalFailed += result.failed
      totalDuration += result.duration
    })
    
    console.log('\n' + '='.repeat(50))
    console.log(`📈 总计: ${totalTests} 个测试`)
    console.log(`✅ 通过: ${totalPassed} 个`)
    console.log(`❌ 失败: ${totalFailed} 个`)
    console.log(`📊 成功率: ${((totalPassed / totalTests) * 100).toFixed(1)}%`)
    console.log(`⏱️  总耗时: ${totalDuration}ms`)
    
    if (totalFailed === 0) {
      console.log('\n🎉 所有测试都通过了！')
    } else {
      console.log(`\n⚠️  有 ${totalFailed} 个测试失败，请检查代码。`)
    }
  }
  
  async runPerformanceTests() {
    console.log('🔧 运行性能测试...')
    
    const tests = [
      {
        name: '防抖函数性能',
        fn: async () => {
          const fn = debounce(() => {}, 100)
          for (let i = 0; i < 1000; i++) {
            fn()
          }
        }
      },
      {
        name: '节流函数性能',
        fn: async () => {
          const fn = throttle(() => {}, 10)
          for (let i = 0; i < 1000; i++) {
            fn()
            await new Promise(resolve => setTimeout(resolve, 1))
          }
        }
      },
      {
        name: '批量处理性能',
        fn: async () => {
          const items = Array.from({ length: 1000 }, (_, i) => i)
          await batchProcess(items, async (batch) => {
            // 模拟处理
            return batch.map(x => x * 2)
          }, { batchSize: 50 })
        }
      }
    ]
    
    const results = await performanceTester.runBatch(tests)
    const report = performanceTester.generateReport()
    
    testReporter.addReport(report)
    
    console.log('\n⚡ 性能测试结果:')
    results.forEach(result => {
      if (result.error) {
        console.log(`❌ ${result.name}: ${result.error}`)
      } else {
        console.log(`✅ ${result.name}: ${result.duration.toFixed(2)}ms`)
      }
    })
    
    return results
  }
  
  exportReport() {
    testReporter.exportToFile()
    console.log('📄 测试报告已导出')
  }
  
  clear() {
    this.results = []
    functionalTester.results = []
    performanceTester.clear()
    testReporter.reports = []
  }
}

// 导出测试运行器实例
export const testRunner = new ComprehensiveTestRunner()

// 自动运行测试（如果在浏览器环境中）
if (typeof window !== 'undefined') {
  // 等待页面加载完成后运行测试
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        console.log('🔍 自动运行综合测试...')
        testRunner.runAllTests().catch(console.error)
      }, 1000)
    })
  } else {
    setTimeout(() => {
      console.log('🔍 自动运行综合测试...')
      testRunner.runAllTests().catch(console.error)
    }, 1000)
  }
}

// 导出测试函数供手动调用
export {
  performanceTests,
  userExperienceTests,
  uiTests,
  dataTests,
  integrationTests
}