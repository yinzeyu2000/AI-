import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
        meta: { requiresGuest: true }
    },
    {
        path: '/',
        name: 'Main',
        component: () => import('../views/MainView.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // 初始化认证状态（仅首次）
    if (authStore.user === null && authStore.session === null) {
        await authStore.initAuth()
    }

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

    if (requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (requiresGuest && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router
