<script setup></script>

<template>
  <div id="app">
    <!-- 导航栏 - 只在非首页显示 -->
    <Navigation v-if="!isHomePage" />
    
    <!-- 页面内容 -->
    <div class="page-content" :class="{ 'with-nav': !isHomePage }">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'

// 路由相关
const route = useRoute()

// 判断是否为首页
const isHomePage = computed(() => route.name === 'Home')
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 页面内容容器 */
.page-content {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 有导航栏时的页面内容 */
.page-content.with-nav {
  height: calc(100vh - 60px); /* 减去导航栏高度 */
  margin-top: 0;
}
</style>
