// 本地小说导入服务
// 提供文件导入、解析、存储等功能

import { fileUtils, storageUtils, commonUtils } from '../utils/index.js'
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 导入状态枚举
 */
export const IMPORT_STATUS = {
  IDLE: 'idle',
  SELECTING: 'selecting',
  VALIDATING: 'validating',
  READING: 'reading',
  PARSING: 'parsing',
  SAVING: 'saving',
  COMPLETED: 'completed',
  ERROR: 'error'
}

/**
 * 导入错误类型
 */
export const IMPORT_ERRORS = {
  FILE_TOO_LARGE: 'file_too_large',
  UNSUPPORTED_FORMAT: 'unsupported_format',
  INVALID_FILE: 'invalid_file',
  PARSE_ERROR: 'parse_error',
  STORAGE_ERROR: 'storage_error',
  DUPLICATE_FILE: 'duplicate_file',
  NETWORK_ERROR: 'network_error'
}

/**
 * 本地小说导入服务类
 */
class NovelImportService {
  constructor() {
    this.processor = null
    this.currentImports = new Map()
    this.importHistory = []
    this.settings = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: ['TXT', 'EPUB'],
      autoSave: true,
      duplicateHandling: 'ask', // 'ask', 'skip', 'overwrite'
      batchSize: 5, // 批量导入时的并发数
      enablePreview: true
    }
    
    this.initProcessor()
  }
  
  /**
   * 初始化文件处理器
   */
  initProcessor() {
    this.processor = fileUtils.createProcessor({
      maxSize: this.settings.maxFileSize,
      allowedFormats: this.settings.allowedFormats
    })
  }
  
  /**
   * 更新设置
   */
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings }
    this.initProcessor()
  }
  
  /**
   * 选择文件
   */
  async selectFiles(multiple = true) {
    try {
      const filter = this.processor.createFileFilter()
      
      // 如果是 Electron 环境，使用原生文件对话框
      if (commonUtils.isElectron()) {
        const result = await window.electronAPI.showOpenDialog({
          title: '选择小说文件',
          filters: [
            {
              name: '支持的格式',
              extensions: filter.extensions.split(',').map(ext => ext.replace('.', ''))
            },
            { name: '所有文件', extensions: ['*'] }
          ],
          properties: multiple ? ['openFile', 'multiSelections'] : ['openFile']
        })
        
        if (result.canceled) {
          return []
        }
        
        // 将文件路径转换为 File 对象
        const files = []
        for (const filePath of result.filePaths) {
          const fileInfo = await window.electronAPI.getFileInfo(filePath)
          const file = new File([], fileInfo.name, {
            type: this.getMimeType(fileInfo.name),
            lastModified: fileInfo.lastModified
          })
          file.path = filePath
          file.size = fileInfo.size
          files.push(file)
        }
        
        return files
      } else {
        // Web 环境使用 input 元素
        return new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.multiple = multiple
          input.accept = filter.extensions
          
          input.onchange = (event) => {
            const files = Array.from(event.target.files)
            resolve(files)
          }
          
          input.click()
        })
      }
    } catch (err) {
      console.error('文件选择失败:', err)
      ElMessage.error('文件选择失败')
      return []
    }
  }
  
  /**
   * 导入单个文件
   */
  async importFile(file, options = {}) {
    const importId = commonUtils.generateId('import_')
    
    try {
      // 创建导入任务
      const importTask = {
        id: importId,
        file,
        status: IMPORT_STATUS.VALIDATING,
        progress: 0,
        startTime: new Date(),
        error: null,
        result: null,
        options
      }
      
      this.currentImports.set(importId, importTask)
      this.emitProgress(importTask)
      
      // 验证文件
      await this.validateFile(importTask)
      
      // 检查重复
      await this.checkDuplicate(importTask)
      
      // 读取和解析文件
      await this.processFile(importTask)
      
      // 保存到存储
      await this.saveNovel(importTask)
      
      // 完成导入
      importTask.status = IMPORT_STATUS.COMPLETED
      importTask.progress = 100
      importTask.endTime = new Date()
      
      this.emitProgress(importTask)
      this.addToHistory(importTask)
      
      ElMessage.success(`《${importTask.result.title}》导入成功`)
      
      return importTask.result
    } catch (err) {
      const importTask = this.currentImports.get(importId)
      if (importTask) {
        importTask.status = IMPORT_STATUS.ERROR
        importTask.error = err
        importTask.endTime = new Date()
        this.emitProgress(importTask)
        this.addToHistory(importTask)
      }
      
      console.error('文件导入失败:', err)
      ElMessage.error(`文件导入失败: ${err.message}`)
      throw err
    } finally {
      this.currentImports.delete(importId)
    }
  }
  
  /**
   * 批量导入文件
   */
  async importFiles(files, options = {}) {
    if (!files || files.length === 0) {
      return { results: [], errors: [] }
    }
    
    const results = []
    const errors = []
    const batchSize = Math.min(this.settings.batchSize, files.length)
    
    // 分批处理文件
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize)
      const batchPromises = batch.map(file => 
        this.importFile(file, options).catch(err => ({ error: err, file }))
      )
      
      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        if (result.error) {
          errors.push({
            file: result.file.name,
            error: result.error.message
          })
        } else {
          results.push(result)
        }
      })
    }
    
    // 显示批量导入结果
    if (results.length > 0) {
      ElMessage.success(`成功导入 ${results.length} 个文件`)
    }
    
    if (errors.length > 0) {
      ElMessage.warning(`${errors.length} 个文件导入失败`)
    }
    
    return { results, errors }
  }
  
  /**
   * 验证文件
   */
  async validateFile(importTask) {
    importTask.status = IMPORT_STATUS.VALIDATING
    importTask.progress = 10
    this.emitProgress(importTask)
    
    const validation = await fileUtils.validateFile(importTask.file, {
      maxSize: this.settings.maxFileSize,
      allowedFormats: this.settings.allowedFormats
    })
    
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    
    importTask.format = validation.format
  }
  
  /**
   * 检查重复文件
   */
  async checkDuplicate(importTask) {
    if (this.settings.duplicateHandling === 'skip') {
      return
    }
    
    try {
      const existingNovels = await storageUtils.getItem('novels') || []
      const duplicate = existingNovels.find(novel => 
        novel.originalFile && 
        novel.originalFile.name === importTask.file.name &&
        novel.originalFile.size === importTask.file.size
      )
      
      if (duplicate) {
        if (this.settings.duplicateHandling === 'ask') {
          const action = await ElMessageBox.confirm(
            `文件《${importTask.file.name}》已存在，是否覆盖？`,
            '重复文件',
            {
              confirmButtonText: '覆盖',
              cancelButtonText: '跳过',
              type: 'warning'
            }
          )
          
          if (action !== 'confirm') {
            throw new Error('用户取消导入')
          }
          
          importTask.duplicateId = duplicate.id
        } else if (this.settings.duplicateHandling === 'overwrite') {
          importTask.duplicateId = duplicate.id
        }
      }
    } catch (err) {
      if (err.message !== '用户取消导入') {
        console.warn('检查重复文件失败:', err)
      } else {
        throw err
      }
    }
  }
  
  /**
   * 处理文件
   */
  async processFile(importTask) {
    importTask.status = IMPORT_STATUS.READING
    importTask.progress = 30
    this.emitProgress(importTask)
    
    const onProgress = (progressData) => {
      switch (progressData.stage) {
        case 'reading':
          importTask.progress = 30 + (progressData.progress * 0.3)
          break
        case 'parsing':
          importTask.status = IMPORT_STATUS.PARSING
          importTask.progress = 60 + (progressData.progress * 0.2)
          break
        case 'complete':
          importTask.progress = 80
          break
      }
      this.emitProgress(importTask)
    }
    
    importTask.result = await this.processor.processFile(importTask.file, onProgress)
  }
  
  /**
   * 保存小说
   */
  async saveNovel(importTask) {
    importTask.status = IMPORT_STATUS.SAVING
    importTask.progress = 85
    this.emitProgress(importTask)
    
    try {
      const novel = importTask.result
      
      // 如果是重复文件，更新现有记录
      if (importTask.duplicateId) {
        novel.id = importTask.duplicateId
        novel.updateTime = new Date()
      }
      
      // 获取现有小说列表
      const novels = await storageUtils.getItem('novels') || []
      
      if (importTask.duplicateId) {
        // 更新现有小说
        const index = novels.findIndex(n => n.id === importTask.duplicateId)
        if (index > -1) {
          novels[index] = novel
        } else {
          novels.push(novel)
        }
      } else {
        // 添加新小说
        novels.push(novel)
      }
      
      // 保存到存储
      await storageUtils.setItem('novels', novels)
      
      // 保存章节内容（大文件分别存储）
      if (novel.chapters && novel.chapters.length > 0) {
        await storageUtils.setItem(`novel_chapters_${novel.id}`, novel.chapters)
      }
      
      importTask.progress = 95
      this.emitProgress(importTask)
    } catch (err) {
      throw new Error(`保存失败: ${err.message}`)
    }
  }
  
  /**
   * 获取MIME类型
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop()
    const mimeTypes = {
      'txt': 'text/plain',
      'epub': 'application/epub+zip',
      'pdf': 'application/pdf',
      'mobi': 'application/x-mobipocket-ebook'
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }
  
  /**
   * 发送进度事件
   */
  emitProgress(importTask) {
    // 这里可以发送到 Vue 组件或其他监听器
    window.dispatchEvent(new CustomEvent('novel-import-progress', {
      detail: {
        id: importTask.id,
        status: importTask.status,
        progress: importTask.progress,
        file: importTask.file.name,
        error: importTask.error,
        result: importTask.result
      }
    }))
  }
  
  /**
   * 添加到历史记录
   */
  addToHistory(importTask) {
    const historyItem = {
      id: importTask.id,
      fileName: importTask.file.name,
      fileSize: importTask.file.size,
      format: importTask.format,
      status: importTask.status,
      startTime: importTask.startTime,
      endTime: importTask.endTime,
      duration: importTask.endTime - importTask.startTime,
      error: importTask.error ? importTask.error.message : null,
      novelId: importTask.result ? importTask.result.id : null,
      novelTitle: importTask.result ? importTask.result.title : null
    }
    
    this.importHistory.unshift(historyItem)
    
    // 限制历史记录数量
    if (this.importHistory.length > 100) {
      this.importHistory = this.importHistory.slice(0, 100)
    }
    
    // 保存历史记录
    storageUtils.setItem('import_history', this.importHistory)
  }
  
  /**
   * 获取导入历史
   */
  async getImportHistory() {
    if (this.importHistory.length === 0) {
      this.importHistory = await storageUtils.getItem('import_history') || []
    }
    return this.importHistory
  }
  
  /**
   * 清除导入历史
   */
  async clearImportHistory() {
    this.importHistory = []
    await storageUtils.removeItem('import_history')
  }
  
  /**
   * 获取当前导入任务
   */
  getCurrentImports() {
    return Array.from(this.currentImports.values())
  }
  
  /**
   * 取消导入任务
   */
  cancelImport(importId) {
    const importTask = this.currentImports.get(importId)
    if (importTask) {
      importTask.status = IMPORT_STATUS.ERROR
      importTask.error = new Error('用户取消')
      importTask.endTime = new Date()
      this.emitProgress(importTask)
      this.currentImports.delete(importId)
      return true
    }
    return false
  }
  
  /**
   * 预览文件内容
   */
  async previewFile(file, maxLength = 1000) {
    if (!this.settings.enablePreview) {
      return null
    }
    
    try {
      const format = await fileUtils.detectFormat(file)
      
      if (format === 'TXT') {
        const content = await commonUtils.readFile(file, 'text')
        return {
          format,
          preview: content.substring(0, maxLength),
          isTruncated: content.length > maxLength,
          totalLength: content.length
        }
      }
      
      return {
        format,
        preview: `${format} 格式文件，需要完整导入后才能查看内容`,
        isTruncated: false,
        totalLength: file.size
      }
    } catch (err) {
      console.error('文件预览失败:', err)
      return null
    }
  }
  
  /**
   * 获取支持的格式信息
   */
  getSupportedFormats() {
    return this.processor.getSupportedFormats()
  }
  
  /**
   * 获取导入统计
   */
  async getImportStats() {
    const history = await this.getImportHistory()
    const total = history.length
    const successful = history.filter(item => item.status === IMPORT_STATUS.COMPLETED).length
    const failed = total - successful
    
    const formatStats = {}
    const sizeStats = { total: 0, average: 0 }
    
    history.forEach(item => {
      if (item.format) {
        formatStats[item.format] = (formatStats[item.format] || 0) + 1
      }
      if (item.fileSize) {
        sizeStats.total += item.fileSize
      }
    })
    
    if (total > 0) {
      sizeStats.average = sizeStats.total / total
    }
    
    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(1) : 0,
      formatStats,
      sizeStats: {
        total: commonUtils.formatFileSize(sizeStats.total),
        average: commonUtils.formatFileSize(sizeStats.average)
      }
    }
  }
}

// 创建全局实例
const importService = new NovelImportService()

// 导出便捷接口
export const novelImport = {
  // 文件选择和导入
  selectFiles: (multiple = true) => importService.selectFiles(multiple),
  importFile: (file, options) => importService.importFile(file, options),
  importFiles: (files, options) => importService.importFiles(files, options),
  
  // 文件预览
  previewFile: (file, maxLength) => importService.previewFile(file, maxLength),
  
  // 设置管理
  updateSettings: (settings) => importService.updateSettings(settings),
  getSettings: () => importService.settings,
  
  // 历史记录
  getImportHistory: () => importService.getImportHistory(),
  clearImportHistory: () => importService.clearImportHistory(),
  
  // 任务管理
  getCurrentImports: () => importService.getCurrentImports(),
  cancelImport: (importId) => importService.cancelImport(importId),
  
  // 统计信息
  getImportStats: () => importService.getImportStats(),
  getSupportedFormats: () => importService.getSupportedFormats(),
  
  // 事件监听
  onProgress: (callback) => {
    window.addEventListener('novel-import-progress', (event) => {
      callback(event.detail)
    })
  },
  
  offProgress: (callback) => {
    window.removeEventListener('novel-import-progress', callback)
  }
}

// 导出类供高级用法
export { NovelImportService }

export default novelImport