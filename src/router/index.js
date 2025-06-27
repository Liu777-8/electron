// src/router/index.js

import { createRouter, createWebHashHistory } from 'vue-router'

import Home from '../views/Home.vue'
import DrinkWater from '../views/DrinkWater/DrinkWater.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/drink-water',
    name: 'DrinkWater',
    component: DrinkWater,
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router