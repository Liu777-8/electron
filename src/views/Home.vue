<template>
  <div class="home">
    <!-- 页面头部 -->
    <div class="header">
      <h1 class="title">健康助手</h1>
      <p class="subtitle">让我们一起养成健康的生活习惯</p>
    </div>

    <!-- 功能模块卡片 -->
    <div class="modules-grid">
      <!-- 喝水提醒模块 -->
      <div class="module-card" @click="navigateTo('/drink-water')">
        <div class="module-icon">💧</div>
        <h3 class="module-title">喝水提醒</h3>
        <p class="module-description">定时提醒您保持充足的水分摄入</p>
        <div class="module-status">
          <span class="status-badge">可用</span>
        </div>
      </div>

      <!-- 预留的其他提醒模块 -->
      <div class="module-card coming-soon">
        <div class="module-icon">🏃‍♂️</div>
        <h3 class="module-title">运动提醒</h3>
        <p class="module-description">提醒您定时进行运动锻炼</p>
        <div class="module-status">
          <span class="status-badge coming">即将推出</span>
        </div>
      </div>

      <div class="module-card coming-soon">
        <div class="module-icon">😴</div>
        <h3 class="module-title">休息提醒</h3>
        <p class="module-description">提醒您适时休息，保护视力</p>
        <div class="module-status">
          <span class="status-badge coming">即将推出</span>
        </div>
      </div>

      <div class="module-card coming-soon">
        <div class="module-icon">🍎</div>
        <h3 class="module-title">饮食提醒</h3>
        <p class="module-description">提醒您按时用餐，保持营养均衡</p>
        <div class="module-status">
          <span class="status-badge coming">即将推出</span>
        </div>
      </div>
    </div>

    <!-- 快速操作区 -->
    <div class="quick-actions">
      <h2>快速操作</h2>
      <div class="actions-grid">
        <button class="action-btn" @click="navigateTo('/drink-water')">
          <span class="action-icon">🚀</span>
          开始喝水提醒
        </button>
        <button class="action-btn" disabled>
          <span class="action-icon">⚙️</span>
          设置中心
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

// 获取路由实例
const router = useRouter();

// 导航方法
const navigateTo = (path) => {
  router.push(path);
};
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
  font-family: "Arial", sans-serif;
  overflow-y: auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  margin-bottom: 40px;
}

.title {
  font-size: 3rem;
  margin: 0 0 10px 0;
  font-weight: 700;
}

.subtitle {
  font-size: 1.2rem;
  margin: 0;
  opacity: 0.9;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 50px;
}

.module-card {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e8ed;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.module-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.module-card.coming-soon {
  opacity: 0.7;
  cursor: not-allowed;
}

.module-card.coming-soon:hover {
  transform: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.module-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  display: block;
}

.module-title {
  color: #2c3e50;
  font-size: 1.5rem;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.module-description {
  color: #5a6c7d;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.module-status {
  position: absolute;
  top: 20px;
  right: 20px;
}

.status-badge {
  background: #28a745;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.coming {
  background: #ffc107;
  color: #212529;
}

.quick-actions {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 30px;
  text-align: center;
}

.quick-actions h2 {
  color: #2c3e50;
  margin: 0 0 24px 0;
  font-size: 1.8rem;
}

.actions-grid {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 160px;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.action-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.action-icon {
  font-size: 1.2rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .home {
    padding: 15px;
  }

  .header {
    padding: 30px 20px;
  }

  .title {
    font-size: 2.2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .modules-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .module-card {
    padding: 24px;
  }

  .actions-grid {
    flex-direction: column;
    align-items: center;
  }

  .action-btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>
