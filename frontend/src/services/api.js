import axios from 'axios'
import { supabase } from '../config/supabase'

// 创建 axios 实例
const apiClient = axios.create({
    baseURL: '/api',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器 - 添加认证 token
apiClient.interceptors.request.use(
    async (config) => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        return response.data
    },
    (error) => {
        console.error('API Error:', error)
        return Promise.reject(error)
    }
)

/**
 * 上传图片进行检测
 * @param {File} file - 图片文件
 * @returns {Promise} 检测结果
 */
export const detectImage = async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const { data: { session } } = await supabase.auth.getSession()

    const response = await axios.post('/api/detect', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` })
        },
        timeout: 60000
    })

    return response.data
}

/**
 * 获取检测历史记录
 * @returns {Promise} 历史记录列表
 */
export const getHistory = async () => {
    return apiClient.get('/history')
}

export default apiClient
