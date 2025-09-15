/**
 * 阅读器组件统一入口
 * 整合所有阅读器相关组件
 */

// 导入阅读器组件
import ReaderWindow from './ReaderWindow.vue'
import ReaderToolbar from './ReaderToolbar.vue'
import ReaderSidebar from './ReaderSidebar.vue'

// 导出所有组件
export {
  ReaderWindow,
  ReaderToolbar,
  ReaderSidebar
}

// 默认导出主要组件
export default ReaderWindow

/**
 * 组件使用说明：
 * 
 * 1. ReaderWindow - 主要的阅读器窗口组件
 *    - 包含完整的阅读界面
 *    - 支持文本显示、翻页、设置等功能
 *    - 可以独立使用或与其他组件组合
 * 
 * 2. ReaderToolbar - 阅读器工具栏组件
 *    - 提供阅读控制功能
 *    - 包含字体设置、主题切换、章节导航等
 *    - 支持摸鱼模式设置
 * 
 * 3. ReaderSidebar - 阅读器侧边栏组件
 *    - 提供章节目录、书签、笔记功能
 *    - 支持搜索和快速导航
 *    - 可折叠显示
 * 
 * 使用示例：
 * 
 * ```vue
 * <template>
 *   <div class="reader-container">
 *     <!-- 完整阅读器 -->
 *     <ReaderWindow 
 *       :novel="currentNovel"
 *       :chapter="currentChapter"
 *       @chapter-change="handleChapterChange"
 *     />
 *     
 *     <!-- 或者分别使用各个组件 -->
 *     <ReaderToolbar 
 *       :visible="showToolbar"
 *       :novel-title="novel.title"
 *       :chapter-title="chapter.title"
 *       @settings-change="handleSettingsChange"
 *     />
 *     
 *     <ReaderSidebar 
 *       :visible="showSidebar"
 *       :chapters="novel.chapters"
 *       :bookmarks="bookmarks"
 *       :notes="notes"
 *       @chapter-select="handleChapterSelect"
 *     />
 *   </div>
 * </template>
 * 
 * <script>
 * import { ReaderWindow, ReaderToolbar, ReaderSidebar } from '@/modules/novel/components/reader'
 * 
 * export default {
 *   components: {
 *     ReaderWindow,
 *     ReaderToolbar,
 *     ReaderSidebar
 *   },
 *   // ...
 * }
 * </script>
 * ```
 * 
 * 组件特性：
 * 
 * - 响应式设计，支持不同屏幕尺寸
 * - 支持多种主题（日间、夜间、护眼等）
 * - 丰富的阅读设置选项
 * - 完整的书签和笔记功能
 * - 摸鱼模式支持
 * - 键盘快捷键支持
 * - 自动保存阅读进度
 * - 章节预加载优化
 */

/**
 * 组件依赖关系：
 * 
 * ReaderWindow (主组件)
 * ├── ReaderToolbar (工具栏)
 * └── ReaderSidebar (侧边栏)
 * 
 * 数据流：
 * - 父组件传递小说数据和章节信息
 * - 子组件通过事件向上传递用户操作
 * - 使用 Pinia store 管理全局状态
 * - 本地存储保存用户设置和阅读进度
 */

/**
 * 性能优化：
 * 
 * 1. 虚拟滚动 - 处理长文本内容
 * 2. 章节预加载 - 提升翻页体验
 * 3. 图片懒加载 - 减少内存占用
 * 4. 防抖处理 - 优化设置更新
 * 5. 组件懒加载 - 按需加载功能
 */

/**
 * 扩展性：
 * 
 * 组件设计采用插槽和事件机制，便于扩展：
 * - 可以添加新的工具栏按钮
 * - 可以扩展侧边栏功能
 * - 可以自定义阅读器主题
 * - 可以集成第三方插件
 */