<template>
  <div class="base-reminder">
    <!-- 通用提醒组件基础模板 -->
    <div class="reminder-container">
      <!-- 头部区域 -->
      <div class="reminder-header">
        <div class="icon-wrapper">
          <span class="reminder-icon">{{ icon }}</span>
        </div>
        <div class="header-content">
          <h3 class="reminder-title">{{ title }}</h3>
          <p class="reminder-subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="reminder-content">
        <slot name="content">
          <p class="default-message">{{ message }}</p>
        </slot>
      </div>

      <!-- 配置区域 -->
      <div class="reminder-config">
        <div class="config-item">
          <label class="config-label">提醒间隔</label>
          <div class="interval-selector">
            <input 
              v-model="localInterval" 
              type="number" 
              min="1" 
              max="1440" 
              class="interval-input"
              @change="updateInterval"
            />
            <span class="interval-unit">分钟</span>
          </div>
        </div>
        
        <div class="config-item">
          <label class="config-label">提醒方式</label>
          <select v-model="notificationType" class="notification-select">
            <option value="browser">浏览器通知</option>
            <option value="sound">声音提醒</option>
            <option value="both">通知+声音</option>
          </select>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="reminder-actions">
        <button 
          @click="toggleReminder" 
          :class="['btn-primary', { 'active': isActive }]"
        >
          <span class="btn-icon">{{ isActive ? '⏸️' : '▶️' }}</span>
          {{ isActive ? '暂停提醒' : '开始提醒' }}
        </button>
        
        <button @click="testReminder" class="btn-secondary">
          <span class="btn-icon">🧪</span>
          测试提醒
        </button>
        
        <slot name="actions"></slot>
      </div>

      <!-- 状态显示区域 -->
      <div class="reminder-status">
        <div class="status-row">
          <div class="status-item">
            <span class="status-label">状态:</span>
            <span :class="['status-value', { 'active': isActive }]">
              {{ isActive ? '运行中' : '已暂停' }}
            </span>
          </div>
          
          <div v-if="isActive && nextReminderTime" class="status-item">
            <span class="status-label">下次提醒:</span>
            <span class="status-value">{{ formatTime(nextReminderTime) }}</span>
          </div>
        </div>
        
        <div v-if="reminderCount > 0" class="stats-row">
          <span class="stats-text">今日已提醒 {{ reminderCount }} 次</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'

// 定义组件属性
const props = defineProps({
  title: {
    type: String,
    default: '提醒'
  },
  subtitle: {
    type: String,
    default: '保持健康习惯'
  },
  message: {
    type: String,
    default: '这是一个提醒消息'
  },
  icon: {
    type: String,
    default: '🔔'
  },
  interval: {
    type: Number,
    default: 30
  },
  autoStart: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['remind', 'start', 'stop', 'test'])

// 响应式数据
const isActive = ref(false)
const timerId = ref(null)
const nextReminderTime = ref(null)
const reminderCount = ref(0)
const localInterval = ref(props.interval)
const notificationType = ref('browser')

// 格式化时间显示
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 更新间隔时间
const updateInterval = () => {
  if (isActive.value) {
    // 如果正在运行，重新启动以应用新间隔
    stopReminder()
    startReminder()
  }
}

// 开始/停止提醒切换
const toggleReminder = () => {
  if (isActive.value) {
    stopReminder()
  } else {
    startReminder()
  }
}

// 开始提醒
const startReminder = () => {
  if (timerId.value) {
    clearInterval(timerId.value)
  }
  
  isActive.value = true
  const intervalMs = localInterval.value * 60 * 1000
  
  // 设置下次提醒时间
  nextReminderTime.value = Date.now() + intervalMs
  
  // 设置定时器
  timerId.value = setInterval(() => {
    triggerReminder()
    // 更新下次提醒时间
    nextReminderTime.value = Date.now() + intervalMs
  }, intervalMs)
  
  emit('start', {
    interval: localInterval.value,
    type: notificationType.value
  })
  
  console.log(`${props.title}提醒已启动，间隔${localInterval.value}分钟`)
}

// 停止提醒
const stopReminder = () => {
  if (timerId.value) {
    clearInterval(timerId.value)
    timerId.value = null
  }
  
  isActive.value = false
  nextReminderTime.value = null
  
  emit('stop')
  
  console.log(`${props.title}提醒已停止`)
}

// 触发提醒
const triggerReminder = () => {
  reminderCount.value++
  
  const reminderData = {
    title: props.title,
    message: props.message,
    icon: props.icon,
    type: notificationType.value,
    timestamp: Date.now(),
    count: reminderCount.value
  }
  
  // 根据设置的提醒方式执行
  if (notificationType.value === 'browser' || notificationType.value === 'both') {
    showNotification(reminderData)
  }
  
  if (notificationType.value === 'sound' || notificationType.value === 'both') {
    playNotificationSound()
  }
  
  emit('remind', reminderData)
  
  console.log('触发提醒:', reminderData)
}

// 测试提醒
const testReminder = () => {
  const testData = {
    title: props.title + ' (测试)',
    message: props.message,
    icon: props.icon,
    type: notificationType.value,
    timestamp: Date.now(),
    isTest: true
  }
  
  if (notificationType.value === 'browser' || notificationType.value === 'both') {
    showNotification(testData)
  }
  
  if (notificationType.value === 'sound' || notificationType.value === 'both') {
    playNotificationSound()
  }
  
  emit('test', testData)
  
  console.log('测试提醒:', testData)
}

// 显示通知
const showNotification = (data) => {
  // Electron环境
  if (window.electronAPI) {
    window.electronAPI.showNotification({
      title: data.title,
      body: data.message,
      icon: data.icon
    })
  } 
  // 浏览器环境
  else if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.message,
        icon: '/vite.svg',
        tag: 'reminder-notification'
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(data.title, {
            body: data.message,
            icon: '/vite.svg',
            tag: 'reminder-notification'
          })
        }
      })
    }
  }
}

// 播放提醒声音
const playNotificationSound = () => {
  try {
    // 创建音频上下文
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (error) {
    console.warn('无法播放提醒声音:', error)
  }
}

// 组件挂载时的处理
onMounted(() => {
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
  
  // 从本地存储恢复数据
  const savedCount = localStorage.getItem(`${props.title}_reminderCount`)
  if (savedCount) {
    reminderCount.value = parseInt(savedCount)
  }
  
  // 自动启动
  if (props.autoStart) {
    startReminder()
  }
  
  console.log(`${props.title}提醒组件已加载`)
})

// 组件卸载时清理
onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value)
  }
  
  // 保存数据到本地存储
  localStorage.setItem(`${props.title}_reminderCount`, reminderCount.value.toString())
})

// 监听提醒次数变化并保存
watch(reminderCount, (newCount) => {
  localStorage.setItem(`${props.title}_reminderCount`, newCount.toString())
})
</script>

<style scoped>
.base-reminder {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.reminder-container {
  background: white;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  transition: all 0.3s ease;
}

.reminder-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
}

.reminder-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f8f9fa;
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.reminder-icon {
  font-size: 28px;
}

.header-content {
  flex: 1;
}

.reminder-title {
  margin: 0 0 6px 0;
  color: #2c3e50;
  font-size: 1.6rem;
  font-weight: 700;
}

.reminder-subtitle {
  margin: 0;
  color: #7f8c8d;
  font-size: 1rem;
}

.reminder-content {
  margin-bottom: 24px;
}

.default-message {
  color: #5a6c7d;
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.reminder-config {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.config-item:last-child {
  margin-bottom: 0;
}

.config-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.interval-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interval-input {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.95rem;
  text-align: center;
}

.interval-input:focus {
  outline: none;
  border-color: #667eea;
}

.interval-unit {
  color: #6c757d;
  font-size: 0.9rem;
}

.notification-select {
  padding: 8px 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  min-width: 120px;
}

.notification-select:focus {
  outline: none;
  border-color: #667eea;
}

.reminder-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  flex: 1;
  min-width: 140px;
  padding: 14px 20px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: #e9ecef;
  color: #495057;
}

.btn-primary.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: #28a745;
  color: white;
}

.btn-secondary:hover {
  background: #218838;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.1rem;
}

.reminder-status {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-value {
  color: #dc3545;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-value.active {
  color: #28a745;
}

.stats-row {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid #e9ecef;
}

.stats-text {
  color: #6c757d;
  font-size: 0.85rem;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .reminder-container {
    padding: 20px;
  }
  
  .reminder-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .icon-wrapper {
    margin-right: 0;
  }
  
  .config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .reminder-actions {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    min-width: auto;
  }
  
  .status-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>