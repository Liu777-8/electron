import { defineStore } from "pinia";
import { ref, computed } from "vue";

/**
 * 健康提醒全局状态管理
 * 用于在页面切换时保持定时器状态的持久化
 */
export const useHealthReminderStore = defineStore("healthReminder", () => {
  // ===== 基础状态 =====
  // 今日统计数据
  const todayStats = ref({
    water: 0, // 饮水次数
    exercise: 0, // 运动次数
    rest: 0, // 休息次数
  });

  // 历史统计数据（本地存储）
  const healthHistory = ref([]);
  
  // 本地存储键名
  const STORAGE_KEY = 'health_statistics_data';

  // 提醒设置
  const customInterval = ref(45); // 提醒间隔（分钟）
  const restInterval = ref(15); // 休息间隔（分钟）
  const notificationType = ref("notification"); // 提醒方式
  const isReminderActive = ref(false); // 提醒是否激活
  const nextReminderTime = ref(null); // 下次提醒时间
  const reminderCount = ref(0); // 今日提醒次数
  const countdown = ref(""); // 倒计时显示
  const isRestPeriod = ref(false); // 是否处于休息期间
  const currentPhase = ref("waiting"); // 当前阶段：waiting(等待开始), reminding(提醒间隔), resting(休息间隔)

  // ===== 定时器管理 =====
  // 全局定时器变量（不使用ref，避免响应式开销）
  let reminderTimer = null;
  let countdownTimer = null;

  // ===== 计算属性 =====
  // 统一的提醒消息
  const reminderMessage = computed(() => {
    return `💧 记得喝水，保持身体水分充足\n🏃‍♂️ 适当运动，增强身体活力\n😴 注意休息，保护视力缓解疲劳\n😄让我们一起养成健康的生活习惯！`;
  });

  // ===== 核心功能方法 =====
  /**
   * 开始健康提醒
   */
  const startReminder = () => {
    isReminderActive.value = true;
    currentPhase.value = "reminding"; // 开始时进入提醒间隔阶段
    isRestPeriod.value = false;
    scheduleNextReminder();
    console.log("健康提醒已启动");
  };

  /**
   * 停止健康提醒
   */
  const stopReminder = () => {
    isReminderActive.value = false;
    nextReminderTime.value = null;
    countdown.value = "";
    currentPhase.value = "waiting"; // 重置阶段状态
    isRestPeriod.value = false; // 重置休息状态

    // 清除定时器
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      reminderTimer = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    console.log("健康提醒已停止");
  };

  /**
   * 切换提醒状态
   */
  const toggleReminder = () => {
    if (isReminderActive.value) {
      stopReminder();
    } else {
      startReminder();
    }
  };

  /**
   * 安排下次提醒
   */
  const scheduleNextReminder = () => {
    if (!isReminderActive.value) return;

    // 根据当前阶段设置不同的间隔时间
    let intervalMs;
    if (currentPhase.value === "reminding" || currentPhase.value === "waiting") {
      // 提醒间隔阶段
      intervalMs = customInterval.value * 60 * 1000;
      currentPhase.value = "reminding";
      isRestPeriod.value = false;
    } else {
      // 休息间隔阶段
      intervalMs = restInterval.value * 60 * 1000;
      currentPhase.value = "resting";
      isRestPeriod.value = true;
    }

    nextReminderTime.value = new Date(Date.now() + intervalMs);

    // 启动倒计时
    startCountdown();

    // 设置定时器
    reminderTimer = setTimeout(() => {
      if (currentPhase.value === "reminding") {
        // 提醒间隔结束，触发提醒
        handleRemind();
        if (isReminderActive.value) {
          // 切换到休息间隔
          currentPhase.value = "resting";
          scheduleNextReminder();
        }
      } else if (currentPhase.value === "resting") {
        // 休息间隔结束，切换回提醒间隔
        currentPhase.value = "reminding";
        if (isReminderActive.value) {
          scheduleNextReminder();
        }
      }
    }, intervalMs);
  };

  /**
   * 处理提醒事件
   */
  const handleRemind = () => {
    // 增加提醒次数
    reminderCount.value++;

    // 发送通知
    sendNotification("健康提醒", reminderMessage.value, "⏰");

    // 播放提示音
    if (
      notificationType.value === "sound" ||
      notificationType.value === "both"
    ) {
      playNotificationSound();
    }

    // 自动保存今日数据到历史记录
    // 只有当今日有数据时才保存（避免空数据污染历史记录）
    const { water, exercise, rest } = todayStats.value;
    if (water > 0 || exercise > 0 || rest > 0 || reminderCount.value > 0) {
      saveTodayToHistory();
      console.log('提醒后自动保存今日健康数据到历史记录');
    }
  };

  /**
   * 测试提醒功能
   */
  const testReminder = () => {
    sendNotification("健康提醒（测试）", reminderMessage.value, "⏰");

    if (
      notificationType.value === "sound" ||
      notificationType.value === "both"
    ) {
      playNotificationSound();
    }
  };

  /**
   * 发送系统通知
   */
  const sendNotification = (title, body, icon) => {
    if (notificationType.value === "sound") return;

    // 检查是否在 Electron 环境中
    if (window.electronAPI && window.electronAPI.showNotification) {
      window.electronAPI.showNotification({
        title,
        body,
        icon,
      });
    } else {
      // 浏览器环境
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification(title, { body, icon });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification(title, { body, icon });
            }
          });
        }
      }
    }
  };

  /**
   * 播放提示音
   */
  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch((e) => {
        console.log("无法播放提示音:", e);
      });
    } catch (e) {
      console.log("提示音播放失败:", e);
    }
  };

  /**
   * 启动倒计时
   */
  const startCountdown = () => {
    // 清除之前的倒计时定时器
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }

    // 立即更新一次倒计时
    updateCountdown();

    // 每秒更新倒计时
    countdownTimer = setInterval(() => {
      updateCountdown();
    }, 1000);
  };

  /**
   * 更新倒计时显示
   */
  const updateCountdown = () => {
    if (!nextReminderTime.value || !isReminderActive.value) {
      countdown.value = "";
      return;
    }

    const now = new Date();
    const timeDiff = nextReminderTime.value.getTime() - now.getTime();

    if (timeDiff <= 0) {
      countdown.value = currentPhase.value === "reminding" ? "即将提醒" : "休息结束";
      return;
    }

    // 计算剩余时间
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    // 根据当前阶段显示不同的前缀
    const phasePrefix = currentPhase.value === "reminding" ? "提醒倒计时: " : "休息倒计时: ";

    // 格式化倒计时显示（带单位）
    let timeStr;
    if (hours > 0) {
      timeStr = `${hours}小时${minutes}分${seconds}秒`;
    } else if (minutes > 0) {
      timeStr = `${minutes}分${seconds}秒`;
    } else {
      timeStr = `${seconds}秒`;
    }
    
    countdown.value = phasePrefix + timeStr;
  };

  /**
   * 格式化时间（精确到秒，带单位）
   */
  const formatTime = (date) => {
    if (!date) return "";
    const timeStr = date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    // 为时间添加单位
    const parts = timeStr.split(":");
    return `${parts[0]}时${parts[1]}分${parts[2]}秒`;
  };

  // ===== 统计相关方法 =====
  /**
   * 记录健康行为
   */
  const recordAction = (type) => {
    if (todayStats.value[type] !== undefined) {
      todayStats.value[type]++;
      console.log(`已记录${getActionName(type)}操作`);
    }
  };

  /**
   * 获取操作名称
   */
  const getActionName = (type) => {
    const names = {
      water: "饮水",
      exercise: "运动",
      rest: "休息",
    };
    return names[type] || type;
  };

  /**
   * 重置统计数据
   */
  const resetStats = () => {
    todayStats.value.water = 0;
    todayStats.value.exercise = 0;
    todayStats.value.rest = 0;
    reminderCount.value = 0;
    console.log("统计数据已重置");
  };

  // ===== 状态恢复方法 =====
  /**
   * 恢复定时器状态（用于页面重新进入时）
   */
  const restoreTimerState = () => {
    if (isReminderActive.value && nextReminderTime.value) {
      const now = new Date();
      const timeDiff = nextReminderTime.value.getTime() - now.getTime();

      if (timeDiff > 0) {
        // 如果还有剩余时间，重新设置定时器
        reminderTimer = setTimeout(() => {
          handleRemind();
          if (isReminderActive.value) {
            scheduleNextReminder();
          }
        }, timeDiff);

        // 重新启动倒计时
        startCountdown();
        console.log("定时器状态已恢复");
      } else {
        // 如果时间已过，立即触发提醒并安排下次
        handleRemind();
        if (isReminderActive.value) {
          scheduleNextReminder();
        }
      }
    }
  };

  // ===== 健康统计数据管理 =====
  /**
   * 从本地存储加载历史数据
   */
  const loadHealthHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        healthHistory.value = JSON.parse(stored);
        console.log('健康统计数据已加载', healthHistory.value.length, '条记录');
      }
    } catch (error) {
      console.error('加载健康统计数据失败:', error);
      healthHistory.value = [];
    }
  };

  /**
   * 保存当天数据到历史记录
   */
  const saveTodayToHistory = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 格式
    
    // 检查今天是否已有记录
    const existingIndex = healthHistory.value.findIndex(item => item.date === dateStr);
    
    const todayRecord = {
      id: existingIndex >= 0 ? healthHistory.value[existingIndex].id : Date.now(),
      date: dateStr,
      dateDisplay: today.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }),
      stats: {
        water: todayStats.value.water,
        exercise: todayStats.value.exercise,
        rest: todayStats.value.rest,
        reminderCount: reminderCount.value
      },
      timestamp: today.getTime()
    };
    
    if (existingIndex >= 0) {
      // 更新现有记录
      healthHistory.value[existingIndex] = todayRecord;
    } else {
      // 添加新记录
      healthHistory.value.unshift(todayRecord);
    }
    
    // 保存到本地存储
    saveHealthHistory();
    console.log('今日数据已保存到历史记录');
  };

  /**
   * 保存历史数据到本地存储
   */
  const saveHealthHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(healthHistory.value));
    } catch (error) {
      console.error('保存健康统计数据失败:', error);
    }
  };

  /**
   * 删除单条历史记录
   */
  const deleteHistoryRecord = (id) => {
    const index = healthHistory.value.findIndex(item => item.id === id);
    if (index >= 0) {
      healthHistory.value.splice(index, 1);
      saveHealthHistory();
      console.log('已删除历史记录:', id);
      return true;
    }
    return false;
  };

  /**
   * 批量删除历史记录
   */
  const deleteMultipleRecords = (ids) => {
    const deletedCount = ids.filter(id => {
      const index = healthHistory.value.findIndex(item => item.id === id);
      if (index >= 0) {
        healthHistory.value.splice(index, 1);
        return true;
      }
      return false;
    }).length;
    
    if (deletedCount > 0) {
      saveHealthHistory();
      console.log('已删除', deletedCount, '条历史记录');
    }
    return deletedCount;
  };

  /**
   * 清空所有历史记录
   */
  const clearAllHistory = () => {
    healthHistory.value = [];
    saveHealthHistory();
    console.log('已清空所有历史记录');
  };

  /**
   * 获取统计摘要
   */
  const getStatsSummary = () => {
    const total = healthHistory.value.length;
    if (total === 0) {
      return {
        totalDays: 0,
        avgWater: 0,
        avgExercise: 0,
        avgRest: 0,
        avgReminders: 0,
        totalWater: 0,
        totalExercise: 0,
        totalRest: 0,
        totalReminders: 0
      };
    }
    
    const totals = healthHistory.value.reduce((acc, record) => {
      acc.water += record.stats.water;
      acc.exercise += record.stats.exercise;
      acc.rest += record.stats.rest;
      acc.reminderCount += record.stats.reminderCount;
      return acc;
    }, { water: 0, exercise: 0, rest: 0, reminderCount: 0 });
    
    return {
      totalDays: total,
      avgWater: Math.round(totals.water / total * 10) / 10,
      avgExercise: Math.round(totals.exercise / total * 10) / 10,
      avgRest: Math.round(totals.rest / total * 10) / 10,
      avgReminders: Math.round(totals.reminderCount / total * 10) / 10,
      totalWater: totals.water,
      totalExercise: totals.exercise,
      totalRest: totals.rest,
      totalReminders: totals.reminderCount
    };
  };

  // 初始化时加载历史数据
  loadHealthHistory();

  // ===== 导出状态和方法 =====
  return {
    // 状态
    todayStats,
    customInterval,
    restInterval,
    notificationType,
    isReminderActive,
    nextReminderTime,
    reminderCount,
    countdown,
    reminderMessage,
    healthHistory,
    isRestPeriod,
    currentPhase,

    // 核心方法
    startReminder,
    stopReminder,
    toggleReminder,
    testReminder,
    formatTime,

    // 统计方法
    recordAction,
    resetStats,

    // 状态恢复
    restoreTimerState,

    // 健康统计数据管理
    loadHealthHistory,
    saveTodayToHistory,
    saveHealthHistory,
    deleteHistoryRecord,
    deleteMultipleRecords,
    clearAllHistory,
    getStatsSummary,
  };
});
