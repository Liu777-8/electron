// src/router/index.js

import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../views/Home.vue'
import RestReminder from '../views/RestReminder/RestReminder.vue'
import HealthStats from '../views/HealthStats/HealthStats.vue'
import Timer from '../views/Timer/Timer.vue'
import NovelDemo from '../modules/novel/views/DemoPage.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/rest-reminder',
    name: 'RestReminder',
    component: RestReminder,
  },
  {
    path: '/health-stats',
    name: 'HealthStats',
    component: HealthStats,
  },
  {
    path: '/timer',
    name: 'Timer',
    component: Timer,
  },
  {
    path: '/novel',
    name: 'Novel',
    component: NovelDemo,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router