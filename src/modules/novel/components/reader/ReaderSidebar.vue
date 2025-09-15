<template>
  <div class="reader-sidebar" :class="{ 'sidebar-hidden': !visible }">
    <!-- 侧边栏头部 -->
    <div class="sidebar-header">
      <div class="sidebar-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'chapters' }"
          @click="activeTab = 'chapters'"
        >
          目录
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'bookmarks' }"
          @click="activeTab = 'bookmarks'"
        >
          书签
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          笔记
        </button>
      </div>
      <button class="close-btn" @click="$emit('close')">
        <i class="icon-close"></i>
      </button>
    </div>

    <!-- 侧边栏内容 -->
    <div class="sidebar-content">
      <!-- 章节目录 -->
      <div class="tab-content" v-show="activeTab === 'chapters'">
        <div class="search-box">
          <input 
            type="text" 
            v-model="chapterSearchQuery" 
            placeholder="搜索章节..."
            class="search-input"
          >
          <i class="icon-search"></i>
        </div>
        
        <div class="chapter-list" ref="chapterListRef">
          <div 
            class="chapter-item" 
            v-for="(chapter, index) in filteredChapters" 
            :key="chapter.id"
            :class="{ 
              active: chapter.id === currentChapterId,
              read: chapter.isRead,
              downloading: chapter.isDownloading
            }"
            @click="selectChapter(chapter)"
          >
            <div class="chapter-info">
              <div class="chapter-title">{{ chapter.title }}</div>
              <div class="chapter-meta">
                <span class="chapter-index">第{{ index + 1 }}章</span>
                <span class="chapter-length" v-if="chapter.wordCount">
                  {{ formatWordCount(chapter.wordCount) }}
                </span>
                <span class="chapter-progress" v-if="chapter.progress > 0">
                  {{ Math.round(chapter.progress) }}%
                </span>
              </div>
            </div>
            
            <div class="chapter-actions">
              <button 
                class="action-btn" 
                v-if="!chapter.isDownloaded && !chapter.isDownloading"
                @click.stop="downloadChapter(chapter)"
                title="下载章节"
              >
                <i class="icon-download"></i>
              </button>
              <div class="loading-spinner" v-if="chapter.isDownloading"></div>
              <i class="icon-check" v-if="chapter.isDownloaded"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 书签列表 -->
      <div class="tab-content" v-show="activeTab === 'bookmarks'">
        <div class="bookmark-list">
          <div 
            class="bookmark-item" 
            v-for="bookmark in bookmarks" 
            :key="bookmark.id"
            @click="goToBookmark(bookmark)"
          >
            <div class="bookmark-info">
              <div class="bookmark-chapter">{{ bookmark.chapterTitle }}</div>
              <div class="bookmark-content">{{ bookmark.content }}</div>
              <div class="bookmark-time">{{ formatTime(bookmark.createdAt) }}</div>
            </div>
            <div class="bookmark-actions">
              <button 
                class="action-btn" 
                @click.stop="editBookmark(bookmark)"
                title="编辑书签"
              >
                <i class="icon-edit"></i>
              </button>
              <button 
                class="action-btn delete-btn" 
                @click.stop="deleteBookmark(bookmark.id)"
                title="删除书签"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
          </div>
          
          <div class="empty-state" v-if="bookmarks.length === 0">
            <i class="icon-bookmark-empty"></i>
            <p>暂无书签</p>
            <small>在阅读时点击书签按钮添加书签</small>
          </div>
        </div>
      </div>

      <!-- 笔记列表 -->
      <div class="tab-content" v-show="activeTab === 'notes'">
        <div class="notes-header">
          <button class="add-note-btn" @click="showAddNoteDialog = true">
            <i class="icon-plus"></i>
            添加笔记
          </button>
        </div>
        
        <div class="note-list">
          <div 
            class="note-item" 
            v-for="note in notes" 
            :key="note.id"
            @click="goToNote(note)"
          >
            <div class="note-info">
              <div class="note-title">{{ note.title || '无标题' }}</div>
              <div class="note-content">{{ note.content }}</div>
              <div class="note-meta">
                <span class="note-chapter">{{ note.chapterTitle }}</span>
                <span class="note-time">{{ formatTime(note.createdAt) }}</span>
              </div>
            </div>
            <div class="note-actions">
              <button 
                class="action-btn" 
                @click.stop="editNote(note)"
                title="编辑笔记"
              >
                <i class="icon-edit"></i>
              </button>
              <button 
                class="action-btn delete-btn" 
                @click.stop="deleteNote(note.id)"
                title="删除笔记"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
          </div>
          
          <div class="empty-state" v-if="notes.length === 0">
            <i class="icon-note-empty"></i>
            <p>暂无笔记</p>
            <small>选中文本后可以添加笔记</small>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加笔记对话框 -->
    <div class="note-dialog" v-if="showAddNoteDialog" @click.self="showAddNoteDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>添加笔记</h3>
          <button class="close-btn" @click="showAddNoteDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>标题</label>
            <input type="text" v-model="newNote.title" placeholder="笔记标题（可选）">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="newNote.content" placeholder="笔记内容" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>标签</label>
            <input type="text" v-model="newNote.tags" placeholder="用逗号分隔多个标签">
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showAddNoteDialog = false">取消</button>
          <button class="btn btn-primary" @click="addNote">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useReaderStore } from '../../stores/reader.js'
import { useNovelStore } from '../../stores/novel.js'

export default {
  name: 'ReaderSidebar',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentChapterId: {
      type: [String, Number],
      default: null
    },
    chapters: {
      type: Array,
      default: () => []
    },
    bookmarks: {
      type: Array,
      default: () => []
    },
    notes: {
      type: Array,
      default: () => []
    }
  },
  emits: [
    'close',
    'chapter-select',
    'bookmark-select',
    'note-select',
    'bookmark-add',
    'bookmark-edit',
    'bookmark-delete',
    'note-add',
    'note-edit',
    'note-delete',
    'chapter-download'
  ],
  setup(props, { emit }) {
    const readerStore = useReaderStore()
    const novelStore = useNovelStore()
    
    // 响应式数据
    const activeTab = ref('chapters')
    const chapterSearchQuery = ref('')
    const showAddNoteDialog = ref(false)
    const chapterListRef = ref(null)
    
    const newNote = ref({
      title: '',
      content: '',
      tags: ''
    })
    
    // 计算属性
    const filteredChapters = computed(() => {
      if (!chapterSearchQuery.value) {
        return props.chapters
      }
      
      const query = chapterSearchQuery.value.toLowerCase()
      return props.chapters.filter(chapter => 
        chapter.title.toLowerCase().includes(query)
      )
    })
    
    // 方法
    const selectChapter = (chapter) => {
      emit('chapter-select', chapter)
    }
    
    const downloadChapter = (chapter) => {
      emit('chapter-download', chapter)
    }
    
    const goToBookmark = (bookmark) => {
      emit('bookmark-select', bookmark)
    }
    
    const editBookmark = (bookmark) => {
      emit('bookmark-edit', bookmark)
    }
    
    const deleteBookmark = (bookmarkId) => {
      if (confirm('确定要删除这个书签吗？')) {
        emit('bookmark-delete', bookmarkId)
      }
    }
    
    const goToNote = (note) => {
      emit('note-select', note)
    }
    
    const editNote = (note) => {
      emit('note-edit', note)
    }
    
    const deleteNote = (noteId) => {
      if (confirm('确定要删除这个笔记吗？')) {
        emit('note-delete', noteId)
      }
    }
    
    const addNote = () => {
      if (!newNote.value.content.trim()) {
        alert('请输入笔记内容')
        return
      }
      
      const noteData = {
        title: newNote.value.title.trim(),
        content: newNote.value.content.trim(),
        tags: newNote.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        chapterId: props.currentChapterId,
        createdAt: new Date().toISOString()
      }
      
      emit('note-add', noteData)
      
      // 重置表单
      newNote.value = {
        title: '',
        content: '',
        tags: ''
      }
      showAddNoteDialog.value = false
    }
    
    const formatWordCount = (count) => {
      if (count < 1000) {
        return `${count}字`
      } else if (count < 10000) {
        return `${(count / 1000).toFixed(1)}k字`
      } else {
        return `${(count / 10000).toFixed(1)}万字`
      }
    }
    
    const formatTime = (timeString) => {
      const date = new Date(timeString)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`
      } else if (diff < 604800000) { // 1周内
        return `${Math.floor(diff / 86400000)}天前`
      } else {
        return date.toLocaleDateString()
      }
    }
    
    // 滚动到当前章节
    const scrollToCurrentChapter = () => {
      if (!chapterListRef.value || !props.currentChapterId) return
      
      nextTick(() => {
        const activeItem = chapterListRef.value.querySelector('.chapter-item.active')
        if (activeItem) {
          activeItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      })
    }
    
    // 监听器
    watch(() => props.visible, (visible) => {
      if (visible && activeTab.value === 'chapters') {
        scrollToCurrentChapter()
      }
    })
    
    watch(() => props.currentChapterId, () => {
      if (props.visible && activeTab.value === 'chapters') {
        scrollToCurrentChapter()
      }
    })
    
    watch(activeTab, (newTab) => {
      if (newTab === 'chapters') {
        scrollToCurrentChapter()
      }
    })
    
    return {
      activeTab,
      chapterSearchQuery,
      showAddNoteDialog,
      chapterListRef,
      newNote,
      filteredChapters,
      selectChapter,
      downloadChapter,
      goToBookmark,
      editBookmark,
      deleteBookmark,
      goToNote,
      editNote,
      deleteNote,
      addNote,
      formatWordCount,
      formatTime
    }
  }
}
</script>

<style scoped>
.reader-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 999;
  transform: translateX(0);
  transition: transform 0.3s ease;
}

.sidebar-hidden {
  transform: translateX(-100%);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.sidebar-tabs {
  display: flex;
  gap: 4px;
}

.tab-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: #e9ecef;
}

.tab-btn.active {
  background: #007bff;
  color: white;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
}

.sidebar-content {
  flex: 1;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-box {
  position: relative;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: #007bff;
}

.search-box .icon-search {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  pointer-events: none;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.chapter-item:hover {
  background: #f8f9fa;
}

.chapter-item.active {
  background: #e3f2fd;
  border-left-color: #007bff;
}

.chapter-item.read {
  opacity: 0.7;
}

.chapter-item.downloading {
  opacity: 0.6;
}

.chapter-info {
  flex: 1;
  min-width: 0;
}

.chapter-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #999;
}

.chapter-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e9ecef;
}

.delete-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.bookmark-list,
.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.bookmark-item,
.note-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.bookmark-item:hover,
.note-item:hover {
  background: #f8f9fa;
}

.bookmark-info,
.note-info {
  flex: 1;
  min-width: 0;
}

.bookmark-chapter,
.note-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-content,
.note-content {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bookmark-time,
.note-time {
  font-size: 11px;
  color: #999;
}

.note-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #999;
}

.note-chapter {
  font-size: 11px;
  color: #007bff;
}

.bookmark-actions,
.note-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.notes-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.add-note-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #007bff;
  border-radius: 6px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.add-note-btn:hover {
  background: #0056b3;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.empty-state small {
  font-size: 12px;
  opacity: 0.7;
}

.note-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.dialog-content {
  width: 400px;
  max-width: 90vw;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #007bff;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

/* 图标样式 */
.icon-close::before { content: '×'; }
.icon-search::before { content: '🔍'; }
.icon-download::before { content: '⬇️'; }
.icon-check::before { content: '✓'; }
.icon-edit::before { content: '✏️'; }
.icon-delete::before { content: '🗑️'; }
.icon-plus::before { content: '+'; }
.icon-bookmark-empty::before { content: '🔖'; }
.icon-note-empty::before { content: '📝'; }

/* 滚动条样式 */
.chapter-list::-webkit-scrollbar,
.bookmark-list::-webkit-scrollbar,
.note-list::-webkit-scrollbar {
  width: 6px;
}

.chapter-list::-webkit-scrollbar-track,
.bookmark-list::-webkit-scrollbar-track,
.note-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chapter-list::-webkit-scrollbar-thumb,
.bookmark-list::-webkit-scrollbar-thumb,
.note-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chapter-list::-webkit-scrollbar-thumb:hover,
.bookmark-list::-webkit-scrollbar-thumb:hover,
.note-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .reader-sidebar {
    width: 280px;
  }
  
  .dialog-content {
    width: 320px;
  }
}

/* 暗色主题 */
.dark-theme .reader-sidebar {
  background: #2a2a2a;
  border-right-color: #444;
}

.dark-theme .sidebar-header {
  background: #333;
  border-bottom-color: #444;
}

.dark-theme .tab-btn {
  color: #ccc;
}

.dark-theme .tab-btn:hover {
  background: #444;
}

.dark-theme .tab-btn.active {
  background: #007bff;
  color: white;
}

.dark-theme .search-input {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark-theme .chapter-item:hover,
.dark-theme .bookmark-item:hover,
.dark-theme .note-item:hover {
  background: #333;
}

.dark-theme .chapter-item.active {
  background: #1a365d;
}

.dark-theme .chapter-title,
.dark-theme .bookmark-chapter,
.dark-theme .note-title {
  color: #fff;
}

.dark-theme .dialog-content {
  background: #2a2a2a;
}

.dark-theme .dialog-header,
.dark-theme .dialog-footer {
  background: #333;
  border-color: #444;
}

.dark-theme .form-group input,
.dark-theme .form-group textarea {
  background: #333;
  border-color: #555;
  color: #ccc;
}
</style>