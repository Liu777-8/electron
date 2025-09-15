// 小说模块状态管理入口

import { useNovelStore } from './novel'
import { useReaderStore } from './reader'
import { useSettingsStore } from './settings'
import { useStealthStore } from './stealth'

// 导出所有store
export {
  useNovelStore,
  useReaderStore,
  useSettingsStore,
  useStealthStore
}

// 创建小说模块stores的工厂函数
export function createNovelStores() {
  return {
    novel: useNovelStore,
    reader: useReaderStore,
    settings: useSettingsStore,
    stealth: useStealthStore
  }
}

// 初始化所有stores
export function initNovelStores() {
  const novelStore = useNovelStore()
  const readerStore = useReaderStore()
  const settingsStore = useSettingsStore()
  const stealthStore = useStealthStore()

  // 初始化设置
  settingsStore.loadSettings()
  
  // 初始化小说库
  novelStore.loadLibrary()
  
  console.log('小说模块状态管理已初始化')
  
  return {
    novelStore,
    readerStore,
    settingsStore,
    stealthStore
  }
}