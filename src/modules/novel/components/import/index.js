/**
 * 小说导入组件模块
 * 提供文件选择、预览、导入进度等功能组件
 */

// 导入组件
import FileSelector from './FileSelector.vue'
import FilePreviewDialog from './FilePreviewDialog.vue'
import ImportProgressDialog from './ImportProgressDialog.vue'

// 导出组件
export {
  FileSelector,
  FilePreviewDialog,
  ImportProgressDialog
}

// 默认导出
export default {
  FileSelector,
  FilePreviewDialog,
  ImportProgressDialog
}

/**
 * 组件使用说明
 * 
 * FileSelector - 文件选择器组件
 * 功能：
 * - 拖拽上传文件
 * - 点击选择文件/文件夹
 * - 文件格式验证
 * - 批量文件管理
 * - 自动导入支持
 * 
 * 使用示例：
 * <FileSelector
 *   :max-files="50"
 *   :max-file-size="100 * 1024 * 1024"
 *   :supported-formats="['TXT', 'EPUB']"
 *   :auto-import="false"
 *   @files-selected="handleFilesSelected"
 *   @import-complete="handleImportComplete"
 * />
 * 
 * FilePreviewDialog - 文件预览对话框
 * 功能：
 * - 文件内容预览
 * - 章节列表显示
 * - 文件详情查看
 * - 导入前确认
 * 
 * 使用示例：
 * <FilePreviewDialog
 *   v-model="showPreview"
 *   :file="selectedFile"
 *   :preview-limit="5000"
 *   @confirm="handlePreviewConfirm"
 * />
 * 
 * ImportProgressDialog - 导入进度对话框
 * 功能：
 * - 实时导入进度显示
 * - 文件状态跟踪
 * - 错误处理和重试
 * - 操作日志记录
 * 
 * 使用示例：
 * <ImportProgressDialog
 *   v-model="showProgress"
 *   :files="importFiles"
 *   :importing="isImporting"
 *   :current-file="currentFile"
 *   :progress="progressData"
 *   @cancel="handleCancel"
 *   @retry="handleRetry"
 * />
 */