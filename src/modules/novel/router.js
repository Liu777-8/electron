// 小说模块路由配置

import NovelHome from './views/NovelHome.vue'
import NovelLibrary from './views/NovelLibrary.vue'
import NovelSettings from './views/NovelSettings.vue'
import OnlineReading from './views/OnlineReading.vue'

// 创建小说模块路由
export function createNovelRoutes() {
  return [
    {
      path: '/novel',
      name: 'NovelHome',
      component: NovelHome,
      meta: {
        title: '小说阅读',
        icon: 'book',
        requiresAuth: false
      }
    },
    {
      path: '/novel/library',
      name: 'NovelLibrary',
      component: NovelLibrary,
      meta: {
        title: '我的书库',
        icon: 'library',
        requiresAuth: false
      }
    },
    {
      path: '/novel/online',
      name: 'OnlineReading',
      component: OnlineReading,
      meta: {
        title: '在线阅读',
        icon: 'globe',
        requiresAuth: false
      }
    },
    {
      path: '/novel/settings',
      name: 'NovelSettings',
      component: NovelSettings,
      meta: {
        title: '阅读设置',
        icon: 'settings',
        requiresAuth: false
      }
    }
  ]
}

// 路由守卫
export function setupNovelRouteGuards(router) {
  // 小说模块特定的路由守卫
  router.beforeEach((to, from, next) => {
    // 检查是否是小说模块路由
    if (to.path.startsWith('/novel')) {
      // 可以在这里添加小说模块特定的逻辑
      // 例如：检查阅读权限、初始化阅读环境等
      console.log('进入小说模块:', to.name)
    }
    next()
  })
}