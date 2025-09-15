// 摸鱼功能状态管理

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { storageUtils } from '../utils/storageUtils'

export const useStealthStore = defineStore('stealth', () => {
  // 状态
  const isStealthMode = ref(false) // 是否开启摸鱼模式
  const opacity = ref(1.0) // 窗口透明度 (0.1-1.0)
  const isHidden = ref(false) // 是否隐藏窗口
  const disguiseMode = ref('none') // 伪装模式: none, work, code, browser
  const quickHideEnabled = ref(true) // 是否启用快速隐藏
  const bossKeyEnabled = ref(true) // 是否启用老板键
  const autoHideEnabled = ref(false) // 是否启用自动隐藏
  const mouseHoverShow = ref(true) // 鼠标悬停显示
  
  // 快捷键设置
  const hotkeys = ref({
    toggleStealth: 'Ctrl+Shift+H', // 切换摸鱼模式
    quickHide: 'Ctrl+H', // 快速隐藏
    bossKey: 'Ctrl+`', // 老板键
    toggleOpacity: 'Ctrl+Shift+O', // 切换透明度
    disguiseToggle: 'Ctrl+Shift+D' // 切换伪装模式
  })
  
  // 透明度预设
  const opacityPresets = ref([
    { name: '完全不透明', value: 1.0 },
    { name: '轻微透明', value: 0.9 },
    { name: '半透明', value: 0.7 },
    { name: '高度透明', value: 0.5 },
    { name: '几乎透明', value: 0.3 },
    { name: '最低可见', value: 0.1 }
  ])
  
  // 伪装模式配置
  const disguiseModes = ref({
    none: {
      name: '无伪装',
      description: '正常显示小说阅读界面',
      enabled: true
    },
    work: {
      name: '工作模式',
      description: '伪装成工作文档界面',
      enabled: true,
      template: 'work-document',
      title: '工作报告 - Microsoft Word',
      favicon: '/icons/word.ico'
    },
    code: {
      name: '编程模式',
      description: '伪装成代码编辑器界面',
      enabled: true,
      template: 'code-editor',
      title: 'Visual Studio Code',
      favicon: '/icons/vscode.ico'
    },
    browser: {
      name: '浏览器模式',
      description: '伪装成正常网页浏览',
      enabled: true,
      template: 'web-browser',
      title: '百度一下，你就知道',
      favicon: '/icons/baidu.ico'
    },
    excel: {
      name: 'Excel模式',
      description: '伪装成Excel表格',
      enabled: false,
      template: 'excel-sheet',
      title: 'Microsoft Excel',
      favicon: '/icons/excel.ico'
    },
    email: {
      name: '邮件模式',
      description: '伪装成邮件客户端',
      enabled: false,
      template: 'email-client',
      title: 'Outlook',
      favicon: '/icons/outlook.ico'
    }
  })
  
  // 自动隐藏设置
  const autoHideSettings = ref({
    enabled: false,
    idleTime: 30, // 空闲时间（秒）
    hideOnFocusLoss: true, // 失去焦点时隐藏
    hideOnMouseLeave: false, // 鼠标离开时隐藏
    showOnMouseMove: true, // 鼠标移动时显示
    excludeApps: [] // 排除的应用程序
  })
  
  // 检测设置
  const detectionSettings = ref({
    enableDetection: true, // 启用检测
    sensitiveApps: [ // 敏感应用列表
      'QQ.exe',
      'WeChat.exe',
      'DingTalk.exe',
      'Feishu.exe',
      'Teams.exe'
    ],
    detectionInterval: 1000, // 检测间隔（毫秒）
    autoAction: 'hide' // 检测到时的动作: hide, minimize, disguise
  })
  
  // 运行时状态
  const lastActiveTime = ref(Date.now()) // 最后活动时间
  const detectionTimer = ref(null) // 检测定时器
  const hideTimer = ref(null) // 隐藏定时器
  const currentDisguiseTemplate = ref(null) // 当前伪装模板
  const isDetectionActive = ref(false) // 检测是否激活
  
  // 统计数据
  const stats = ref({
    totalStealthTime: 0, // 总摸鱼时间（分钟）
    stealthSessions: 0, // 摸鱼次数
    quickHideCount: 0, // 快速隐藏次数
    bossKeyCount: 0, // 老板键使用次数
    detectionCount: 0 // 检测触发次数
  })

  // 计算属性
  const currentOpacityPreset = computed(() => {
    return opacityPresets.value.find(preset => 
      Math.abs(preset.value - opacity.value) < 0.05
    ) || { name: '自定义', value: opacity.value }
  })
  
  const currentDisguiseConfig = computed(() => {
    return disguiseModes.value[disguiseMode.value] || disguiseModes.value.none
  })
  
  const isTransparent = computed(() => {
    return opacity.value < 1.0
  })
  
  const canQuickHide = computed(() => {
    return quickHideEnabled.value && !isHidden.value
  })
  
  const stealthStatus = computed(() => {
    if (isHidden.value) return 'hidden'
    if (disguiseMode.value !== 'none') return 'disguised'
    if (isTransparent.value) return 'transparent'
    if (isStealthMode.value) return 'stealth'
    return 'normal'
  })

  // 动作
  async function toggleStealthMode() {
    isStealthMode.value = !isStealthMode.value
    
    if (isStealthMode.value) {
      await startStealthMode()
    } else {
      await stopStealthMode()
    }
    
    await saveSettings()
    console.log('摸鱼模式:', isStealthMode.value ? '开启' : '关闭')
  }
  
  async function startStealthMode() {
    isStealthMode.value = true
    
    // 开始检测
    if (detectionSettings.value.enableDetection) {
      startDetection()
    }
    
    // 开始自动隐藏
    if (autoHideSettings.value.enabled) {
      startAutoHide()
    }
    
    // 更新统计
    stats.value.stealthSessions++
    
    // 通知主进程启用摸鱼模式
    if (window.electronAPI) {
      window.electronAPI.enableStealthMode({
        opacity: opacity.value,
        disguiseMode: disguiseMode.value,
        hotkeys: hotkeys.value
      })
    }
  }
  
  async function stopStealthMode() {
    isStealthMode.value = false
    isHidden.value = false
    disguiseMode.value = 'none'
    opacity.value = 1.0
    
    // 停止检测和自动隐藏
    stopDetection()
    stopAutoHide()
    
    // 通知主进程禁用摸鱼模式
    if (window.electronAPI) {
      window.electronAPI.disableStealthMode()
    }
  }
  
  function setOpacity(value) {
    opacity.value = Math.max(0.1, Math.min(1.0, value))
    
    // 实时更新窗口透明度
    if (window.electronAPI && isStealthMode.value) {
      window.electronAPI.setWindowOpacity(opacity.value)
    }
  }
  
  function nextOpacityPreset() {
    const currentIndex = opacityPresets.value.findIndex(preset => 
      Math.abs(preset.value - opacity.value) < 0.05
    )
    const nextIndex = (currentIndex + 1) % opacityPresets.value.length
    setOpacity(opacityPresets.value[nextIndex].value)
  }
  
  async function quickHide() {
    if (!canQuickHide.value) return
    
    isHidden.value = true
    stats.value.quickHideCount++
    
    if (window.electronAPI) {
      window.electronAPI.hideWindow()
    }
    
    console.log('快速隐藏窗口')
  }
  
  async function quickShow() {
    if (!isHidden.value) return
    
    isHidden.value = false
    
    if (window.electronAPI) {
      window.electronAPI.showWindow()
    }
    
    console.log('显示窗口')
  }
  
  async function bossKey() {
    stats.value.bossKeyCount++
    
    if (isHidden.value) {
      await quickShow()
    } else {
      await quickHide()
    }
  }
  
  function setDisguiseMode(mode) {
    if (disguiseModes.value[mode] && disguiseModes.value[mode].enabled) {
      disguiseMode.value = mode
      currentDisguiseTemplate.value = disguiseModes.value[mode].template
      
      console.log('切换伪装模式:', mode)
    }
  }
  
  function toggleDisguiseMode() {
    const enabledModes = Object.keys(disguiseModes.value).filter(
      key => disguiseModes.value[key].enabled
    )
    
    const currentIndex = enabledModes.indexOf(disguiseMode.value)
    const nextIndex = (currentIndex + 1) % enabledModes.length
    
    setDisguiseMode(enabledModes[nextIndex])
  }
  
  function startDetection() {
    if (detectionTimer.value) return
    
    isDetectionActive.value = true
    
    detectionTimer.value = setInterval(async () => {
      if (window.electronAPI) {
        const activeApp = await window.electronAPI.getActiveApplication()
        
        if (detectionSettings.value.sensitiveApps.includes(activeApp)) {
          stats.value.detectionCount++
          
          switch (detectionSettings.value.autoAction) {
            case 'hide':
              await quickHide()
              break
            case 'minimize':
              if (window.electronAPI) {
                window.electronAPI.minimizeWindow()
              }
              break
            case 'disguise':
              if (disguiseMode.value === 'none') {
                setDisguiseMode('work')
              }
              break
          }
          
          console.log('检测到敏感应用:', activeApp)
        }
      }
    }, detectionSettings.value.detectionInterval)
  }
  
  function stopDetection() {
    if (detectionTimer.value) {
      clearInterval(detectionTimer.value)
      detectionTimer.value = null
      isDetectionActive.value = false
    }
  }
  
  function startAutoHide() {
    if (hideTimer.value) return
    
    hideTimer.value = setInterval(() => {
      const now = Date.now()
      const idleTime = (now - lastActiveTime.value) / 1000
      
      if (idleTime > autoHideSettings.value.idleTime && !isHidden.value) {
        quickHide()
      }
    }, 1000)
  }
  
  function stopAutoHide() {
    if (hideTimer.value) {
      clearInterval(hideTimer.value)
      hideTimer.value = null
    }
  }
  
  function updateActivity() {
    lastActiveTime.value = Date.now()
    
    // 如果启用了鼠标移动显示，且当前隐藏，则显示窗口
    if (autoHideSettings.value.showOnMouseMove && isHidden.value) {
      quickShow()
    }
  }
  
  function updateHotkey(action, key) {
    hotkeys.value[action] = key
    
    // 通知主进程更新快捷键
    if (window.electronAPI) {
      window.electronAPI.updateHotkey(action, key)
    }
  }
  
  function enableDisguiseMode(mode, enabled = true) {
    if (disguiseModes.value[mode]) {
      disguiseModes.value[mode].enabled = enabled
    }
  }
  
  async function loadSettings() {
    try {
      const saved = await storageUtils.getItem('stealth_settings')
      if (saved) {
        if (saved.opacity !== undefined) opacity.value = saved.opacity
        if (saved.disguiseMode) disguiseMode.value = saved.disguiseMode
        if (saved.quickHideEnabled !== undefined) quickHideEnabled.value = saved.quickHideEnabled
        if (saved.bossKeyEnabled !== undefined) bossKeyEnabled.value = saved.bossKeyEnabled
        if (saved.autoHideEnabled !== undefined) autoHideEnabled.value = saved.autoHideEnabled
        if (saved.mouseHoverShow !== undefined) mouseHoverShow.value = saved.mouseHoverShow
        if (saved.hotkeys) Object.assign(hotkeys.value, saved.hotkeys)
        if (saved.autoHideSettings) Object.assign(autoHideSettings.value, saved.autoHideSettings)
        if (saved.detectionSettings) Object.assign(detectionSettings.value, saved.detectionSettings)
        if (saved.stats) Object.assign(stats.value, saved.stats)
      }
      
      console.log('摸鱼设置加载完成')
    } catch (err) {
      console.error('加载摸鱼设置失败:', err)
    }
  }
  
  async function saveSettings() {
    try {
      const settings = {
        opacity: opacity.value,
        disguiseMode: disguiseMode.value,
        quickHideEnabled: quickHideEnabled.value,
        bossKeyEnabled: bossKeyEnabled.value,
        autoHideEnabled: autoHideEnabled.value,
        mouseHoverShow: mouseHoverShow.value,
        hotkeys: hotkeys.value,
        autoHideSettings: autoHideSettings.value,
        detectionSettings: detectionSettings.value,
        stats: stats.value,
        lastSaved: new Date().toISOString()
      }
      
      await storageUtils.setItem('stealth_settings', settings)
    } catch (err) {
      console.error('保存摸鱼设置失败:', err)
    }
  }
  
  function resetStats() {
    stats.value = {
      totalStealthTime: 0,
      stealthSessions: 0,
      quickHideCount: 0,
      bossKeyCount: 0,
      detectionCount: 0
    }
  }
  
  function getStealthReport() {
    return {
      ...stats.value,
      averageSessionTime: stats.value.stealthSessions > 0 
        ? Math.round(stats.value.totalStealthTime / stats.value.stealthSessions) 
        : 0,
      detectionRate: stats.value.stealthSessions > 0
        ? Math.round((stats.value.detectionCount / stats.value.stealthSessions) * 100)
        : 0
    }
  }

  return {
    // 状态
    isStealthMode,
    opacity,
    isHidden,
    disguiseMode,
    quickHideEnabled,
    bossKeyEnabled,
    autoHideEnabled,
    mouseHoverShow,
    hotkeys,
    opacityPresets,
    disguiseModes,
    autoHideSettings,
    detectionSettings,
    lastActiveTime,
    currentDisguiseTemplate,
    isDetectionActive,
    stats,
    
    // 计算属性
    currentOpacityPreset,
    currentDisguiseConfig,
    isTransparent,
    canQuickHide,
    stealthStatus,
    
    // 动作
    toggleStealthMode,
    startStealthMode,
    stopStealthMode,
    setOpacity,
    nextOpacityPreset,
    quickHide,
    quickShow,
    bossKey,
    setDisguiseMode,
    toggleDisguiseMode,
    startDetection,
    stopDetection,
    updateActivity,
    updateHotkey,
    enableDisguiseMode,
    loadSettings,
    saveSettings,
    resetStats,
    getStealthReport
  }
})