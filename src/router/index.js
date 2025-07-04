// src/router/index.js

import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../views/Home.vue'
import RestReminder from '../views/RestReminder/RestReminder.vue'
import HealthStats from '../views/HealthStats/HealthStats.vue'

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
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router