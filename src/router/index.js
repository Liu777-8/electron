// src/router/index.js

import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../views/Home.vue'
import RestReminder from '../views/RestReminder/RestReminder.vue'

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
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router