// 阅读设置状态管理

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { storageUtils } from '../utils/storageUtils'

export const useSettingsStore = defineStore('settings', () => {
  // 阅读器设置
  const readerSettings = ref({
    // 字体设置
    fontFamily: 'Microsoft YaHei', // 字体
    fontSize: 18, // 字体大小 (px)
    fontWeight: 'normal', // 字体粗细
    lineHeight: 1.8, // 行高
    letterSpacing: 0, // 字间距 (px)
    
    // 颜色主题
    theme: 'light', // light, dark, sepia, green, custom
    backgroundColor: '#ffffff', // 背景色
    textColor: '#333333', // 文字颜色
    
    // 布局设置
    pageWidth: 800, // 页面宽度 (px)
    pageMargin: 60, // 页面边距 (px)
    paragraphSpacing: 16, // 段落间距 (px)
    textAlign: 'justify', // 文本对齐: left, center, right, justify
    
    // 翻页设置
    pageMode: 'scroll', // scroll, page
    animationDuration: 300, // 翻页动画时长 (ms)
    autoScroll: false, // 自动滚动
    scrollSpeed: 50, // 自动滚动速度 (px/s)
    
    // 阅读辅助
    showProgress: true, // 显示阅读进度
    showChapterTitle: true, // 显示章节标题
    showPageNumber: false, // 显示页码
    highlightCurrentLine: false, // 高亮当前行
    
    // 护眼设置
    eyeProtection: false, // 护眼模式
    blueLight: 0, // 蓝光过滤 (0-100)
    brightness: 100, // 亮度 (0-100)
    
    // 快捷键设置
    shortcuts: {
      nextPage: 'ArrowRight',
      prevPage: 'ArrowLeft',
      nextChapter: 'ArrowDown',
      prevChapter: 'ArrowUp',
      toggleFullscreen: 'F11',
      toggleMenu: 'Escape',
      addBookmark: 'Ctrl+B',
      showSettings: 'Ctrl+,'
    }
  })

  // 窗口设置
  const windowSettings = ref({
    // 窗口尺寸
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    
    // 窗口位置
    x: null, // null表示居中
    y: null,
    
    // 窗口状态
    alwaysOnTop: false, // 置顶
    resizable: true, // 可调整大小
    maximizable: true, // 可最大化
    minimizable: true, // 可最小化
    
    // 窗口样式
    frame: true, // 显示边框
    titleBarStyle: 'default', // default, hidden, hiddenInset
    transparent: false, // 透明窗口
    opacity: 1.0, // 窗口透明度
    
    // 多窗口
    allowMultipleWindows: true, // 允许多个阅读窗口
    rememberPosition: true, // 记住窗口位置
    rememberSize: true // 记住窗口大小
  })

  // 导入设置
  const importSettings = ref({
    // 支持的格式
    supportedFormats: ['txt', 'epub', 'pdf'],
    
    // 文本编码
    defaultEncoding: 'utf-8',
    autoDetectEncoding: true,
    
    // 章节识别
    chapterPattern: [
      /^第[\d一二三四五六七八九十百千万]+[章节回]/,
      /^Chapter\s+\d+/i,
      /^\d+[\s\.]/
    ],
    
    // 文件处理
    maxFileSize: 100 * 1024 * 1024, // 100MB
    enableCache: true,
    cacheExpiry: 7 * 24 * 60 * 60 * 1000, // 7天
    
    // 元数据提取
    extractMetadata: true,
    generateThumbnail: true,
    analyzeContent: true
  })

  // 在线阅读设置
  const onlineSettings = ref({
    // 浏览器设置
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    enableJavaScript: true,
    enableImages: true,
    enablePlugins: false,
    
    // 网络设置
    timeout: 30000, // 30秒
    maxRedirects: 5,
    enableProxy: false,
    proxyUrl: '',
    
    // 内容过滤
    blockAds: true,
    blockPopups: true,
    blockTrackers: true,
    
    // 常用网站
    bookmarkSites: [
      { name: '起点中文网', url: 'https://www.qidian.com' },
      { name: '晋江文学城', url: 'https://www.jjwxc.net' },
      { name: '纵横中文网', url: 'https://www.zongheng.com' }
    ]
  })

  // 通用设置
  const generalSettings = ref({
    // 语言设置
    language: 'zh-CN',
    
    // 启动设置
    autoStart: false, // 开机自启
    startMinimized: false, // 启动时最小化
    rememberLastBook: true, // 记住上次阅读的书
    
    // 数据设置
    autoBackup: true, // 自动备份
    backupInterval: 24 * 60 * 60 * 1000, // 24小时
    maxBackups: 10, // 最大备份数
    
    // 性能设置
    enableHardwareAcceleration: true,
    maxMemoryUsage: 512, // MB
    enableLazyLoading: true,
    
    // 隐私设置
    collectUsageData: false,
    enableCrashReporting: true,
    clearCacheOnExit: false
  })

  // 预设主题
  const themes = ref({
    light: {
      name: '明亮',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderColor: '#e0e0e0'
    },
    dark: {
      name: '暗黑',
      backgroundColor: '#1a1a1a',
      textColor: '#e0e0e0',
      borderColor: '#404040'
    },
    sepia: {
      name: '护眼',
      backgroundColor: '#f7f3e9',
      textColor: '#5c4b37',
      borderColor: '#d4c5a9'
    },
    green: {
      name: '绿色',
      backgroundColor: '#e8f5e8',
      textColor: '#2d5016',
      borderColor: '#c8e6c9'
    }
  })

  // 计算属性
  const currentTheme = computed(() => {
    const themeName = readerSettings.value.theme
    if (themeName === 'custom') {
      return {
        name: '自定义',
        backgroundColor: readerSettings.value.backgroundColor,
        textColor: readerSettings.value.textColor,
        borderColor: '#cccccc'
      }
    }
    return themes.value[themeName] || themes.value.light
  })

  const readerStyles = computed(() => {
    const settings = readerSettings.value
    const theme = currentTheme.value
    
    return {
      fontFamily: settings.fontFamily,
      fontSize: `${settings.fontSize}px`,
      fontWeight: settings.fontWeight,
      lineHeight: settings.lineHeight,
      letterSpacing: `${settings.letterSpacing}px`,
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      maxWidth: `${settings.pageWidth}px`,
      padding: `${settings.pageMargin}px`,
      textAlign: settings.textAlign,
      '--paragraph-spacing': `${settings.paragraphSpacing}px`
    }
  })

  // 监听设置变化并自动保存
  watch(readerSettings, () => saveSettings(), { deep: true })
  watch(windowSettings, () => saveSettings(), { deep: true })
  watch(importSettings, () => saveSettings(), { deep: true })
  watch(onlineSettings, () => saveSettings(), { deep: true })
  watch(generalSettings, () => saveSettings(), { deep: true })

  // 动作
  async function loadSettings() {
    try {
      const saved = await storageUtils.getItem('novel_settings')
      if (saved) {
        // 合并保存的设置，保留默认值
        if (saved.readerSettings) {
          Object.assign(readerSettings.value, saved.readerSettings)
        }
        if (saved.windowSettings) {
          Object.assign(windowSettings.value, saved.windowSettings)
        }
        if (saved.importSettings) {
          Object.assign(importSettings.value, saved.importSettings)
        }
        if (saved.onlineSettings) {
          Object.assign(onlineSettings.value, saved.onlineSettings)
        }
        if (saved.generalSettings) {
          Object.assign(generalSettings.value, saved.generalSettings)
        }
      }
      console.log('设置加载完成')
    } catch (err) {
      console.error('加载设置失败:', err)
    }
  }

  async function saveSettings() {
    try {
      const settings = {
        readerSettings: readerSettings.value,
        windowSettings: windowSettings.value,
        importSettings: importSettings.value,
        onlineSettings: onlineSettings.value,
        generalSettings: generalSettings.value,
        lastSaved: new Date().toISOString()
      }
      
      await storageUtils.setItem('novel_settings', settings)
    } catch (err) {
      console.error('保存设置失败:', err)
    }
  }

  function resetSettings(category = 'all') {
    const defaultSettings = {
      reader: () => {
        readerSettings.value = {
          fontFamily: 'Microsoft YaHei',
          fontSize: 18,
          fontWeight: 'normal',
          lineHeight: 1.8,
          letterSpacing: 0,
          theme: 'light',
          backgroundColor: '#ffffff',
          textColor: '#333333',
          pageWidth: 800,
          pageMargin: 60,
          paragraphSpacing: 16,
          textAlign: 'justify',
          pageMode: 'scroll',
          animationDuration: 300,
          autoScroll: false,
          scrollSpeed: 50,
          showProgress: true,
          showChapterTitle: true,
          showPageNumber: false,
          highlightCurrentLine: false,
          eyeProtection: false,
          blueLight: 0,
          brightness: 100,
          shortcuts: {
            nextPage: 'ArrowRight',
            prevPage: 'ArrowLeft',
            nextChapter: 'ArrowDown',
            prevChapter: 'ArrowUp',
            toggleFullscreen: 'F11',
            toggleMenu: 'Escape',
            addBookmark: 'Ctrl+B',
            showSettings: 'Ctrl+,'
          }
        }
      },
      window: () => {
        windowSettings.value = {
          width: 1000,
          height: 700,
          minWidth: 600,
          minHeight: 400,
          x: null,
          y: null,
          alwaysOnTop: false,
          resizable: true,
          maximizable: true,
          minimizable: true,
          frame: true,
          titleBarStyle: 'default',
          transparent: false,
          opacity: 1.0,
          allowMultipleWindows: true,
          rememberPosition: true,
          rememberSize: true
        }
      }
    }

    if (category === 'all') {
      Object.values(defaultSettings).forEach(reset => reset())
    } else if (defaultSettings[category]) {
      defaultSettings[category]()
    }
  }

  function applyTheme(themeName) {
    if (themes.value[themeName]) {
      readerSettings.value.theme = themeName
      const theme = themes.value[themeName]
      readerSettings.value.backgroundColor = theme.backgroundColor
      readerSettings.value.textColor = theme.textColor
    }
  }

  function updateReaderSetting(key, value) {
    readerSettings.value[key] = value
  }

  function updateWindowSetting(key, value) {
    windowSettings.value[key] = value
  }

  function updateImportSetting(key, value) {
    importSettings.value[key] = value
  }

  function updateOnlineSetting(key, value) {
    onlineSettings.value[key] = value
  }

  function updateGeneralSetting(key, value) {
    generalSettings.value[key] = value
  }

  function addCustomTheme(name, theme) {
    themes.value[name] = theme
  }

  function removeCustomTheme(name) {
    if (name !== 'light' && name !== 'dark' && name !== 'sepia' && name !== 'green') {
      delete themes.value[name]
    }
  }

  async function exportSettings() {
    try {
      const settings = {
        readerSettings: readerSettings.value,
        windowSettings: windowSettings.value,
        importSettings: importSettings.value,
        onlineSettings: onlineSettings.value,
        generalSettings: generalSettings.value,
        themes: themes.value,
        exportTime: new Date().toISOString(),
        version: '1.0.0'
      }
      
      return JSON.stringify(settings, null, 2)
    } catch (err) {
      console.error('导出设置失败:', err)
      throw err
    }
  }

  async function importAllSettings(settingsJson) {
    try {
      const settings = JSON.parse(settingsJson)
      
      if (settings.readerSettings) {
        Object.assign(readerSettings.value, settings.readerSettings)
      }
      if (settings.windowSettings) {
        Object.assign(windowSettings.value, settings.windowSettings)
      }
      if (settings.importSettings) {
        Object.assign(importSettings.value, settings.importSettings)
      }
      if (settings.onlineSettings) {
        Object.assign(onlineSettings.value, settings.onlineSettings)
      }
      if (settings.generalSettings) {
        Object.assign(generalSettings.value, settings.generalSettings)
      }
      if (settings.themes) {
        Object.assign(themes.value, settings.themes)
      }
      
      await saveSettings()
      console.log('设置导入成功')
    } catch (err) {
      console.error('导入设置失败:', err)
      throw err
    }
  }

  return {
    // 状态
    readerSettings,
    windowSettings,
    importSettings,
    onlineSettings,
    generalSettings,
    themes,
    
    // 计算属性
    currentTheme,
    readerStyles,
    
    // 动作
    loadSettings,
    saveSettings,
    resetSettings,
    applyTheme,
    updateReaderSetting,
    updateWindowSetting,
    updateImportSetting,
    updateOnlineSetting,
    updateGeneralSetting,
    addCustomTheme,
    removeCustomTheme,
    exportSettings,
    importAllSettings
  }
})