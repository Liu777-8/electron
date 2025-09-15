<template>
  <div class="file-selector">
    <!-- 文件拖拽区域 -->
    <div 
      class="drop-zone"
      :class="{ 
        'drop-zone--active': isDragOver,
        'drop-zone--disabled': disabled 
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @click="openFileDialog"
    >
      <div class="drop-zone__content">
        <el-icon class="drop-zone__icon" :size="48">
          <Upload v-if="!isDragOver" />
          <DocumentAdd v-else />
        </el-icon>
        
        <div class="drop-zone__text">
          <p class="drop-zone__primary">
            {{ isDragOver ? '释放文件以导入' : '点击选择文件或拖拽文件到此处' }}
          </p>
          <p class="drop-zone__secondary">
            支持格式：{{ supportedFormatsText }}
          </p>
          <p class="drop-zone__hint">
            单个文件最大 {{ maxFileSizeText }}，最多选择 {{ maxFiles }} 个文件
          </p>
        </div>
      </div>
    </div>
    
    <!-- 文件选择按钮 -->
    <div class="file-actions">
      <el-button 
        type="primary" 
        :icon="FolderOpened"
        :disabled="disabled"
        @click="openFileDialog"
      >
        选择文件
      </el-button>
      
      <el-button 
        :icon="Folder"
        :disabled="disabled"
        @click="openFolderDialog"
      >
        选择文件夹
      </el-button>
      
      <el-button 
        v-if="selectedFiles.length > 0"
        :icon="Delete"
        @click="clearFiles"
      >
        清空列表
      </el-button>
    </div>
    
    <!-- 已选择的文件列表 -->
    <div v-if="selectedFiles.length > 0" class="file-list">
      <div class="file-list__header">
        <span>已选择 {{ selectedFiles.length }} 个文件</span>
        <el-button 
          type="primary" 
          size="small"
          :loading="importing"
          :disabled="!canImport"
          @click="startImport"
        >
          {{ importing ? '导入中...' : '开始导入' }}
        </el-button>
      </div>
      
      <div class="file-list__items">
        <div 
          v-for="(file, index) in selectedFiles" 
          :key="file.id"
          class="file-item"
          :class="{ 
            'file-item--error': file.error,
            'file-item--success': file.imported 
          }"
        >
          <div class="file-item__icon">
            <el-icon>
              <Document v-if="file.format === 'TXT'" />
              <Reading v-else-if="file.format === 'EPUB'" />
              <Warning v-else-if="file.error" />
              <SuccessFilled v-else-if="file.imported" />
              <Document v-else />
            </el-icon>
          </div>
          
          <div class="file-item__info">
            <div class="file-item__name" :title="file.name">
              {{ file.name }}
            </div>
            <div class="file-item__meta">
              <span class="file-item__size">{{ formatFileSize(file.size) }}</span>
              <span class="file-item__format">{{ file.format }}</span>
              <span v-if="file.encoding" class="file-item__encoding">
                {{ file.encoding }}
              </span>
            </div>
            <div v-if="file.error" class="file-item__error">
              {{ file.error }}
            </div>
            <div v-if="file.imported" class="file-item__success">
              导入成功
            </div>
          </div>
          
          <div class="file-item__actions">
            <el-button 
              v-if="!file.imported"
              type="text" 
              size="small"
              :icon="View"
              @click="previewFile(file)"
            >
              预览
            </el-button>
            <el-button 
              type="text" 
              size="small"
              :icon="Delete"
              @click="removeFile(index)"
            >
              移除
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 导入进度 -->
    <div v-if="importing" class="import-progress">
      <el-progress 
        :percentage="importProgress" 
        :status="importStatus"
        :stroke-width="8"
      >
        <template #default="{ percentage }">
          <span class="progress-text">
            {{ importStatusText }} ({{ percentage }}%)
          </span>
        </template>
      </el-progress>
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInput"
      type="file"
      multiple
      :accept="acceptTypes"
      style="display: none"
      @change="handleFileSelect"
    >
    
    <!-- 文件预览对话框 -->
    <FilePreviewDialog 
      v-model="showPreview"
      :file="previewingFile"
      @confirm="confirmPreview"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  DocumentAdd,
  FolderOpened,
  Folder,
  Delete,
  Document,
  Reading,
  Warning,
  SuccessFilled,
  View
} from '@element-plus/icons-vue'
import { services } from '../../services/index.js'
import { commonUtils } from '../../utils/index.js'
import FilePreviewDialog from './FilePreviewDialog.vue'

// Props
const props = defineProps({
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 最大文件数量
  maxFiles: {
    type: Number,
    default: 50
  },
  // 最大文件大小（字节）
  maxFileSize: {
    type: Number,
    default: 100 * 1024 * 1024 // 100MB
  },
  // 支持的文件格式
  supportedFormats: {
    type: Array,
    default: () => ['TXT', 'EPUB']
  },
  // 自动开始导入
  autoImport: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'files-selected',
  'import-start',
  'import-progress',
  'import-complete',
  'import-error'
])

// 响应式数据
const fileInput = ref(null)
const isDragOver = ref(false)
const selectedFiles = ref([])
const importing = ref(false)
const importProgress = ref(0)
const importStatus = ref('')
const importStatusText = ref('')
const showPreview = ref(false)
const previewingFile = ref(null)

// 计算属性
const supportedFormatsText = computed(() => {
  return props.supportedFormats.join('、')
})

const maxFileSizeText = computed(() => {
  return commonUtils.formatFileSize(props.maxFileSize)
})

const acceptTypes = computed(() => {
  const types = []
  if (props.supportedFormats.includes('TXT')) {
    types.push('.txt')
  }
  if (props.supportedFormats.includes('EPUB')) {
    types.push('.epub')
  }
  return types.join(',')
})

const canImport = computed(() => {
  return selectedFiles.value.length > 0 && 
         selectedFiles.value.some(file => !file.error && !file.imported)
})

// 方法
const openFileDialog = () => {
  if (props.disabled) return
  fileInput.value?.click()
}

const openFolderDialog = async () => {
  if (props.disabled) return
  
  try {
    // 使用 Electron API 选择文件夹
    if (window.electronAPI && window.electronAPI.selectFolder) {
      const result = await window.electronAPI.selectFolder()
      if (result && result.filePaths && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0]
        await scanFolder(folderPath)
      }
    } else {
      ElMessage.warning('文件夹选择功能需要在 Electron 环境中使用')
    }
  } catch (err) {
    console.error('选择文件夹失败:', err)
    ElMessage.error('选择文件夹失败')
  }
}

const scanFolder = async (folderPath) => {
  try {
    // 扫描文件夹中的小说文件
    const files = await services.import.scanFolder(folderPath, {
      supportedFormats: props.supportedFormats,
      maxFiles: props.maxFiles,
      maxFileSize: props.maxFileSize
    })
    
    if (files.length === 0) {
      ElMessage.info('文件夹中没有找到支持的小说文件')
      return
    }
    
    // 添加到选择列表
    const newFiles = files.map(file => createFileItem(file))
    selectedFiles.value.push(...newFiles)
    
    ElMessage.success(`从文件夹中找到 ${files.length} 个文件`)
    
    // 触发事件
    emit('files-selected', selectedFiles.value)
    
    // 自动导入
    if (props.autoImport) {
      await startImport()
    }
  } catch (err) {
    console.error('扫描文件夹失败:', err)
    ElMessage.error('扫描文件夹失败')
  }
}

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files)
  addFiles(files)
  
  // 清空输入框
  event.target.value = ''
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (props.disabled) return
  
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

const handleDragOver = (event) => {
  event.preventDefault()
}

const handleDragEnter = (event) => {
  event.preventDefault()
  if (!props.disabled) {
    isDragOver.value = true
  }
}

const handleDragLeave = (event) => {
  event.preventDefault()
  // 只有当离开整个拖拽区域时才设置为false
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isDragOver.value = false
  }
}

const addFiles = async (files) => {
  if (files.length === 0) return
  
  // 检查文件数量限制
  if (selectedFiles.value.length + files.length > props.maxFiles) {
    ElMessage.warning(`最多只能选择 ${props.maxFiles} 个文件`)
    return
  }
  
  const newFiles = []
  
  for (const file of files) {
    try {
      // 验证文件
      const validation = await validateFile(file)
      
      if (validation.isValid) {
        const fileItem = createFileItem(file, validation)
        newFiles.push(fileItem)
      } else {
        const fileItem = createFileItem(file, validation)
        fileItem.error = validation.error
        newFiles.push(fileItem)
      }
    } catch (err) {
      console.error('处理文件失败:', err)
      const fileItem = createFileItem(file)
      fileItem.error = '文件处理失败'
      newFiles.push(fileItem)
    }
  }
  
  selectedFiles.value.push(...newFiles)
  
  // 触发事件
  emit('files-selected', selectedFiles.value)
  
  // 自动导入
  if (props.autoImport && newFiles.some(f => !f.error)) {
    await startImport()
  }
}

const createFileItem = (file, validation = null) => {
  return {
    id: commonUtils.generateId('file_'),
    name: file.name,
    size: file.size,
    type: file.type,
    format: validation?.format || getFileFormat(file.name),
    encoding: validation?.encoding || 'utf-8',
    lastModified: file.lastModified,
    file: file,
    error: null,
    imported: false,
    progress: 0
  }
}

const getFileFormat = (fileName) => {
  const ext = fileName.split('.').pop()?.toUpperCase()
  return props.supportedFormats.includes(ext) ? ext : 'UNKNOWN'
}

const validateFile = async (file) => {
  try {
    // 检查文件大小
    if (file.size > props.maxFileSize) {
      return {
        isValid: false,
        error: `文件大小超过限制（${commonUtils.formatFileSize(props.maxFileSize)}）`
      }
    }
    
    // 检查文件格式
    const format = getFileFormat(file.name)
    if (!props.supportedFormats.includes(format)) {
      return {
        isValid: false,
        error: `不支持的文件格式（${format}）`
      }
    }
    
    // 使用服务验证文件
    const validation = await services.import.validateFile(file)
    
    return {
      isValid: validation.isValid,
      error: validation.error,
      format: validation.format,
      encoding: validation.encoding
    }
  } catch (err) {
    return {
      isValid: false,
      error: '文件验证失败'
    }
  }
}

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1)
  emit('files-selected', selectedFiles.value)
}

const clearFiles = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空文件列表吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    selectedFiles.value = []
    emit('files-selected', selectedFiles.value)
  } catch {
    // 用户取消
  }
}

const startImport = async () => {
  if (importing.value || !canImport.value) return
  
  try {
    importing.value = true
    importProgress.value = 0
    importStatus.value = ''
    importStatusText.value = '准备导入...'
    
    emit('import-start')
    
    const filesToImport = selectedFiles.value.filter(file => !file.error && !file.imported)
    const totalFiles = filesToImport.length
    let completedFiles = 0
    
    for (const fileItem of filesToImport) {
      try {
        importStatusText.value = `正在导入: ${fileItem.name}`
        
        // 导入文件
        const result = await services.import.importFile(fileItem.file, {
          onProgress: (progress) => {
            fileItem.progress = progress
            emit('import-progress', {
              file: fileItem,
              progress,
              completed: completedFiles,
              total: totalFiles
            })
          }
        })
        
        // 标记为已导入
        fileItem.imported = true
        fileItem.progress = 100
        completedFiles++
        
        // 更新总进度
        importProgress.value = Math.round((completedFiles / totalFiles) * 100)
        
      } catch (err) {
        console.error(`导入文件失败: ${fileItem.name}`, err)
        fileItem.error = err.message || '导入失败'
        
        emit('import-error', {
          file: fileItem,
          error: err
        })
      }
    }
    
    importStatusText.value = '导入完成'
    importStatus.value = completedFiles === totalFiles ? 'success' : 'warning'
    
    emit('import-complete', {
      total: totalFiles,
      completed: completedFiles,
      failed: totalFiles - completedFiles
    })
    
    if (completedFiles > 0) {
      ElMessage.success(`成功导入 ${completedFiles} 个文件`)
    }
    
    if (completedFiles < totalFiles) {
      ElMessage.warning(`${totalFiles - completedFiles} 个文件导入失败`)
    }
    
  } catch (err) {
    console.error('导入过程失败:', err)
    ElMessage.error('导入过程失败')
    importStatus.value = 'exception'
    importStatusText.value = '导入失败'
    
    emit('import-error', { error: err })
  } finally {
    importing.value = false
  }
}

const previewFile = (fileItem) => {
  previewingFile.value = fileItem
  showPreview.value = true
}

const confirmPreview = (confirmed) => {
  if (confirmed && previewingFile.value) {
    // 可以在这里添加预览确认后的逻辑
  }
  showPreview.value = false
  previewingFile.value = null
}

const formatFileSize = (size) => {
  return commonUtils.formatFileSize(size)
}

// 生命周期
onMounted(() => {
  // 防止页面默认的拖拽行为
  document.addEventListener('dragover', preventDefault)
  document.addEventListener('drop', preventDefault)
})

onUnmounted(() => {
  document.removeEventListener('dragover', preventDefault)
  document.removeEventListener('drop', preventDefault)
})

const preventDefault = (e) => {
  e.preventDefault()
}

// 暴露方法给父组件
defineExpose({
  addFiles,
  clearFiles,
  startImport,
  selectedFiles: selectedFiles.value
})
</script>

<style scoped>
.file-selector {
  width: 100%;
}

.drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: var(--el-bg-color-page);
}

.drop-zone:hover {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.drop-zone--active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-8);
  transform: scale(1.02);
}

.drop-zone--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.drop-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.drop-zone__icon {
  color: var(--el-color-primary);
  transition: transform 0.3s ease;
}

.drop-zone--active .drop-zone__icon {
  transform: scale(1.2);
}

.drop-zone__text {
  max-width: 400px;
}

.drop-zone__primary {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.drop-zone__secondary {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin: 0 0 4px 0;
}

.drop-zone__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin: 0;
}

.file-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  justify-content: center;
}

.file-list {
  margin-top: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.file-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color);
  font-weight: 500;
}

.file-list__items {
  max-height: 400px;
  overflow-y: auto;
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

.file-item--error {
  background-color: var(--el-color-error-light-9);
}

.file-item--success {
  background-color: var(--el-color-success-light-9);
}

.file-item__icon {
  margin-right: 12px;
  font-size: 20px;
  color: var(--el-color-primary);
}

.file-item--error .file-item__icon {
  color: var(--el-color-error);
}

.file-item--success .file-item__icon {
  color: var(--el-color-success);
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
  margin-bottom: 2px;
}

.file-item__error {
  font-size: 12px;
  color: var(--el-color-error);
  margin-top: 4px;
}

.file-item__success {
  font-size: 12px;
  color: var(--el-color-success);
  margin-top: 4px;
}

.file-item__actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.import-progress {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}

.progress-text {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .drop-zone {
    padding: 24px 16px;
  }
  
  .drop-zone__primary {
    font-size: 14px;
  }
  
  .file-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .file-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-item__actions {
    margin-left: 0;
    align-self: flex-end;
  }
}
</style>