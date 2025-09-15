// 存储工具函数
// 提供统一的本地存储接口，支持多种存储方式

/**
 * 存储适配器接口
 */
class StorageAdapter {
  async getItem(key) {
    throw new Error('getItem method must be implemented')
  }
  
  async setItem(key, value) {
    throw new Error('setItem method must be implemented')
  }
  
  async removeItem(key) {
    throw new Error('removeItem method must be implemented')
  }
  
  async clear() {
    throw new Error('clear method must be implemented')
  }
  
  async keys() {
    throw new Error('keys method must be implemented')
  }
}

/**
 * LocalStorage 适配器
 */
class LocalStorageAdapter extends StorageAdapter {
  constructor(prefix = 'novel_') {
    super()
    this.prefix = prefix
  }
  
  _getKey(key) {
    return `${this.prefix}${key}`
  }
  
  async getItem(key) {
    try {
      const item = localStorage.getItem(this._getKey(key))
      return item ? JSON.parse(item) : null
    } catch (err) {
      console.error('LocalStorage getItem error:', err)
      return null
    }
  }
  
  async setItem(key, value) {
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(value))
      return true
    } catch (err) {
      console.error('LocalStorage setItem error:', err)
      return false
    }
  }
  
  async removeItem(key) {
    try {
      localStorage.removeItem(this._getKey(key))
      return true
    } catch (err) {
      console.error('LocalStorage removeItem error:', err)
      return false
    }
  }
  
  async clear() {
    try {
      const keys = await this.keys()
      keys.forEach(key => localStorage.removeItem(this._getKey(key)))
      return true
    } catch (err) {
      console.error('LocalStorage clear error:', err)
      return false
    }
  }
  
  async keys() {
    try {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length))
        }
      }
      return keys
    } catch (err) {
      console.error('LocalStorage keys error:', err)
      return []
    }
  }
}

/**
 * IndexedDB 适配器
 */
class IndexedDBAdapter extends StorageAdapter {
  constructor(dbName = 'NovelReaderDB', version = 1, storeName = 'novels') {
    super()
    this.dbName = dbName
    this.version = version
    this.storeName = storeName
    this.db = null
  }
  
  async _openDB() {
    if (this.db) return this.db
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }
  
  async getItem(key) {
    try {
      const db = await this._openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          resolve(result ? result.value : null)
        }
      })
    } catch (err) {
      console.error('IndexedDB getItem error:', err)
      return null
    }
  }
  
  async setItem(key, value) {
    try {
      const db = await this._openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.put({ key, value, timestamp: Date.now() })
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch (err) {
      console.error('IndexedDB setItem error:', err)
      return false
    }
  }
  
  async removeItem(key) {
    try {
      const db = await this._openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch (err) {
      console.error('IndexedDB removeItem error:', err)
      return false
    }
  }
  
  async clear() {
    try {
      const db = await this._openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch (err) {
      console.error('IndexedDB clear error:', err)
      return false
    }
  }
  
  async keys() {
    try {
      const db = await this._openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.getAllKeys()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
    } catch (err) {
      console.error('IndexedDB keys error:', err)
      return []
    }
  }
}

/**
 * 文件系统适配器（通过 Electron API）
 */
class FileSystemAdapter extends StorageAdapter {
  constructor(dataPath = null) {
    super()
    this.dataPath = dataPath
    this.isElectron = typeof window !== 'undefined' && window.electronAPI
  }
  
  async _ensureDataPath() {
    if (!this.dataPath && this.isElectron) {
      this.dataPath = await window.electronAPI.getDataPath()
    }
    return this.dataPath
  }
  
  async getItem(key) {
    if (!this.isElectron) return null
    
    try {
      await this._ensureDataPath()
      const data = await window.electronAPI.readFile(`${this.dataPath}/${key}.json`)
      return data ? JSON.parse(data) : null
    } catch (err) {
      console.error('FileSystem getItem error:', err)
      return null
    }
  }
  
  async setItem(key, value) {
    if (!this.isElectron) return false
    
    try {
      await this._ensureDataPath()
      const data = JSON.stringify(value, null, 2)
      await window.electronAPI.writeFile(`${this.dataPath}/${key}.json`, data)
      return true
    } catch (err) {
      console.error('FileSystem setItem error:', err)
      return false
    }
  }
  
  async removeItem(key) {
    if (!this.isElectron) return false
    
    try {
      await this._ensureDataPath()
      await window.electronAPI.deleteFile(`${this.dataPath}/${key}.json`)
      return true
    } catch (err) {
      console.error('FileSystem removeItem error:', err)
      return false
    }
  }
  
  async clear() {
    if (!this.isElectron) return false
    
    try {
      const keys = await this.keys()
      for (const key of keys) {
        await this.removeItem(key)
      }
      return true
    } catch (err) {
      console.error('FileSystem clear error:', err)
      return false
    }
  }
  
  async keys() {
    if (!this.isElectron) return []
    
    try {
      await this._ensureDataPath()
      const files = await window.electronAPI.listFiles(this.dataPath)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''))
    } catch (err) {
      console.error('FileSystem keys error:', err)
      return []
    }
  }
}

/**
 * 存储管理器
 */
class StorageManager {
  constructor() {
    this.adapters = new Map()
    this.currentAdapter = null
    this.fallbackAdapter = null
    
    // 初始化适配器
    this._initAdapters()
  }
  
  _initAdapters() {
    // 注册适配器
    this.adapters.set('localStorage', new LocalStorageAdapter())
    this.adapters.set('indexedDB', new IndexedDBAdapter())
    this.adapters.set('fileSystem', new FileSystemAdapter())
    
    // 选择最佳适配器
    this._selectBestAdapter()
  }
  
  _selectBestAdapter() {
    // 优先级：文件系统 > IndexedDB > LocalStorage
    if (typeof window !== 'undefined' && window.electronAPI) {
      this.currentAdapter = this.adapters.get('fileSystem')
      this.fallbackAdapter = this.adapters.get('indexedDB')
    } else if (typeof indexedDB !== 'undefined') {
      this.currentAdapter = this.adapters.get('indexedDB')
      this.fallbackAdapter = this.adapters.get('localStorage')
    } else {
      this.currentAdapter = this.adapters.get('localStorage')
      this.fallbackAdapter = null
    }
    
    console.log('选择存储适配器:', this.currentAdapter.constructor.name)
  }
  
  async _executeWithFallback(operation, ...args) {
    try {
      return await operation.call(this.currentAdapter, ...args)
    } catch (err) {
      console.warn('主存储适配器失败，尝试备用适配器:', err)
      
      if (this.fallbackAdapter) {
        try {
          return await operation.call(this.fallbackAdapter, ...args)
        } catch (fallbackErr) {
          console.error('备用存储适配器也失败:', fallbackErr)
          throw fallbackErr
        }
      }
      
      throw err
    }
  }
  
  async getItem(key) {
    return this._executeWithFallback(this.currentAdapter.getItem, key)
  }
  
  async setItem(key, value) {
    return this._executeWithFallback(this.currentAdapter.setItem, key, value)
  }
  
  async removeItem(key) {
    return this._executeWithFallback(this.currentAdapter.removeItem, key)
  }
  
  async clear() {
    return this._executeWithFallback(this.currentAdapter.clear)
  }
  
  async keys() {
    return this._executeWithFallback(this.currentAdapter.keys)
  }
  
  // 批量操作
  async getItems(keys) {
    const results = {}
    for (const key of keys) {
      results[key] = await this.getItem(key)
    }
    return results
  }
  
  async setItems(items) {
    const results = {}
    for (const [key, value] of Object.entries(items)) {
      results[key] = await this.setItem(key, value)
    }
    return results
  }
  
  async removeItems(keys) {
    const results = {}
    for (const key of keys) {
      results[key] = await this.removeItem(key)
    }
    return results
  }
  
  // 数据迁移
  async migrate(fromAdapter, toAdapter) {
    try {
      const keys = await fromAdapter.keys()
      const migrationResults = []
      
      for (const key of keys) {
        try {
          const value = await fromAdapter.getItem(key)
          if (value !== null) {
            await toAdapter.setItem(key, value)
            migrationResults.push({ key, status: 'success' })
          }
        } catch (err) {
          migrationResults.push({ key, status: 'error', error: err.message })
        }
      }
      
      console.log('数据迁移完成:', migrationResults)
      return migrationResults
    } catch (err) {
      console.error('数据迁移失败:', err)
      throw err
    }
  }
  
  // 数据备份
  async backup() {
    try {
      const keys = await this.keys()
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {}
      }
      
      for (const key of keys) {
        backup.data[key] = await this.getItem(key)
      }
      
      return backup
    } catch (err) {
      console.error('数据备份失败:', err)
      throw err
    }
  }
  
  // 数据恢复
  async restore(backup) {
    try {
      if (!backup.data) {
        throw new Error('无效的备份数据')
      }
      
      const results = []
      for (const [key, value] of Object.entries(backup.data)) {
        try {
          await this.setItem(key, value)
          results.push({ key, status: 'success' })
        } catch (err) {
          results.push({ key, status: 'error', error: err.message })
        }
      }
      
      console.log('数据恢复完成:', results)
      return results
    } catch (err) {
      console.error('数据恢复失败:', err)
      throw err
    }
  }
  
  // 存储统计
  async getStorageInfo() {
    try {
      const keys = await this.keys()
      let totalSize = 0
      const itemSizes = {}
      
      for (const key of keys) {
        const value = await this.getItem(key)
        const size = JSON.stringify(value).length
        itemSizes[key] = size
        totalSize += size
      }
      
      return {
        totalItems: keys.length,
        totalSize,
        itemSizes,
        adapter: this.currentAdapter.constructor.name
      }
    } catch (err) {
      console.error('获取存储信息失败:', err)
      return null
    }
  }
}

// 创建全局存储管理器实例
const storageManager = new StorageManager()

// 导出便捷接口
export const storageUtils = {
  getItem: (key) => storageManager.getItem(key),
  setItem: (key, value) => storageManager.setItem(key, value),
  removeItem: (key) => storageManager.removeItem(key),
  clear: () => storageManager.clear(),
  keys: () => storageManager.keys(),
  getItems: (keys) => storageManager.getItems(keys),
  setItems: (items) => storageManager.setItems(items),
  removeItems: (keys) => storageManager.removeItems(keys),
  backup: () => storageManager.backup(),
  restore: (backup) => storageManager.restore(backup),
  getStorageInfo: () => storageManager.getStorageInfo()
}

// 导出类供高级用法
export {
  StorageAdapter,
  LocalStorageAdapter,
  IndexedDBAdapter,
  FileSystemAdapter,
  StorageManager
}

export default storageUtils