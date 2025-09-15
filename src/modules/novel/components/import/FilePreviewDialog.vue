<template>
  <el-dialog
    v-model="dialogVisible"
    title="文件预览"
    width="80%"
    :before-close="handleClose"
    class="file-preview-dialog"
  >
    <div v-if="loading" class="preview-loading">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else-if="error" class="preview-error">
      <el-result
        icon="error"
        title="预览失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="retryPreview">
            重试
          </el-button>
        </template>
      </el-result>
    </div>
    
    <div v-else class="preview-content">
      <!-- 文件信息 -->
      <div class="file-info">
        <div class="file-info__header">
          <div class="file-info__title">
            <el-icon class="file-info__icon">
              <Document v-if="fileInfo.format === 'TXT'" />
              <Reading v-else-if="fileInfo.format === 'EPUB'" />
              <Document v-else />
            </el-icon>
            <span class="file-info__name">{{ fileInfo.name }}</span>
          </div>
          
          <div class="file-info__actions">
            <el-button
              size="small"
              :icon="Refresh"
              @click="retryPreview"
            >
              刷新
            </el-button>
          </div>
        </div>
        
        <div class="file-info__meta">
          <div class="meta-item">
            <span class="meta-label">格式:</span>
            <el-tag size="small" :type="getFormatTagType(fileInfo.format)">
              {{ fileInfo.format }}
            </el-tag>
          </div>
          
          <div class="meta-item">
            <span class="meta-label">大小:</span>
            <span class="meta-value">{{ formatFileSize(fileInfo.size) }}</span>
          </div>
          
          <div v-if="fileInfo.encoding" class="meta-item">
            <span class="meta-label">编码:</span>
            <span class="meta-value">{{ fileInfo.encoding }}</span>
          </div>
          
          <div v-if="previewData.wordCount" class="meta-item">
            <span class="meta-label">字数:</span>
            <span class="meta-value">{{ previewData.wordCount.toLocaleString() }}</span>
          </div>
          
          <div v-if="previewData.chapterCount" class="meta-item">
            <span class="meta-label">章节:</span>
            <span class="meta-value">{{ previewData.chapterCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- 内容预览 -->
      <div class="content-preview">
        <div class="preview-tabs">
          <el-tabs v-model="activeTab" type="border-card">
            <!-- 文本预览 -->
            <el-tab-pane label="内容预览" name="content">
              <div class="content-view">
                <div v-if="previewData.content" class="content-text">
                  <div 
                    v-for="(paragraph, index) in previewParagraphs" 
                    :key="index"
                    class="content-paragraph"
                    :class="{ 'content-paragraph--chapter': paragraph.isChapter }"
                  >
                    {{ paragraph.text }}
                  </div>
                  
                  <div v-if="previewData.isTruncated" class="content-truncated">
                    <el-divider>
                      <el-icon><MoreFilled /></el-icon>
                      <span>内容过长，仅显示前 {{ previewLimit }} 个字符</span>
                      <el-icon><MoreFilled /></el-icon>
                    </el-divider>
                  </div>
                </div>
                
                <div v-else class="content-empty">
                  <el-empty description="无法预览文件内容" />
                </div>
              </div>
            </el-tab-pane>
            
            <!-- 章节列表 -->
            <el-tab-pane 
              v-if="previewData.chapters && previewData.chapters.length > 0" 
              label="章节列表" 
              name="chapters"
            >
              <div class="chapters-view">
                <div class="chapters-header">
                  <span>共 {{ previewData.chapters.length }} 个章节</span>
                </div>
                
                <div class="chapters-list">
                  <div 
                    v-for="(chapter, index) in previewData.chapters" 
                    :key="index"
                    class="chapter-item"
                    @click="previewChapter(chapter)"
                  >
                    <div class="chapter-info">
                      <div class="chapter-title">{{ chapter.title }}</div>
                      <div class="chapter-meta">
                        <span class="chapter-index">第 {{ index + 1 }} 章</span>
                        <span v-if="chapter.wordCount" class="chapter-words">
                          {{ chapter.wordCount }} 字
                        </span>
                      </div>
                    </div>
                    
                    <el-icon class="chapter-arrow">
                      <ArrowRight />
                    </el-icon>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            
            <!-- 文件详情 -->
            <el-tab-pane label="文件详情" name="details">
              <div class="details-view">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="文件名">
                    {{ fileInfo.name }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item label="文件格式">
                    <el-tag :type="getFormatTagType(fileInfo.format)">
                      {{ fileInfo.format }}
                    </el-tag>
                  </el-descriptions-item>
                  
                  <el-descriptions-item label="文件大小">
                    {{ formatFileSize(fileInfo.size) }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item label="最后修改">
                    {{ formatDate(fileInfo.lastModified) }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item v-if="fileInfo.encoding" label="文件编码">
                    {{ fileInfo.encoding }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item v-if="previewData.wordCount" label="总字数">
                    {{ previewData.wordCount.toLocaleString() }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item v-if="previewData.chapterCount" label="章节数量">
                    {{ previewData.chapterCount }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item v-if="previewData.author" label="作者">
                    {{ previewData.author }}
                  </el-descriptions-item>
                  
                  <el-descriptions-item v-if="previewData.description" label="简介" :span="2">
                    <div class="description-text">
                      {{ previewData.description }}
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="loading || error"
          @click="handleConfirm"
        >
          确认导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Reading,
  Refresh,
  MoreFilled,
  ArrowRight
} from '@element-plus/icons-vue'
import { services } from '../../services/index.js'
import { commonUtils } from '../../utils/index.js'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  },
  previewLimit: {
    type: Number,
    default: 5000 // 预览字符数限制
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'confirm',
  'cancel'
])

// 响应式数据
const dialogVisible = ref(false)
const loading = ref(false)
const error = ref('')
const activeTab = ref('content')
const previewData = ref({})
const fileInfo = ref({})

// 计算属性
const previewParagraphs = computed(() => {
  if (!previewData.value.content) return []
  
  const content = previewData.value.content
  const paragraphs = content.split('\n').filter(p => p.trim())
  
  return paragraphs.map(text => {
    // 简单的章节检测
    const isChapter = /^(第[\d一二三四五六七八九十百千万]+[章回节]|Chapter\s*\d+|[\d]+\.|序章|楔子|后记|尾声)/i.test(text.trim())
    
    return {
      text: text.trim(),
      isChapter
    }
  })
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.file) {
    loadPreview()
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 方法
const loadPreview = async () => {
  if (!props.file) return
  
  try {
    loading.value = true
    error.value = ''
    
    // 设置文件信息
    fileInfo.value = {
      name: props.file.name,
      size: props.file.size,
      format: props.file.format,
      encoding: props.file.encoding,
      lastModified: props.file.lastModified || props.file.file?.lastModified
    }
    
    // 加载预览数据
    const preview = await services.import.previewFile(props.file.file, {
      limit: props.previewLimit,
      includeChapters: true,
      includeMeta: true
    })
    
    previewData.value = preview
    
    // 如果有章节信息，默认显示章节列表
    if (preview.chapters && preview.chapters.length > 0) {
      await nextTick()
      // 可以选择默认显示章节列表
      // activeTab.value = 'chapters'
    }
    
  } catch (err) {
    console.error('加载预览失败:', err)
    error.value = err.message || '加载预览失败'
  } finally {
    loading.value = false
  }
}

const retryPreview = () => {
  loadPreview()
}

const previewChapter = (chapter) => {
  // 可以在这里实现章节预览功能
  ElMessage.info(`预览章节: ${chapter.title}`)
}

const getFormatTagType = (format) => {
  switch (format) {
    case 'TXT':
      return 'primary'
    case 'EPUB':
      return 'success'
    default:
      return 'info'
  }
}

const formatFileSize = (size) => {
  return commonUtils.formatFileSize(size)
}

const formatDate = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleClose = () => {
  dialogVisible.value = false
  emit('cancel')
}

const handleConfirm = () => {
  dialogVisible.value = false
  emit('confirm', true)
}

// 暴露方法
defineExpose({
  loadPreview,
  retryPreview
})
</script>

<style scoped>
.file-preview-dialog {
  --preview-border-color: var(--el-border-color-lighter);
}

.preview-loading {
  padding: 20px;
}

.preview-error {
  padding: 20px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  height: 70vh;
  min-height: 500px;
}

.file-info {
  margin-bottom: 16px;
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--preview-border-color);
}

.file-info__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.file-info__title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-info__icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.file-info__name {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.file-info__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.meta-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.content-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-tabs :deep(.el-tabs__content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.preview-tabs :deep(.el-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-text {
  flex: 1;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  overflow-y: auto;
  font-family: 'Microsoft YaHei', sans-serif;
  line-height: 1.8;
}

.content-paragraph {
  margin-bottom: 12px;
  text-indent: 2em;
  color: var(--el-text-color-primary);
}

.content-paragraph--chapter {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-color-primary);
  text-indent: 0;
  margin: 20px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--preview-border-color);
}

.content-truncated {
  margin-top: 20px;
  text-align: center;
}

.content-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chapters-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chapters-header {
  padding: 12px 16px;
  background-color: var(--el-bg-color-page);
  border-bottom: 1px solid var(--preview-border-color);
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.chapters-list {
  flex: 1;
  overflow-y: auto;
}

.chapter-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--preview-border-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chapter-item:hover {
  background-color: var(--el-bg-color-page);
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.chapter-arrow {
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}

.details-view {
  padding: 16px;
}

.description-text {
  max-height: 100px;
  overflow-y: auto;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .file-preview-dialog {
    width: 95% !important;
  }
  
  .preview-content {
    height: 60vh;
  }
  
  .file-info__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .file-info__meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .content-text {
    padding: 12px;
    font-size: 14px;
  }
  
  .chapter-item {
    padding: 8px 12px;
  }
}

/* 滚动条样式 */
.content-text::-webkit-scrollbar,
.chapters-list::-webkit-scrollbar {
  width: 6px;
}

.content-text::-webkit-scrollbar-track,
.chapters-list::-webkit-scrollbar-track {
  background: var(--el-bg-color-page);
}

.content-text::-webkit-scrollbar-thumb,
.chapters-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.content-text::-webkit-scrollbar-thumb:hover,
.chapters-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>