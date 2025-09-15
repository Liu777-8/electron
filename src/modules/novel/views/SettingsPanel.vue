<template>
  <div class="settings-panel" :class="{ 'dark': isDark, 'fullscreen': isFullscreen }">
    <!-- 设置面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('close')" title="返回">
          <i class="icon-arrow-left"></i>
        </button>
        <h2>设置中心</h2>
      </div>
      
      <div class="header-right">
        <button 
          class="header-btn" 
          @click="exportSettings" 
          title="导出设置"
        >
          <i class="icon-export"></i>
          导出
        </button>
        
        <button 
          class="header-btn" 
          @click="importSettingsFile" 
          title="导入设置"
        >
          <i class="icon-import"></i>
          导入
        </button>
        
        <button 
          class="header-btn" 
          @click="resetAllSettings" 
          title="重置所有设置"
        >
          <i class="icon-reset"></i>
          重置
        </button>
        
        <button 
          class="header-btn" 
          @click="toggleFullscreen" 
          :title="isFullscreen ? '退出全屏' : '全屏显示'"
        >
          <i :class="isFullscreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'"></i>
        </button>
      </div>
    </div>
    
    <!-- 设置面板内容 -->
    <div class="panel-content">
      <!-- 侧边栏导航 -->
      <div class="settings-sidebar">
        <div class="sidebar-search">
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="搜索设置项..."
            class="search-input"
          >
          <i class="icon-search"></i>
        </div>
        
        <div class="settings-nav">
          <div 
            class="nav-item" 
            v-for="category in filteredCategories" 
            :key="category.key"
            :class="{ 'active': activeCategory === category.key }"
            @click="selectCategory(category.key)"
          >
            <i :class="category.icon"></i>
            <span>{{ category.name }}</span>
            <div class="nav-badge" v-if="category.badge">{{ category.badge }}</div>
          </div>
        </div>
        
        <!-- 快速操作 -->
        <div class="quick-actions">
          <h4>快速操作</h4>
          <button class="quick-btn" @click="toggleDarkMode">
            <i :class="isDark ? 'icon-sun' : 'icon-moon'"></i>
            {{ isDark ? '浅色模式' : '深色模式' }}
          </button>
          
          <button class="quick-btn" @click="toggleStealthMode">
            <i class="icon-stealth"></i>
            {{ stealthMode ? '关闭摸鱼' : '开启摸鱼' }}
          </button>
          
          <button class="quick-btn" @click="openDataFolder">
            <i class="icon-folder"></i>
            打开数据目录
          </button>
        </div>
      </div>
      
      <!-- 设置内容区域 -->
      <div class="settings-main">
        <!-- 面包屑导航 -->
        <div class="breadcrumb">
          <span class="breadcrumb-item">设置中心</span>
          <i class="icon-chevron-right"></i>
          <span class="breadcrumb-item active">{{ currentCategoryName }}</span>
        </div>
        
        <!-- 设置内容 -->
        <div class="settings-content">
          <!-- 阅读设置 -->
          <div v-if="activeCategory === 'reading'" class="setting-category">
            <ReadingSettings @settings-change="handleReadingSettingsChange" />
          </div>
          
          <!-- 界面设置 -->
          <div v-else-if="activeCategory === 'interface'" class="setting-category">
            <InterfaceSettings @settings-change="handleInterfaceSettingsChange" />
          </div>
          
          <!-- 数据管理 -->
          <div v-else-if="activeCategory === 'data'" class="setting-category">
            <DataManagement @data-change="handleDataChange" />
          </div>
          
          <!-- 摸鱼设置 -->
          <div v-else-if="activeCategory === 'stealth'" class="setting-category">
            <StealthSettings @stealth-change="handleStealthSettingsChange" />
          </div>
          
          <!-- 快捷键设置 -->
          <div v-else-if="activeCategory === 'hotkeys'" class="setting-category">
            <HotkeySettings @hotkey-change="handleHotkeyChange" />
          </div>
          
          <!-- 高级设置 -->
          <div v-else-if="activeCategory === 'advanced'" class="setting-category">
            <AdvancedSettings @advanced-change="handleAdvancedChange" />
          </div>
          
          <!-- 关于信息 -->
          <div v-else-if="activeCategory === 'about'" class="setting-category">
            <AboutInfo />
          </div>
          
          <!-- 默认欢迎页面 -->
          <div v-else class="welcome-page">
            <div class="welcome-content">
              <i class="icon-settings-large"></i>
              <h3>欢迎使用设置中心</h3>
              <p>在这里您可以自定义小说阅读器的各项功能和外观设置</p>
              
              <div class="feature-grid">
                <div class="feature-card" @click="selectCategory('reading')">
                  <i class="icon-book"></i>
                  <h4>阅读设置</h4>
                  <p>字体、主题、布局等阅读体验设置</p>
                </div>
                
                <div class="feature-card" @click="selectCategory('stealth')">
                  <i class="icon-stealth"></i>
                  <h4>摸鱼功能</h4>
                  <p>透明度、快捷键、界面伪装设置</p>
                </div>
                
                <div class="feature-card" @click="selectCategory('interface')">
                  <i class="icon-palette"></i>
                  <h4>界面设置</h4>
                  <p>主题、布局、动画等界面定制</p>
                </div>
                
                <div class="feature-card" @click="selectCategory('hotkeys')">
                  <i class="icon-keyboard"></i>
                  <h4>快捷键</h4>
                  <p>自定义键盘快捷键和手势操作</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 设置同步状态 -->
    <div class="sync-status" v-if="syncStatus.visible">
      <div class="sync-content">
        <i :class="syncStatus.icon"></i>
        <span>{{ syncStatus.message }}</span>
        <button v-if="syncStatus.action" @click="syncStatus.action.handler">
          {{ syncStatus.action.text }}
        </button>
      </div>
    </div>
    
    <!-- 确认对话框 -->
    <div class="confirm-dialog" v-if="confirmDialog.visible">
      <div class="dialog-overlay" @click="hideConfirmDialog"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>{{ confirmDialog.title }}</h3>
        </div>
        <div class="dialog-body">
          <p>{{ confirmDialog.message }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="hideConfirmDialog">
            取消
          </button>
          <button class="btn-confirm" @click="confirmAction">
            确认
          </button>
        </div>
      </div>
    </div>
    
    <!-- 文件选择器 -->
    <input 
      type="file" 
      ref="fileInput" 
      accept=".json" 
      @change="handleFileImport" 
      style="display: none;"
    >
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '../stores/settings.js'
import { ReadingSettings, StealthSettings, InterfaceSettings, DataManagement } from '../components/settings'

// 动态导入其他设置组件
const HotkeySettings = () => import('../components/settings/HotkeySettings.vue')
const AdvancedSettings = () => import('../components/settings/AdvancedSettings.vue')
const AboutInfo = () => import('../components/settings/AboutInfo.vue')

export default {
  name: 'SettingsPanel',
  components: {
    ReadingSettings,
    StealthSettings,
    InterfaceSettings,
    DataManagement,
    // 动态组件将在需要时加载
    HotkeySettings,
    AdvancedSettings,
    AboutInfo
  },
  emits: ['close', 'settings-change'],
  setup(props, { emit }) {
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const activeCategory = ref('welcome')
    const searchQuery = ref('')
    const isFullscreen = ref(false)
    const isDark = ref(false)
    const stealthMode = ref(false)
    const fileInput = ref(null)
    
    // 设置分类
    const categories = ref([
      {
        key: 'reading',
        name: '阅读设置',
        icon: 'icon-book',
        description: '字体、主题、布局等阅读体验设置'
      },
      {
        key: 'stealth',
        name: '摸鱼功能',
        icon: 'icon-stealth',
        description: '透明度、快捷键、界面伪装设置'
      },
      {
        key: 'interface',
        name: '界面设置',
        icon: 'icon-palette',
        description: '主题、布局、动画等界面定制'
      },
      {
        key: 'data',
        name: '数据管理',
        icon: 'icon-database',
        description: '数据备份、同步、清理等管理功能'
      },
      {
        key: 'hotkeys',
        name: '快捷键',
        icon: 'icon-keyboard',
        description: '自定义键盘快捷键和手势操作'
      },
      {
        key: 'advanced',
        name: '高级设置',
        icon: 'icon-cog',
        description: '性能优化、调试选项等高级功能'
      },
      {
        key: 'about',
        name: '关于',
        icon: 'icon-info',
        description: '版本信息、更新日志、帮助文档'
      }
    ])
    
    // 同步状态
    const syncStatus = ref({
      visible: false,
      icon: '',
      message: '',
      action: null
    })
    
    // 确认对话框
    const confirmDialog = ref({
      visible: false,
      title: '',
      message: '',
      onConfirm: null
    })
    
    // 计算属性
    const filteredCategories = computed(() => {
      if (!searchQuery.value) return categories.value
      
      const query = searchQuery.value.toLowerCase()
      return categories.value.filter(category => 
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
      )
    })
    
    const currentCategoryName = computed(() => {
      const category = categories.value.find(c => c.key === activeCategory.value)
      return category ? category.name : '欢迎'
    })
    
    // 方法
    const selectCategory = (categoryKey) => {
      activeCategory.value = categoryKey
    }
    
    const toggleFullscreen = () => {
      isFullscreen.value = !isFullscreen.value
      
      if (isFullscreen.value) {
        document.documentElement.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    }
    
    const toggleDarkMode = () => {
      isDark.value = !isDark.value
      settingsStore.updateInterfaceSettings({ darkMode: isDark.value })
      document.body.classList.toggle('dark-theme', isDark.value)
    }
    
    const toggleStealthMode = () => {
      stealthMode.value = !stealthMode.value
      settingsStore.updateStealthSettings({ enabled: stealthMode.value })
    }
    
    const openDataFolder = async () => {
      try {
        // 使用 Electron API 打开数据目录
        if (window.electronAPI) {
          await window.electronAPI.openDataFolder()
        } else {
          // 浏览器环境下的处理
          console.log('数据目录:', settingsStore.getDataPath())
        }
      } catch (error) {
        console.error('打开数据目录失败:', error)
      }
    }
    
    const exportSettings = async () => {
      try {
        const settings = settingsStore.exportAllSettings()
        const blob = new Blob([JSON.stringify(settings, null, 2)], {
          type: 'application/json'
        })
        
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `novel-reader-settings-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        showSyncStatus('success', '设置导出成功')
      } catch (error) {
        console.error('导出设置失败:', error)
        showSyncStatus('error', '设置导出失败')
      }
    }
    
    const importSettingsFile = () => {
      fileInput.value?.click()
    }
    
    const handleFileImport = async (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const settings = JSON.parse(text)
        
        showConfirmDialog(
          '导入设置',
          '导入设置将覆盖当前所有设置，是否继续？',
          () => {
            settingsStore.importAllSettings(settings)
            showSyncStatus('success', '设置导入成功')
            // 刷新界面状态
            loadCurrentSettings()
          }
        )
      } catch (error) {
        console.error('导入设置失败:', error)
        showSyncStatus('error', '设置文件格式错误')
      } finally {
        // 清空文件选择
        event.target.value = ''
      }
    }
    
    const resetAllSettings = () => {
      showConfirmDialog(
        '重置设置',
        '此操作将重置所有设置到默认值，是否继续？',
        () => {
          settingsStore.resetAllSettings()
          showSyncStatus('success', '设置重置成功')
          loadCurrentSettings()
        }
      )
    }
    
    const showConfirmDialog = (title, message, onConfirm) => {
      confirmDialog.value = {
        visible: true,
        title,
        message,
        onConfirm
      }
    }
    
    const hideConfirmDialog = () => {
      confirmDialog.value.visible = false
    }
    
    const confirmAction = () => {
      if (confirmDialog.value.onConfirm) {
        confirmDialog.value.onConfirm()
      }
      hideConfirmDialog()
    }
    
    const showSyncStatus = (type, message, action = null) => {
      const icons = {
        success: 'icon-check-circle',
        error: 'icon-error-circle',
        warning: 'icon-warning-circle',
        info: 'icon-info-circle'
      }
      
      syncStatus.value = {
        visible: true,
        icon: icons[type] || icons.info,
        message,
        action
      }
      
      // 3秒后自动隐藏
      setTimeout(() => {
        syncStatus.value.visible = false
      }, 3000)
    }
    
    const loadCurrentSettings = () => {
      // 加载当前设置状态
      const interfaceSettings = settingsStore.interfaceSettings
      const stealthSettings = settingsStore.stealthSettings
      
      isDark.value = interfaceSettings?.darkMode || false
      stealthMode.value = stealthSettings?.enabled || false
    }
    
    // 设置变化处理
    const handleReadingSettingsChange = (settings) => {
      settingsStore.updateReadingSettings(settings)
      emit('settings-change', { type: 'reading', settings })
    }
    
    const handleStealthSettingsChange = (settings) => {
      settingsStore.updateStealthSettings(settings)
      stealthMode.value = settings.enabled
      emit('settings-change', { type: 'stealth', settings })
    }
    
    const handleInterfaceSettingsChange = (settings) => {
      settingsStore.updateInterfaceSettings(settings)
      isDark.value = settings.darkMode
      emit('settings-change', { type: 'interface', settings })
    }
    
    const handleDataChange = (data) => {
      console.log('数据管理操作:', data)
      // 处理数据管理操作
      switch (data.type) {
        case 'backup-created':
          showSyncStatus('success', '备份创建成功')
          break
        case 'backup-restored':
          showSyncStatus('success', '备份恢复成功')
          break
        case 'sync-completed':
          showSyncStatus('success', '数据同步完成')
          break
        case 'cleanup-completed':
          showSyncStatus('success', '数据清理完成')
          break
        default:
          showSyncStatus('info', '数据操作完成')
      }
      emit('settings-change', { type: 'data', data })
    }
    
    const handleHotkeyChange = (hotkeys) => {
      settingsStore.updateHotkeySettings(hotkeys)
      emit('settings-change', { type: 'hotkeys', hotkeys })
    }
    
    const handleAdvancedChange = (settings) => {
      settingsStore.updateAdvancedSettings(settings)
      emit('settings-change', { type: 'advanced', settings })
    }
    
    // 键盘快捷键
    const handleKeydown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            exportSettings()
            break
          case 'o':
            event.preventDefault()
            importSettingsFile()
            break
          case 'r':
            event.preventDefault()
            resetAllSettings()
            break
        }
      } else {
        switch (event.key) {
          case 'Escape':
            if (confirmDialog.value.visible) {
              hideConfirmDialog()
            } else if (isFullscreen.value) {
              toggleFullscreen()
            } else {
              emit('close')
            }
            break
          case 'F11':
            event.preventDefault()
            toggleFullscreen()
            break
        }
      }
    }
    
    // 生命周期
    onMounted(() => {
      loadCurrentSettings()
      document.addEventListener('keydown', handleKeydown)
    })
    
    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })
    
    return {
      // 响应式数据
      activeCategory,
      searchQuery,
      isFullscreen,
      isDark,
      stealthMode,
      fileInput,
      categories,
      syncStatus,
      confirmDialog,
      
      // 计算属性
      filteredCategories,
      currentCategoryName,
      
      // 方法
      selectCategory,
      toggleFullscreen,
      toggleDarkMode,
      toggleStealthMode,
      openDataFolder,
      exportSettings,
      importSettingsFile,
      handleFileImport,
      resetAllSettings,
      showConfirmDialog,
      hideConfirmDialog,
      confirmAction,
      handleReadingSettingsChange,
      handleStealthSettingsChange,
      handleInterfaceSettingsChange,
      handleDataChange,
      handleHotkeyChange,
      handleAdvancedChange
    }
  }
}
</script>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f5f5f5;
  border-color: #007bff;
  color: #007bff;
}

.panel-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  gap: 8px;
}

.header-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.header-btn:hover {
  background: #f5f5f5;
  border-color: #007bff;
  color: #007bff;
}

.panel-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.settings-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.sidebar-search {
  position: relative;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.search-input:focus {
  border-color: #007bff;
}

.sidebar-search .icon-search {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.settings-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-item.active {
  background: #e3f2fd;
  color: #007bff;
}

.nav-item i {
  margin-right: 12px;
  font-size: 16px;
}

.nav-item span {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.nav-badge {
  background: #dc3545;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

.quick-actions {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
}

.quick-actions h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-btn {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: #f5f5f5;
  border-color: #007bff;
  color: #007bff;
}

.settings-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.breadcrumb {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
  color: #666;
}

.breadcrumb-item {
  color: #666;
}

.breadcrumb-item.active {
  color: #333;
  font-weight: 500;
}

.breadcrumb .icon-chevron-right {
  margin: 0 8px;
  font-size: 12px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.setting-category {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.welcome-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.welcome-content {
  text-align: center;
  max-width: 600px;
}

.welcome-content .icon-settings-large {
  font-size: 64px;
  color: #007bff;
  margin-bottom: 24px;
}

.welcome-content h3 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.welcome-content p {
  margin: 0 0 32px 0;
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.feature-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.feature-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1);
}

.feature-card i {
  font-size: 24px;
  color: #007bff;
  margin-bottom: 12px;
}

.feature-card h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.feature-card p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.sync-status {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
}

.sync-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.sync-content i {
  font-size: 16px;
}

.sync-content .icon-check-circle {
  color: #28a745;
}

.sync-content .icon-error-circle {
  color: #dc3545;
}

.sync-content .icon-warning-circle {
  color: #ffc107;
}

.sync-content .icon-info-circle {
  color: #007bff;
}

.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 400px;
  max-width: 500px;
}

.dialog-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.dialog-body {
  padding: 16px 24px;
}

.dialog-body p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.dialog-footer {
  padding: 16px 24px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  border: 1px solid #ddd;
  background: white;
  color: #666;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-confirm {
  border: 1px solid #007bff;
  background: #007bff;
  color: white;
}

.btn-confirm:hover {
  background: #0056b3;
}

/* 全屏模式 */
.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

/* 图标 */
.icon-arrow-left::before { content: '←'; }
.icon-export::before { content: '📤'; }
.icon-import::before { content: '📥'; }
.icon-reset::before { content: '🔄'; }
.icon-fullscreen::before { content: '⛶'; }
.icon-fullscreen-exit::before { content: '⛷'; }
.icon-search::before { content: '🔍'; }
.icon-book::before { content: '📖'; }
.icon-stealth::before { content: '👁️'; }
.icon-palette::before { content: '🎨'; }
.icon-database::before { content: '💾'; }
.icon-keyboard::before { content: '⌨️'; }
.icon-cog::before { content: '⚙️'; }
.icon-info::before { content: 'ℹ️'; }
.icon-sun::before { content: '☀️'; }
.icon-moon::before { content: '🌙'; }
.icon-folder::before { content: '📁'; }
.icon-chevron-right::before { content: '›'; }
.icon-settings-large::before { content: '⚙️'; }
.icon-check-circle::before { content: '✅'; }
.icon-error-circle::before { content: '❌'; }
.icon-warning-circle::before { content: '⚠️'; }
.icon-info-circle::before { content: 'ℹ️'; }

/* 滚动条 */
.settings-nav::-webkit-scrollbar,
.settings-content::-webkit-scrollbar {
  width: 6px;
}

.settings-nav::-webkit-scrollbar-track,
.settings-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.settings-nav::-webkit-scrollbar-thumb,
.settings-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.settings-nav::-webkit-scrollbar-thumb:hover,
.settings-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 暗色主题 */
.dark {
  background: #1a1a1a;
}

.dark .panel-header,
.dark .settings-sidebar,
.dark .breadcrumb,
.dark .setting-category,
.dark .sync-status,
.dark .dialog-content {
  background: #2a2a2a;
  border-color: #444;
}

.dark .panel-header h2,
.dark .breadcrumb-item.active,
.dark .welcome-content h3,
.dark .feature-card h4,
.dark .dialog-header h3 {
  color: #fff;
}

.dark .breadcrumb-item,
.dark .welcome-content p,
.dark .feature-card p,
.dark .dialog-body p {
  color: #ccc;
}

.dark .search-input {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark .nav-item:hover {
  background: #333;
}

.dark .nav-item.active {
  background: #1e3a5f;
}

.dark .back-btn,
.dark .header-btn,
.dark .quick-btn {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark .back-btn:hover,
.dark .header-btn:hover,
.dark .quick-btn:hover {
  background: #444;
  border-color: #007bff;
  color: #007bff;
}

.dark .feature-card {
  background: #333;
  border-color: #555;
}

.dark .feature-card:hover {
  border-color: #007bff;
}

.dark .btn-cancel {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark .btn-cancel:hover {
  background: #444;
}

/* 响应式 */
@media (max-width: 1024px) {
  .settings-sidebar {
    width: 240px;
  }
  
  .feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .panel-header {
    padding: 12px 16px;
  }
  
  .header-right {
    gap: 4px;
  }
  
  .header-btn {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .settings-sidebar {
    width: 200px;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .dialog-content {
    min-width: 300px;
    margin: 20px;
  }
}

@media (max-width: 640px) {
  .panel-content {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .settings-nav {
    display: flex;
    overflow-x: auto;
    padding: 8px 16px;
  }
  
  .nav-item {
    flex-shrink: 0;
    margin-right: 8px;
    margin-bottom: 0;
  }
  
  .quick-actions {
    display: none;
  }
}
</style>