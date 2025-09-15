<template>
  <div class="timer-container">
    <!-- 页面头部 -->
    <div class="header">
      <h1 class="title">⏱️ 时间管理</h1>
      <p class="subtitle">专注工作，合理休息</p>
    </div>

    <!-- 计时器类型选择 -->
    <div class="timer-type-selector">
      <button 
        :class="['type-btn', { active: currentType === 'stopwatch' }]"
        @click="switchType('stopwatch')"
      >
        <span class="type-icon">⏱️</span>
        正计时
      </button>
      <button 
        :class="['type-btn', { active: currentType === 'countdown' }]"
        @click="switchType('countdown')"
      >
        <span class="type-icon">⏰</span>
        倒计时
      </button>
    </div>

    <!-- 计时器显示区域 -->
    <div class="timer-display">
      <div class="time-circle">
        <div class="time-text">
          {{ formatTime(displayTime) }}
        </div>
        <div class="time-label">
          {{ currentType === 'stopwatch' ? '已用时间' : '剩余时间' }}
        </div>
      </div>
    </div>

    <!-- 倒计时设置面板 -->
    <div v-if="currentType === 'countdown'" class="countdown-settings">
      <h3>设置倒计时时间</h3>
      <div class="time-inputs">
        <div class="input-group">
          <label>小时</label>
          <input 
            v-model.number="countdownHours" 
            type="number" 
            min="0" 
            max="23"
            :disabled="isRunning"
          >
        </div>
        <div class="input-group">
          <label>分钟</label>
          <input 
            v-model.number="countdownMinutes" 
            type="number" 
            min="0" 
            max="59"
            :disabled="isRunning"
          >
        </div>
        <div class="input-group">
          <label>秒</label>
          <input 
            v-model.number="countdownSeconds" 
            type="number" 
            min="0" 
            max="59"
            :disabled="isRunning"
          >
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <button 
        :class="['control-btn', 'start-btn', { 'pause-btn': isRunning }]"
        @click="toggleTimer"
      >
        <span class="btn-icon">{{ isRunning ? '⏸️' : '▶️' }}</span>
        {{ isRunning ? '暂停' : '开始' }}
      </button>
      
      <button 
        class="control-btn reset-btn"
        @click="resetTimer"
        :disabled="!isRunning && displayTime === 0"
      >
        <span class="btn-icon">🔄</span>
        重置
      </button>
    </div>

    <!-- 提醒设置 -->
    <div class="notification-settings">
      <h3>提醒设置</h3>
      <div class="setting-item">
        <label class="checkbox-label">
          <input 
            v-model="notificationEnabled" 
            type="checkbox"
          >
          <span class="checkmark"></span>
          启用提醒通知
        </label>
      </div>
      
      <div v-if="notificationEnabled" class="notification-options">
        <div class="setting-item">
          <label class="checkbox-label">
            <input 
              v-model="soundEnabled" 
              type="checkbox"
            >
            <span class="checkmark"></span>
            声音提醒
          </label>
        </div>
        
        <div class="setting-item">
          <label>提醒消息</label>
          <input 
            v-model="notificationMessage" 
            type="text" 
            placeholder="输入自定义提醒消息"
            class="message-input"
          >
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <h3>今日记录</h3>
      <div v-if="todayRecords.length === 0" class="no-records">
        暂无记录
      </div>
      <div v-else class="records-list">
        <div 
          v-for="(record, index) in todayRecords" 
          :key="index"
          class="record-item"
        >
          <div class="record-type">
            {{ record.type === 'stopwatch' ? '⏱️ 正计时' : '⏰ 倒计时' }}
          </div>
          <div class="record-time">{{ formatTime(record.duration) }}</div>
          <div class="record-timestamp">{{ formatTimestamp(record.timestamp) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 响应式数据
const currentType = ref('stopwatch') // 'stopwatch' | 'countdown'
const isRunning = ref(false)
const startTime = ref(0)
const elapsedTime = ref(0)
const countdownHours = ref(0)
const countdownMinutes = ref(25) // 默认25分钟番茄钟
const countdownSeconds = ref(0)
const countdownTotalTime = ref(0)
const countdownRemainingTime = ref(0)

// 通知设置
const notificationEnabled = ref(true)
const soundEnabled = ref(true)
const notificationMessage = ref('时间到了！')

// 历史记录
const todayRecords = ref([])

// 定时器
let timer = null

// 计算属性
const displayTime = computed(() => {
  if (currentType.value === 'stopwatch') {
    return elapsedTime.value
  } else {
    return countdownRemainingTime.value
  }
})

// 监听倒计时设置变化
watch([countdownHours, countdownMinutes, countdownSeconds], () => {
  if (!isRunning.value) {
    updateCountdownTime()
  }
})

// 方法
const switchType = (type) => {
  if (isRunning.value) {
    stopTimer()
  }
  currentType.value = type
  resetTimer()
}

const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const startTimer = () => {
  if (currentType.value === 'countdown' && countdownRemainingTime.value === 0) {
    updateCountdownTime()
  }
  
  startTime.value = Date.now() - (currentType.value === 'stopwatch' ? elapsedTime.value * 1000 : 0)
  isRunning.value = true
  
  timer = setInterval(() => {
    if (currentType.value === 'stopwatch') {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000)
    } else {
      const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
      countdownRemainingTime.value = Math.max(0, countdownTotalTime.value - elapsed)
      
      if (countdownRemainingTime.value === 0) {
        onTimerComplete()
      }
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const stopTimer = () => {
  pauseTimer()
  // 记录到历史
  if (currentType.value === 'stopwatch' && elapsedTime.value > 0) {
    addRecord(currentType.value, elapsedTime.value)
  } else if (currentType.value === 'countdown' && countdownRemainingTime.value < countdownTotalTime.value) {
    addRecord(currentType.value, countdownTotalTime.value - countdownRemainingTime.value)
  }
}

const resetTimer = () => {
  stopTimer()
  elapsedTime.value = 0
  if (currentType.value === 'countdown') {
    updateCountdownTime()
  }
}

const updateCountdownTime = () => {
  countdownTotalTime.value = countdownHours.value * 3600 + countdownMinutes.value * 60 + countdownSeconds.value
  countdownRemainingTime.value = countdownTotalTime.value
}

const onTimerComplete = () => {
  stopTimer()
  
  // 发送通知
  if (notificationEnabled.value) {
    showNotification()
  }
  
  // 播放声音
  if (soundEnabled.value) {
    playNotificationSound()
  }
}

const showNotification = () => {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('计时器提醒', {
        body: notificationMessage.value,
        icon: '/icon.png'
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('计时器提醒', {
            body: notificationMessage.value,
            icon: '/icon.png'
          })
        }
      })
    }
  }
}

const playNotificationSound = () => {
  // 创建音频上下文播放提示音
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 1)
}

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const addRecord = (type, duration) => {
  const record = {
    type,
    duration,
    timestamp: Date.now()
  }
  todayRecords.value.unshift(record)
  
  // 保存到本地存储
  saveRecords()
}

const saveRecords = () => {
  const today = new Date().toDateString()
  localStorage.setItem(`timer-records-${today}`, JSON.stringify(todayRecords.value))
}

const loadRecords = () => {
  const today = new Date().toDateString()
  const saved = localStorage.getItem(`timer-records-${today}`)
  if (saved) {
    todayRecords.value = JSON.parse(saved)
  }
}

// 生命周期
onMounted(() => {
  updateCountdownTime()
  loadRecords()
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.timer-container {
  width: 100%;
  height: 100%;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  overflow-y: auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.header {
  text-align: center;
  margin-bottom: 30px;
  padding: 30px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
}

.title {
  font-size: 2.5rem;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  margin: 0;
  opacity: 0.9;
}

.timer-type-selector {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #5a6c7d;
}

.type-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.type-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.type-icon {
  font-size: 1.2rem;
}

.timer-display {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.time-circle {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  border: 8px solid #f8f9fa;
}

.time-text {
  font-size: 3rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.time-label {
  font-size: 1rem;
  color: #5a6c7d;
  font-weight: 500;
}

.countdown-settings {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.countdown-settings h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.time-inputs {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.input-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.input-group label {
  font-size: 0.9rem;
  color: #5a6c7d;
  font-weight: 500;
}

.input-group input {
  width: 60px;
  padding: 8px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 30px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
}

.start-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(40, 167, 69, 0.4);
}

.pause-btn {
  background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%);
  color: white;
}

.pause-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 193, 7, 0.4);
}

.reset-btn {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.reset-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(108, 117, 125, 0.4);
}

.reset-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2rem;
}

.notification-settings {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.notification-settings h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.setting-item {
  margin-bottom: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-size: 1rem;
  color: #2c3e50;
}

.checkbox-label input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #e1e8ed;
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.checkbox-label input[type="checkbox"]:checked + .checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.notification-options {
  margin-left: 32px;
  padding-left: 16px;
  border-left: 2px solid #e1e8ed;
}

.message-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 8px;
}

.message-input:focus {
  outline: none;
  border-color: #667eea;
}

.history-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.history-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.no-records {
  text-align: center;
  color: #5a6c7d;
  font-style: italic;
  padding: 20px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.record-type {
  font-weight: 500;
  color: #2c3e50;
}

.record-time {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #667eea;
}

.record-timestamp {
  font-size: 0.9rem;
  color: #5a6c7d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .timer-container {
    padding: 15px;
  }
  
  .time-circle {
    width: 220px;
    height: 220px;
  }
  
  .time-text {
    font-size: 2.2rem;
  }
  
  .controls {
    flex-direction: column;
    align-items: center;
  }
  
  .control-btn {
    width: 100%;
    max-width: 200px;
  }
  
  .time-inputs {
    flex-direction: column;
    align-items: center;
  }
  
  .record-item {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>