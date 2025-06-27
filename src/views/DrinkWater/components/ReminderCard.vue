<template>
  <div class="reminder-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="icon-container">
        <span class="reminder-icon">{{ icon }}</span>
      </div>
      <h3 class="card-title">{{ title }}</h3>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
      <p class="reminder-message">{{ message }}</p>
      <div class="interval-info">
        <span class="interval-text">提醒间隔: {{ interval }} 分钟</span>
      </div>
    </div>

    <!-- 卡片操作区 -->
    <div class="card-actions">
      <button 
        @click="toggleReminder" 
        :class="['btn-toggle', { 'active': isActive }]"
      >
        {{ isActive ? '停止提醒' : '开始提醒' }}
      </button>
      <button @click="triggerRemind" class="btn-test">
        测试提醒
      </button>
    </div>

    <!-- 状态指示器 -->
    <div class="status-indicator">
      <div :class="['status-dot', { 'active': isActive }]"></div>
      <span class="status-text">
        {{ isActive ? '提醒已启用' : '提醒已暂停' }}
      </span>
    </div>

    <!-- 下次提醒时间 -->
    <div v-if="isActive && nextReminderTime" class="next-reminder">
      <small>下次提醒: {{ formatTime(nextReminderTime) }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 定义组件属性
const props = defineProps({
  title: {
    type: String,
    default: '提醒'
  },
  message: {
    type: String,
    default: '这是一个提醒消息'
  },
  interval: {
    type: Number,
    default: 30 // 默认30分钟
  },
  icon: {
    type: String,
    default: '🔔'
  }
})

// 定义事件
const emit = defineEmits(['remind'])

// 响应式数据
const isActive = ref(false)
const timerId = ref(null)
const nextReminderTime = ref(null)

// 计算属性：格式化时间
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 开始/停止提醒
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
  const intervalMs = props.interval * 60 * 1000 // 转换为毫秒
  
  // 设置下次提醒时间
  nextReminderTime.value = Date.now() + intervalMs
  
  // 设置定时器
  timerId.value = setInterval(() => {
    triggerRemind()
    // 更新下次提醒时间
    nextReminderTime.value = Date.now() + intervalMs
  }, intervalMs)
  
  console.log(`${props.title}提醒已启动，间隔${props.interval}分钟`)
}

// 停止提醒
const stopReminder = () => {
  if (timerId.value) {
    clearInterval(timerId.value)
    timerId.value = null
  }
  
  isActive.value = false
  nextReminderTime.value = null
  
  console.log(`${props.title}提醒已停止`)
}

// 触发提醒
const triggerRemind = () => {
  const reminderData = {
    title: props.title,
    message: props.message,
    icon: props.icon,
    timestamp: Date.now()
  }
  
  // 发送提醒事件给父组件
  emit('remind', reminderData)
  
  console.log('触发提醒:', reminderData)
}

// 组件挂载时的处理
onMounted(() => {
  console.log(`${props.title}提醒组件已加载`)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timerId.value) {
    clearInterval(timerId.value)
  }
})
</script>

<style scoped>
.reminder-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  transition: all 0.3s ease;
  max-width: 400px;
  margin: 0 auto;
}

.reminder-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.icon-container {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.reminder-icon {
  font-size: 24px;
  filter: grayscale(0);
}

.card-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.card-content {
  margin-bottom: 24px;
}

.reminder-message {
  color: #5a6c7d;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.interval-info {
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.interval-text {
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn-toggle, .btn-test {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-toggle {
  background: #e9ecef;
  color: #495057;
}

.btn-toggle.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-toggle:hover {
  transform: translateY(-1px);
}

.btn-test {
  background: #28a745;
  color: white;
}

.btn-test:hover {
  background: #218838;
  transform: translateY(-1px);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
  transition: background-color 0.3s ease;
}

.status-dot.active {
  background: #28a745;
  animation: pulse 2s infinite;
}

.status-text {
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 500;
}

.next-reminder {
  text-align: center;
  color: #6c757d;
  font-size: 0.8rem;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .reminder-card {
    padding: 20px;
    margin: 0 10px;
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .icon-container {
    margin-right: 0;
  }
  
  .card-actions {
    flex-direction: column;
  }
}
</style>