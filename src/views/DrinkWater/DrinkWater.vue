<template>
  <div class="drink-water-page">
    <!-- 紧凑型页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <span class="page-icon">💧</span>
          <div class="title-text">
            <h1>喝水提醒</h1>
            <p class="subtitle">保持健康饮水习惯</p>
          </div>
        </div>
        <!-- 统计信息移到头部 -->
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">{{ todayWaterCount }}</span>
            <span class="stat-label">今日饮水</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ reminderCount }}</span>
            <span class="stat-label">提醒次数</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="main-content">
      <!-- 左侧：提醒设置 -->
      <div class="reminder-settings">
        <div class="settings-card">
          <h3 class="card-title">
            <span class="title-icon">⚙️</span>
            提醒设置
          </h3>

          <!-- 间隔时间设置 -->
          <div class="setting-group">
            <label class="setting-label">提醒间隔</label>
            <div class="interval-controls">
              <div class="preset-buttons">
                <button
                  v-for="preset in intervalPresets"
                  :key="preset.value"
                  @click="setInterval(preset.value)"
                  :class="[
                    'preset-btn',
                    { active: customInterval === preset.value },
                  ]"
                >
                  {{ preset.label }}
                </button>
              </div>
              <div class="custom-interval">
                <input
                  v-model.number="customInterval"
                  type="number"
                  min="1"
                  max="1440"
                  class="interval-input"
                  @change="updateReminderInterval"
                />
                <span class="interval-unit">分钟</span>
              </div>
            </div>
          </div>

          <!-- 提醒方式设置 -->
          <div class="setting-group">
            <label class="setting-label">提醒方式</label>
            <select v-model="notificationType" class="notification-select">
              <option value="browser">浏览器通知</option>
              <option value="sound">声音提醒</option>
              <option value="both">通知+声音</option>
            </select>
          </div>

          <!-- 提醒消息自定义 -->
          <div class="setting-group">
            <label class="setting-label">提醒消息</label>
            <textarea
              v-model="customMessage"
              class="message-input"
              placeholder="输入自定义提醒消息..."
              rows="2"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 右侧：控制面板 -->
      <div class="control-panel">
        <div class="control-card">
          <h3 class="card-title">
            <span class="title-icon">🎮</span>
            控制面板
          </h3>

          <!-- 主要控制按钮 -->
          <div class="main-controls">
            <button
              @click="toggleReminder"
              :class="[
                'control-btn',
                'toggle-btn',
                { active: isReminderActive },
              ]"
            >
              <span class="btn-icon">{{ isReminderActive ? "⏸️" : "▶️" }}</span>
              <span class="btn-text">{{
                isReminderActive ? "暂停提醒" : "开始提醒"
              }}</span>
            </button>

            <button @click="testReminder" class="control-btn test-btn">
              <span class="btn-icon">🧪</span>
              <span class="btn-text">测试提醒</span>
            </button>
          </div>

          <!-- 状态显示 -->
          <div class="status-display">
            <div class="status-item">
              <div class="status-indicator">
                <div
                  :class="['status-dot', { active: isReminderActive }]"
                ></div>
                <span class="status-text">
                  {{ isReminderActive ? "提醒运行中" : "提醒已暂停" }}
                </span>
              </div>
            </div>

            <div
              v-if="isReminderActive && nextReminderTime"
              class="status-item"
            >
              <span class="next-reminder-label">下次提醒:</span>
              <span class="next-reminder-time">{{
                formatTime(nextReminderTime)
              }}</span>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="quick-actions">
            <button @click="addWaterRecord" class="action-btn primary">
              <span class="btn-icon">➕</span>
              记录饮水
            </button>
            <button @click="resetStats" class="action-btn secondary">
              <span class="btn-icon">🔄</span>
              重置统计
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

// 响应式数据
const todayWaterCount = ref(0);
const reminderCount = ref(0);
const customInterval = ref(30); // 默认30分钟
const customMessage = ref("该喝水了！保持身体水分充足");
const notificationType = ref("browser");
const isReminderActive = ref(false);
const reminderTimer = ref(null);
const nextReminderTime = ref(null);

const intervalPresets = [
  { label: "15分钟", value: 15 },
  { label: "30分钟", value: 30 },
  { label: "45分钟", value: 45 },
  { label: "1小时", value: 60 },
  { label: "2小时", value: 120 },
];

// 设置间隔
const setInterval = (minutes) => {
  customInterval.value = minutes;
  updateReminderInterval();
};

// 更新提醒间隔
const updateReminderInterval = () => {
  saveSettings();
  if (isReminderActive.value) {
    stopReminder();
    startReminder();
  }
};

// 切换提醒状态
const toggleReminder = () => {
  if (isReminderActive.value) {
    stopReminder();
  } else {
    startReminder();
  }
};

// 开始提醒
const startReminder = () => {
  isReminderActive.value = true;
  scheduleNextReminder();
};

// 停止提醒
const stopReminder = () => {
  isReminderActive.value = false;
  if (reminderTimer.value) {
    clearTimeout(reminderTimer.value);
    reminderTimer.value = null;
  }
  nextReminderTime.value = null;
};

// 安排下次提醒
const scheduleNextReminder = () => {
  if (reminderTimer.value) {
    clearTimeout(reminderTimer.value);
  }

  const intervalMs = customInterval.value * 60 * 1000;
  nextReminderTime.value = new Date(Date.now() + intervalMs);

  reminderTimer.value = setTimeout(() => {
    handleRemind();
    if (isReminderActive.value) {
      scheduleNextReminder();
    }
  }, intervalMs);
};

// 测试提醒
const testReminder = () => {
  sendNotification();
};

// 处理提醒事件
const handleRemind = () => {
  reminderCount.value++;
  saveData();
  sendNotification();
};

// 发送通知
const sendNotification = () => {
  const message = customMessage.value;

  // 检查是否在 Electron 环境中
  if (window.electronAPI) {
    // 使用 Electron 的通知
    window.electronAPI.showNotification({
      title: "喝水提醒",
      body: message,
      icon: "path/to/icon.png",
    });
  } else {
    // 使用浏览器的通知 API
    if ("Notification" in window && notificationType.value !== "sound") {
      if (Notification.permission === "granted") {
        new Notification("喝水提醒", {
          body: message,
          icon: "/favicon.ico",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("喝水提醒", {
              body: message,
              icon: "/favicon.ico",
            });
          }
        });
      }
    } else {
      // 降级到 alert
      alert(`喝水提醒: ${message}`);
    }
  }

  // 声音提醒（如果选择了声音或两者）
  if (notificationType.value === "sound" || notificationType.value === "both") {
    playNotificationSound();
  }
};

// 播放提示音
const playNotificationSound = () => {
  // 创建一个简单的提示音
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

// 格式化时间
const formatTime = (date) => {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 添加饮水记录
const addWaterRecord = () => {
  todayWaterCount.value++;
  saveData();
};

// 重置统计
const resetStats = () => {
  todayWaterCount.value = 0;
  reminderCount.value = 0;
  saveData();
};

// 加载数据
const loadData = () => {
  const today = new Date().toDateString();
  const savedData = localStorage.getItem("drinkWaterData");

  if (savedData) {
    const data = JSON.parse(savedData);
    if (data.date === today) {
      todayWaterCount.value = data.waterCount || 0;
      reminderCount.value = data.reminderCount || 0;
    }
  }
};

// 保存数据
const saveData = () => {
  const today = new Date().toDateString();
  const data = {
    date: today,
    waterCount: todayWaterCount.value,
    reminderCount: reminderCount.value,
  };
  localStorage.setItem("drinkWaterData", JSON.stringify(data));
};

// 加载设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem("drinkWaterSettings");
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    customInterval.value = settings.interval || 30;
    customMessage.value = settings.message || "该喝水了！保持身体水分充足";
    notificationType.value = settings.notificationType || "browser";
  }
};

// 保存设置
const saveSettings = () => {
  const settings = {
    interval: customInterval.value,
    message: customMessage.value,
    notificationType: notificationType.value,
  };
  localStorage.setItem("drinkWaterSettings", JSON.stringify(settings));
};

// 组件挂载时的初始化
onMounted(() => {
  // 请求通知权限
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  loadData();
  loadSettings();
});

// 组件卸载前清理
onBeforeUnmount(() => {
  if (reminderTimer.value) {
    clearTimeout(reminderTimer.value);
  }
});

// 监听设置变化并保存
watch([customMessage, notificationType], () => {
  saveSettings();
});
</script>

<style scoped>
.drink-water-page {
  /* 适配导航栏布局 */
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 紧凑型页面头部 */
.page-header {
  flex-shrink: 0;
  margin: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 12px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-icon {
  font-size: 2rem;
}

.title-text h1 {
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 0.9rem;
  margin: 4px 0 0 0;
  opacity: 0.9;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 4px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 12px 12px 12px;
  min-height: 0; /* 允许flex子项收缩 */
}

/* 设置卡片和控制卡片通用样式 */
.settings-card,
.control-card {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow-y: auto;
  min-height: 0; /* 允许内容滚动 */
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.title-icon {
  font-size: 1.1rem;
}

/* 设置组 */
.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.9;
}

/* 间隔控制 */
.interval-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.preset-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.preset-btn.active {
  background: #4caf50;
  border-color: #4caf50;
}

.custom-interval {
  display: flex;
  align-items: center;
  gap: 8px;
}

.interval-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  font-size: 0.9rem;
}

.interval-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.interval-unit {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 选择框和文本域 */
.notification-select,
.message-input {
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.message-input {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.notification-select option {
  background: #333;
  color: white;
}

/* 控制按钮 */
.main-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toggle-btn.active {
  background: #4caf50;
  border-color: #4caf50;
}

.test-btn:hover {
  background: rgba(255, 193, 7, 0.2);
  border-color: rgba(255, 193, 7, 0.5);
}

.btn-icon {
  font-size: 1rem;
}

.btn-text {
  flex: 1;
  text-align: left;
}

/* 状态显示 */
.status-display {
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
}

.status-item {
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  transition: background-color 0.2s ease;
}

.status-dot.active {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.status-text {
  font-size: 0.9rem;
}

.next-reminder-label {
  font-size: 0.8rem;
  opacity: 0.8;
}

.next-reminder-time {
  font-size: 0.9rem;
  font-weight: 500;
  color: #ffd700;
}

/* 快速操作 */
.quick-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: #4caf50;
  color: white;
}

.action-btn.primary:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #ff6b6b;
  color: white;
}

.action-btn.secondary:hover {
  background: #ee5a52;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    margin: 8px;
    margin-bottom: 6px;
    padding: 10px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .header-stats {
    justify-content: center;
  }

  .main-content {
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 0 8px 8px 8px;
  }

  .settings-card,
  .control-card {
    padding: 12px;
  }

  .preset-buttons {
    justify-content: center;
  }

  .quick-actions {
    flex-direction: column;
  }
}

@media (max-height: 600px) {
  .page-header {
    margin: 6px;
    margin-bottom: 4px;
    padding: 8px;
  }

  .header-content {
    gap: 8px;
  }

  .title-text h1 {
    font-size: 1.4rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .stat-number {
    font-size: 1.4rem;
  }

  .main-content {
    gap: 6px;
    margin: 0 6px 6px 6px;
  }

  .settings-card,
  .control-card {
    padding: 10px;
  }

  .card-title {
    font-size: 1rem;
    margin-bottom: 12px;
  }

  .setting-group {
    margin-bottom: 12px;
  }
}

/* 超宽屏幕优化 */
@media (min-width: 1400px) {
  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    margin-bottom: 12px;
  }
}
</style>
