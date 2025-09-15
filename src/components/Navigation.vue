<template>
  <div class="navigation-bar">
    <div class="nav-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <button
          class="breadcrumb-item home"
          @click="navigateToHome"
          :class="{ active: isHome }"
        >
          <span class="breadcrumb-icon">🏠</span>
          <span class="breadcrumb-text">首页</span>
        </button>

        <span v-if="!isHome" class="breadcrumb-separator">></span>

        <span v-if="!isHome" class="breadcrumb-item current">
          <span class="breadcrumb-icon">{{ currentPageIcon }}</span>
          <span class="breadcrumb-text">{{ currentPageTitle }}</span>
        </span>
      </div>

      <!-- 返回按钮 -->
      <button
        v-if="!isHome"
        class="back-button"
        @click="goBack"
        title="返回上一页"
      >
        <span class="back-icon">←</span>
        <span class="back-text">返回</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

// 路由相关
const router = useRouter();
const route = useRoute();

// 页面配置映射
const pageConfig = {
  Home: { title: "首页", icon: "🏠" },
  HealthStats: { title: "健康统计", icon: "💧" },
  RestReminder: { title: "休息提醒", icon: "⏰" },
  Novel: { title: "小说阅读", icon: "📚" },
};

// 计算属性
const isHome = computed(() => route.name === "Home");
const currentPageTitle = computed(() => {
  return pageConfig[route.name]?.title || "未知页面";
});
const currentPageIcon = computed(() => {
  return pageConfig[route.name]?.icon || "📄";
});

// 导航方法
const navigateToHome = () => {
  router.push("/");
};

const goBack = () => {
  // 优先使用浏览器历史记录返回
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    // 如果没有历史记录，则返回首页
    router.push("/");
  }
};
</script>

<style scoped>
/* 导航栏容器 */
.navigation-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

/* 导航内容 */
.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  width: 100%;
}

/* 面包屑导航 */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  color: rgba(255, 255, 255, 0.9);
}

.breadcrumb-item.home {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.breadcrumb-item.home:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.breadcrumb-item.home.active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.breadcrumb-item.current {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-weight: 600;
}

.breadcrumb-separator {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: bold;
}

.breadcrumb-icon {
  font-size: 16px;
}

.breadcrumb-text {
  font-size: 14px;
}

/* 返回按钮 */
.back-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.back-icon {
  font-size: 16px;
  font-weight: bold;
}

.back-text {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-content {
    padding: 10px 16px;
  }

  .breadcrumb-item {
    padding: 4px 8px;
    font-size: 12px;
  }

  .breadcrumb-text {
    display: none;
  }

  .back-button {
    padding: 6px 12px;
    font-size: 12px;
  }

  .back-text {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-content {
    padding: 8px 12px;
  }

  .breadcrumb-item {
    padding: 4px 6px;
  }

  .back-button {
    padding: 4px 8px;
  }
}
</style>
