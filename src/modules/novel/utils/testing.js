/**
 * 测试工具函数
 * 提供各种测试功能和自动化测试工具
 */

// 性能测试
export class PerformanceTester {
  constructor() {
    this.tests = new Map()
    this.results = []
  }
  
  // 开始性能测试
  start(testName) {
    this.tests.set(testName, {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    })
  }
  
  // 结束性能测试
  end(testName) {
    const test = this.tests.get(testName)
    if (!test) {
      console.warn(`Performance test '${testName}' not found`)
      return null
    }
    
    const endTime = performance.now()
    const endMemory = this.getMemoryUsage()
    
    const result = {
      name: testName,
      duration: endTime - test.startTime,
      memoryUsed: endMemory - test.startMemory,
      timestamp: new Date().toISOString()
    }
    
    this.results.push(result)
    this.tests.delete(testName)
    
    return result
  }
  
  // 获取内存使用情况
  getMemoryUsage() {
    if (performance.memory) {
      return performance.memory.usedJSHeapSize
    }
    return 0
  }
  
  // 批量测试
  async runBatch(tests) {
    const results = []
    
    for (const test of tests) {
      try {
        this.start(test.name)
        await test.fn()
        const result = this.end(test.name)
        results.push(result)
      } catch (error) {
        results.push({
          name: test.name,
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    return results
  }
  
  // 生成报告
  generateReport() {
    const report = {
      totalTests: this.results.length,
      averageDuration: this.results.reduce((sum, r) => sum + (r.duration || 0), 0) / this.results.length,
      totalMemoryUsed: this.results.reduce((sum, r) => sum + (r.memoryUsed || 0), 0),
      tests: this.results
    }
    
    return report
  }
  
  // 清除结果
  clear() {
    this.results = []
    this.tests.clear()
  }
}

// 功能测试
export class FunctionalTester {
  constructor() {
    this.testSuites = new Map()
    this.results = []
  }
  
  // 添加测试套件
  addSuite(name, tests) {
    this.testSuites.set(name, tests)
  }
  
  // 运行单个测试
  async runTest(testFn, testName) {
    const startTime = Date.now()
    
    try {
      await testFn()
      return {
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        name: testName,
        status: 'failed',
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  // 运行测试套件
  async runSuite(suiteName) {
    const tests = this.testSuites.get(suiteName)
    if (!tests) {
      throw new Error(`Test suite '${suiteName}' not found`)
    }
    
    const results = []
    
    for (const [testName, testFn] of Object.entries(tests)) {
      const result = await this.runTest(testFn, testName)
      results.push(result)
    }
    
    const suiteResult = {
      suite: suiteName,
      tests: results,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      total: results.length,
      duration: results.reduce((sum, r) => sum + r.duration, 0)
    }
    
    this.results.push(suiteResult)
    return suiteResult
  }
  
  // 运行所有测试
  async runAll() {
    const results = []
    
    for (const suiteName of this.testSuites.keys()) {
      const result = await this.runSuite(suiteName)
      results.push(result)
    }
    
    return results
  }
}

// UI 测试工具
export class UITester {
  constructor() {
    this.interactions = []
  }
  
  // 模拟点击
  async click(selector, options = {}) {
    const element = document.querySelector(selector)
    if (!element) {
      throw new Error(`Element '${selector}' not found`)
    }
    
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ...options
    })
    
    element.dispatchEvent(event)
    
    this.interactions.push({
      type: 'click',
      selector,
      timestamp: Date.now()
    })
    
    // 等待可能的异步操作
    await this.wait(options.delay || 100)
  }
  
  // 模拟输入
  async type(selector, text, options = {}) {
    const element = document.querySelector(selector)
    if (!element) {
      throw new Error(`Element '${selector}' not found`)
    }
    
    element.focus()
    
    if (options.clear) {
      element.value = ''
    }
    
    for (const char of text) {
      element.value += char
      
      // 触发输入事件
      element.dispatchEvent(new Event('input', { bubbles: true }))
      
      if (options.typeDelay) {
        await this.wait(options.typeDelay)
      }
    }
    
    element.dispatchEvent(new Event('change', { bubbles: true }))
    
    this.interactions.push({
      type: 'type',
      selector,
      text,
      timestamp: Date.now()
    })
  }
  
  // 模拟键盘事件
  async keyPress(selector, key, options = {}) {
    const element = document.querySelector(selector)
    if (!element) {
      throw new Error(`Element '${selector}' not found`)
    }
    
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options
    })
    
    element.dispatchEvent(event)
    
    this.interactions.push({
      type: 'keyPress',
      selector,
      key,
      timestamp: Date.now()
    })
    
    await this.wait(50)
  }
  
  // 等待元素出现
  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector)
      if (element) {
        return element
      }
      await this.wait(100)
    }
    
    throw new Error(`Element '${selector}' not found within ${timeout}ms`)
  }
  
  // 等待元素消失
  async waitForElementToDisappear(selector, timeout = 5000) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector)
      if (!element) {
        return true
      }
      await this.wait(100)
    }
    
    throw new Error(`Element '${selector}' still exists after ${timeout}ms`)
  }
  
  // 检查元素是否可见
  isVisible(selector) {
    const element = document.querySelector(selector)
    if (!element) return false
    
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && 
           window.getComputedStyle(element).visibility !== 'hidden'
  }
  
  // 获取元素文本
  getText(selector) {
    const element = document.querySelector(selector)
    return element ? element.textContent.trim() : null
  }
  
  // 获取元素属性
  getAttribute(selector, attribute) {
    const element = document.querySelector(selector)
    return element ? element.getAttribute(attribute) : null
  }
  
  // 截图（如果支持）
  async screenshot(selector = null) {
    if (!('html2canvas' in window)) {
      console.warn('html2canvas not available for screenshots')
      return null
    }
    
    const element = selector ? document.querySelector(selector) : document.body
    if (!element) {
      throw new Error(`Element '${selector}' not found for screenshot`)
    }
    
    try {
      const canvas = await html2canvas(element)
      return canvas.toDataURL()
    } catch (error) {
      console.error('Screenshot failed:', error)
      return null
    }
  }
  
  // 等待
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // 清除交互历史
  clearInteractions() {
    this.interactions = []
  }
  
  // 获取交互历史
  getInteractions() {
    return [...this.interactions]
  }
}

// 断言工具
export class Assertions {
  static assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message}\nExpected: ${expected}\nActual: ${actual}`)
    }
  }
  
  static assertNotEqual(actual, expected, message = '') {
    if (actual === expected) {
      throw new Error(`Assertion failed: ${message}\nExpected not equal to: ${expected}\nActual: ${actual}`)
    }
  }
  
  static assertTrue(value, message = '') {
    if (!value) {
      throw new Error(`Assertion failed: ${message}\nExpected: true\nActual: ${value}`)
    }
  }
  
  static assertFalse(value, message = '') {
    if (value) {
      throw new Error(`Assertion failed: ${message}\nExpected: false\nActual: ${value}`)
    }
  }
  
  static assertNull(value, message = '') {
    if (value !== null) {
      throw new Error(`Assertion failed: ${message}\nExpected: null\nActual: ${value}`)
    }
  }
  
  static assertNotNull(value, message = '') {
    if (value === null) {
      throw new Error(`Assertion failed: ${message}\nExpected: not null\nActual: ${value}`)
    }
  }
  
  static assertUndefined(value, message = '') {
    if (value !== undefined) {
      throw new Error(`Assertion failed: ${message}\nExpected: undefined\nActual: ${value}`)
    }
  }
  
  static assertNotUndefined(value, message = '') {
    if (value === undefined) {
      throw new Error(`Assertion failed: ${message}\nExpected: not undefined\nActual: ${value}`)
    }
  }
  
  static assertArrayEqual(actual, expected, message = '') {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      throw new Error(`Assertion failed: ${message}\nBoth values must be arrays`)
    }
    
    if (actual.length !== expected.length) {
      throw new Error(`Assertion failed: ${message}\nArray lengths differ\nExpected: ${expected.length}\nActual: ${actual.length}`)
    }
    
    for (let i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) {
        throw new Error(`Assertion failed: ${message}\nArrays differ at index ${i}\nExpected: ${expected[i]}\nActual: ${actual[i]}`)
      }
    }
  }
  
  static assertObjectEqual(actual, expected, message = '') {
    const actualStr = JSON.stringify(actual, null, 2)
    const expectedStr = JSON.stringify(expected, null, 2)
    
    if (actualStr !== expectedStr) {
      throw new Error(`Assertion failed: ${message}\nExpected: ${expectedStr}\nActual: ${actualStr}`)
    }
  }
  
  static assertThrows(fn, expectedError = null, message = '') {
    try {
      fn()
      throw new Error(`Assertion failed: ${message}\nExpected function to throw an error`)
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        throw new Error(`Assertion failed: ${message}\nExpected error type: ${expectedError.name}\nActual error type: ${error.constructor.name}`)
      }
    }
  }
  
  static async assertThrowsAsync(fn, expectedError = null, message = '') {
    try {
      await fn()
      throw new Error(`Assertion failed: ${message}\nExpected async function to throw an error`)
    } catch (error) {
      if (expectedError && !(error instanceof expectedError)) {
        throw new Error(`Assertion failed: ${message}\nExpected error type: ${expectedError.name}\nActual error type: ${error.constructor.name}`)
      }
    }
  }
}

// 模拟数据生成器
export class MockDataGenerator {
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  static randomNumber(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  static randomBoolean() {
    return Math.random() < 0.5
  }
  
  static randomDate(start = new Date(2020, 0, 1), end = new Date()) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  }
  
  static randomEmail() {
    const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const username = this.randomString(8)
    const domain = domains[Math.floor(Math.random() * domains.length)]
    return `${username}@${domain}`
  }
  
  static randomPhone() {
    return `1${this.randomNumber(3000000000, 9999999999)}`
  }
  
  static randomArray(generator, length = 5) {
    return Array.from({ length }, () => generator())
  }
  
  static randomObject(schema) {
    const obj = {}
    for (const [key, generator] of Object.entries(schema)) {
      obj[key] = typeof generator === 'function' ? generator() : generator
    }
    return obj
  }
  
  static generateRandomData(schema) {
    const obj = {}
    for (const [key, type] of Object.entries(schema)) {
      switch (type) {
        case 'string':
          obj[key] = this.randomString()
          break
        case 'number':
          obj[key] = this.randomNumber()
          break
        case 'boolean':
          obj[key] = this.randomBoolean()
          break
        case 'date':
          obj[key] = this.randomDate()
          break
        case 'email':
          obj[key] = this.randomEmail()
          break
        case 'phone':
          obj[key] = this.randomPhone()
          break
        default:
          obj[key] = null
      }
    }
    return obj
  }
  
  // 生成小说相关的模拟数据
  static generateNovel() {
    const titles = ['龙族', '斗破苍穹', '完美世界', '遮天', '圣墟', '雪中悍刀行']
    const authors = ['江南', '天蚕土豆', '辰东', '烽火戏诸侯', '猫腻', '我吃西红柿']
    const categories = ['玄幻', '都市', '历史', '科幻', '武侠', '仙侠']
    
    return {
      id: this.randomString(8),
      title: titles[Math.floor(Math.random() * titles.length)],
      author: authors[Math.floor(Math.random() * authors.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      description: this.randomString(100),
      wordCount: this.randomNumber(100000, 5000000),
      chapterCount: this.randomNumber(100, 3000),
      status: this.randomBoolean() ? '连载中' : '已完结',
      rating: (Math.random() * 5).toFixed(1),
      createdAt: this.randomDate(),
      updatedAt: this.randomDate()
    }
  }
  
  static generateChapter() {
    return {
      id: this.randomString(8),
      title: `第${this.randomNumber(1, 1000)}章 ${this.randomString(10)}`,
      content: this.randomString(2000),
      wordCount: this.randomNumber(1000, 5000),
      publishTime: this.randomDate(),
      isVip: this.randomBoolean()
    }
  }
  
  static generateUser() {
    return {
      id: this.randomString(8),
      username: this.randomString(8),
      email: this.randomEmail(),
      phone: this.randomPhone(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.randomString(8)}`,
      level: this.randomNumber(1, 100),
      exp: this.randomNumber(0, 10000),
      coins: this.randomNumber(0, 100000),
      vipLevel: this.randomNumber(0, 5),
      createdAt: this.randomDate(),
      lastLoginAt: this.randomDate()
    }
  }
}

// 测试报告生成器
export class TestReporter {
  constructor() {
    this.reports = []
  }
  
  addReport(report) {
    this.reports.push({
      ...report,
      timestamp: new Date().toISOString()
    })
  }
  
  generateHTML() {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>测试报告</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .stat { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .passed { color: #28a745; }
          .failed { color: #dc3545; }
          .test-suite { margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; }
          .suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
          .test-case { padding: 10px 15px; border-bottom: 1px solid #eee; }
          .test-case:last-child { border-bottom: none; }
          .error { background: #f8d7da; color: #721c24; padding: 10px; margin: 5px 0; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>测试报告</h1>
          <p>生成时间: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <div class="stat">
            <h3>总测试数</h3>
            <p>${this.getTotalTests()}</p>
          </div>
          <div class="stat">
            <h3 class="passed">通过</h3>
            <p>${this.getPassedTests()}</p>
          </div>
          <div class="stat">
            <h3 class="failed">失败</h3>
            <p>${this.getFailedTests()}</p>
          </div>
          <div class="stat">
            <h3>成功率</h3>
            <p>${this.getSuccessRate()}%</p>
          </div>
        </div>
        
        ${this.reports.map(report => this.renderReport(report)).join('')}
      </body>
      </html>
    `
    
    return html
  }
  
  renderReport(report) {
    if (report.tests) {
      // 功能测试报告
      return `
        <div class="test-suite">
          <div class="suite-header">
            <h3>${report.suite || '测试套件'}</h3>
            <p>通过: ${report.passed} | 失败: ${report.failed} | 总计: ${report.total} | 耗时: ${report.duration}ms</p>
          </div>
          ${report.tests.map(test => `
            <div class="test-case">
              <h4 class="${test.status}">${test.name} - ${test.status}</h4>
              <p>耗时: ${test.duration}ms</p>
              ${test.error ? `<div class="error">${test.error}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `
    } else {
      // 性能测试报告
      return `
        <div class="test-suite">
          <div class="suite-header">
            <h3>性能测试报告</h3>
            <p>平均耗时: ${report.averageDuration?.toFixed(2)}ms | 总内存使用: ${this.formatBytes(report.totalMemoryUsed)}</p>
          </div>
          ${report.tests?.map(test => `
            <div class="test-case">
              <h4>${test.name}</h4>
              <p>耗时: ${test.duration?.toFixed(2)}ms | 内存: ${this.formatBytes(test.memoryUsed)}</p>
              ${test.error ? `<div class="error">${test.error}</div>` : ''}
            </div>
          `).join('') || ''}
        </div>
      `
    }
  }
  
  getTotalTests() {
    return this.reports.reduce((sum, report) => sum + (report.total || report.tests?.length || 0), 0)
  }
  
  getPassedTests() {
    return this.reports.reduce((sum, report) => {
      if (report.passed !== undefined) {
        return sum + report.passed
      }
      return sum + (report.tests?.filter(t => t.status === 'passed').length || 0)
    }, 0)
  }
  
  getFailedTests() {
    return this.reports.reduce((sum, report) => {
      if (report.failed !== undefined) {
        return sum + report.failed
      }
      return sum + (report.tests?.filter(t => t.status === 'failed').length || 0)
    }, 0)
  }
  
  getSuccessRate() {
    const total = this.getTotalTests()
    const passed = this.getPassedTests()
    return total > 0 ? ((passed / total) * 100).toFixed(1) : 0
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  exportToFile() {
    const html = this.generateHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `test-report-${Date.now()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// 导出默认实例
export const performanceTester = new PerformanceTester()
export const functionalTester = new FunctionalTester()
export const uiTester = new UITester()
export const testReporter = new TestReporter()