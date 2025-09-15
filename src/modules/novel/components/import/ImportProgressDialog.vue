<template>
  <el-dialog
    v-model="dialogVisible"
    title="导入进度"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="!importing"
    class="import-progress-dialog"
  >
    <div class="progress-content">
      <!-- 总体进度 -->
      <div class="overall-progress">
        <div class="progress-header">
          <h4 class="progress-title">总体进度</h4>
          <div class="progress-stats">
            <span class="stats-item">
              已完成: <strong>{{ completedCount }}</strong>
            </span>
            <span class="stats-item">
              总计: <strong>{{ totalCount }}</strong>
            </span>
            <span v-if="failedCount > 0" class="stats-item stats-item--error">
              失败: <strong>{{ failedCount }}</strong>
            </span>
          </div>
        </div>
        
        <el-progress
          :percentage="overallProgress"
          :status="overallStatus"
          :stroke-width="12"
          :show-text="false"
        />
        
        <div class="progress-text">
          <span class="progress-percentage">{{ overallProgress }}%</span>
          <span class="progress-status">{{ statusText }}</span>
        </div>
      </div>
      
      <!-- 当前处理的文件 -->
      <div v-if="currentFile" class="current-file">
        <div class="current-file__header">
          <el-icon class="current-file__icon">
            <Loading v-if="importing" />
            <SuccessFilled v-else-if="currentFile.status === 'completed'" />
            <CircleCloseFilled v-else-if="currentFile.status === 'failed'" />
            <Document v-else />
          </el-icon>
          <span class="current-file__name">{{ currentFile.name }}</span>
        </div>
        
        <el-progress
          v-if="currentFile.progress !== undefined"
          :percentage="currentFile.progress"
          :status="getFileProgressStatus(currentFile)"
          :stroke-width="6"
        />
        
        <div v-if="currentFile.error" class="current-file__error">
          <el-icon><Warning /></el-icon>
          <span>{{ currentFile.error }}</span>
        </div>
      </div>
      
      <!-- 文件列表 -->
      <div class="file-list">
        <div class="file-list__header">
          <span>文件列表</span>
          <el-button
            v-if="!importing && (completedCount > 0 || failedCount > 0)"
            size="small"
            type="text"
            @click="toggleShowDetails"
          >
            {{ showDetails ? '隐藏详情' : '显示详情' }}
          </el-button>
        </div>
        
        <div class="file-list__content" :class="{ 'file-list__content--collapsed': !showDetails }">
          <div
            v-for="(file, index) in fileList"
            :key="file.id || index"
            class="file-item"
            :class="{
              'file-item--pending': file.status === 'pending',
              'file-item--processing': file.status === 'processing',
              'file-item--completed': file.status === 'completed',
              'file-item--failed': file.status === 'failed'
            }"
          >
            <div class="file-item__status">
              <el-icon>
                <Clock v-if="file.status === 'pending'" />
                <Loading v-else-if="file.status === 'processing'" />
                <SuccessFilled v-else-if="file.status === 'completed'" />
                <CircleCloseFilled v-else-if="file.status === 'failed'" />
                <Document v-else />
              </el-icon>
            </div>
            
            <div class="file-item__info">
              <div class="file-item__name" :title="file.name">
                {{ file.name }}
              </div>
              
              <div class="file-item__meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-format">{{ file.format }}</span>
                <span v-if="file.duration" class="file-duration">
                  耗时: {{ formatDuration(file.duration) }}
                </span>
              </div>
              
              <div v-if="file.error" class="file-item__error">
                {{ file.error }}
              </div>
            </div>
            
            <div class="file-item__progress">
              <el-progress
                v-if="file.status === 'processing' && file.progress !== undefined"
                type="circle"
                :percentage="file.progress"
                :width="32"
                :stroke-width="4"
                :show-text="false"
              />
              
              <div v-else-if="file.status === 'completed'" class="status-badge status-badge--success">
                完成
              </div>
              
              <div v-else-if="file.status === 'failed'" class="status-badge status-badge--error">
                失败
              </div>
              
              <div v-else-if="file.status === 'pending'" class="status-badge status-badge--pending">
                等待
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作日志 -->
      <div v-if="showLogs && logs.length > 0" class="operation-logs">
        <div class="logs-header">
          <span>操作日志</span>
          <el-button
            size="small"
            type="text"
            @click="clearLogs"
          >
            清空日志
          </el-button>
        </div>
        
        <div class="logs-content">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-item"
            :class="`log-item--${log.level}`"
          >
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button
            v-if="logs.length > 0"
            size="small"
            type="text"
            @click="toggleShowLogs"
          >
            {{ showLogs ? '隐藏日志' : '显示日志' }}
          </el-button>
        </div>
        
        <div class="footer-right">
          <el-button
            v-if="importing"
            type="warning"
            @click="handleCancel"
          >
            取消导入
          </el-button>
          
          <el-button
            v-if="!importing && failedCount > 0"
            type="primary"
            @click="handleRetry"
          >
            重试失败项
          </el-button>
          
          <el-button
            v-if="!importing"
            type="primary"
            @click="handleClose"
          >
            {{ completedCount > 0 ? '完成' : '关闭' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Loading,
  SuccessFilled,
  CircleCloseFilled,
  Document,
  Warning,
  Clock
} from '@element-plus/icons-vue'
import { commonUtils } from '../../utils/index.js'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  files: {
    type: Array,
    default: () => []
  },
  importing: {
    type: Boolean,
    default: false
  },
  currentFile: {
    type: Object,
    default: null
  },
  progress: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'cancel',
  'retry',
  'close'
])

// 响应式数据
const dialogVisible = ref(false)
const showDetails = ref(true)
const showLogs = ref(false)
const logs = ref([])
const fileList = ref([])

// 计算属性
const totalCount = computed(() => fileList.value.length)

const completedCount = computed(() => {
  return fileList.value.filter(file => file.status === 'completed').length
})

const failedCount = computed(() => {
  return fileList.value.filter(file => file.status === 'failed').length
})

const processingCount = computed(() => {
  return fileList.value.filter(file => file.status === 'processing').length
})

const overallProgress = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const overallStatus = computed(() => {
  if (props.importing) return ''
  if (failedCount.value > 0 && completedCount.value > 0) return 'warning'
  if (failedCount.value > 0) return 'exception'
  if (completedCount.value === totalCount.value) return 'success'
  return ''
})

const statusText = computed(() => {
  if (props.importing) {
    if (props.currentFile) {
      return `正在处理: ${props.currentFile.name}`
    }
    return '导入中...'
  }
  
  if (completedCount.value === totalCount.value) {
    return '导入完成'
  }
  
  if (failedCount.value > 0) {
    return `${completedCount.value} 个成功，${failedCount.value} 个失败`
  }
  
  return '准备导入'
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

watch(() => props.files, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    fileList.value = newFiles.map(file => ({
      ...file,
      status: file.status || 'pending',
      progress: file.progress || 0,
      startTime: null,
      endTime: null,
      duration: null
    }))
  }
}, { immediate: true, deep: true })

watch(() => props.progress, (newProgress) => {
  if (newProgress && newProgress.file) {
    updateFileProgress(newProgress)
  }
}, { deep: true })

// 方法
const updateFileProgress = (progressData) => {
  const { file, progress, status, error } = progressData
  
  const fileIndex = fileList.value.findIndex(f => 
    f.id === file.id || f.name === file.name
  )
  
  if (fileIndex !== -1) {
    const fileItem = fileList.value[fileIndex]
    
    // 更新状态
    if (status) {
      fileItem.status = status
      
      if (status === 'processing' && !fileItem.startTime) {
        fileItem.startTime = Date.now()
      }
      
      if ((status === 'completed' || status === 'failed') && fileItem.startTime) {
        fileItem.endTime = Date.now()
        fileItem.duration = fileItem.endTime - fileItem.startTime
      }
    }
    
    // 更新进度
    if (progress !== undefined) {
      fileItem.progress = progress
    }
    
    // 更新错误信息
    if (error) {
      fileItem.error = error
    }
    
    // 添加日志
    if (status === 'processing') {
      addLog('info', `开始处理: ${file.name}`)
    } else if (status === 'completed') {
      addLog('success', `导入成功: ${file.name}`)
    } else if (status === 'failed') {
      addLog('error', `导入失败: ${file.name} - ${error || '未知错误'}`)
    }
  }
}

const getFileProgressStatus = (file) => {
  if (file.status === 'completed') return 'success'
  if (file.status === 'failed') return 'exception'
  return ''
}

const addLog = (level, message) => {
  logs.value.push({
    level,
    message,
    timestamp: Date.now()
  })
  
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(-100)
  }
}

const clearLogs = () => {
  logs.value = []
}

const toggleShowDetails = () => {
  showDetails.value = !showDetails.value
}

const toggleShowLogs = () => {
  showLogs.value = !showLogs.value
}

const formatFileSize = (size) => {
  return commonUtils.formatFileSize(size)
}

const formatDuration = (duration) => {
  if (!duration) return '-'
  
  const seconds = Math.floor(duration / 1000)
  if (seconds < 60) {
    return `${seconds}秒`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}分${remainingSeconds}秒`
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN')
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消导入吗？已导入的文件不会被删除。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '继续导入',
        type: 'warning'
      }
    )
    
    emit('cancel')
    addLog('warning', '用户取消导入')
  } catch {
    // 用户选择继续导入
  }
}

const handleRetry = () => {
  const failedFiles = fileList.value.filter(file => file.status === 'failed')
  
  if (failedFiles.length === 0) {
    ElMessage.info('没有失败的文件需要重试')
    return
  }
  
  // 重置失败文件的状态
  failedFiles.forEach(file => {
    file.status = 'pending'
    file.progress = 0
    file.error = null
    file.startTime = null
    file.endTime = null
    file.duration = null
  })
  
  emit('retry', failedFiles)
  addLog('info', `重试 ${failedFiles.length} 个失败的文件`)
}

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

// 暴露方法
defineExpose({
  updateFileProgress,
  addLog,
  clearLogs
})
</script>

<style scoped>
.import-progress-dialog {
  --progress-success-color: var(--el-color-success);
  --progress-error-color: var(--el-color-error);
  --progress-warning-color: var(--el-color-warning);
  --progress-pending-color: var(--el-color-info);
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
  overflow: hidden;
}

.overall-progress {
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-stats {
  display: flex;
  gap: 16px;
}

.stats-item {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.stats-item--error {
  color: var(--progress-error-color);
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 14px;
}

.progress-percentage {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-status {
  color: var(--el-text-color-regular);
}

.current-file {
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.current-file__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.current-file__icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.current-file__name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-file__error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--progress-error-color);
}

.file-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.file-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 500;
}

.file-list__content {
  flex: 1;
  overflow-y: auto;
  max-height: 300px;
  transition: max-height 0.3s ease;
}

.file-list__content--collapsed {
  max-height: 0;
  overflow: hidden;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s ease;
}

.file-item:hover {
  background-color: var(--el-bg-color-page);
}

.file-item:last-child {
  border-bottom: none;
}

.file-item--pending {
  background-color: var(--el-color-info-light-9);
}

.file-item--processing {
  background-color: var(--el-color-primary-light-9);
}

.file-item--completed {
  background-color: var(--el-color-success-light-9);
}

.file-item--failed {
  background-color: var(--el-color-error-light-9);
}

.file-item__status {
  margin-right: 12px;
  font-size: 16px;
}

.file-item--pending .file-item__status {
  color: var(--progress-pending-color);
}

.file-item--processing .file-item__status {
  color: var(--el-color-primary);
}

.file-item--completed .file-item__status {
  color: var(--progress-success-color);
}

.file-item--failed .file-item__status {
  color: var(--progress-error-color);
}

.file-item__info {
  flex: 1;
  min-width: 0;
}

.file-item__name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-item__meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.file-item__error {
  font-size: 12px;
  color: var(--progress-error-color);
  margin-top: 4px;
}

.file-item__progress {
  margin-left: 12px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge--success {
  background-color: var(--el-color-success-light-8);
  color: var(--progress-success-color);
}

.status-badge--error {
  background-color: var(--el-color-error-light-8);
  color: var(--progress-error-color);
}

.status-badge--pending {
  background-color: var(--el-color-info-light-8);
  color: var(--progress-pending-color);
}

.operation-logs {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 500;
}

.logs-content {
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item--info {
  color: var(--el-text-color-regular);
}

.log-item--success {
  color: var(--progress-success-color);
}

.log-item--error {
  color: var(--progress-error-color);
}

.log-item--warning {
  color: var(--progress-warning-color);
}

.log-time {
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.log-message {
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .progress-stats {
    flex-direction: column;
    gap: 4px;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-item__progress {
    margin-left: 0;
    align-self: flex-end;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .footer-right {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 滚动条样式 */
.file-list__content::-webkit-scrollbar,
.logs-content::-webkit-scrollbar {
  width: 6px;
}

.file-list__content::-webkit-scrollbar-track,
.logs-content::-webkit-scrollbar-track {
  background: var(--el-bg-color-page);
}

.file-list__content::-webkit-scrollbar-thumb,
.logs-content::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.file-list__content::-webkit-scrollbar-thumb:hover,
.logs-content::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>