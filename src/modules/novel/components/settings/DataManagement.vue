<template>
  <div class="data-management">
    <!-- 设置头部 -->
    <div class="settings-header">
      <h3>数据管理</h3>
      <p>管理您的阅读数据、书签、笔记等信息</p>
    </div>
    
    <!-- 数据概览 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>数据概览</h4>
        <p>查看当前存储的数据统计信息</p>
      </div>
      
      <div class="data-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-book"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataStats.novels }}</div>
            <div class="stat-label">导入小说</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-bookmark"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataStats.bookmarks }}</div>
            <div class="stat-label">书签数量</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-note"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataStats.notes }}</div>
            <div class="stat-label">阅读笔记</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <i class="icon-history"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dataStats.history }}</div>
            <div class="stat-label">阅读历史</div>
          </div>
        </div>
      </div>
      
      <div class="storage-info">
        <div class="storage-item">
          <span class="storage-label">数据目录:</span>
          <span class="storage-path">{{ dataPath }}</span>
          <button class="path-btn" @click="openDataFolder" title="打开数据目录">
            <i class="icon-folder"></i>
          </button>
        </div>
        
        <div class="storage-item">
          <span class="storage-label">占用空间:</span>
          <span class="storage-size">{{ formatSize(dataStats.totalSize) }}</span>
          <button class="refresh-btn" @click="refreshStats" title="刷新统计">
            <i class="icon-refresh"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 数据备份 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>数据备份</h4>
        <p>备份您的阅读数据，防止数据丢失</p>
      </div>
      
      <div class="backup-options">
        <div class="backup-type">
          <h5>备份类型</h5>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="backupOptions.novels"
              >
              <span class="checkbox-label">小说文件</span>
              <span class="checkbox-desc">包含所有导入的小说内容</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="backupOptions.bookmarks"
              >
              <span class="checkbox-label">书签数据</span>
              <span class="checkbox-desc">保存的阅读位置和书签</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="backupOptions.notes"
              >
              <span class="checkbox-label">阅读笔记</span>
              <span class="checkbox-desc">您添加的所有笔记和批注</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="backupOptions.settings"
              >
              <span class="checkbox-label">应用设置</span>
              <span class="checkbox-desc">个人偏好和配置信息</span>
            </label>
            
            <label class="checkbox-item">
              <input 
                type="checkbox" 
                v-model="backupOptions.history"
              >
              <span class="checkbox-label">阅读历史</span>
              <span class="checkbox-desc">阅读记录和进度信息</span>
            </label>
          </div>
        </div>
        
        <div class="backup-actions">
          <button 
            class="backup-btn primary" 
            @click="createBackup"
            :disabled="isBackingUp || !hasSelectedBackupOptions"
          >
            <i class="icon-backup"></i>
            {{ isBackingUp ? '备份中...' : '创建备份' }}
          </button>
          
          <button class="backup-btn" @click="scheduleBackup">
            <i class="icon-schedule"></i>
            定时备份
          </button>
        </div>
      </div>
      
      <div class="backup-history" v-if="backupHistory.length > 0">
        <h5>备份历史</h5>
        <div class="backup-list">
          <div 
            class="backup-item" 
            v-for="backup in backupHistory" 
            :key="backup.id"
          >
            <div class="backup-info">
              <div class="backup-name">{{ backup.name }}</div>
              <div class="backup-meta">
                <span class="backup-date">{{ formatDate(backup.date) }}</span>
                <span class="backup-size">{{ formatSize(backup.size) }}</span>
              </div>
            </div>
            
            <div class="backup-actions">
              <button 
                class="action-btn" 
                @click="restoreBackup(backup)"
                title="恢复备份"
              >
                <i class="icon-restore"></i>
              </button>
              
              <button 
                class="action-btn" 
                @click="downloadBackup(backup)"
                title="下载备份"
              >
                <i class="icon-download"></i>
              </button>
              
              <button 
                class="action-btn danger" 
                @click="deleteBackup(backup)"
                title="删除备份"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 数据同步 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>数据同步</h4>
        <p>在多个设备间同步您的阅读数据</p>
      </div>
      
      <div class="sync-options">
        <div class="sync-service">
          <h5>同步服务</h5>
          <div class="service-selector">
            <label 
              class="service-option" 
              v-for="service in syncServices" 
              :key="service.key"
            >
              <input 
                type="radio" 
                :value="service.key" 
                v-model="syncSettings.service"
                @change="updateSyncService"
              >
              <div class="service-info">
                <div class="service-header">
                  <i :class="service.icon"></i>
                  <span class="service-name">{{ service.name }}</span>
                  <span class="service-status" :class="service.status">
                    {{ service.statusText }}
                  </span>
                </div>
                <div class="service-desc">{{ service.description }}</div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="sync-config" v-if="syncSettings.service !== 'none'">
          <div class="config-group">
            <label class="config-label">同步频率</label>
            <select v-model="syncSettings.frequency" @change="updateSyncSettings">
              <option value="manual">手动同步</option>
              <option value="realtime">实时同步</option>
              <option value="hourly">每小时</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
            </select>
          </div>
          
          <div class="config-group">
            <label class="config-label">冲突处理</label>
            <select v-model="syncSettings.conflictResolution" @change="updateSyncSettings">
              <option value="ask">询问用户</option>
              <option value="local">优先本地</option>
              <option value="remote">优先远程</option>
              <option value="merge">智能合并</option>
            </select>
          </div>
        </div>
        
        <div class="sync-actions">
          <button 
            class="sync-btn primary" 
            @click="syncNow"
            :disabled="isSyncing || syncSettings.service === 'none'"
          >
            <i class="icon-sync"></i>
            {{ isSyncing ? '同步中...' : '立即同步' }}
          </button>
          
          <button 
            class="sync-btn" 
            @click="showSyncLog"
            v-if="syncSettings.service !== 'none'"
          >
            <i class="icon-log"></i>
            同步日志
          </button>
        </div>
      </div>
      
      <div class="sync-status" v-if="lastSyncTime">
        <div class="status-item">
          <span class="status-label">上次同步:</span>
          <span class="status-value">{{ formatDate(lastSyncTime) }}</span>
        </div>
        
        <div class="status-item">
          <span class="status-label">同步状态:</span>
          <span class="status-value" :class="syncStatus.type">
            {{ syncStatus.message }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- 数据清理 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>数据清理</h4>
        <p>清理不需要的数据，释放存储空间</p>
      </div>
      
      <div class="cleanup-options">
        <div class="cleanup-item">
          <div class="cleanup-info">
            <h5>临时文件</h5>
            <p>清理缓存和临时文件</p>
            <span class="cleanup-size">{{ formatSize(cleanupStats.tempFiles) }}</span>
          </div>
          <button class="cleanup-btn" @click="cleanupTempFiles">
            <i class="icon-clean"></i>
            清理
          </button>
        </div>
        
        <div class="cleanup-item">
          <div class="cleanup-info">
            <h5>阅读历史</h5>
            <p>清理超过指定天数的阅读记录</p>
            <div class="cleanup-config">
              <input 
                type="number" 
                v-model="cleanupSettings.historyDays"
                min="1" 
                max="365"
                class="days-input"
              >
              <span>天前的记录</span>
            </div>
          </div>
          <button class="cleanup-btn" @click="cleanupHistory">
            <i class="icon-clean"></i>
            清理
          </button>
        </div>
        
        <div class="cleanup-item">
          <div class="cleanup-info">
            <h5>重复文件</h5>
            <p>查找并删除重复的小说文件</p>
            <span class="cleanup-size">{{ formatSize(cleanupStats.duplicates) }}</span>
          </div>
          <button class="cleanup-btn" @click="findDuplicates">
            <i class="icon-search"></i>
            扫描
          </button>
        </div>
        
        <div class="cleanup-item">
          <div class="cleanup-info">
            <h5>损坏文件</h5>
            <p>检查并清理损坏的数据文件</p>
          </div>
          <button class="cleanup-btn" @click="checkCorruptedFiles">
            <i class="icon-check"></i>
            检查
          </button>
        </div>
      </div>
      
      <div class="cleanup-actions">
        <button class="cleanup-all-btn" @click="cleanupAll">
          <i class="icon-clean-all"></i>
          一键清理
        </button>
      </div>
    </div>
    
    <!-- 数据导入导出 -->
    <div class="setting-section">
      <div class="section-header">
        <h4>数据导入导出</h4>
        <p>导入其他阅读器的数据或导出当前数据</p>
      </div>
      
      <div class="import-export-options">
        <div class="option-group">
          <h5>导入数据</h5>
          <div class="import-sources">
            <button 
              class="source-btn" 
              v-for="source in importSources" 
              :key="source.key"
              @click="importFromSource(source)"
            >
              <i :class="source.icon"></i>
              <span>{{ source.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="option-group">
          <h5>导出数据</h5>
          <div class="export-formats">
            <button 
              class="format-btn" 
              v-for="format in exportFormats" 
              :key="format.key"
              @click="exportToFormat(format)"
            >
              <i :class="format.icon"></i>
              <span>{{ format.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 危险操作 -->
    <div class="setting-section danger-section">
      <div class="section-header">
        <h4>危险操作</h4>
        <p class="danger-warning">以下操作不可逆，请谨慎使用</p>
      </div>
      
      <div class="danger-actions">
        <button class="danger-btn" @click="resetAllData">
          <i class="icon-reset"></i>
          重置所有数据
        </button>
        
        <button class="danger-btn" @click="deleteAllNovels">
          <i class="icon-delete-all"></i>
          删除所有小说
        </button>
        
        <button class="danger-btn" @click="clearAllHistory">
          <i class="icon-clear"></i>
          清空阅读历史
        </button>
      </div>
    </div>
    
    <!-- 进度对话框 -->
    <div class="progress-dialog" v-if="showProgress">
      <div class="dialog-overlay"></div>
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>{{ progressTitle }}</h3>
        </div>
        <div class="dialog-body">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: progressPercent + '%' }"
            ></div>
          </div>
          <div class="progress-text">{{ progressText }}</div>
        </div>
        <div class="dialog-footer" v-if="!progressCancellable">
          <button class="cancel-btn" @click="cancelOperation">
            取消
          </button>
        </div>
      </div>
    </div>
    
    <!-- 文件选择器 -->
    <input 
      type="file" 
      ref="fileInput" 
      @change="handleFileSelect" 
      style="display: none;"
      multiple
    >
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'

export default {
  name: 'DataManagement',
  emits: ['data-change'],
  setup(props, { emit }) {
    // 响应式数据
    const dataStats = reactive({
      novels: 0,
      bookmarks: 0,
      notes: 0,
      history: 0,
      totalSize: 0
    })
    
    const dataPath = ref('')
    const isBackingUp = ref(false)
    const isSyncing = ref(false)
    const showProgress = ref(false)
    const progressTitle = ref('')
    const progressPercent = ref(0)
    const progressText = ref('')
    const progressCancellable = ref(true)
    const fileInput = ref(null)
    
    // 备份选项
    const backupOptions = reactive({
      novels: true,
      bookmarks: true,
      notes: true,
      settings: true,
      history: false
    })
    
    const backupHistory = ref([])
    
    // 同步设置
    const syncSettings = reactive({
      service: 'none',
      frequency: 'manual',
      conflictResolution: 'ask'
    })
    
    const lastSyncTime = ref(null)
    const syncStatus = reactive({
      type: 'success',
      message: '同步正常'
    })
    
    // 清理设置
    const cleanupSettings = reactive({
      historyDays: 30
    })
    
    const cleanupStats = reactive({
      tempFiles: 0,
      duplicates: 0
    })
    
    // 同步服务
    const syncServices = ref([
      {
        key: 'none',
        name: '不同步',
        description: '仅在本地存储数据',
        icon: 'icon-local',
        status: 'disabled',
        statusText: '已禁用'
      },
      {
        key: 'webdav',
        name: 'WebDAV',
        description: '使用WebDAV服务同步数据',
        icon: 'icon-webdav',
        status: 'available',
        statusText: '可用'
      },
      {
        key: 'onedrive',
        name: 'OneDrive',
        description: '使用微软OneDrive同步',
        icon: 'icon-onedrive',
        status: 'available',
        statusText: '可用'
      },
      {
        key: 'googledrive',
        name: 'Google Drive',
        description: '使用Google Drive同步',
        icon: 'icon-googledrive',
        status: 'available',
        statusText: '可用'
      }
    ])
    
    // 导入源
    const importSources = ref([
      {
        key: 'kindle',
        name: 'Kindle',
        icon: 'icon-kindle'
      },
      {
        key: 'calibre',
        name: 'Calibre',
        icon: 'icon-calibre'
      },
      {
        key: 'moonreader',
        name: 'Moon+ Reader',
        icon: 'icon-moonreader'
      },
      {
        key: 'json',
        name: 'JSON文件',
        icon: 'icon-json'
      }
    ])
    
    // 导出格式
    const exportFormats = ref([
      {
        key: 'json',
        name: 'JSON格式',
        icon: 'icon-json'
      },
      {
        key: 'csv',
        name: 'CSV格式',
        icon: 'icon-csv'
      },
      {
        key: 'xml',
        name: 'XML格式',
        icon: 'icon-xml'
      },
      {
        key: 'opml',
        name: 'OPML格式',
        icon: 'icon-opml'
      }
    ])
    
    // 计算属性
    const hasSelectedBackupOptions = computed(() => {
      return Object.values(backupOptions).some(option => option)
    })
    
    // 方法
    const formatSize = (bytes) => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const formatDate = (date) => {
      return new Date(date).toLocaleString('zh-CN')
    }
    
    const refreshStats = async () => {
      try {
        // 模拟获取数据统计
        dataStats.novels = 156
        dataStats.bookmarks = 342
        dataStats.notes = 89
        dataStats.history = 1205
        dataStats.totalSize = 1024 * 1024 * 45 // 45MB
        
        cleanupStats.tempFiles = 1024 * 1024 * 2.5 // 2.5MB
        cleanupStats.duplicates = 1024 * 1024 * 8.2 // 8.2MB
        
        emit('data-change', { type: 'stats-refresh', stats: dataStats })
      } catch (error) {
        console.error('刷新统计失败:', error)
      }
    }
    
    const openDataFolder = async () => {
      try {
        if (window.electronAPI) {
          await window.electronAPI.openDataFolder()
        } else {
          console.log('打开数据目录:', dataPath.value)
        }
      } catch (error) {
        console.error('打开数据目录失败:', error)
      }
    }
    
    const createBackup = async () => {
      if (!hasSelectedBackupOptions.value) return
      
      isBackingUp.value = true
      showProgress.value = true
      progressTitle.value = '创建备份'
      progressPercent.value = 0
      progressText.value = '准备备份数据...'
      
      try {
        // 模拟备份过程
        const steps = [
          { text: '备份小说文件...', percent: 20 },
          { text: '备份书签数据...', percent: 40 },
          { text: '备份阅读笔记...', percent: 60 },
          { text: '备份应用设置...', percent: 80 },
          { text: '压缩备份文件...', percent: 100 }
        ]
        
        for (const step of steps) {
          progressText.value = step.text
          progressPercent.value = step.percent
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        // 添加到备份历史
        const backup = {
          id: Date.now(),
          name: `备份_${new Date().toISOString().split('T')[0]}`,
          date: new Date(),
          size: 1024 * 1024 * 12.5, // 12.5MB
          options: { ...backupOptions }
        }
        
        backupHistory.value.unshift(backup)
        
        emit('data-change', { type: 'backup-created', backup })
      } catch (error) {
        console.error('创建备份失败:', error)
      } finally {
        isBackingUp.value = false
        showProgress.value = false
      }
    }
    
    const restoreBackup = async (backup) => {
      if (!confirm(`确定要恢复备份 "${backup.name}" 吗？这将覆盖当前数据。`)) {
        return
      }
      
      showProgress.value = true
      progressTitle.value = '恢复备份'
      progressPercent.value = 0
      progressText.value = '准备恢复数据...'
      
      try {
        // 模拟恢复过程
        const steps = [
          { text: '解压备份文件...', percent: 25 },
          { text: '恢复小说文件...', percent: 50 },
          { text: '恢复书签数据...', percent: 75 },
          { text: '恢复应用设置...', percent: 100 }
        ]
        
        for (const step of steps) {
          progressText.value = step.text
          progressPercent.value = step.percent
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        emit('data-change', { type: 'backup-restored', backup })
      } catch (error) {
        console.error('恢复备份失败:', error)
      } finally {
        showProgress.value = false
      }
    }
    
    const downloadBackup = (backup) => {
      // 模拟下载备份文件
      const blob = new Blob(['backup data'], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${backup.name}.backup`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    const deleteBackup = (backup) => {
      if (!confirm(`确定要删除备份 "${backup.name}" 吗？`)) {
        return
      }
      
      const index = backupHistory.value.findIndex(b => b.id === backup.id)
      if (index > -1) {
        backupHistory.value.splice(index, 1)
        emit('data-change', { type: 'backup-deleted', backup })
      }
    }
    
    const scheduleBackup = () => {
      // 打开定时备份设置对话框
      console.log('设置定时备份')
    }
    
    const updateSyncService = () => {
      emit('data-change', { type: 'sync-service-changed', service: syncSettings.service })
    }
    
    const updateSyncSettings = () => {
      emit('data-change', { type: 'sync-settings-changed', settings: { ...syncSettings } })
    }
    
    const syncNow = async () => {
      if (syncSettings.service === 'none') return
      
      isSyncing.value = true
      showProgress.value = true
      progressTitle.value = '数据同步'
      progressPercent.value = 0
      progressText.value = '连接同步服务...'
      
      try {
        // 模拟同步过程
        const steps = [
          { text: '检查远程数据...', percent: 25 },
          { text: '上传本地更改...', percent: 50 },
          { text: '下载远程更改...', percent: 75 },
          { text: '合并数据...', percent: 100 }
        ]
        
        for (const step of steps) {
          progressText.value = step.text
          progressPercent.value = step.percent
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        lastSyncTime.value = new Date()
        syncStatus.type = 'success'
        syncStatus.message = '同步成功'
        
        emit('data-change', { type: 'sync-completed', time: lastSyncTime.value })
      } catch (error) {
        console.error('同步失败:', error)
        syncStatus.type = 'error'
        syncStatus.message = '同步失败'
      } finally {
        isSyncing.value = false
        showProgress.value = false
      }
    }
    
    const showSyncLog = () => {
      console.log('显示同步日志')
    }
    
    const cleanupTempFiles = async () => {
      showProgress.value = true
      progressTitle.value = '清理临时文件'
      progressPercent.value = 0
      progressText.value = '扫描临时文件...'
      
      try {
        // 模拟清理过程
        await new Promise(resolve => setTimeout(resolve, 1000))
        progressPercent.value = 50
        progressText.value = '删除临时文件...'
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        progressPercent.value = 100
        progressText.value = '清理完成'
        
        cleanupStats.tempFiles = 0
        
        emit('data-change', { type: 'temp-files-cleaned' })
      } catch (error) {
        console.error('清理临时文件失败:', error)
      } finally {
        showProgress.value = false
      }
    }
    
    const cleanupHistory = async () => {
      if (!confirm(`确定要删除 ${cleanupSettings.historyDays} 天前的阅读历史吗？`)) {
        return
      }
      
      try {
        // 模拟清理历史记录
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const deletedCount = Math.floor(dataStats.history * 0.3)
        dataStats.history -= deletedCount
        
        emit('data-change', { 
          type: 'history-cleaned', 
          deletedCount,
          days: cleanupSettings.historyDays 
        })
      } catch (error) {
        console.error('清理历史记录失败:', error)
      }
    }
    
    const findDuplicates = async () => {
      showProgress.value = true
      progressTitle.value = '扫描重复文件'
      progressPercent.value = 0
      progressText.value = '分析文件...'
      
      try {
        // 模拟扫描过程
        for (let i = 0; i <= 100; i += 10) {
          progressPercent.value = i
          progressText.value = `扫描进度 ${i}%`
          await new Promise(resolve => setTimeout(resolve, 200))
        }
        
        emit('data-change', { type: 'duplicates-found', count: 5 })
      } catch (error) {
        console.error('扫描重复文件失败:', error)
      } finally {
        showProgress.value = false
      }
    }
    
    const checkCorruptedFiles = async () => {
      showProgress.value = true
      progressTitle.value = '检查文件完整性'
      progressPercent.value = 0
      progressText.value = '验证文件...'
      
      try {
        // 模拟检查过程
        for (let i = 0; i <= 100; i += 20) {
          progressPercent.value = i
          progressText.value = `检查进度 ${i}%`
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        emit('data-change', { type: 'integrity-check-completed', corruptedCount: 0 })
      } catch (error) {
        console.error('检查文件完整性失败:', error)
      } finally {
        showProgress.value = false
      }
    }
    
    const cleanupAll = async () => {
      if (!confirm('确定要执行一键清理吗？这将清理所有可清理的数据。')) {
        return
      }
      
      showProgress.value = true
      progressTitle.value = '一键清理'
      progressPercent.value = 0
      
      try {
        // 依次执行各种清理操作
        progressText.value = '清理临时文件...'
        await cleanupTempFiles()
        progressPercent.value = 33
        
        progressText.value = '清理历史记录...'
        await cleanupHistory()
        progressPercent.value = 66
        
        progressText.value = '扫描重复文件...'
        await findDuplicates()
        progressPercent.value = 100
        
        emit('data-change', { type: 'cleanup-all-completed' })
      } catch (error) {
        console.error('一键清理失败:', error)
      } finally {
        showProgress.value = false
      }
    }
    
    const importFromSource = (source) => {
      if (source.key === 'json') {
        fileInput.value?.click()
      } else {
        console.log('从', source.name, '导入数据')
      }
    }
    
    const exportToFormat = (format) => {
      console.log('导出为', format.name)
      
      // 模拟导出数据
      const data = {
        novels: dataStats.novels,
        bookmarks: dataStats.bookmarks,
        notes: dataStats.notes,
        exportTime: new Date().toISOString()
      }
      
      let content = ''
      let filename = ''
      let mimeType = ''
      
      switch (format.key) {
        case 'json':
          content = JSON.stringify(data, null, 2)
          filename = 'novel-data.json'
          mimeType = 'application/json'
          break
        case 'csv':
          content = 'type,count\nnovels,' + data.novels + '\nbookmarks,' + data.bookmarks
          filename = 'novel-data.csv'
          mimeType = 'text/csv'
          break
        default:
          content = JSON.stringify(data, null, 2)
          filename = 'novel-data.json'
          mimeType = 'application/json'
      }
      
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    const handleFileSelect = (event) => {
      const files = event.target.files
      if (files && files.length > 0) {
        console.log('选择了文件:', files)
        // 处理文件导入
      }
    }
    
    const resetAllData = () => {
      if (!confirm('确定要重置所有数据吗？这将删除所有小说、书签、笔记等数据，且不可恢复！')) {
        return
      }
      
      if (!confirm('请再次确认：这将永久删除所有数据！')) {
        return
      }
      
      // 重置数据
      Object.assign(dataStats, {
        novels: 0,
        bookmarks: 0,
        notes: 0,
        history: 0,
        totalSize: 0
      })
      
      emit('data-change', { type: 'all-data-reset' })
    }
    
    const deleteAllNovels = () => {
      if (!confirm('确定要删除所有小说吗？这将删除所有导入的小说文件！')) {
        return
      }
      
      dataStats.novels = 0
      emit('data-change', { type: 'all-novels-deleted' })
    }
    
    const clearAllHistory = () => {
      if (!confirm('确定要清空所有阅读历史吗？')) {
        return
      }
      
      dataStats.history = 0
      emit('data-change', { type: 'all-history-cleared' })
    }
    
    const cancelOperation = () => {
      showProgress.value = false
      isBackingUp.value = false
      isSyncing.value = false
    }
    
    // 生命周期
    onMounted(() => {
      // 初始化数据
      dataPath.value = 'C:\\Users\\Username\\AppData\\Local\\NovelReader'
      refreshStats()
      
      // 模拟一些备份历史
      backupHistory.value = [
        {
          id: 1,
          name: '备份_2024-01-15',
          date: new Date('2024-01-15'),
          size: 1024 * 1024 * 8.5
        },
        {
          id: 2,
          name: '备份_2024-01-10',
          date: new Date('2024-01-10'),
          size: 1024 * 1024 * 7.2
        }
      ]
      
      lastSyncTime.value = new Date('2024-01-16T10:30:00')
    })
    
    return {
      dataStats,
      dataPath,
      isBackingUp,
      isSyncing,
      showProgress,
      progressTitle,
      progressPercent,
      progressText,
      progressCancellable,
      fileInput,
      backupOptions,
      backupHistory,
      syncSettings,
      lastSyncTime,
      syncStatus,
      cleanupSettings,
      cleanupStats,
      syncServices,
      importSources,
      exportFormats,
      hasSelectedBackupOptions,
      formatSize,
      formatDate,
      refreshStats,
      openDataFolder,
      createBackup,
      restoreBackup,
      downloadBackup,
      deleteBackup,
      scheduleBackup,
      updateSyncService,
      updateSyncSettings,
      syncNow,
      showSyncLog,
      cleanupTempFiles,
      cleanupHistory,
      findDuplicates,
      checkCorruptedFiles,
      cleanupAll,
      importFromSource,
      exportToFormat,
      handleFileSelect,
      resetAllData,
      deleteAllNovels,
      clearAllHistory,
      cancelOperation
    }
  }
}
</script>

<style scoped>
.data-management {
  padding: 0;
}

.settings-header {
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
}

.settings-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.settings-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.setting-section {
  padding: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.setting-section:last-child {
  border-bottom: none;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-header p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

/* 数据统计 */
.data-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #007bff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  margin-right: 12px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

/* 存储信息 */
.storage-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.storage-label {
  color: #666;
  min-width: 80px;
}

.storage-path,
.storage-size {
  color: #333;
  font-family: monospace;
  flex: 1;
}

.path-btn,
.refresh-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
}

.path-btn:hover,
.refresh-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

/* 备份选项 */
.backup-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.backup-type h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.checkbox-item:hover {
  background: #f8f9fa;
}

.checkbox-item input {
  margin-right: 8px;
  margin-top: 2px;
}

.checkbox-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.checkbox-desc {
  font-size: 12px;
  color: #666;
  margin-left: 20px;
}

.backup-actions {
  display: flex;
  gap: 12px;
}

.backup-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.backup-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.backup-btn.primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.backup-btn.primary:hover {
  background: #0056b3;
}

.backup-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 备份历史 */
.backup-history {
  margin-top: 24px;
}

.backup-history h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.backup-info {
  flex: 1;
}

.backup-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.backup-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.backup-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
}

.action-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.action-btn.danger:hover {
  border-color: #dc3545;
  color: #dc3545;
}

/* 同步选项 */
.sync-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sync-service h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.service-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-option {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.service-option:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

.service-option input {
  margin-right: 12px;
}

.service-info {
  flex: 1;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.service-name {
  font-weight: 500;
  color: #333;
}

.service-status {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.service-status.available {
  background: #d4edda;
  color: #155724;
}

.service-status.disabled {
  background: #f8d7da;
  color: #721c24;
}

.service-desc {
  font-size: 12px;
  color: #666;
}

/* 同步配置 */
.sync-config {
  display: flex;
  gap: 16px;
}

.config-group {
  flex: 1;
}

.config-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.config-group select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

/* 同步操作 */
.sync-actions {
  display: flex;
  gap: 12px;
}

.sync-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.sync-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.sync-btn.primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.sync-btn.primary:hover {
  background: #0056b3;
}

.sync-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 同步状态 */
.sync-status {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 13px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  color: #666;
}

.status-value {
  color: #333;
  font-weight: 500;
}

.status-value.success {
  color: #28a745;
}

.status-value.error {
  color: #dc3545;
}

/* 清理选项 */
.cleanup-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cleanup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.cleanup-info {
  flex: 1;
}

.cleanup-info h5 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.cleanup-info p {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.cleanup-size {
  font-size: 12px;
  color: #007bff;
  font-weight: 500;
}

.cleanup-config {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.days-input {
  width: 60px;
  padding: 4px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.cleanup-btn {
  padding: 8px 16px;
  border: 1px solid #28a745;
  border-radius: 6px;
  background: white;
  color: #28a745;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.cleanup-btn:hover {
  background: #28a745;
  color: white;
}

.cleanup-actions {
  text-align: center;
  margin-top: 16px;
}

.cleanup-all-btn {
  padding: 12px 24px;
  border: 1px solid #007bff;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.cleanup-all-btn:hover {
  background: #0056b3;
}

/* 导入导出 */
.import-export-options {
  display: flex;
  gap: 32px;
}

.option-group {
  flex: 1;
}

.option-group h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.import-sources,
.export-formats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-btn,
.format-btn {
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
  transition: all 0.2s ease;
}

.source-btn:hover,
.format-btn:hover {
  border-color: #007bff;
  background: #f8f9ff;
}

/* 危险操作 */
.danger-section {
  border: 1px solid #dc3545;
  border-radius: 8px;
  background: #fff5f5;
}

.danger-warning {
  color: #dc3545 !important;
  font-weight: 500;
}

.danger-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.danger-btn {
  padding: 10px 16px;
  border: 1px solid #dc3545;
  border-radius: 6px;
  background: white;
  color: #dc3545;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.danger-btn:hover {
  background: #dc3545;
  color: white;
}

/* 进度对话框 */
.progress-dialog {
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

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.dialog-footer {
  padding: 16px 24px 20px;
  text-align: right;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-stats {
    grid-template-columns: 1fr;
  }
  
  .import-export-options {
    flex-direction: column;
    gap: 20px;
  }
  
  .sync-config {
    flex-direction: column;
  }
  
  .backup-actions,
  .sync-actions,
  .danger-actions {
    flex-direction: column;
  }
  
  .dialog-content {
    min-width: 300px;
    margin: 20px;
  }
}

/* 暗色主题 */
@media (prefers-color-scheme: dark) {
  .data-management {
    background: #1a1a1a;
    color: #e0e0e0;
  }
  
  .settings-header {
    border-bottom-color: #333;
  }
  
  .settings-header h3 {
    color: #e0e0e0;
  }
  
  .settings-header p {
    color: #999;
  }
  
  .setting-section {
    border-bottom-color: #2a2a2a;
  }
  
  .section-header h4 {
    color: #e0e0e0;
  }
  
  .section-header p {
    color: #999;
  }
  
  .stat-card {
    background: #2a2a2a;
    border-color: #333;
  }
  
  .stat-value {
    color: #e0e0e0;
  }
  
  .stat-label {
    color: #999;
  }
  
  .storage-path,
  .storage-size {
    color: #e0e0e0;
  }
  
  .path-btn,
  .refresh-btn,
  .backup-btn,
  .sync-btn,
  .cleanup-btn,
  .source-btn,
  .format-btn,
  .action-btn {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  .path-btn:hover,
  .refresh-btn:hover,
  .backup-btn:hover,
  .sync-btn:hover,
  .source-btn:hover,
  .format-btn:hover,
  .action-btn:hover {
    border-color: #007bff;
    background: #333;
  }
  
  .checkbox-item:hover {
    background: #2a2a2a;
  }
  
  .checkbox-label {
    color: #e0e0e0;
  }
  
  .checkbox-desc {
    color: #999;
  }
  
  .service-option {
    background: #2a2a2a;
    border-color: #333;
  }
  
  .service-option:hover {
    background: #333;
  }
  
  .service-name {
    color: #e0e0e0;
  }
  
  .service-desc {
    color: #999;
  }
  
  .config-group select,
  .days-input {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  .sync-status {
    background: #2a2a2a;
    border-color: #333;
  }
  
  .status-label {
    color: #999;
  }
  
  .status-value {
    color: #e0e0e0;
  }
  
  .cleanup-item,
  .backup-item {
    background: #2a2a2a;
    border-color: #333;
  }
  
  .cleanup-info h5,
  .backup-name {
    color: #e0e0e0;
  }
  
  .cleanup-info p {
    color: #999;
  }
  
  .backup-meta {
    color: #999;
  }
  
  .danger-section {
    background: #2a1a1a;
    border-color: #dc3545;
  }
  
  .dialog-content {
    background: #2a2a2a;
  }
  
  .dialog-header {
    border-bottom-color: #333;
  }
  
  .dialog-header h3 {
    color: #e0e0e0;
  }
  
  .progress-bar {
    background: #333;
  }
  
  .progress-text {
    color: #999;
  }
  
  .dialog-footer {
    border-top-color: #333;
  }
  
  .cancel-btn {
    background: #2a2a2a;
    border-color: #444;
    color: #e0e0e0;
  }
  
  .cancel-btn:hover {
    border-color: #007bff;
  }
}
</style>