<template>
  <div class="online-browser" :class="{ 'stealth-mode': stealthMode }">
    <!-- 浏览器工具栏 -->
    <div class="browser-toolbar" v-show="!hideToolbar">
      <!-- 导航控制 -->
      <div class="nav-controls">
        <button class="nav-btn" @click="goBack" :disabled="!canGoBack" title="后退">
          <i class="icon-arrow-left"></i>
        </button>
        <button class="nav-btn" @click="goForward" :disabled="!canGoForward" title="前进">
          <i class="icon-arrow-right"></i>
        </button>
        <button class="nav-btn" @click="refresh" title="刷新">
          <i class="icon-refresh" :class="{ spinning: isLoading }"></i>
        </button>
        <button class="nav-btn" @click="goHome" title="首页">
          <i class="icon-home"></i>
        </button>
      </div>

      <!-- 地址栏 -->
      <div class="address-bar">
        <div class="url-input-container">
          <input 
            type="text" 
            v-model="currentUrl" 
            @keydown.enter="navigateToUrl"
            @focus="selectUrl"
            class="url-input"
            placeholder="输入网址或搜索内容..."
          >
          <button class="go-btn" @click="navigateToUrl" title="访问">
            <i class="icon-go"></i>
          </button>
        </div>
        
        <!-- 快速访问书签 -->
        <div class="quick-bookmarks">
          <button 
            class="bookmark-btn" 
            v-for="bookmark in quickBookmarks" 
            :key="bookmark.id"
            @click="navigateToUrl(bookmark.url)"
            :title="bookmark.title"
          >
            {{ bookmark.name }}
          </button>
        </div>
      </div>

      <!-- 功能控制 -->
      <div class="function-controls">
        <button class="control-btn" @click="toggleAutoScroll" :class="{ active: autoScrollEnabled }" title="自动滚动">
          <i class="icon-auto-scroll"></i>
        </button>
        <button class="control-btn" @click="toggleContentExtract" :class="{ active: contentExtractEnabled }" title="内容提取">
          <i class="icon-extract"></i>
        </button>
        <button class="control-btn" @click="showBookmarkDialog = true" title="添加书签">
          <i class="icon-bookmark-add"></i>
        </button>
        <button class="control-btn" @click="toggleFullscreen" title="全屏">
          <i class="icon-fullscreen"></i>
        </button>
        <button class="control-btn" @click="showSettings = !showSettings" title="设置">
          <i class="icon-settings"></i>
        </button>
      </div>
    </div>

    <!-- 浏览器内容区域 -->
    <div class="browser-content" :style="{ opacity: stealthOpacity }">
      <!-- 加载进度条 -->
      <div class="loading-progress" v-show="isLoading">
        <div class="progress-bar" :style="{ width: loadingProgress + '%' }"></div>
      </div>

      <!-- WebView 容器 -->
      <div class="webview-container" ref="webviewContainer">
        <webview 
          ref="webview"
          :src="webviewSrc"
          :useragent="userAgent"
          :preload="preloadScript"
          allowpopups
          webpreferences="contextIsolation=false,nodeIntegration=false"
          @dom-ready="onDomReady"
          @did-start-loading="onStartLoading"
          @did-stop-loading="onStopLoading"
          @did-finish-load="onFinishLoad"
          @did-fail-load="onFailLoad"
          @page-title-updated="onTitleUpdated"
          @new-window="onNewWindow"
          @console-message="onConsoleMessage"
        ></webview>
      </div>

      <!-- 内容提取面板 -->
      <div class="extract-panel" v-show="contentExtractEnabled && extractedContent">
        <div class="extract-header">
          <h3>提取的内容</h3>
          <div class="extract-actions">
            <button class="action-btn" @click="saveExtractedContent" title="保存为小说">
              <i class="icon-save"></i>
              保存
            </button>
            <button class="action-btn" @click="copyExtractedContent" title="复制内容">
              <i class="icon-copy"></i>
              复制
            </button>
            <button class="action-btn" @click="closeExtractPanel" title="关闭">
              <i class="icon-close"></i>
            </button>
          </div>
        </div>
        <div class="extract-content">
          <div class="content-info">
            <div class="info-item">
              <label>标题:</label>
              <span>{{ extractedContent.title }}</span>
            </div>
            <div class="info-item">
              <label>字数:</label>
              <span>{{ extractedContent.wordCount }}</span>
            </div>
          </div>
          <div class="content-text" v-html="extractedContent.content"></div>
        </div>
      </div>
    </div>

    <!-- 自动滚动控制 -->
    <div class="auto-scroll-controls" v-show="autoScrollEnabled">
      <div class="scroll-settings">
        <label>滚动速度:</label>
        <input type="range" v-model="scrollSpeed" min="1" max="10" @input="updateScrollSpeed">
        <span>{{ scrollSpeed }}</span>
      </div>
      <div class="scroll-actions">
        <button class="scroll-btn" @click="startAutoScroll" v-if="!isAutoScrolling">开始</button>
        <button class="scroll-btn" @click="stopAutoScroll" v-else>停止</button>
        <button class="scroll-btn" @click="pauseAutoScroll" v-if="isAutoScrolling && !isScrollPaused">暂停</button>
        <button class="scroll-btn" @click="resumeAutoScroll" v-if="isAutoScrolling && isScrollPaused">继续</button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel" v-show="showSettings" @click.stop>
      <div class="settings-section">
        <h4>浏览器设置</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="hideToolbar" @change="saveSettings">
            隐藏工具栏
          </label>
        </div>
        <div class="setting-item">
          <label>用户代理:</label>
          <select v-model="userAgent" @change="saveSettings">
            <option value="default">默认</option>
            <option value="chrome">Chrome</option>
            <option value="firefox">Firefox</option>
            <option value="mobile">移动端</option>
          </select>
        </div>
      </div>

      <div class="settings-section">
        <h4>摸鱼设置</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="stealthMode" @change="saveSettings">
            隐身模式
          </label>
        </div>
        <div class="setting-item">
          <label>透明度:</label>
          <input type="range" v-model="stealthOpacity" min="0.1" max="1" step="0.1" @input="saveSettings">
          <span>{{ Math.round(stealthOpacity * 100) }}%</span>
        </div>
        <div class="setting-item">
          <label>快速隐藏:</label>
          <input type="text" v-model="hideHotkey" @keydown="recordHotkey" placeholder="按下快捷键">
        </div>
      </div>

      <div class="settings-section">
        <h4>内容提取</h4>
        <div class="setting-item">
          <label>
            <input type="checkbox" v-model="autoExtract" @change="saveSettings">
            自动提取内容
          </label>
        </div>
        <div class="setting-item">
          <label>提取规则:</label>
          <select v-model="extractRule" @change="saveSettings">
            <option value="auto">自动识别</option>
            <option value="article">文章内容</option>
            <option value="custom">自定义规则</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 书签对话框 -->
    <div class="bookmark-dialog" v-if="showBookmarkDialog" @click.self="showBookmarkDialog = false">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>添加书签</h3>
          <button class="close-btn" @click="showBookmarkDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>名称</label>
            <input type="text" v-model="newBookmark.name" placeholder="书签名称">
          </div>
          <div class="form-group">
            <label>网址</label>
            <input type="text" v-model="newBookmark.url" placeholder="网站地址">
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="newBookmark.category">
              <option value="novel">小说网站</option>
              <option value="reading">阅读工具</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="showBookmarkDialog = false">取消</button>
          <button class="btn btn-primary" @click="addBookmark">保存</button>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div class="settings-overlay" v-show="showSettings" @click="showSettings = false"></div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useSettingsStore } from '../../stores/settings.js'

export default {
  name: 'OnlineBrowser',
  props: {
    initialUrl: {
      type: String,
      default: 'https://www.baidu.com'
    },
    stealthMode: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'url-change',
    'title-change',
    'content-extract',
    'bookmark-add',
    'stealth-toggle'
  ],
  setup(props, { emit }) {
    const onlineStore = useOnlineStore()
    const settingsStore = useSettingsStore()
    
    // 响应式数据
    const webview = ref(null)
    const webviewContainer = ref(null)
    const currentUrl = ref(props.initialUrl)
    const webviewSrc = ref(props.initialUrl)
    const isLoading = ref(false)
    const loadingProgress = ref(0)
    const canGoBack = ref(false)
    const canGoForward = ref(false)
    const pageTitle = ref('')
    
    // 设置相关
    const showSettings = ref(false)
    const hideToolbar = ref(false)
    const userAgent = ref('default')
    const stealthOpacity = ref(1)
    const hideHotkey = ref('Ctrl+H')
    
    // 功能控制
    const autoScrollEnabled = ref(false)
    const contentExtractEnabled = ref(false)
    const autoExtract = ref(false)
    const extractRule = ref('auto')
    
    // 自动滚动
    const scrollSpeed = ref(3)
    const isAutoScrolling = ref(false)
    const isScrollPaused = ref(false)
    const scrollInterval = ref(null)
    
    // 内容提取
    const extractedContent = ref(null)
    
    // 书签
    const showBookmarkDialog = ref(false)
    const newBookmark = ref({
      name: '',
      url: '',
      category: 'novel'
    })
    
    // 快速书签
    const quickBookmarks = ref([
      { id: 1, name: '起点', url: 'https://www.qidian.com', title: '起点中文网' },
      { id: 2, name: '晋江', url: 'https://www.jjwxc.net', title: '晋江文学城' },
      { id: 3, name: '纵横', url: 'https://www.zongheng.com', title: '纵横中文网' },
      { id: 4, name: '17K', url: 'https://www.17k.com', title: '17K小说网' }
    ])
    
    // 用户代理配置
    const userAgents = {
      default: '',
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    }
    
    // 预加载脚本路径
    const preloadScript = computed(() => {
      return `file://${__dirname}/preload/browser-preload.js`
    })
    
    // 方法
    const navigateToUrl = (url) => {
      const targetUrl = url || currentUrl.value
      if (!targetUrl) return
      
      let finalUrl = targetUrl
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.includes('.')) {
          finalUrl = 'https://' + targetUrl
        } else {
          finalUrl = 'https://www.baidu.com/s?wd=' + encodeURIComponent(targetUrl)
        }
      }
      
      webviewSrc.value = finalUrl
      currentUrl.value = finalUrl
      emit('url-change', finalUrl)
    }
    
    const goBack = () => {
      if (webview.value && canGoBack.value) {
        webview.value.goBack()
      }
    }
    
    const goForward = () => {
      if (webview.value && canGoForward.value) {
        webview.value.goForward()
      }
    }
    
    const refresh = () => {
      if (webview.value) {
        webview.value.reload()
      }
    }
    
    const goHome = () => {
      navigateToUrl(props.initialUrl)
    }
    
    const selectUrl = (event) => {
      event.target.select()
    }
    
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else {
        document.exitFullscreen()
      }
    }
    
    // 自动滚动功能
    const toggleAutoScroll = () => {
      autoScrollEnabled.value = !autoScrollEnabled.value
      if (!autoScrollEnabled.value) {
        stopAutoScroll()
      }
    }
    
    const startAutoScroll = () => {
      if (!webview.value) return
      
      isAutoScrolling.value = true
      isScrollPaused.value = false
      
      scrollInterval.value = setInterval(() => {
        if (!isScrollPaused.value) {
          webview.value.executeJavaScript(`
            window.scrollBy(0, ${scrollSpeed.value * 2});
          `)
        }
      }, 100)
    }
    
    const stopAutoScroll = () => {
      if (scrollInterval.value) {
        clearInterval(scrollInterval.value)
        scrollInterval.value = null
      }
      isAutoScrolling.value = false
      isScrollPaused.value = false
    }
    
    const pauseAutoScroll = () => {
      isScrollPaused.value = true
    }
    
    const resumeAutoScroll = () => {
      isScrollPaused.value = false
    }
    
    const updateScrollSpeed = () => {
      // 滚动速度更新时无需特殊处理，间隔函数会自动使用新值
    }
    
    // 内容提取功能
    const toggleContentExtract = () => {
      contentExtractEnabled.value = !contentExtractEnabled.value
      if (contentExtractEnabled.value) {
        extractContent()
      }
    }
    
    const extractContent = async () => {
      if (!webview.value) return
      
      try {
        const result = await webview.value.executeJavaScript(`
          (function() {
            // 自动识别文章内容
            const selectors = [
              'article',
              '.content',
              '.article-content',
              '.post-content',
              '.entry-content',
              '#content',
              '.main-content'
            ];
            
            let content = '';
            let title = document.title;
            
            for (const selector of selectors) {
              const element = document.querySelector(selector);
              if (element) {
                content = element.innerText || element.textContent;
                break;
              }
            }
            
            if (!content) {
              // 如果没有找到特定容器，尝试提取主要文本
              const paragraphs = document.querySelectorAll('p');
              content = Array.from(paragraphs)
                .map(p => p.innerText || p.textContent)
                .filter(text => text.length > 50)
                .join('\n\n');
            }
            
            return {
              title: title,
              content: content,
              wordCount: content.length,
              url: window.location.href
            };
          })()
        `)
        
        if (result && result.content) {
          extractedContent.value = result
          emit('content-extract', result)
        }
      } catch (error) {
        console.error('内容提取失败:', error)
      }
    }
    
    const saveExtractedContent = () => {
      if (extractedContent.value) {
        // 触发保存事件，由父组件处理
        emit('content-extract', {
          ...extractedContent.value,
          action: 'save'
        })
      }
    }
    
    const copyExtractedContent = () => {
      if (extractedContent.value) {
        navigator.clipboard.writeText(extractedContent.value.content)
        // 可以添加提示
      }
    }
    
    const closeExtractPanel = () => {
      contentExtractEnabled.value = false
      extractedContent.value = null
    }
    
    // 书签功能
    const addBookmark = () => {
      if (!newBookmark.value.name || !newBookmark.value.url) {
        alert('请填写书签名称和网址')
        return
      }
      
      const bookmark = {
        id: Date.now(),
        name: newBookmark.value.name,
        url: newBookmark.value.url,
        category: newBookmark.value.category,
        title: pageTitle.value,
        createdAt: new Date().toISOString()
      }
      
      emit('bookmark-add', bookmark)
      
      // 重置表单
      newBookmark.value = {
        name: '',
        url: '',
        category: 'novel'
      }
      showBookmarkDialog.value = false
    }
    
    // 设置功能
    const recordHotkey = (event) => {
      event.preventDefault()
      const keys = []
      if (event.ctrlKey) keys.push('Ctrl')
      if (event.altKey) keys.push('Alt')
      if (event.shiftKey) keys.push('Shift')
      if (event.key && !['Control', 'Alt', 'Shift'].includes(event.key)) {
        keys.push(event.key.toUpperCase())
      }
      hideHotkey.value = keys.join('+')
      saveSettings()
    }
    
    const saveSettings = () => {
      const settings = {
        hideToolbar: hideToolbar.value,
        userAgent: userAgent.value,
        stealthMode: props.stealthMode,
        stealthOpacity: stealthOpacity.value,
        hideHotkey: hideHotkey.value,
        autoExtract: autoExtract.value,
        extractRule: extractRule.value,
        scrollSpeed: scrollSpeed.value
      }
      
      settingsStore.updateOnlineSettings(settings)
    }
    
    // WebView 事件处理
    const onDomReady = () => {
      if (webview.value) {
        canGoBack.value = webview.value.canGoBack()
        canGoForward.value = webview.value.canGoForward()
        
        // 如果启用了自动提取，则提取内容
        if (autoExtract.value) {
          setTimeout(() => {
            extractContent()
          }, 1000)
        }
      }
    }
    
    const onStartLoading = () => {
      isLoading.value = true
      loadingProgress.value = 0
    }
    
    const onStopLoading = () => {
      isLoading.value = false
      loadingProgress.value = 100
      
      if (webview.value) {
        currentUrl.value = webview.value.getURL()
        canGoBack.value = webview.value.canGoBack()
        canGoForward.value = webview.value.canGoForward()
      }
    }
    
    const onFinishLoad = () => {
      isLoading.value = false
      loadingProgress.value = 100
    }
    
    const onFailLoad = (event) => {
      console.error('页面加载失败:', event)
      isLoading.value = false
    }
    
    const onTitleUpdated = (event) => {
      pageTitle.value = event.title
      emit('title-change', event.title)
      
      // 自动填充书签名称
      if (showBookmarkDialog.value && !newBookmark.value.name) {
        newBookmark.value.name = event.title
        newBookmark.value.url = currentUrl.value
      }
    }
    
    const onNewWindow = (event) => {
      // 在新窗口中打开链接
      navigateToUrl(event.url)
    }
    
    const onConsoleMessage = (event) => {
      console.log('WebView Console:', event.message)
    }
    
    // 初始化设置
    const initializeSettings = () => {
      const settings = settingsStore.onlineSettings
      
      hideToolbar.value = settings.hideToolbar || false
      userAgent.value = settings.userAgent || 'default'
      stealthOpacity.value = settings.stealthOpacity || 1
      hideHotkey.value = settings.hideHotkey || 'Ctrl+H'
      autoExtract.value = settings.autoExtract || false
      extractRule.value = settings.extractRule || 'auto'
      scrollSpeed.value = settings.scrollSpeed || 3
    }
    
    // 生命周期
    onMounted(() => {
      initializeSettings()
      
      // 设置用户代理
      nextTick(() => {
        if (webview.value && userAgent.value !== 'default') {
          webview.value.setUserAgent(userAgents[userAgent.value])
        }
      })
    })
    
    onUnmounted(() => {
      stopAutoScroll()
    })
    
    return {
      webview,
      webviewContainer,
      currentUrl,
      webviewSrc,
      isLoading,
      loadingProgress,
      canGoBack,
      canGoForward,
      pageTitle,
      showSettings,
      hideToolbar,
      userAgent,
      stealthOpacity,
      hideHotkey,
      autoScrollEnabled,
      contentExtractEnabled,
      autoExtract,
      extractRule,
      scrollSpeed,
      isAutoScrolling,
      isScrollPaused,
      extractedContent,
      showBookmarkDialog,
      newBookmark,
      quickBookmarks,
      preloadScript,
      navigateToUrl,
      goBack,
      goForward,
      refresh,
      goHome,
      selectUrl,
      toggleFullscreen,
      toggleAutoScroll,
      startAutoScroll,
      stopAutoScroll,
      pauseAutoScroll,
      resumeAutoScroll,
      updateScrollSpeed,
      toggleContentExtract,
      extractContent,
      saveExtractedContent,
      copyExtractedContent,
      closeExtractPanel,
      addBookmark,
      recordHotkey,
      saveSettings,
      onDomReady,
      onStartLoading,
      onStopLoading,
      onFinishLoad,
      onFailLoad,
      onTitleUpdated,
      onNewWindow,
      onConsoleMessage
    }
  }
}
</script>

<style scoped>
.online-browser {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
  transition: opacity 0.3s ease;
}

.stealth-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  min-height: 48px;
}

.nav-controls {
  display: flex;
  gap: 4px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #007bff;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.address-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.url-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  outline: none;
  font-size: 14px;
}

.go-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: #007bff;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.go-btn:hover {
  background: #0056b3;
}

.quick-bookmarks {
  display: flex;
  gap: 4px;
}

.bookmark-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.bookmark-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.function-controls {
  display: flex;
  gap: 4px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.control-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.browser-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #f0f0f0;
  z-index: 10;
}

.progress-bar {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
}

.webview-container {
  width: 100%;
  height: 100%;
}

webview {
  width: 100%;
  height: 100%;
  border: none;
}

.extract-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 400px;
  height: 100%;
  background: white;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 20;
}

.extract-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.extract-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.extract-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
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

.action-btn:hover {
  background: #e9ecef;
}

.extract-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.content-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.info-item label {
  font-weight: 500;
  color: #666;
  min-width: 40px;
}

.content-text {
  line-height: 1.6;
  font-size: 14px;
  color: #333;
  white-space: pre-wrap;
}

.auto-scroll-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 30;
}

.scroll-settings {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.scroll-settings input[type="range"] {
  width: 80px;
}

.scroll-actions {
  display: flex;
  gap: 4px;
}

.scroll-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.2s ease;
}

.scroll-btn:hover {
  background: #0056b3;
}

.settings-panel {
  position: absolute;
  top: 100%;
  right: 12px;
  width: 300px;
  max-height: 400px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  z-index: 1001;
}

.settings-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.setting-item select,
.setting-item input[type="text"] {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.setting-item input[type="range"] {
  width: 80px;
}

.bookmark-dialog {
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
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #007bff;
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

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* 图标样式 */
.icon-arrow-left::before { content: '←'; }
.icon-arrow-right::before { content: '→'; }
.icon-refresh::before { content: '↻'; }
.icon-refresh.spinning { animation: spin 1s linear infinite; }
.icon-home::before { content: '🏠'; }
.icon-go::before { content: '→'; }
.icon-auto-scroll::before { content: '⏬'; }
.icon-extract::before { content: '📄'; }
.icon-bookmark-add::before { content: '⭐'; }
.icon-fullscreen::before { content: '⛶'; }
.icon-settings::before { content: '⚙️'; }
.icon-save::before { content: '💾'; }
.icon-copy::before { content: '📋'; }
.icon-close::before { content: '×'; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .browser-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .quick-bookmarks {
    display: none;
  }
  
  .extract-panel {
    width: 100%;
  }
  
  .settings-panel {
    width: 280px;
  }
}

/* 暗色主题 */
.dark-theme .online-browser {
  background: #1a1a1a;
}

.dark-theme .browser-toolbar {
  background: #2a2a2a;
  border-bottom-color: #444;
}

.dark-theme .nav-btn,
.dark-theme .control-btn,
.dark-theme .bookmark-btn {
  background: #333;
  border-color: #555;
  color: #ccc;
}

.dark-theme .url-input-container {
  background: #333;
  border-color: #555;
}

.dark-theme .url-input {
  background: transparent;
  color: #ccc;
}

.dark-theme .extract-panel {
  background: #2a2a2a;
  border-left-color: #444;
}

.dark-theme .extract-header {
  background: #333;
  border-bottom-color: #444;
}

.dark-theme .settings-panel {
  background: #2a2a2a;
  border-color: #444;
}

.dark-theme .dialog-content {
  background: #2a2a2a;
}

.dark-theme .dialog-header,
.dark-theme .dialog-footer {
  background: #333;
  border-color: #444;
}
</style>