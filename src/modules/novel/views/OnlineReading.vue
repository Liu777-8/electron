<template>
  <div class="online-reading-page">
    <!-- 页面头部 -->
    <div class="page-header" v-show="!isFullscreen && !stealthMode">
      <div class="header-left">
        <button class="back-btn" @click="$router.go(-1)" title="返回">
          <i class="icon-arrow-left"></i>
        </button>
        <h1 class="page-title">在线阅读</h1>
      </div>
      
      <div class="header-right">
        <div class="reading-stats">
          <div class="stat-item">
            <span class="stat-label">今日阅读:</span>
            <span class="stat-value">{{ todayReadingTime }}分钟</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">收藏网站:</span>
            <span class="stat-value">{{ bookmarks.length }}个</span>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="action-btn" @click="showBookmarkManager = true" title="书签管理">
            <i class="icon-bookmark"></i>
          </button>
          <button class="action-btn" @click="showHistory = true" title="浏览历史">
            <i class="icon-history"></i>
          </button>
          <button class="action-btn" @click="toggleStealthMode" :class="{ active: stealthMode }" title="摸鱼模式">
            <i class="icon-stealth"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- 在线浏览器 -->
    <div class="browser-container">
      <OnlineBrowser 
        :initial-url="initialUrl"
        :stealth-mode="stealthMode"
        @url-change="handleUrlChange"
        @title-change="handleTitleChange"
        @content-extract="handleContentExtract"
        @bookmark-add="handleBookmarkAdd"
        @stealth-toggle="handleStealthToggle"
      />
    </div>

    <!-- 书签管理对话框 -->
    <div class="bookmark-manager" v-if="showBookmarkManager" @click.self="showBookmarkManager = false">
      <div class="manager-content">
        <div class="manager-header">
          <h3>书签管理</h3>
          <button class="close-btn" @click="showBookmarkManager = false">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <div class="manager-body">
          <div class="bookmark-categories">
            <button 
              class="category-btn" 
              v-for="category in bookmarkCategories" 
              :key="category.key"
              :class="{ active: selectedCategory === category.key }"
              @click="selectedCategory = category.key"
            >
              {{ category.name }} ({{ getCategoryCount(category.key) }})
            </button>
          </div>
          
          <div class="bookmark-list">
            <div class="bookmark-search">
              <input 
                type="text" 
                v-model="bookmarkSearchQuery" 
                placeholder="搜索书签..."
                class="search-input"
              >
            </div>
            
            <div class="bookmark-items">
              <div 
                class="bookmark-item" 
                v-for="bookmark in filteredBookmarks" 
                :key="bookmark.id"
                @click="navigateToBookmark(bookmark)"
              >
                <div class="bookmark-info">
                  <div class="bookmark-title">{{ bookmark.name }}</div>
                  <div class="bookmark-url">{{ bookmark.url }}</div>
                  <div class="bookmark-meta">
                    <span class="bookmark-category">{{ getCategoryName(bookmark.category) }}</span>
                    <span class="bookmark-time">{{ formatTime(bookmark.createdAt) }}</span>
                  </div>
                </div>
                <div class="bookmark-actions">
                  <button class="action-btn" @click.stop="editBookmark(bookmark)" title="编辑">
                    <i class="icon-edit"></i>
                  </button>
                  <button class="action-btn delete-btn" @click.stop="deleteBookmark(bookmark.id)" title="删除">
                    <i class="icon-delete"></i>
                  </button>
                </div>
              </div>
              
              <div class="empty-state" v-if="filteredBookmarks.length === 0">
                <i class="icon-bookmark-empty"></i>
                <p>暂无书签</p>
                <small>在浏览网页时添加书签</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 浏览历史对话框 -->
    <div class="history-manager" v-if="showHistory" @click.self="showHistory = false">
      <div class="manager-content">
        <div class="manager-header">
          <h3>浏览历史</h3>
          <div class="header-actions">
            <button class="action-btn" @click="clearHistory" title="清空历史">
              <i class="icon-clear"></i>
              清空
            </button>
            <button class="close-btn" @click="showHistory = false">
              <i class="icon-close"></i>
            </button>
          </div>
        </div>
        
        <div class="manager-body">
          <div class="history-search">
            <input 
              type="text" 
              v-model="historySearchQuery" 
              placeholder="搜索历史记录..."
              class="search-input"
            >
          </div>
          
          <div class="history-list">
            <div class="history-group" v-for="group in groupedHistory" :key="group.date">
              <div class="group-header">{{ group.date }}</div>
              <div 
                class="history-item" 
                v-for="item in group.items" 
                :key="item.id"
                @click="navigateToHistory(item)"
              >
                <div class="history-info">
                  <div class="history-title">{{ item.title || item.url }}</div>
                  <div class="history-url">{{ item.url }}</div>
                  <div class="history-time">{{ formatTime(item.visitedAt) }}</div>
                </div>
                <div class="history-actions">
                  <button class="action-btn" @click.stop="addBookmarkFromHistory(item)" title="添加书签">
                    <i class="icon-bookmark-add"></i>
                  </button>
                  <button class="action-btn delete-btn" @click.stop="deleteHistoryItem(item.id)" title="删除">
                    <i class="icon-delete"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="empty-state" v-if="filteredHistory.length === 0">
              <i class="icon-history-empty"></i>
              <p>暂无浏览历史</p>
              <small>开始浏览网页后会显示历史记录</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 内容保存对话框 -->
    <div class="save-content-dialog" v-if="showSaveDialog" @click.self="showSaveDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>保存为小说</h3>
          <button class="close-btn" @click="showSaveDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="content-preview">
            <div class="preview-info">
              <div class="info-item">
                <label>标题:</label>
                <input type="text" v-model="saveContent.title" placeholder="小说标题">
              </div>
              <div class="info-item">
                <label>作者:</label>
                <input type="text" v-model="saveContent.author" placeholder="作者名称">
              </div>
              <div class="info-item">
                <label>分类:</label>
                <select v-model="saveContent.category">
                  <option value="fantasy">玄幻</option>
                  <option value="romance">言情</option>
                  <option value="urban">都市</option>
                  <option value="history">历史</option>
                  <option value="scifi">科幻</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div class="info-item">
                <label>字数:</label>
                <span>{{ saveContent.wordCount }}</span>
              </div>
            </div>
            <div class="content-text">
              <textarea v-model="saveContent.content" rows="10" readonly></textarea>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showSaveDialog = false">取消</button>
          <button class="btn btn-primary" @click="saveAsNovel">保存</button>
        </div>
      </div>
    </div>

    <!-- 摸鱼模式提示 -->
    <div class="stealth-indicator" v-show="stealthMode">
      <div class="indicator-content">
        <i class="icon-stealth"></i>
        <span>摸鱼模式已启用</span>
        <button class="exit-stealth" @click="toggleStealthMode">退出</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { OnlineBrowser } from '../components/online'
import { useNovelStore } from '../stores/novel.js'
import { useSettingsStore } from '../stores/settings.js'

export default {
  name: 'OnlineReading',
  components: {
    OnlineBrowser
  },
  setup() {
    const router = useRouter()
    const onlineStore = useOnlineStore()
    const novelStore = useNovelStore()
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const initialUrl = ref('https://www.baidu.com')
    const currentUrl = ref('')
    const currentTitle = ref('')
    const isFullscreen = ref(false)
    const stealthMode = ref(false)
    
    // 对话框状态
    const showBookmarkManager = ref(false)
    const showHistory = ref(false)
    const showSaveDialog = ref(false)
    
    // 书签管理
    const bookmarks = ref([])
    const selectedCategory = ref('all')
    const bookmarkSearchQuery = ref('')
    
    const bookmarkCategories = ref([
      { key: 'all', name: '全部' },
      { key: 'novel', name: '小说网站' },
      { key: 'reading', name: '阅读工具' },
      { key: 'other', name: '其他' }
    ])
    
    // 浏览历史
    const history = ref([])
    const historySearchQuery = ref('')
    
    // 内容保存
    const saveContent = ref({
      title: '',
      author: '',
      category: 'other',
      content: '',
      wordCount: 0,
      url: ''
    })
    
    // 统计数据
    const todayReadingTime = ref(0)
    
    // 计算属性
    const filteredBookmarks = computed(() => {
      let filtered = bookmarks.value
      
      if (selectedCategory.value !== 'all') {
        filtered = filtered.filter(bookmark => bookmark.category === selectedCategory.value)
      }
      
      if (bookmarkSearchQuery.value) {
        const query = bookmarkSearchQuery.value.toLowerCase()
        filtered = filtered.filter(bookmark => 
          bookmark.name.toLowerCase().includes(query) ||
          bookmark.url.toLowerCase().includes(query)
        )
      }
      
      return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })
    
    const filteredHistory = computed(() => {
      let filtered = history.value
      
      if (historySearchQuery.value) {
        const query = historySearchQuery.value.toLowerCase()
        filtered = filtered.filter(item => 
          (item.title && item.title.toLowerCase().includes(query)) ||
          item.url.toLowerCase().includes(query)
        )
      }
      
      return filtered.sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt))
    })
    
    const groupedHistory = computed(() => {
      const groups = {}
      
      filteredHistory.value.forEach(item => {
        const date = new Date(item.visitedAt).toLocaleDateString()
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(item)
      })
      
      return Object.keys(groups).map(date => ({
        date,
        items: groups[date]
      }))
    })
    
    // 方法
    const handleUrlChange = (url) => {
      currentUrl.value = url
      addToHistory(url, currentTitle.value)
    }
    
    const handleTitleChange = (title) => {
      currentTitle.value = title
    }
    
    const handleContentExtract = (content) => {
      if (content.action === 'save') {
        saveContent.value = {
          title: content.title || '',
          author: '',
          category: 'other',
          content: content.content || '',
          wordCount: content.wordCount || 0,
          url: content.url || currentUrl.value
        }
        showSaveDialog.value = true
      }
    }
    
    const handleBookmarkAdd = (bookmark) => {
      addBookmark(bookmark)
    }
    
    const handleStealthToggle = () => {
      toggleStealthMode()
    }
    
    const toggleStealthMode = () => {
      stealthMode.value = !stealthMode.value
      settingsStore.updateOnlineSettings({ stealthMode: stealthMode.value })
    }
    
    // 书签管理
    const addBookmark = (bookmark) => {
      const newBookmark = {
        id: Date.now(),
        name: bookmark.name || currentTitle.value || 'Untitled',
        url: bookmark.url || currentUrl.value,
        category: bookmark.category || 'other',
        title: bookmark.title || currentTitle.value,
        createdAt: new Date().toISOString()
      }
      
      bookmarks.value.push(newBookmark)
      saveBookmarks()
    }
    
    const editBookmark = (bookmark) => {
      const name = prompt('书签名称:', bookmark.name)
      if (name !== null) {
        bookmark.name = name
        saveBookmarks()
      }
    }
    
    const deleteBookmark = (bookmarkId) => {
      if (confirm('确定要删除这个书签吗？')) {
        bookmarks.value = bookmarks.value.filter(b => b.id !== bookmarkId)
        saveBookmarks()
      }
    }
    
    const navigateToBookmark = (bookmark) => {
      initialUrl.value = bookmark.url
      showBookmarkManager.value = false
    }
    
    const getCategoryCount = (categoryKey) => {
      if (categoryKey === 'all') {
        return bookmarks.value.length
      }
      return bookmarks.value.filter(b => b.category === categoryKey).length
    }
    
    const getCategoryName = (categoryKey) => {
      const category = bookmarkCategories.value.find(c => c.key === categoryKey)
      return category ? category.name : '其他'
    }
    
    // 历史记录管理
    const addToHistory = (url, title) => {
      const existingIndex = history.value.findIndex(item => item.url === url)
      
      if (existingIndex !== -1) {
        // 更新现有记录的访问时间
        history.value[existingIndex].visitedAt = new Date().toISOString()
        if (title) {
          history.value[existingIndex].title = title
        }
      } else {
        // 添加新记录
        history.value.unshift({
          id: Date.now(),
          url,
          title: title || '',
          visitedAt: new Date().toISOString()
        })
        
        // 限制历史记录数量
        if (history.value.length > 1000) {
          history.value = history.value.slice(0, 1000)
        }
      }
      
      saveHistory()
    }
    
    const navigateToHistory = (item) => {
      initialUrl.value = item.url
      showHistory.value = false
    }
    
    const addBookmarkFromHistory = (item) => {
      const bookmark = {
        name: item.title || item.url,
        url: item.url,
        category: 'other',
        title: item.title
      }
      addBookmark(bookmark)
    }
    
    const deleteHistoryItem = (itemId) => {
      if (confirm('确定要删除这条历史记录吗？')) {
        history.value = history.value.filter(item => item.id !== itemId)
        saveHistory()
      }
    }
    
    const clearHistory = () => {
      if (confirm('确定要清空所有浏览历史吗？')) {
        history.value = []
        saveHistory()
      }
    }
    
    // 内容保存
    const saveAsNovel = async () => {
      if (!saveContent.value.title || !saveContent.value.content) {
        alert('请填写标题和内容')
        return
      }
      
      try {
        const novelData = {
          title: saveContent.value.title,
          author: saveContent.value.author || '未知作者',
          category: saveContent.value.category,
          content: saveContent.value.content,
          wordCount: saveContent.value.wordCount,
          source: 'online',
          sourceUrl: saveContent.value.url,
          createdAt: new Date().toISOString(),
          chapters: [{
            id: 1,
            title: '第一章',
            content: saveContent.value.content,
            wordCount: saveContent.value.wordCount
          }]
        }
        
        await novelStore.addNovel(novelData)
        
        showSaveDialog.value = false
        alert('小说保存成功！')
      } catch (error) {
        console.error('保存小说失败:', error)
        alert('保存失败，请重试')
      }
    }
    
    // 工具函数
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
      } else {
        return date.toLocaleDateString()
      }
    }
    
    // 数据持久化
    const saveBookmarks = () => {
      localStorage.setItem('novel-bookmarks', JSON.stringify(bookmarks.value))
    }
    
    const loadBookmarks = () => {
      const saved = localStorage.getItem('novel-bookmarks')
      if (saved) {
        bookmarks.value = JSON.parse(saved)
      }
    }
    
    const saveHistory = () => {
      localStorage.setItem('novel-history', JSON.stringify(history.value))
    }
    
    const loadHistory = () => {
      const saved = localStorage.getItem('novel-history')
      if (saved) {
        history.value = JSON.parse(saved)
      }
    }
    
    const updateReadingTime = () => {
      // 更新今日阅读时间
      const today = new Date().toDateString()
      const savedTime = localStorage.getItem(`reading-time-${today}`)
      todayReadingTime.value = savedTime ? parseInt(savedTime) : 0
      
      // 每分钟增加阅读时间
      setInterval(() => {
        todayReadingTime.value += 1
        localStorage.setItem(`reading-time-${today}`, todayReadingTime.value.toString())
      }, 60000)
    }
    
    // 生命周期
    onMounted(() => {
      loadBookmarks()
      loadHistory()
      updateReadingTime()
      
      // 监听全屏状态
      const handleFullscreenChange = () => {
        isFullscreen.value = !!document.fullscreenElement
      }
      
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      
      // 加载设置
      const settings = settingsStore.onlineSettings
      stealthMode.value = settings.stealthMode || false
    })
    
    onUnmounted(() => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    })
    
    return {
      initialUrl,
      currentUrl,
      currentTitle,
      isFullscreen,
      stealthMode,
      showBookmarkManager,
      showHistory,
      showSaveDialog,
      bookmarks,
      selectedCategory,
      bookmarkSearchQuery,
      bookmarkCategories,
      history,
      historySearchQuery,
      saveContent,
      todayReadingTime,
      filteredBookmarks,
      filteredHistory,
      groupedHistory,
      handleUrlChange,
      handleTitleChange,
      handleContentExtract,
      handleBookmarkAdd,
      handleStealthToggle,
      toggleStealthMode,
      addBookmark,
      editBookmark,
      deleteBookmark,
      navigateToBookmark,
      getCategoryCount,
      getCategoryName,
      navigateToHistory,
      addBookmarkFromHistory,
      deleteHistoryItem,
      clearHistory,
      saveAsNovel,
      formatTime
    }
  }
}
</script>

<style scoped>
.online-reading-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f0f0f0;
  border-color: #007bff;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.reading-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #007bff;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f0f0f0;
  border-color: #007bff;
}

.action-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.browser-container {
  flex: 1;
  overflow: hidden;
}

.bookmark-manager,
.history-manager,
.save-content-dialog {
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

.manager-content,
.dialog-content {
  width: 800px;
  max-width: 90vw;
  height: 600px;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.manager-header,
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.manager-header h3,
.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.manager-body,
.dialog-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.bookmark-categories {
  width: 200px;
  padding: 16px;
  border-right: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.category-btn {
  display: block;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 4px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #666;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  transition: all 0.2s ease;
}

.category-btn:hover {
  background: #e9ecef;
}

.category-btn.active {
  background: #007bff;
  color: white;
}

.bookmark-list,
.history-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bookmark-search,
.history-search {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.search-input:focus {
  border-color: #007bff;
}

.bookmark-items,
.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.bookmark-item,
.history-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f5f5f5;
}

.bookmark-item:hover,
.history-item:hover {
  background: #f8f9fa;
}

.bookmark-info,
.history-info {
  flex: 1;
  min-width: 0;
}

.bookmark-title,
.history-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-url,
.history-url {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bookmark-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #999;
}

.bookmark-category {
  padding: 2px 6px;
  background: #e9ecef;
  border-radius: 3px;
  font-size: 10px;
}

.history-time {
  font-size: 11px;
  color: #999;
}

.bookmark-actions,
.history-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.delete-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.history-group {
  margin-bottom: 16px;
}

.group-header {
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  position: sticky;
  top: 0;
  z-index: 1;
}

.content-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.preview-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.info-item input,
.info-item select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.info-item input:focus,
.info-item select:focus {
  border-color: #007bff;
}

.content-text {
  flex: 1;
}

.content-text textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
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

.stealth-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  z-index: 9999;
}

.exit-stealth {
  padding: 4px 8px;
  border: none;
  border-radius: 3px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.2s ease;
}

.exit-stealth:hover {
  background: #0056b3;
}

/* 图标样式 */
.icon-arrow-left::before { content: '←'; }
.icon-bookmark::before { content: '🔖'; }
.icon-history::before { content: '📜'; }
.icon-stealth::before { content: '👁️'; }
.icon-close::before { content: '×'; }
.icon-edit::before { content: '✏️'; }
.icon-delete::before { content: '🗑️'; }
.icon-clear::before { content: '🧹'; }
.icon-bookmark-add::before { content: '⭐'; }
.icon-bookmark-empty::before { content: '🔖'; }
.icon-history-empty::before { content: '📜'; }

/* 滚动条样式 */
.bookmark-items::-webkit-scrollbar,
.history-list::-webkit-scrollbar,
.content-text textarea::-webkit-scrollbar {
  width: 6px;
}

.bookmark-items::-webkit-scrollbar-track,
.history-list::-webkit-scrollbar-track,
.content-text textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.bookmark-items::-webkit-scrollbar-thumb,
.history-list::-webkit-scrollbar-thumb,
.content-text textarea::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.bookmark-items::-webkit-scrollbar-thumb:hover,
.history-list::-webkit-scrollbar-thumb:hover,
.content-text textarea::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
  }
  
  .reading-stats {
    display: none;
  }
  
  .manager-content,
  .dialog-content {
    width: 95vw;
    height: 90vh;
  }
  
  .bookmark-categories {
    width: 150px;
  }
  
  .preview-info {
    grid-template-columns: 1fr;
  }
}

/* 暗色主题 */
.dark-theme .online-reading-page {
  background: #1a1a1a;
}

.dark-theme .page-header {
  background: #2a2a2a;
  border-bottom-color: #444;
}

.dark-theme .page-title {
  color: #fff;
}

.dark-theme .back-btn,
.dark-theme .action-btn {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark-theme .manager-content,
.dark-theme .dialog-content {
  background: #2a2a2a;
}

.dark-theme .manager-header,
.dark-theme .dialog-header,
.dark-theme .dialog-footer {
  background: #333;
  border-color: #444;
}

.dark-theme .bookmark-categories {
  background: #333;
  border-right-color: #444;
}

.dark-theme .category-btn {
  color: #ccc;
}

.dark-theme .category-btn:hover {
  background: #444;
}

.dark-theme .search-input,
.dark-theme .info-item input,
.dark-theme .info-item select,
.dark-theme .content-text textarea {
  background: #333;
  border-color: #555;
  color: #ccc;
}
</style>