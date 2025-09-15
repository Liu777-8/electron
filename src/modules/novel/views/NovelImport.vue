<template>
  <div class="novel-import">
    <!-- 页面头部 -->
    <div class="import-header">
      <div class="header-content">
        <div class="header-title">
          <el-icon class="title-icon"><Upload /></el-icon>
          <h2>小说导入</h2>
        </div>
        
        <div class="header-actions">
          <el-button
            type="text"
            :icon="QuestionFilled"
            @click="showHelp = true"
          >
            使用帮助
          </el-button>
          
          <el-button
            v-if="importedNovels.length > 0"
            type="primary"
            :icon="List"
            @click="$router.push('/novel/library')"
          >
            查看书库 ({{ importedNovels.length }})
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 导入统计 -->
    <div v-if="importStats.total > 0" class="import-stats">
      <div class="stats-grid">
        <div class="stat-item stat-item--total">
          <div class="stat-value">{{ importStats.total }}</div>
          <div class="stat-label">总计导入</div>
        </div>
        
        <div class="stat-item stat-item--success">
          <div class="stat-value">{{ importStats.success }}</div>
          <div class="stat-label">成功</div>
        </div>
        
        <div class="stat-item stat-item--failed">
          <div class="stat-value">{{ importStats.failed }}</div>
          <div class="stat-label">失败</div>
        </div>
        
        <div class="stat-item stat-item--size">
          <div class="stat-value">{{ formatFileSize(importStats.totalSize) }}</div>
          <div class="stat-label">总大小</div>
        </div>
      </div>
    </div>
    
    <!-- 文件选择器 -->
    <div class="import-content">
      <FileSelector
        ref="fileSelectorRef"
        :max-files="maxFiles"
        :max-file-size="maxFileSize"
        :supported-formats="supportedFormats"
        :auto-import="autoImport"
        :disabled="importing"
        @files-selected="handleFilesSelected"
        @import-start="handleImportStart"
        @import-progress="handleImportProgress"
        @import-complete="handleImportComplete"
        @import-error="handleImportError"
      />
    </div>
    
    <!-- 最近导入的小说 -->
    <div v-if="recentNovels.length > 0" class="recent-novels">
      <div class="section-header">
        <h3>最近导入</h3>
        <el-button
          type="text"
          size="small"
          @click="showAllRecent = !showAllRecent"
        >
          {{ showAllRecent ? '收起' : '查看全部' }}
        </el-button>
      </div>
      
      <div class="novels-grid" :class="{ 'novels-grid--expanded': showAllRecent }">
        <div
          v-for="novel in displayedRecentNovels"
          :key="novel.id"
          class="novel-card"
          @click="openNovel(novel)"
        >
          <div class="novel-cover">
            <img
              v-if="novel.cover"
              :src="novel.cover"
              :alt="novel.title"
              @error="handleImageError"
            >
            <div v-else class="novel-cover-placeholder">
              <el-icon><Reading /></el-icon>
            </div>
          </div>
          
          <div class="novel-info">
            <div class="novel-title" :title="novel.title">
              {{ novel.title }}
            </div>
            
            <div class="novel-meta">
              <span v-if="novel.author" class="novel-author">
                {{ novel.author }}
              </span>
              <span class="novel-format">
                {{ novel.format }}
              </span>
              <span class="novel-size">
                {{ formatFileSize(novel.fileSize) }}
              </span>
            </div>
            
            <div class="novel-time">
              {{ formatImportTime(novel.importTime) }}
            </div>
          </div>
          
          <div class="novel-actions">
            <el-button
              type="text"
              size="small"
              :icon="View"
              @click.stop="previewNovel(novel)"
            >
              预览
            </el-button>
            
            <el-button
              type="text"
              size="small"
              :icon="Reading"
              @click.stop="startReading(novel)"
            >
              阅读
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 导入进度对话框 -->
    <ImportProgressDialog
      v-model="showProgress"
      :files="importFiles"
      :importing="importing"
      :current-file="currentFile"
      :progress="progressData"
      @cancel="handleCancelImport"
      @retry="handleRetryImport"
      @close="handleCloseProgress"
    />
    
    <!-- 文件预览对话框 -->
    <FilePreviewDialog
      v-model="showPreview"
      :file="previewFile"
      @confirm="handlePreviewConfirm"
    />
    
    <!-- 使用帮助对话框 -->
    <el-dialog
      v-model="showHelp"
      title="使用帮助"
      width="600px"
      class="help-dialog"
    >
      <div class="help-content">
        <div class="help-section">
          <h4>支持的文件格式</h4>
          <ul>
            <li><strong>TXT 文件：</strong>纯文本小说文件，支持多种编码格式</li>
            <li><strong>EPUB 文件：</strong>电子书标准格式，支持章节结构和元数据</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h4>导入方式</h4>
          <ul>
            <li><strong>拖拽导入：</strong>直接将文件拖拽到导入区域</li>
            <li><strong>点击选择：</strong>点击导入区域或"选择文件"按钮</li>
            <li><strong>文件夹导入：</strong>选择包含小说文件的文件夹批量导入</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h4>文件要求</h4>
          <ul>
            <li>单个文件最大 {{ formatFileSize(maxFileSize) }}</li>
            <li>最多同时选择 {{ maxFiles }} 个文件</li>
            <li>文件名建议使用中文或英文，避免特殊字符</li>
          </ul>
        </div>
        
        <div class="help-section">
          <h4>注意事项</h4>
          <ul>
            <li>导入过程中请勿关闭页面或刷新浏览器</li>
            <li>重复的文件会被自动跳过</li>
            <li>导入失败的文件可以单独重试</li>
            <li>所有导入的小说都会保存在本地书库中</li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  QuestionFilled,
  List,
  Reading,
  View
} from '@element-plus/icons-vue'
import { FileSelector, FilePreviewDialog, ImportProgressDialog } from '../components/import/index.js'
import { useNovelStore } from '../stores/novel.js'
import { useSettingsStore } from '../stores/settings.js'
import { services } from '../services/index.js'
import { commonUtils } from '../utils/index.js'

// 路由
const router = useRouter()

// 状态管理
const novelStore = useNovelStore()
const settingsStore = useSettingsStore()

// 响应式数据
const fileSelectorRef = ref(null)
const importing = ref(false)
const showProgress = ref(false)
const showPreview = ref(false)
const showHelp = ref(false)
const showAllRecent = ref(false)

const importFiles = ref([])
const currentFile = ref(null)
const progressData = ref({})
const previewFile = ref(null)

const importStats = ref({
  total: 0,
  success: 0,
  failed: 0,
  totalSize: 0
})

// 计算属性
const maxFiles = computed(() => settingsStore.import.maxFiles)
const maxFileSize = computed(() => settingsStore.import.maxFileSize)
const supportedFormats = computed(() => settingsStore.import.supportedFormats)
const autoImport = computed(() => settingsStore.import.autoImport)

const importedNovels = computed(() => novelStore.novels)

const recentNovels = computed(() => {
  return novelStore.novels
    .filter(novel => novel.importTime)
    .sort((a, b) => new Date(b.importTime) - new Date(a.importTime))
    .slice(0, 20) // 最多显示20本最近导入的小说
})

const displayedRecentNovels = computed(() => {
  return showAllRecent.value ? recentNovels.value : recentNovels.value.slice(0, 6)
})

// 方法
const handleFilesSelected = (files) => {
  importFiles.value = files
  
  // 如果有文件且不是自动导入，显示进度对话框
  if (files.length > 0 && !autoImport.value) {
    showProgress.value = true
  }
}

const handleImportStart = () => {
  importing.value = true
  showProgress.value = true
  
  ElMessage.info('开始导入小说文件...')
}

const handleImportProgress = (progress) => {
  progressData.value = progress
  currentFile.value = progress.file
  
  // 更新导入文件状态
  const fileIndex = importFiles.value.findIndex(f => 
    f.id === progress.file.id || f.name === progress.file.name
  )
  
  if (fileIndex !== -1) {
    importFiles.value[fileIndex] = {
      ...importFiles.value[fileIndex],
      ...progress.file,
      progress: progress.progress
    }
  }
}

const handleImportComplete = async (result) => {
  importing.value = false
  currentFile.value = null
  
  // 更新统计信息
  importStats.value.total += result.total
  importStats.value.success += result.completed
  importStats.value.failed += result.failed
  
  // 计算总大小
  const completedFiles = importFiles.value.filter(f => f.imported)
  importStats.value.totalSize += completedFiles.reduce((sum, f) => sum + (f.size || 0), 0)
  
  // 刷新小说列表
  await novelStore.loadNovels()
  
  // 显示完成消息
  if (result.completed > 0) {
    ElMessage.success(`成功导入 ${result.completed} 本小说`)
  }
  
  if (result.failed > 0) {
    ElMessage.warning(`${result.failed} 个文件导入失败`)
  }
}

const handleImportError = (error) => {
  console.error('导入错误:', error)
  ElMessage.error(error.message || '导入过程中发生错误')
}

const handleCancelImport = async () => {
  try {
    // 取消导入服务
    await services.import.cancelImport()
    
    importing.value = false
    currentFile.value = null
    showProgress.value = false
    
    ElMessage.info('已取消导入')
  } catch (err) {
    console.error('取消导入失败:', err)
    ElMessage.error('取消导入失败')
  }
}

const handleRetryImport = async (failedFiles) => {
  try {
    importing.value = true
    
    // 重新导入失败的文件
    await services.import.retryImport(failedFiles)
    
  } catch (err) {
    console.error('重试导入失败:', err)
    ElMessage.error('重试导入失败')
    importing.value = false
  }
}

const handleCloseProgress = () => {
  showProgress.value = false
  
  // 清空文件列表
  if (!importing.value) {
    importFiles.value = []
    fileSelectorRef.value?.clearFiles()
  }
}

const openNovel = (novel) => {
  // 跳转到小说详情页面
  router.push(`/novel/detail/${novel.id}`)
}

const previewNovel = (novel) => {
  previewFile.value = {
    name: novel.title,
    format: novel.format,
    size: novel.fileSize,
    file: novel // 传递整个小说对象用于预览
  }
  showPreview.value = true
}

const startReading = async (novel) => {
  try {
    // 开始阅读小说
    await services.reader.startReading(novel.id)
    
    ElMessage.success(`开始阅读《${novel.title}》`)
    
    // 可以选择跳转到阅读页面或打开阅读窗口
    // router.push(`/novel/reader/${novel.id}`)
  } catch (err) {
    console.error('开始阅读失败:', err)
    ElMessage.error('开始阅读失败')
  }
}

const handlePreviewConfirm = () => {
  showPreview.value = false
  previewFile.value = null
}

const handleImageError = (event) => {
  // 图片加载失败时的处理
  event.target.style.display = 'none'
}

const formatFileSize = (size) => {
  return commonUtils.formatFileSize(size)
}

const formatImportTime = (time) => {
  if (!time) return ''
  
  const now = new Date()
  const importTime = new Date(time)
  const diffMs = now - importTime
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天导入'
  } else if (diffDays === 1) {
    return '昨天导入'
  } else if (diffDays < 7) {
    return `${diffDays}天前导入`
  } else {
    return importTime.toLocaleDateString('zh-CN')
  }
}

// 生命周期
onMounted(async () => {
  // 加载小说列表
  await novelStore.loadNovels()
  
  // 加载导入统计
  try {
    const stats = await services.import.getImportStats()
    importStats.value = stats
  } catch (err) {
    console.error('加载导入统计失败:', err)
  }
})

onUnmounted(() => {
  // 清理资源
  if (importing.value) {
    services.import.cancelImport().catch(console.error)
  }
})
</script>

<style scoped>
.novel-import {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.import-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.import-stats {
  margin-bottom: 24px;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.stat-item--total .stat-value {
  color: var(--el-color-primary);
}

.stat-item--success .stat-value {
  color: var(--el-color-success);
}

.stat-item--failed .stat-value {
  color: var(--el-color-error);
}

.stat-item--size .stat-value {
  color: var(--el-color-info);
}

.import-content {
  margin-bottom: 32px;
}

.recent-novels {
  margin-top: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.novels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-height: 400px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.novels-grid--expanded {
  max-height: none;
}

.novel-card {
  display: flex;
  padding: 16px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.novel-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.novel-cover {
  width: 60px;
  height: 80px;
  margin-right: 12px;
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
}

.novel-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.novel-cover-placeholder {
  color: var(--el-text-color-placeholder);
  font-size: 24px;
}

.novel-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.novel-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.novel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.novel-time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.novel-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.help-dialog {
  --help-section-spacing: 20px;
}

.help-content {
  line-height: 1.6;
}

.help-section {
  margin-bottom: var(--help-section-spacing);
}

.help-section:last-child {
  margin-bottom: 0;
}

.help-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.help-section ul {
  margin: 0;
  padding-left: 20px;
}

.help-section li {
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
}

.help-section li:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .novel-import {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .novels-grid {
    grid-template-columns: 1fr;
  }
  
  .novel-card {
    padding: 12px;
  }
  
  .novel-cover {
    width: 50px;
    height: 70px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-item {
    padding: 12px;
  }
  
  .stat-value {
    font-size: 20px;
  }
}
</style>