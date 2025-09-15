<template>
  <div class="about-info">
    <div class="settings-header">
      <h3>关于</h3>
      <p class="settings-description">版本信息、更新日志、帮助文档</p>
    </div>

    <div class="settings-content">
      <!-- 应用信息 -->
      <div class="app-info-section">
        <div class="app-logo">
          <div class="logo-icon">
            <i class="icon-book"></i>
          </div>
          <div class="app-details">
            <h2 class="app-name">小说阅读器</h2>
            <p class="app-version">版本 {{ appInfo.version }}</p>
            <p class="app-description">{{ appInfo.description }}</p>
          </div>
        </div>
        
        <div class="version-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">构建版本:</span>
              <span class="info-value">{{ appInfo.buildVersion }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">构建时间:</span>
              <span class="info-value">{{ appInfo.buildDate }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">运行环境:</span>
              <span class="info-value">{{ appInfo.environment }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">框架版本:</span>
              <span class="info-value">Vue {{ appInfo.vueVersion }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能特性 -->
      <div class="features-section">
        <h4>主要功能</h4>
        <div class="features-grid">
          <div class="feature-item">
            <i class="icon-book-open"></i>
            <h5>多格式支持</h5>
            <p>支持TXT、EPUB、PDF等多种电子书格式</p>
          </div>
          
          <div class="feature-item">
            <i class="icon-palette"></i>
            <h5>主题定制</h5>
            <p>丰富的主题选择和个性化定制选项</p>
          </div>
          
          <div class="feature-item">
            <i class="icon-cloud"></i>
            <h5>云端同步</h5>
            <p>阅读进度和书签云端同步，多设备无缝切换</p>
          </div>
          
          <div class="feature-item">
            <i class="icon-stealth"></i>
            <h5>摸鱼模式</h5>
            <p>透明度调节和快速隐藏，工作学习两不误</p>
          </div>
          
          <div class="feature-item">
            <i class="icon-search"></i>
            <h5>智能搜索</h5>
            <p>全文搜索和书源管理，海量资源触手可及</p>
          </div>
          
          <div class="feature-item">
            <i class="icon-bookmark"></i>
            <h5>书签笔记</h5>
            <p>智能书签和阅读笔记，记录精彩瞬间</p>
          </div>
        </div>
      </div>

      <!-- 更新日志 -->
      <div class="changelog-section">
        <h4>更新日志</h4>
        <div class="changelog-list">
          <div 
            v-for="version in changelog" 
            :key="version.version"
            class="changelog-item"
          >
            <div class="version-header">
              <span class="version-number">v{{ version.version }}</span>
              <span class="release-date">{{ version.date }}</span>
              <span class="version-type" :class="version.type">{{ getVersionTypeText(version.type) }}</span>
            </div>
            
            <div class="changelog-content">
              <div v-if="version.features.length" class="change-category">
                <h6>✨ 新功能</h6>
                <ul>
                  <li v-for="feature in version.features" :key="feature">{{ feature }}</li>
                </ul>
              </div>
              
              <div v-if="version.improvements.length" class="change-category">
                <h6>🚀 优化改进</h6>
                <ul>
                  <li v-for="improvement in version.improvements" :key="improvement">{{ improvement }}</li>
                </ul>
              </div>
              
              <div v-if="version.fixes.length" class="change-category">
                <h6>🐛 问题修复</h6>
                <ul>
                  <li v-for="fix in version.fixes" :key="fix">{{ fix }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 帮助链接 -->
      <div class="help-section">
        <h4>帮助与支持</h4>
        <div class="help-links">
          <a href="#" class="help-link" @click="openLink('userGuide')">
            <i class="icon-book"></i>
            <span>使用指南</span>
          </a>
          
          <a href="#" class="help-link" @click="openLink('faq')">
            <i class="icon-question"></i>
            <span>常见问题</span>
          </a>
          
          <a href="#" class="help-link" @click="openLink('feedback')">
            <i class="icon-message"></i>
            <span>意见反馈</span>
          </a>
          
          <a href="#" class="help-link" @click="openLink('github')">
            <i class="icon-github"></i>
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <!-- 开发团队 -->
      <div class="team-section">
        <h4>开发团队</h4>
        <div class="team-info">
          <div class="team-member">
            <div class="member-avatar">
              <i class="icon-user"></i>
            </div>
            <div class="member-info">
              <h5>开发者</h5>
              <p>负责应用开发和维护</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 许可证信息 -->
      <div class="license-section">
        <h4>许可证</h4>
        <div class="license-info">
          <p>本软件基于 MIT 许可证开源发布</p>
          <div class="license-actions">
            <button class="btn btn-secondary" @click="showLicense">
              <i class="icon-document"></i>
              查看许可证
            </button>
            
            <button class="btn btn-secondary" @click="showThirdParty">
              <i class="icon-list"></i>
              第三方组件
            </button>
          </div>
        </div>
      </div>

      <!-- 检查更新 -->
      <div class="update-section">
        <h4>检查更新</h4>
        <div class="update-info">
          <div class="update-status">
            <span class="status-text">{{ updateStatus.text }}</span>
            <span class="status-icon" :class="updateStatus.type">
              <i :class="updateStatus.icon"></i>
            </span>
          </div>
          
          <div class="update-actions">
            <button 
              class="btn btn-primary" 
              @click="checkForUpdates"
              :disabled="updateStatus.checking"
            >
              <i class="icon-refresh" :class="{ spinning: updateStatus.checking }"></i>
              {{ updateStatus.checking ? '检查中...' : '检查更新' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 许可证对话框 -->
    <div v-if="showLicenseDialog" class="license-dialog-overlay" @click="showLicenseDialog = false">
      <div class="license-dialog" @click.stop>
        <div class="dialog-header">
          <h4>MIT 许可证</h4>
          <button class="close-btn" @click="showLicenseDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="dialog-content">
          <pre class="license-text">{{ licenseText }}</pre>
        </div>
      </div>
    </div>

    <!-- 第三方组件对话框 -->
    <div v-if="showThirdPartyDialog" class="license-dialog-overlay" @click="showThirdPartyDialog = false">
      <div class="license-dialog" @click.stop>
        <div class="dialog-header">
          <h4>第三方组件</h4>
          <button class="close-btn" @click="showThirdPartyDialog = false">
            <i class="icon-close"></i>
          </button>
        </div>
        <div class="dialog-content">
          <div class="third-party-list">
            <div v-for="component in thirdPartyComponents" :key="component.name" class="component-item">
              <div class="component-info">
                <h5>{{ component.name }}</h5>
                <p>{{ component.description }}</p>
              </div>
              <div class="component-meta">
                <span class="version">v{{ component.version }}</span>
                <span class="license">{{ component.license }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'AboutInfo',
  setup() {
    // 响应式数据
    const showLicenseDialog = ref(false)
    const showThirdPartyDialog = ref(false)
    
    // 应用信息
    const appInfo = ref({
      version: '1.0.0',
      buildVersion: '20240101.001',
      buildDate: '2024-01-01 12:00:00',
      environment: 'Production',
      vueVersion: '3.4.0',
      description: '一款功能丰富的电子书阅读应用，支持多种格式，提供优质的阅读体验'
    })
    
    // 更新状态
    const updateStatus = ref({
      text: '当前版本是最新版本',
      type: 'success',
      icon: 'icon-check',
      checking: false
    })
    
    // 更新日志
    const changelog = ref([
      {
        version: '1.0.0',
        date: '2024-01-01',
        type: 'major',
        features: [
          '全新的用户界面设计',
          '支持多种电子书格式',
          '云端同步功能',
          '摸鱼模式'
        ],
        improvements: [
          '优化阅读性能',
          '改进用户体验',
          '增强稳定性'
        ],
        fixes: [
          '修复页面翻转问题',
          '解决内存泄漏',
          '修复主题切换bug'
        ]
      },
      {
        version: '0.9.5',
        date: '2023-12-15',
        type: 'minor',
        features: [
          '新增夜间模式',
          '书签管理功能'
        ],
        improvements: [
          '优化启动速度',
          '改进搜索算法'
        ],
        fixes: [
          '修复字体显示问题',
          '解决崩溃问题'
        ]
      },
      {
        version: '0.9.0',
        date: '2023-12-01',
        type: 'minor',
        features: [
          '基础阅读功能',
          '主题系统',
          '设置面板'
        ],
        improvements: [],
        fixes: []
      }
    ])
    
    // 第三方组件
    const thirdPartyComponents = ref([
      {
        name: 'Vue.js',
        version: '3.4.0',
        description: '渐进式JavaScript框架',
        license: 'MIT'
      },
      {
        name: 'Vite',
        version: '5.0.0',
        description: '下一代前端构建工具',
        license: 'MIT'
      },
      {
        name: 'Pinia',
        version: '2.1.0',
        description: 'Vue状态管理库',
        license: 'MIT'
      },
      {
        name: 'Vue Router',
        version: '4.2.0',
        description: 'Vue官方路由管理器',
        license: 'MIT'
      }
    ])
    
    // MIT许可证文本
    const licenseText = ref(`MIT License

Copyright (c) 2024 Novel Reader

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`)
    
    // 方法
    const getVersionTypeText = (type) => {
      const typeMap = {
        major: '重大更新',
        minor: '功能更新',
        patch: '修复更新',
        beta: '测试版本'
      }
      return typeMap[type] || '更新'
    }
    
    const openLink = (type) => {
      const links = {
        userGuide: 'https://example.com/guide',
        faq: 'https://example.com/faq',
        feedback: 'https://example.com/feedback',
        github: 'https://github.com/example/novel-reader'
      }
      
      if (links[type]) {
        window.open(links[type], '_blank')
      }
    }
    
    const showLicense = () => {
      showLicenseDialog.value = true
    }
    
    const showThirdParty = () => {
      showThirdPartyDialog.value = true
    }
    
    const checkForUpdates = async () => {
      updateStatus.value = {
        text: '正在检查更新...',
        type: 'info',
        icon: 'icon-refresh',
        checking: true
      }
      
      // 模拟检查更新
      setTimeout(() => {
        const hasUpdate = Math.random() > 0.7 // 30%概率有更新
        
        if (hasUpdate) {
          updateStatus.value = {
            text: '发现新版本 v1.0.1',
            type: 'warning',
            icon: 'icon-download',
            checking: false
          }
        } else {
          updateStatus.value = {
            text: '当前版本是最新版本',
            type: 'success',
            icon: 'icon-check',
            checking: false
          }
        }
      }, 2000)
    }
    
    // 生命周期
    onMounted(() => {
      // 获取实际的Vue版本
      try {
        const vue = require('vue')
        if (vue.version) {
          appInfo.value.vueVersion = vue.version
        }
      } catch (e) {
        // 无法获取版本信息
      }
    })
    
    return {
      showLicenseDialog,
      showThirdPartyDialog,
      appInfo,
      updateStatus,
      changelog,
      thirdPartyComponents,
      licenseText,
      getVersionTypeText,
      openLink,
      showLicense,
      showThirdParty,
      checkForUpdates
    }
  }
}
</script>

<style scoped>
.about-info {
  padding: 20px;
}

.settings-header {
  margin-bottom: 30px;
}

.settings-header h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.app-info-section {
  margin-bottom: 40px;
  padding: 30px;
  background: linear-gradient(135deg, var(--primary-color-light), var(--primary-color));
  border-radius: 16px;
  color: white;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.app-name {
  margin: 0 0 4px 0;
  font-size: 28px;
  font-weight: 700;
}

.app-version {
  margin: 0 0 8px 0;
  opacity: 0.9;
  font-size: 16px;
}

.app-description {
  margin: 0;
  opacity: 0.8;
  line-height: 1.5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.info-label {
  opacity: 0.8;
}

.info-value {
  font-weight: 500;
}

.features-section,
.changelog-section,
.help-section,
.team-section,
.license-section,
.update-section {
  margin-bottom: 40px;
  padding: 24px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.features-section h4,
.changelog-section h4,
.help-section h4,
.team-section h4,
.license-section h4,
.update-section h4 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.feature-item {
  padding: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-align: center;
}

.feature-item i {
  font-size: 32px;
  color: var(--primary-color);
  margin-bottom: 12px;
}

.feature-item h5 {
  margin: 0 0 8px 0;
  color: var(--text-primary);
}

.feature-item p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.changelog-list {
  max-height: 400px;
  overflow-y: auto;
}

.changelog-item {
  margin-bottom: 24px;
  padding: 20px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.version-number {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.release-date {
  color: var(--text-secondary);
  font-size: 14px;
}

.version-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.version-type.major {
  background: var(--danger-color-light);
  color: var(--danger-color);
}

.version-type.minor {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.version-type.patch {
  background: var(--success-color-light);
  color: var(--success-color);
}

.change-category {
  margin-bottom: 12px;
}

.change-category h6 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.change-category ul {
  margin: 0;
  padding-left: 20px;
}

.change-category li {
  margin-bottom: 4px;
  color: var(--text-secondary);
  font-size: 14px;
}

.help-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.help-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.help-link:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color);
}

.help-link i {
  font-size: 20px;
  color: var(--primary-color);
}

.team-member {
  display: flex;
  align-items: center;
  gap: 16px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  background: var(--primary-color-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 20px;
}

.member-info h5 {
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.member-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.license-actions,
.update-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.update-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon.success {
  color: var(--success-color);
}

.status-icon.warning {
  color: var(--warning-color);
}

.status-icon.info {
  color: var(--primary-color);
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-color-dark);
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.license-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.license-dialog {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  max-height: 80vh;
  width: 90%;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.dialog-header h4 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  padding: 8px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dialog-content {
  padding: 24px;
  overflow-y: auto;
}

.license-text {
  font-family: monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
  white-space: pre-wrap;
  margin: 0;
}

.third-party-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.component-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.component-info h5 {
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.component-info p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.component-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.version {
  font-weight: 500;
  color: var(--primary-color);
}

.license {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-logo {
    flex-direction: column;
    text-align: center;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .help-links {
    grid-template-columns: 1fr;
  }
  
  .update-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .component-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .component-meta {
    align-items: flex-start;
  }
}
</style>