import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(true) // 默认深色模式

    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme')
        if (savedTheme) {
            isDark.value = savedTheme === 'dark'
        }
        applyTheme()
    }

    const toggleTheme = () => {
        isDark.value = !isDark.value
        applyTheme()
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    }

    const applyTheme = () => {
        if (isDark.value) {
            document.documentElement.classList.add('dark')
            document.body.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
            document.body.classList.remove('dark')
        }
    }

    return {
        isDark,
        initTheme,
        toggleTheme
    }
})
