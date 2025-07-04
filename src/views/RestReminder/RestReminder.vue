<template>
  <div class="rest-reminder">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">健康提醒</h1>
      <p class="page-subtitle">统一的健康生活提醒助手</p>
    </div>

    <!-- 提醒配置 -->
    <div class="reminder-config">
      <div class="config-card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="title-icon">⏰</span>
            健康提醒设置
          </h2>
        </div>

        <div class="card-content">
          <!-- 今日统计 -->
          <div class="stats-section">
            <h3 class="section-title">今日统计</h3>
            <div class="stats-grid">
              <div
                class="stat-item clickable"
                @click="recordAction('water')"
                title="点击记录饮水"
              >
                <div class="stat-icon">💧</div>
                <div class="stat-value">{{ healthStore.todayStats.water }}</div>
                <div class="stat-label">饮水次数</div>
              </div>
              <div
                class="stat-item clickable"
                @click="recordAction('exercise')"
                title="点击记录运动"
              >
                <div class="stat-icon">🏃‍♂️</div>
                <div class="stat-value">
                  {{ healthStore.todayStats.exercise }}
                </div>
                <div class="stat-label">运动次数</div>
              </div>
              <div
                class="stat-item clickable"
                @click="recordAction('rest')"
                title="点击记录休息"
              >
                <div class="stat-icon">😴</div>
                <div class="stat-value">{{ healthStore.todayStats.rest }}</div>
                <div class="stat-label">休息次数</div>
              </div>

              <div class="stat-item highlight">
                <div class="stat-icon">🔔</div>
                <div class="stat-value">{{ healthStore.reminderCount }}</div>
                <div class="stat-label">提醒次数</div>
              </div>
            </div>
          </div>

          <!-- 提醒设置 -->
          <div class="settings-section">
            <!-- 第一组：提醒间隔 -->
            <div class="settings-row">
              <!-- 提醒间隔选择 -->
              <div class="setting-group full-width">
                <label class="setting-label">提醒间隔</label>
                <div class="interval-cards">
                  <div
                    v-for="interval in intervalOptions"
                    :key="interval.value"
                    :class="[
                      'interval-card',
                      { active: healthStore.customInterval === interval.value },
                    ]"
                    @click="healthStore.customInterval = interval.value"
                  >
                    <div class="interval-time">{{ interval.label }}</div>
                    <div class="interval-desc">{{ interval.desc }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 第二组：休息间隔 -->
            <div class="settings-row">
              <!-- 休息间隔选择 -->
              <div class="setting-group full-width">
                <label class="setting-label">休息间隔</label>
                <div class="interval-cards">
                  <div
                    v-for="restInterval in restIntervalOptions"
                    :key="restInterval.value"
                    :class="[
                      'interval-card',
                      {
                        active: healthStore.restInterval === restInterval.value,
                      },
                    ]"
                    @click="healthStore.restInterval = restInterval.value"
                  >
                    <div class="interval-time">{{ restInterval.label }}</div>
                    <div class="interval-desc">{{ restInterval.desc }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 第二组：提醒内容和控制面板 -->
          <div class="content-control-section">
            <div class="settings-row">
              <!-- 提醒内容预览 -->
              <div class="setting-group half-width">
                <label class="setting-label">提醒内容</label>
                <div class="reminder-preview">
                  <div class="preview-card">
                    <div class="preview-title">健康提醒</div>
                    <div class="preview-content">
                      {{ healthStore.reminderMessage }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- 控制面板 -->
              <div class="setting-group half-width">
                <label class="setting-label">控制面板</label>

                <!-- 主要控制按钮 -->
                <div class="main-control-buttons">
                  <button
                    :class="[
                      'control-btn',
                      'primary',
                      { active: healthStore.isReminderActive },
                    ]"
                    @click="healthStore.toggleReminder"
                  >
                    <span class="btn-icon">{{
                      healthStore.isReminderActive ? "⏸️" : "▶️"
                    }}</span>
                    {{ healthStore.isReminderActive ? "暂停提醒" : "开始提醒" }}
                  </button>

                  <button
                    class="control-btn secondary"
                    @click="healthStore.testReminder"
                  >
                    <span class="btn-icon">🔔</span>
                    测试提醒
                  </button>
                </div>

                <!-- 提醒状态 -->
                <div class="status-info">
                  <div class="status-item">
                    <span class="status-label">状态：</span>
                    <span
                      :class="[
                        'status-value',
                        healthStore.isReminderActive ? 'active' : 'inactive',
                      ]"
                    >
                      {{ healthStore.isReminderActive ? "运行中" : "已停止" }}
                    </span>
                  </div>

                  <!-- 当前阶段显示 -->
                  <div class="status-item" v-if="healthStore.isReminderActive">
                    <span class="status-label">当前阶段：</span>
                    <span
                      :class="[
                        'status-value',
                        'phase-indicator',
                        healthStore.currentPhase === 'reminding'
                          ? 'reminding-phase'
                          : 'resting-phase',
                      ]"
                    >
                      {{
                        healthStore.currentPhase === "reminding"
                          ? "⏰ 提醒间隔"
                          : "😴 休息间隔"
                      }}
                    </span>
                  </div>

                  <div
                    class="status-item"
                    v-if="
                      healthStore.isReminderActive &&
                      healthStore.nextReminderTime
                    "
                  >
                    <span class="status-label">{{
                      healthStore.currentPhase === "reminding"
                        ? "下次提醒："
                        : "休息结束："
                    }}</span>
                    <span class="status-value">{{
                      healthStore.formatTime(healthStore.nextReminderTime)
                    }}</span>
                    <span
                      class="countdown-display"
                      v-if="healthStore.countdown"
                    >
                      ({{ healthStore.countdown }})
                    </span>
                  </div>
                </div>

                <!-- 提醒方式选择 -->
                <div class="notification-section">
                  <div class="notification-select">
                    <select
                      v-model="healthStore.notificationType"
                      class="notification-dropdown"
                    >
                      <option value="notification">系统通知</option>
                      <option value="sound">声音提醒</option>
                      <option value="both">通知+声音</option>
                    </select>
                  </div>
                </div>

                <!-- 重置按钮 -->
                <div class="reset-section">
                  <button class="control-btn reset" @click="handleResetStats">
                    <span class="btn-icon">🔄</span>
                    重置统计
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useHealthReminderStore } from "@/store/healthReminder.js";

// 使用全局健康提醒状态管理
const healthStore = useHealthReminderStore();

// 注意：不要解构响应式状态，直接使用 store 对象以保持响应性

// 提醒间隔选项配置
const intervalOptions = [
  { value: 1, label: "1分钟", desc: "测试模式" },
  { value: 15, label: "15分钟", desc: "高频提醒" },
  { value: 30, label: "30分钟", desc: "标准间隔" },
  { value: 45, label: "45分钟", desc: "适中频率" },
  { value: 60, label: "60分钟", desc: "低频提醒" },
];

// 休息间隔选项配置
const restIntervalOptions = [
  { value: 5, label: "5分钟", desc: "短暂休息" },
  { value: 10, label: "10分钟", desc: "快速恢复" },
  { value: 15, label: "15分钟", desc: "标准休息" },
  { value: 20, label: "20分钟", desc: "充分休息" },
  { value: 30, label: "30分钟", desc: "深度休息" },
];

// 重置统计（添加确认对话框）
const handleResetStats = () => {
  if (confirm("确定要重置今日统计数据吗？")) {
    healthStore.resetStats();
  }
};

// 记录动作
const recordAction = (actionType) => {
  healthStore.recordAction(actionType);
};

// 组件挂载时的初始化
onMounted(() => {
  // 恢复定时器状态（如果之前有运行中的定时器）
  healthStore.restoreTimerState();
  console.log("健康提醒模块已加载，定时器状态已恢复");

  // 设置定期自动保存（每5分钟保存一次今日数据）
  const autoSaveInterval = setInterval(() => {
    // 只有当今日有数据时才保存
    const { water, exercise, rest } = healthStore.todayStats;
    if (
      water > 0 ||
      exercise > 0 ||
      rest > 0 ||
      healthStore.reminderCount > 0
    ) {
      healthStore.saveTodayToHistory();
      console.log("自动保存今日健康数据");
    }
  }, 5 * 60 * 1000); // 5分钟

  // 页面卸载时清除定时器
  onUnmounted(() => {
    clearInterval(autoSaveInterval);
  });
});

// 组件卸载时的处理
onUnmounted(() => {
  // 不清除定时器，让它在后台继续运行
  // 这样即使切换页面，定时器也会继续工作
  console.log("健康提醒模块已卸载，但定时器继续在后台运行");
});
</script>

<style scoped>
.rest-reminder {
  width: 100%;
  height: 100%;
  font-family: "Arial", sans-serif;
  overflow-y: auto;
  padding: 16px;
  background: #f8f9fa;
  box-sizing: border-box;
}

/* 页面头部 */
.page-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.page-title {
  font-size: 1.8rem;
  margin: 0 0 6px 0;
  font-weight: 600;
}

.page-subtitle {
  font-size: 0.95rem;
  margin: 0;
  opacity: 0.9;
}

/* 配置卡片 */
.reminder-config {
  width: 100%;
}

.config-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.title-icon {
  font-size: 1.4rem;
}

.card-content {
  padding: 20px;
}

/* 各个部分的通用样式 */
.section-title {
  color: #2c3e50;
  font-size: 1.1rem;
  margin: 0 0 12px 0;
  font-weight: 600;
  border-bottom: 2px solid #e1e8ed;
  padding-bottom: 6px;
}

/* 统计部分 */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e1e8ed;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 可点击的统计卡片样式 */
.stat-item.clickable {
  cursor: pointer;
  user-select: none;
}

.stat-item.clickable:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.2);
}

.stat-item.clickable:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.stat-item.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.stat-icon {
  font-size: 1.2rem;
  margin-bottom: 6px;
  display: block;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-item.highlight .stat-value {
  color: white;
}

.stat-label {
  color: #5a6c7d;
  font-size: 0.8rem;
  font-weight: 500;
}

.stat-item.highlight .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

/* 设置部分 */
.settings-section {
  margin-bottom: 24px;
}

/* 内容控制部分 */
.content-control-section {
  margin-bottom: 24px;
}

/* 横向排列的设置行 */
.settings-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.setting-group {
  margin-bottom: 16px;
}

/* 半宽度设置组 */
.setting-group.half-width {
  flex: 1;
  margin-bottom: 0;
}

/* 全宽度设置组 */
.setting-group.full-width {
  width: 100%;
  margin-bottom: 0;
}

.setting-label {
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

/* 当前间隔显示 */
.current-interval {
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  padding: 12px;
}

.interval-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}

.interval-value {
  font-weight: 600;
  color: #667eea;
  font-size: 1.1rem;
}

.interval-note {
  color: #5a6c7d;
  font-size: 0.85rem;
}

/* 间隔卡片选择器 */
.interval-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.interval-card {
  flex: 1;
  min-width: 100px;
  padding: 16px 12px;
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.interval-card:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.interval-card.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.interval-card.active:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.interval-time {
  font-size: 1.1rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.interval-card.active .interval-time {
  color: white;
}

.interval-desc {
  font-size: 0.8rem;
  color: #5a6c7d;
  font-weight: 500;
}

.interval-card.active .interval-desc {
  color: rgba(255, 255, 255, 0.9);
}

/* 通知选择器 */
.notification-select {
  width: 100%;
}

.notification-dropdown {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-dropdown:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.notification-dropdown:hover {
  border-color: #667eea;
}

/* 提醒预览 */
.reminder-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e1e8ed;
}

.preview-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.preview-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-title::before {
  content: "⏰";
  font-size: 1.2rem;
}

.preview-content {
  color: #5a6c7d;
  line-height: 1.6;
  font-size: 0.9rem;
  white-space: pre-line;
}

/* 主要控制按钮 */
.main-control-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  justify-content: center;
  width: 100%;
}

.control-btn.primary {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.control-btn.primary.active {
  background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
}

.control-btn.secondary {
  background: #6c757d;
  color: white;
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.control-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  font-size: 1.1rem;
}

/* 提醒方式选择部分 */
.notification-section {
  margin-top: 16px;
  margin-bottom: 16px;
}

.notification-label {
  display: block;
  color: #2c3e50;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.notification-section .notification-select {
  width: 100%;
}

.notification-section .notification-dropdown {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  color: #2c3e50;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-section .notification-dropdown:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.notification-section .notification-dropdown:hover {
  border-color: #667eea;
}

/* 重置按钮部分 */
.reset-section {
  margin-top: 0;
}

.control-btn.reset {
  background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
  width: 100%;
}

/* 状态信息 */
.status-info {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e1e8ed;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 0.85rem;
}

.status-item:last-child {
  margin-bottom: 0;
}

/* 阶段指示器样式 */
.phase-indicator {
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
}

.reminding-phase {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.resting-phase {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.status-label {
  font-weight: 600;
  color: #2c3e50;
  margin-right: 6px;
}

.status-value {
  font-weight: 500;
}

.status-value.active {
  color: #28a745;
}

.status-value.inactive {
  color: #dc3545;
}

/* 倒计时显示 */
.countdown-display {
  margin-left: 8px;
  color: #667eea;
  font-weight: 600;
  font-size: 0.9rem;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .rest-reminder {
    padding: 12px;
  }

  .page-header {
    padding: 16px 12px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .card-content {
    padding: 16px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  /* 在小屏幕上改为垂直布局 */
  .settings-row {
    flex-direction: column;
    gap: 16px;
  }

  .setting-group.half-width {
    margin-bottom: 16px;
  }

  /* 间隔卡片在小屏幕上的适配 */
  .interval-cards {
    gap: 8px;
  }

  /* 倒计时在小屏幕上的适配 */
  .countdown-display {
    font-size: 0.8rem;
    padding: 1px 6px;
    margin-left: 6px;
  }

  .status-item {
    flex-wrap: wrap;
    gap: 4px;
  }

  .interval-card {
    min-width: 80px;
    padding: 12px 8px;
  }

  .interval-time {
    font-size: 1rem;
  }

  .interval-desc {
    font-size: 0.75rem;
  }

  .main-control-buttons {
    flex-direction: row;
    gap: 8px;
  }

  .control-btn {
    flex: 1;
    font-size: 0.8rem;
    padding: 10px 16px;
  }
}
</style>
