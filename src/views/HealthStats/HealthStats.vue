<template>
  <div class="health-stats">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <i class="icon">📊</i>
        健康统计
      </h1>
      <p class="page-subtitle">查看您的健康数据记录和统计分析</p>
    </div>

    <!-- 统计摘要卡片 -->
    <div class="stats-summary" v-if="summary.totalDays > 0">
      <div class="summary-card">
        <div class="summary-item">
          <div class="summary-value">{{ summary.totalDays }}</div>
          <div class="summary-label">记录天数</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ summary.avgWater }}</div>
          <div class="summary-label">平均饮水</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ summary.avgExercise }}</div>
          <div class="summary-label">平均运动</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">{{ summary.avgRest }}</div>
          <div class="summary-label">平均休息</div>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar" v-if="healthStore.healthHistory.length > 0">
      <div class="toolbar-left">
        <button
          class="btn btn-primary"
          @click="saveToday"
          :disabled="isSavingToday"
        >
          <i class="icon">💾</i>
          {{ isSavingToday ? "保存中..." : "保存今日数据" }}
        </button>

        <button class="btn btn-secondary" @click="toggleSelectMode">
          <i class="icon">{{ isSelectMode ? "✅" : "☑️" }}</i>
          {{ isSelectMode ? "取消选择" : "批量选择" }}
        </button>
      </div>

      <div class="toolbar-right" v-if="isSelectMode">
        <button
          class="btn btn-outline"
          @click="selectAll"
          v-if="selectedIds.length < healthStore.healthHistory.length"
        >
          全选
        </button>
        <button class="btn btn-outline" @click="clearSelection" v-else>
          取消全选
        </button>

        <button
          class="btn btn-danger"
          @click="deleteSelected"
          :disabled="selectedIds.length === 0"
        >
          <i class="icon">🗑️</i>
          删除选中 ({{ selectedIds.length }})
        </button>
      </div>

      <div class="toolbar-right" v-else>
        <button class="btn btn-danger-outline" @click="clearAllData">
          <i class="icon">🗑️</i>
          清空所有数据
        </button>
      </div>
    </div>

    <!-- 数据列表 -->
    <div class="data-list" v-if="healthStore.healthHistory.length > 0">
      <div
        v-for="record in healthStore.healthHistory"
        :key="record.id"
        class="data-item"
        :class="{ selected: selectedIds.includes(record.id) }"
      >
        <!-- 选择框 -->
        <div class="item-checkbox" v-if="isSelectMode">
          <input
            type="checkbox"
            :checked="selectedIds.includes(record.id)"
            @change="toggleSelection(record.id)"
          />
        </div>

        <!-- 日期信息 -->
        <div class="item-date">
          <div class="date-main">{{ formatDate(record.date) }}</div>
          <div class="date-sub">{{ record.dateDisplay }}</div>
        </div>

        <!-- 统计数据 -->
        <div class="item-stats">
          <div class="stat-item">
            <i class="stat-icon">💧</i>
            <span class="stat-value">{{ record.stats.water }}</span>
            <span class="stat-label">饮水</span>
          </div>
          <div class="stat-item">
            <i class="stat-icon">🏃</i>
            <span class="stat-value">{{ record.stats.exercise }}</span>
            <span class="stat-label">运动</span>
          </div>
          <div class="stat-item">
            <i class="stat-icon">😴</i>
            <span class="stat-value">{{ record.stats.rest }}</span>
            <span class="stat-label">休息</span>
          </div>
          <div class="stat-item">
            <i class="stat-icon">🔔</i>
            <span class="stat-value">{{ record.stats.reminderCount }}</span>
            <span class="stat-label">提醒</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="item-actions" v-if="!isSelectMode">
          <button
            class="btn-icon btn-danger"
            @click="deleteSingle(record.id)"
            title="删除此记录"
          >
            <i class="icon">🗑️</i>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">📈</div>
      <h3>暂无健康数据</h3>
      <p>开始记录您的健康数据，建立良好的生活习惯</p>
      <button class="btn btn-primary" @click="saveToday">
        <i class="icon">💾</i>
        保存今日数据
      </button>
    </div>

    <!-- 确认删除对话框 -->
    <div class="modal-overlay" v-if="showDeleteConfirm" @click="cancelDelete">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>确认删除</h3>
        </div>
        <div class="modal-body">
          <p v-if="deleteType === 'single'">确定要删除这条健康记录吗？</p>
          <p v-else-if="deleteType === 'multiple'">
            确定要删除选中的 {{ selectedIds.length }} 条记录吗？
          </p>
          <p v-else>确定要清空所有健康数据吗？此操作不可恢复。</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="cancelDelete">取消</button>
          <button class="btn btn-danger" @click="confirmDelete">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useHealthReminderStore } from "../../store/healthReminder.js";

// Store
const healthStore = useHealthReminderStore();

// 响应式数据
const isSelectMode = ref(false);
const selectedIds = ref([]);
const showDeleteConfirm = ref(false);
const deleteType = ref(""); // 'single', 'multiple', 'all'
const deleteTarget = ref(null);
const isSavingToday = ref(false);

// 计算属性
const summary = computed(() => healthStore.getStatsSummary());

// 方法
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateStr === today.toISOString().split("T")[0]) {
    return "今天";
  } else if (dateStr === yesterday.toISOString().split("T")[0]) {
    return "昨天";
  } else {
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  }
};

const saveToday = async () => {
  isSavingToday.value = true;
  try {
    healthStore.saveTodayToHistory();
    // 简单的成功提示
    setTimeout(() => {
      isSavingToday.value = false;
    }, 500);
  } catch (error) {
    console.error("保存今日数据失败:", error);
    isSavingToday.value = false;
  }
};

const toggleSelectMode = () => {
  isSelectMode.value = !isSelectMode.value;
  if (!isSelectMode.value) {
    selectedIds.value = [];
  }
};

const toggleSelection = (id) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const selectAll = () => {
  selectedIds.value = healthStore.healthHistory.map((item) => item.id);
};

const clearSelection = () => {
  selectedIds.value = [];
};

const deleteSingle = (id) => {
  deleteType.value = "single";
  deleteTarget.value = id;
  showDeleteConfirm.value = true;
};

const deleteSelected = () => {
  if (selectedIds.value.length === 0) return;
  deleteType.value = "multiple";
  deleteTarget.value = [...selectedIds.value];
  showDeleteConfirm.value = true;
};

const clearAllData = () => {
  deleteType.value = "all";
  deleteTarget.value = null;
  showDeleteConfirm.value = true;
};

const confirmDelete = () => {
  try {
    if (deleteType.value === "single") {
      healthStore.deleteHistoryRecord(deleteTarget.value);
    } else if (deleteType.value === "multiple") {
      healthStore.deleteMultipleRecords(deleteTarget.value);
      selectedIds.value = [];
      isSelectMode.value = false;
    } else if (deleteType.value === "all") {
      healthStore.clearAllHistory();
      selectedIds.value = [];
      isSelectMode.value = false;
    }
  } catch (error) {
    console.error("删除数据失败:", error);
  } finally {
    cancelDelete();
  }
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
  deleteType.value = "";
  deleteTarget.value = null;
};

// 生命周期
onMounted(() => {
  // 确保数据已加载
  healthStore.loadHealthHistory();
});
</script>

<style scoped>
.health-stats {
  width: 100%;
  height: 100%;
  padding: 20px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  overflow-y: auto;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 10px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.page-title .icon {
  font-size: 2.2rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin: 0;
}

/* 统计摘要 */
.stats-summary {
  margin-bottom: 30px;
}

.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-outline {
  background: transparent;
  color: #3498db;
  border: 2px solid #3498db;
}

.btn-outline:hover {
  background: #3498db;
  color: white;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
}

.btn-danger-outline {
  background: transparent;
  color: #e74c3c;
  border: 2px solid #e74c3c;
}

.btn-danger-outline:hover {
  background: #e74c3c;
  color: white;
}

.btn-icon {
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.btn-icon.btn-danger {
  color: #e74c3c;
}

.btn-icon.btn-danger:hover {
  background: #e74c3c;
  color: white;
}

/* 数据列表 */
.data-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-item {
  background: white;
  border: 2px solid #ecf0f1;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  transition: all 0.2s ease;
}

.data-item:hover {
  border-color: #3498db;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
}

.data-item.selected {
  border-color: #3498db;
  background: #f8fbff;
}

.item-checkbox {
  display: flex;
  align-items: center;
}

.item-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.item-date {
  min-width: 100px;
}

.date-main {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.date-sub {
  font-size: 0.85rem;
  color: #7f8c8d;
}

.item-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 16px;
  flex: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-icon {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.item-actions {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 1rem;
  margin-bottom: 24px;
}

/* 模态框 */
.modal-overlay {
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

.modal {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px 24px 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #2c3e50;
}

.modal-body {
  padding: 16px 24px;
}

.modal-body p {
  margin: 0;
  color: #7f8c8d;
  line-height: 1.5;
}

.modal-actions {
  padding: 0 24px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 滚动条样式优化 */
.health-stats::-webkit-scrollbar {
  width: 6px;
}

.health-stats::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.health-stats::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.health-stats::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .health-stats {
    padding: 16px;
    min-height: calc(100vh - 32px);
  }

  .page-title {
    font-size: 2rem;
  }

  .summary-card {
    grid-template-columns: repeat(2, 1fr);
    padding: 20px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .data-item {
    grid-template-columns: 1fr;
    gap: 16px;
    text-align: center;
  }

  .item-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .summary-card {
    grid-template-columns: 1fr;
  }

  .item-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
