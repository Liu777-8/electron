/**
 * Node.js环境下的测试文件
 * 只测试不依赖浏览器API的功能
 */

// 导入性能工具（不依赖浏览器API）
import {
  debounce,
  throttle,
  delay,
  batchProcess,
  MemoryManager,
  PerformanceMonitor
} from '../utils/performance.js'

// 导入测试工具
import {
  MockDataGenerator
} from '../utils/testing.js'

// 测试结果收集器
class TestCollector {
  constructor() {
    this.results = []
    this.startTime = Date.now()
  }

  addResult(name, passed, message = '', duration = 0) {
    this.results.push({
      name,
      passed,
      message,
      duration,
      timestamp: new Date().toISOString()
    })
  }

  getStats() {
    const total = this.results.length
    const passed = this.results.filter(r => r.passed).length
    const failed = total - passed
    const totalDuration = Date.now() - this.startTime
    
    return {
      total,
      passed,
      failed,
      duration: totalDuration,
      passRate: total > 0 ? (passed / total * 100).toFixed(2) : 0
    }
  }

  printResults() {
    console.log('\n=== 测试结果 ===')
    console.log(`开始时间: ${new Date(this.startTime).toLocaleString()}`)
    
    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ 通过' : '❌ 失败'
      const duration = result.duration > 0 ? ` (${result.duration}ms)` : ''
      console.log(`${index + 1}. ${result.name}: ${status}${duration}`)
      if (result.message) {
        console.log(`   ${result.message}`)
      }
    })
    
    const stats = this.getStats()
    console.log('\n=== 统计信息 ===')
    console.log(`总测试数: ${stats.total}`)
    console.log(`通过: ${stats.passed}`)
    console.log(`失败: ${stats.failed}`)
    console.log(`通过率: ${stats.passRate}%`)
    console.log(`总耗时: ${stats.duration}ms`)
    
    return stats
  }
}

// 性能工具测试
class PerformanceTests {
  constructor(collector) {
    this.collector = collector
  }

  async testDebounce() {
    const startTime = Date.now()
    let callCount = 0
    
    const debouncedFn = debounce(() => {
      callCount++
    }, 100)
    
    // 快速调用多次
    for (let i = 0; i < 5; i++) {
      debouncedFn()
    }
    
    // 等待防抖完成
    await delay(150)
    
    const duration = Date.now() - startTime
    const passed = callCount === 1
    
    this.collector.addResult(
      '防抖函数测试',
      passed,
      passed ? '防抖函数正常工作，5次调用只执行1次' : `期望执行1次，实际执行${callCount}次`,
      duration
    )
  }

  async testThrottle() {
    const startTime = Date.now()
    let callCount = 0
    
    const throttledFn = throttle(() => {
      callCount++
    }, 50)
    
    // 快速调用多次
    for (let i = 0; i < 10; i++) {
      throttledFn()
      await delay(10)
    }
    
    const duration = Date.now() - startTime
    const passed = callCount >= 1 && callCount <= 3
    
    this.collector.addResult(
      '节流函数测试',
      passed,
      passed ? `节流函数正常工作，执行了${callCount}次` : `节流函数异常，执行了${callCount}次`,
      duration
    )
  }

  async testBatchProcess() {
    const startTime = Date.now()
    
    try {
      const items = Array.from({ length: 100 }, (_, i) => i)
      const results = await batchProcess(
        items,
        10,
        async (item) => item * 2,
        5
      )
      
      const duration = Date.now() - startTime
      const passed = results.length === 100 && results[0] === 0 && results[99] === 198
      
      this.collector.addResult(
        '批量处理测试',
        passed,
        passed ? '批量处理100个项目成功' : '批量处理结果不正确',
        duration
      )
    } catch (error) {
      const duration = Date.now() - startTime
      this.collector.addResult(
        '批量处理测试',
        false,
        `批量处理失败: ${error.message}`,
        duration
      )
    }
  }

  async testMemoryManager() {
    const startTime = Date.now()
    const manager = new MemoryManager()
    
    try {
      // 测试基本操作
      manager.set('test1', 'value1')
      manager.set('test2', 'value2')
      manager.set('test3', 'value3')
      
      const value1 = manager.get('test1')
      const hasTest2 = manager.has('test2')
      const size = manager.size()
      
      manager.delete('test3')
      const sizeAfterDelete = manager.size()
      
      const duration = Date.now() - startTime
      const passed = value1 === 'value1' && hasTest2 && size === 3 && sizeAfterDelete === 2
      
      this.collector.addResult(
        '内存管理器测试',
        passed,
        passed ? '内存管理器所有操作正常' : '内存管理器操作异常',
        duration
      )
    } catch (error) {
      const duration = Date.now() - startTime
      this.collector.addResult(
        '内存管理器测试',
        false,
        `内存管理器测试失败: ${error.message}`,
        duration
      )
    }
  }

  async testPerformanceMonitor() {
    const startTime = Date.now()
    const monitor = new PerformanceMonitor()
    
    try {
      // 测试标记和测量
      monitor.mark('test-start')
      await delay(50)
      monitor.mark('test-end')
      
      const measurement = monitor.measure('test-duration', 'test-start', 'test-end')
      
      // 测试指标记录
      monitor.recordMetric('test-metric', 100)
      monitor.recordMetric('test-metric', 200)
      monitor.recordMetric('test-metric', 150)
      
      const stats = monitor.getMetricStats('test-metric')
      
      const duration = Date.now() - startTime
      const passed = measurement && measurement.duration >= 0 && stats && stats.avg === 150
      
      if (!passed) {
        console.log('调试信息 - measurement:', measurement)
        console.log('调试信息 - stats:', stats)
      }
      
      this.collector.addResult(
        '性能监控器测试',
        passed,
        passed ? '性能监控器功能正常' : '性能监控器功能异常',
        duration
      )
    } catch (error) {
      const duration = Date.now() - startTime
      this.collector.addResult(
        '性能监控器测试',
        false,
        `性能监控器测试失败: ${error.message}`,
        duration
      )
    }
  }

  async runAll() {
    console.log('\n🚀 开始性能工具测试...')
    
    await this.testDebounce()
    await this.testThrottle()
    await this.testBatchProcess()
    await this.testMemoryManager()
    await this.testPerformanceMonitor()
    
    console.log('✅ 性能工具测试完成')
  }
}

// 数据生成测试
class DataGenerationTests {
  constructor(collector) {
    this.collector = collector
  }

  testMockDataGenerator() {
    const startTime = Date.now()
    
    try {
      // 测试小说数据生成
      const novel = MockDataGenerator.generateNovel()
      const novelValid = novel && novel.id && novel.title && novel.author
      
      // 测试章节数据生成
      const chapter = MockDataGenerator.generateChapter()
      const chapterValid = chapter && chapter.id && chapter.title && chapter.content
      
      // 测试用户数据生成
      const user = MockDataGenerator.generateUser()
      const userValid = user && user.id && user.username && user.email
      
      // 测试随机数据生成
      const randomData = MockDataGenerator.generateRandomData({
        name: 'string',
        age: 'number',
        active: 'boolean'
      })
      const randomValid = randomData && typeof randomData.name === 'string' && 
                         typeof randomData.age === 'number' && typeof randomData.active === 'boolean'
      
      const duration = Date.now() - startTime
      const passed = novelValid && chapterValid && userValid && randomValid
      
      if (!passed) {
        console.log('调试信息 - novelValid:', novelValid, 'novel:', novel)
        console.log('调试信息 - chapterValid:', chapterValid, 'chapter:', chapter)
        console.log('调试信息 - userValid:', userValid, 'user:', user)
        console.log('调试信息 - randomValid:', randomValid, 'randomData:', randomData)
      }
      
      this.collector.addResult(
        '模拟数据生成测试',
        passed,
        passed ? '所有数据生成功能正常' : '部分数据生成功能异常',
        duration
      )
    } catch (error) {
      const duration = Date.now() - startTime
      this.collector.addResult(
        '模拟数据生成测试',
        false,
        `数据生成测试失败: ${error.message}`,
        duration
      )
    }
  }

  async runAll() {
    console.log('\n📊 开始数据生成测试...')
    
    this.testMockDataGenerator()
    
    console.log('✅ 数据生成测试完成')
  }
}

// 工具函数测试
class UtilityTests {
  constructor(collector) {
    this.collector = collector
  }

  async testDelay() {
    const startTime = Date.now()
    
    try {
      await delay(100)
      const duration = Date.now() - startTime
      const passed = duration >= 95 && duration <= 150 // 允许一些误差
      
      this.collector.addResult(
        '延迟函数测试',
        passed,
        passed ? `延迟${duration}ms，符合预期` : `延迟${duration}ms，不符合预期`,
        duration
      )
    } catch (error) {
      const duration = Date.now() - startTime
      this.collector.addResult(
        '延迟函数测试',
        false,
        `延迟函数测试失败: ${error.message}`,
        duration
      )
    }
  }

  async runAll() {
    console.log('\n🔧 开始工具函数测试...')
    
    await this.testDelay()
    
    console.log('✅ 工具函数测试完成')
  }
}

// 主测试运行器
class NodeTestRunner {
  constructor() {
    this.collector = new TestCollector()
    this.performanceTests = new PerformanceTests(this.collector)
    this.dataTests = new DataGenerationTests(this.collector)
    this.utilityTests = new UtilityTests(this.collector)
  }

  async runAllTests() {
    console.log('🧪 开始Node.js环境测试')
    console.log('=' .repeat(50))
    
    try {
      await this.performanceTests.runAll()
      await this.dataTests.runAll()
      await this.utilityTests.runAll()
      
      console.log('\n' + '='.repeat(50))
      const stats = this.collector.printResults()
      
      if (stats.failed === 0) {
        console.log('\n🎉 所有测试通过！')
      } else {
        console.log(`\n⚠️  有 ${stats.failed} 个测试失败`)
      }
      
      return stats
    } catch (error) {
      console.error('\n❌ 测试运行器出错:', error.message)
      return { total: 0, passed: 0, failed: 1, error: error.message }
    }
  }
}

// 运行测试
const runner = new NodeTestRunner()
runner.runAllTests().then(stats => {
  process.exit(stats.failed > 0 ? 1 : 0)
}).catch(error => {
  console.error('测试运行失败:', error)
  process.exit(1)
})

export { NodeTestRunner }