// 文件处理工具函数
// 提供文件读取、解析、格式检测等功能

import { ElMessage } from 'element-plus'

/**
 * 支持的文件格式配置
 */
export const SUPPORTED_FORMATS = {
  TXT: {
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    description: '文本文件 (*.txt)'
  },
  EPUB: {
    extensions: ['.epub'],
    mimeTypes: ['application/epub+zip'],
    description: 'EPUB电子书 (*.epub)'
  },
  PDF: {
    extensions: ['.pdf'],
    mimeTypes: ['application/pdf'],
    description: 'PDF文档 (*.pdf)'
  },
  MOBI: {
    extensions: ['.mobi', '.azw', '.azw3'],
    mimeTypes: ['application/x-mobipocket-ebook'],
    description: 'Kindle电子书 (*.mobi, *.azw, *.azw3)'
  }
}

/**
 * 文件格式检测器
 */
class FileFormatDetector {
  /**
   * 根据文件扩展名检测格式
   */
  static detectByExtension(filename) {
    const ext = this.getFileExtension(filename)
    
    for (const [format, config] of Object.entries(SUPPORTED_FORMATS)) {
      if (config.extensions.includes(ext)) {
        return format
      }
    }
    
    return null
  }
  
  /**
   * 根据MIME类型检测格式
   */
  static detectByMimeType(mimeType) {
    for (const [format, config] of Object.entries(SUPPORTED_FORMATS)) {
      if (config.mimeTypes.includes(mimeType)) {
        return format
      }
    }
    
    return null
  }
  
  /**
   * 根据文件内容检测格式
   */
  static async detectByContent(file) {
    try {
      const buffer = await this.readFileAsArrayBuffer(file, 0, 1024)
      const bytes = new Uint8Array(buffer)
      
      // 检测文件头标识
      if (this.checkEPUBSignature(bytes)) {
        return 'EPUB'
      }
      
      if (this.checkPDFSignature(bytes)) {
        return 'PDF'
      }
      
      if (this.checkMOBISignature(bytes)) {
        return 'MOBI'
      }
      
      // 默认为文本文件
      return 'TXT'
    } catch (err) {
      console.error('文件内容检测失败:', err)
      return null
    }
  }
  
  /**
   * 综合检测文件格式
   */
  static async detectFormat(file) {
    // 优先使用扩展名检测
    let format = this.detectByExtension(file.name)
    
    if (!format) {
      // 使用MIME类型检测
      format = this.detectByMimeType(file.type)
    }
    
    if (!format) {
      // 使用文件内容检测
      format = await this.detectByContent(file)
    }
    
    return format
  }
  
  /**
   * 获取文件扩展名
   */
  static getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.')
    return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : ''
  }
  
  /**
   * 读取文件为ArrayBuffer
   */
  static readFileAsArrayBuffer(file, start = 0, end = file.size) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file.slice(start, end))
    })
  }
  
  /**
   * 检测EPUB文件签名
   */
  static checkEPUBSignature(bytes) {
    // EPUB文件是ZIP格式，检查ZIP文件头
    return bytes[0] === 0x50 && bytes[1] === 0x4B && 
           (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  }
  
  /**
   * 检测PDF文件签名
   */
  static checkPDFSignature(bytes) {
    // PDF文件头：%PDF-
    return bytes[0] === 0x25 && bytes[1] === 0x50 && 
           bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2D
  }
  
  /**
   * 检测MOBI文件签名
   */
  static checkMOBISignature(bytes) {
    // MOBI文件在偏移60处有"BOOKMOBI"标识
    if (bytes.length < 68) return false
    
    const mobiSignature = [0x42, 0x4F, 0x4F, 0x4B, 0x4D, 0x4F, 0x42, 0x49] // "BOOKMOBI"
    for (let i = 0; i < mobiSignature.length; i++) {
      if (bytes[60 + i] !== mobiSignature[i]) {
        return false
      }
    }
    return true
  }
}

/**
 * 文件读取器基类
 */
class FileReader {
  constructor() {
    this.encoding = 'utf-8'
  }
  
  async readFile(file) {
    throw new Error('readFile method must be implemented')
  }
  
  /**
   * 检测文本编码
   */
  async detectEncoding(file) {
    try {
      const buffer = await FileFormatDetector.readFileAsArrayBuffer(file, 0, 1024)
      const bytes = new Uint8Array(buffer)
      
      // 检测BOM
      if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
        return 'utf-8'
      }
      
      if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
        return 'utf-16le'
      }
      
      if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
        return 'utf-16be'
      }
      
      // 简单的中文编码检测
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      if (text.includes('�')) {
        // 可能是GBK编码
        return 'gbk'
      }
      
      return 'utf-8'
    } catch (err) {
      console.error('编码检测失败:', err)
      return 'utf-8'
    }
  }
  
  /**
   * 读取文本文件
   */
  async readTextFile(file, encoding = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        try {
          let text = reader.result
          
          // 处理不同编码
          if (encoding === 'gbk') {
            // 如果是GBK编码，需要特殊处理
            // 这里简化处理，实际项目中可能需要引入编码转换库
            console.warn('检测到GBK编码，可能需要手动转换')
          }
          
          resolve(text)
        } catch (err) {
          reject(err)
        }
      }
      
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file, encoding || this.encoding)
    })
  }
}

/**
 * TXT文件读取器
 */
class TxtFileReader extends FileReader {
  async readFile(file) {
    try {
      // 检测编码
      const encoding = await this.detectEncoding(file)
      
      // 读取文本内容
      const content = await this.readTextFile(file, encoding)
      
      // 解析章节
      const chapters = this.parseChapters(content)
      
      return {
        title: this.extractTitle(file.name),
        author: '未知作者',
        description: '',
        chapters,
        totalChapters: chapters.length,
        totalWords: content.length,
        encoding,
        format: 'TXT',
        size: file.size,
        lastModified: new Date(file.lastModified)
      }
    } catch (err) {
      console.error('TXT文件读取失败:', err)
      throw new Error(`TXT文件读取失败: ${err.message}`)
    }
  }
  
  /**
   * 解析章节
   */
  parseChapters(content) {
    const chapters = []
    
    // 常见的章节标题模式
    const chapterPatterns = [
      /^第[\d一二三四五六七八九十百千万]+[章节回]/gm,
      /^第[\d]+章/gm,
      /^Chapter\s+\d+/gim,
      /^[\d]+\./gm,
      /^[\d]+、/gm
    ]
    
    let bestPattern = null
    let maxMatches = 0
    
    // 选择匹配最多的模式
    for (const pattern of chapterPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > maxMatches) {
        maxMatches = matches.length
        bestPattern = pattern
      }
    }
    
    if (bestPattern && maxMatches > 1) {
      // 使用最佳模式分割章节
      const parts = content.split(bestPattern)
      const matches = content.match(bestPattern)
      
      for (let i = 0; i < matches.length; i++) {
        const title = matches[i].trim()
        const content = parts[i + 1] || ''
        
        chapters.push({
          id: i + 1,
          title,
          content: content.trim(),
          wordCount: content.trim().length
        })
      }
    } else {
      // 没有找到章节模式，按字数分割
      const wordsPerChapter = 3000
      const totalWords = content.length
      const chapterCount = Math.ceil(totalWords / wordsPerChapter)
      
      for (let i = 0; i < chapterCount; i++) {
        const start = i * wordsPerChapter
        const end = Math.min((i + 1) * wordsPerChapter, totalWords)
        const chapterContent = content.substring(start, end)
        
        chapters.push({
          id: i + 1,
          title: `第${i + 1}部分`,
          content: chapterContent,
          wordCount: chapterContent.length
        })
      }
    }
    
    return chapters
  }
  
  /**
   * 提取标题
   */
  extractTitle(filename) {
    return filename.replace(/\.[^/.]+$/, '') // 移除扩展名
  }
}

/**
 * EPUB文件读取器
 */
class EpubFileReader extends FileReader {
  async readFile(file) {
    try {
      // 这里需要使用EPUB解析库，如epub.js
      // 由于复杂性，这里提供基本框架
      
      console.warn('EPUB文件解析需要专门的库支持')
      
      return {
        title: this.extractTitle(file.name),
        author: '未知作者',
        description: 'EPUB文件需要专门的解析库',
        chapters: [{
          id: 1,
          title: '第一章',
          content: 'EPUB文件解析功能正在开发中...',
          wordCount: 20
        }],
        totalChapters: 1,
        totalWords: 20,
        format: 'EPUB',
        size: file.size,
        lastModified: new Date(file.lastModified)
      }
    } catch (err) {
      console.error('EPUB文件读取失败:', err)
      throw new Error(`EPUB文件读取失败: ${err.message}`)
    }
  }
  
  extractTitle(filename) {
    return filename.replace(/\.[^/.]+$/, '')
  }
}

/**
 * 文件读取器工厂
 */
class FileReaderFactory {
  static createReader(format) {
    switch (format) {
      case 'TXT':
        return new TxtFileReader()
      case 'EPUB':
        return new EpubFileReader()
      default:
        throw new Error(`不支持的文件格式: ${format}`)
    }
  }
}

/**
 * 文件验证器
 */
class FileValidator {
  /**
   * 验证文件大小
   */
  static validateFileSize(file, maxSize = 50 * 1024 * 1024) { // 默认50MB
    if (file.size > maxSize) {
      throw new Error(`文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`)
    }
    return true
  }
  
  /**
   * 验证文件格式
   */
  static validateFileFormat(format) {
    if (!SUPPORTED_FORMATS[format]) {
      throw new Error(`不支持的文件格式: ${format}`)
    }
    return true
  }
  
  /**
   * 验证文件名
   */
  static validateFileName(filename) {
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(filename)) {
      throw new Error('文件名包含非法字符')
    }
    return true
  }
  
  /**
   * 综合验证文件
   */
  static async validateFile(file, options = {}) {
    const {
      maxSize = 50 * 1024 * 1024,
      allowedFormats = Object.keys(SUPPORTED_FORMATS)
    } = options
    
    try {
      // 验证文件名
      this.validateFileName(file.name)
      
      // 验证文件大小
      this.validateFileSize(file, maxSize)
      
      // 检测并验证文件格式
      const format = await FileFormatDetector.detectFormat(file)
      if (!format || !allowedFormats.includes(format)) {
        throw new Error(`不支持的文件格式: ${format || '未知'}`)
      }
      
      this.validateFileFormat(format)
      
      return { valid: true, format }
    } catch (err) {
      return { valid: false, error: err.message }
    }
  }
}

/**
 * 文件处理主类
 */
export class FileProcessor {
  constructor(options = {}) {
    this.options = {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedFormats: Object.keys(SUPPORTED_FORMATS),
      ...options
    }
  }
  
  /**
   * 处理文件
   */
  async processFile(file, onProgress = null) {
    try {
      // 验证文件
      const validation = await FileValidator.validateFile(file, this.options)
      if (!validation.valid) {
        throw new Error(validation.error)
      }
      
      const format = validation.format
      
      // 创建对应的读取器
      const reader = FileReaderFactory.createReader(format)
      
      // 读取文件
      if (onProgress) onProgress({ stage: 'reading', progress: 0 })
      
      const result = await reader.readFile(file)
      
      if (onProgress) onProgress({ stage: 'parsing', progress: 50 })
      
      // 添加元数据
      result.id = this.generateId()
      result.importTime = new Date()
      result.filePath = file.name
      result.originalFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
      
      if (onProgress) onProgress({ stage: 'complete', progress: 100 })
      
      return result
    } catch (err) {
      console.error('文件处理失败:', err)
      throw err
    }
  }
  
  /**
   * 批量处理文件
   */
  async processFiles(files, onProgress = null) {
    const results = []
    const errors = []
    
    for (let i = 0; i < files.length; i++) {
      try {
        if (onProgress) {
          onProgress({
            fileIndex: i,
            fileName: files[i].name,
            totalFiles: files.length,
            progress: (i / files.length) * 100
          })
        }
        
        const result = await this.processFile(files[i])
        results.push(result)
      } catch (err) {
        errors.push({
          file: files[i].name,
          error: err.message
        })
      }
    }
    
    return { results, errors }
  }
  
  /**
   * 生成唯一ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
  
  /**
   * 获取支持的格式信息
   */
  getSupportedFormats() {
    return SUPPORTED_FORMATS
  }
  
  /**
   * 创建文件选择过滤器
   */
  createFileFilter() {
    const extensions = []
    const descriptions = []
    
    for (const [format, config] of Object.entries(SUPPORTED_FORMATS)) {
      if (this.options.allowedFormats.includes(format)) {
        extensions.push(...config.extensions)
        descriptions.push(config.description)
      }
    }
    
    return {
      extensions: extensions.join(','),
      description: descriptions.join('; ')
    }
  }
}

// 导出便捷函数
export const fileUtils = {
  // 文件格式检测
  detectFormat: FileFormatDetector.detectFormat.bind(FileFormatDetector),
  detectByExtension: FileFormatDetector.detectByExtension.bind(FileFormatDetector),
  detectByMimeType: FileFormatDetector.detectByMimeType.bind(FileFormatDetector),
  
  // 文件验证
  validateFile: FileValidator.validateFile.bind(FileValidator),
  validateFileSize: FileValidator.validateFileSize.bind(FileValidator),
  validateFileFormat: FileValidator.validateFileFormat.bind(FileValidator),
  
  // 文件处理
  createProcessor: (options) => new FileProcessor(options),
  
  // 支持的格式
  getSupportedFormats: () => SUPPORTED_FORMATS,
  
  // 创建文件选择器配置
  createFileDialogConfig: (allowedFormats = Object.keys(SUPPORTED_FORMATS)) => {
    const processor = new FileProcessor({ allowedFormats })
    return processor.createFileFilter()
  }
}

export default fileUtils