import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../config/supabase'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const session = ref(null)
    const loading = ref(false)

    const isAuthenticated = computed(() => !!user.value)

    // 初始化认证状态
    const initAuth = async () => {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        session.value = currentSession
        user.value = currentSession?.user ?? null

        // 监听认证状态变化
        supabase.auth.onAuthStateChange((_event, newSession) => {
            session.value = newSession
            user.value = newSession?.user ?? null
        })
    }

    // 登录
    const signIn = async (email, password) => {
        try {
            loading.value = true
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) throw error

            session.value = data.session
            user.value = data.user
            ElMessage.success('登录成功')
            return { data, error: null }
        } catch (error) {
            ElMessage.error(error.message || '登录失败')
            return { data: null, error }
        } finally {
            loading.value = false
        }
    }

    // 注册
    const signUp = async (email, password) => {
        try {
            loading.value = true
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) throw error

            ElMessage.success('注册成功，请查收邮件确认')
            return { data, error: null }
        } catch (error) {
            ElMessage.error(error.message || '注册失败')
            return { data: null, error }
        } finally {
            loading.value = false
        }
    }

    // 登出
    const signOut = async () => {
        try {
            loading.value = true
            const { error } = await supabase.auth.signOut()
            if (error) throw error

            user.value = null
            session.value = null
            ElMessage.success('已退出登录')
        } catch (error) {
            ElMessage.error(error.message || '退出失败')
        } finally {
            loading.value = false
        }
    }

    return {
        user,
        session,
        loading,
        isAuthenticated,
        initAuth,
        signIn,
        signUp,
        signOut
    }
})
