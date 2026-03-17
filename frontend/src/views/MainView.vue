<template>
  <div class="main-container" :class="{ 'dark': themeStore.isDark }">
    <!-- 顶部导航栏 -->
    <div class="navbar">
      <div class="navbar-content">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AI 目标检测系统
          </h1>
          <el-tag type="info" effect="dark">{{ authStore.user?.email }}</el-tag>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- 主题切换 -->
          <el-button
            :icon="themeStore.isDark ? 'Sunny' : 'Moon'"
            circle
            @click="themeStore.toggleTheme"
          />
          <!-- 历史记录 -->
          <el-button type="primary" @click="showHistoryDialog = true">
            <el-icon class="mr-1"><Clock /></el-icon>
            历史记录
          </el-button>
          <!-- 退出登录 -->
          <el-button @click="handleLogout">
            <el-icon class="mr-1"><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧控制面板 -->
      <div class="control-panel">
        <el-card class="control-card" shadow="hover">
          <!-- 检测模式切换 -->
          <div class="section mb-6">
            <h3 class="section-title">检测模式</h3>
            <el-segmented v-model="detectionStore.detectionMode" :options="modeOptions" block />
          </div>

          <!-- 上传检测模式 -->
          <template v-if="detectionStore.detectionMode === 'upload'">
            <!-- 模型选择 -->
            <div class="section mb-6">
              <h3 class="section-title">AI 检测模型</h3>
              <el-select v-model="detectionStore.selectedModel" placeholder="选择模型" class="w-full">
                <el-option label="STD-DETR" value="STD-DETR" />
                <el-option label="ISTD-DETR" value="ISTD-DETR" />
                <el-option label="RT-DETR-R18" value="RT-DETR-R18" />
                <el-option label="RT-DETR-R50" value="RT-DETR-R50" />
              </el-select>
            </div>

            <!-- 阈值调节 -->
            <div class="section mb-6">
              <h3 class="section-title">置信度阈值</h3>
              <div class="slider-container">
                <el-slider v-model="detectionStore.confidence" :min="0" :max="1" :step="0.05" show-input />
              </div>
            </div>

            <div class="section mb-6">
              <h3 class="section-title">IoU 阈值</h3>
              <div class="slider-container">
                <el-slider v-model="detectionStore.iou" :min="0" :max="1" :step="0.05" show-input />
              </div>
            </div>

            <!-- 文件上传 -->
            <div class="section mb-6">
              <h3 class="section-title">上传图片</h3>
              <el-upload
                class="upload-area"
                drag
                :auto-upload="false"
                :show-file-list="false"
                accept="image/*"
                :on-change="handleFileChange"
              >
                <el-icon class="upload-icon"><UploadFilled /></el-icon>
                <div class="upload-text">点击或拖拽上传文件</div>
                <div class="upload-hint">支持 JPG、PNG 、MP4、AVI格式</div>
              </el-upload>
            </div>

            <!-- 检测按钮 -->
            <el-button
              type="primary"
              size="large"
              class="w-full"
              :loading="detectionStore.loading"
              :disabled="!selectedFile"
              @click="handleDetect"
            >
              <el-icon class="mr-2"><Aim /></el-icon>
              开始检测
            </el-button>

            <!-- 导出按钮 -->
            <el-button
              class="w-full mt-3"
              size="large"
              :disabled="!detectionStore.resultImage"
              @click="showExportDialog = true"
            >
              <el-icon class="mr-2"><Download /></el-icon>
              导出结果
            </el-button>
          </template>

          <!-- 实时检测模式（占位） -->
          <template v-else>
            <el-empty description="实时检测功能开发中..." />
          </template>
        </el-card>
      </div>

      <!-- 右侧结果展示区 -->
      <div class="result-panel">
        <!-- 图片对比区 -->
        <el-card class="result-card mb-4" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="font-semibold">检测前后对比</span>
            </div>
          </template>
          
          <div class="image-compare">
            <!-- 原始图 -->
            <div class="image-box">
              <div class="image-label">原始文件</div>
              <div class="image-wrapper">
                <img v-if="detectionStore.originalImage" :src="detectionStore.originalImage" alt="原始图" />
                <el-empty v-else description="暂无文件" :image-size="120" />
              </div>
            </div>

            <!-- 检测结果图 -->
            <div class="image-box">
              <div class="image-label">检测结果</div>
              <div class="image-wrapper">
                <img v-if="detectionStore.resultImage" :src="detectionStore.resultImage" alt="检测结果" />
                <el-empty v-else description="暂无结果" :image-size="120" />
              </div>
            </div>
          </div>
        </el-card>

        <!-- JSON 数据展示区 -->
        <el-card class="result-card flex-1" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="font-semibold">检测数据</span>
              <el-tag v-if="detectionStore.detections.length > 0" type="success">
                检测到 {{ detectionStore.detections.length }} 个目标
              </el-tag>
            </div>
          </template>
          
          <el-scrollbar height="350px">
            <pre v-if="detectionStore.detections.length > 0" class="json-viewer">{{ formatJSON(detectionStore.detections) }}</pre>
            <el-empty v-else description="暂无检测数据" :image-size="120" />
          </el-scrollbar>
        </el-card>
      </div>
    </div>

    <!-- 历史记录对话框 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="检测历史"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-table :data="historyData" stripe height="500">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="原始图片" width="120">
          <template #default="{ row }">
            <el-image
              :src="row.image_url"
              :preview-src-list="[row.image_url]"
              fit="cover"
              class="w-20 h-20 rounded"
            />
          </template>
        </el-table-column>
        <el-table-column label="检测结果" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.result_image_url"
              :src="row.result_image_url"
              :preview-src-list="[row.result_image_url]"
              fit="cover"
              class="w-20 h-20 rounded"
            />
          </template>
        </el-table-column>
        <el-table-column label="检测数量" width="100">
          <template #default="{ row }">
            <el-tag type="success">{{ row.results?.length || 0 }} 个</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="检测时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="loadHistoryItem(row)">加载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="showExportDialog"
      title="导出设置"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="导出路径">
          <el-input v-model="exportPath" placeholder="请输入导出路径" />
        </el-form-item>
        <el-form-item label="文件格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="JSON">JSON</el-radio>
            <el-radio label="CSV">CSV</el-radio>
            <el-radio label="TXT">TXT</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import { useDetectionStore } from '../stores/detection'
import { detectImage, getHistory } from '../services/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const detectionStore = useDetectionStore()

const selectedFile = ref(null)
const showHistoryDialog = ref(false)
const showExportDialog = ref(false)
const historyData = ref([])
const exportPath = ref('')
const exportFormat = ref('JSON')

const modeOptions = [
  { label: '上传检测', value: 'upload' },
  { label: '实时检测', value: 'realtime' }
]

// 文件选择
const handleFileChange = (file) => {
  selectedFile.value = file.raw
  detectionStore.clearResult()
}

// 执行检测
const handleDetect = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  try {
    detectionStore.loading = true
    const result = await detectImage(selectedFile.value)
    detectionStore.setDetectionResult(result)
    ElMessage.success('检测完成！')
  } catch (error) {
    console.error('检测失败:', error)
    ElMessage.error('检测失败，请重试')
  } finally {
    detectionStore.loading = false
  }
}

// 加载历史记录
const loadHistory = async () => {
  try {
    const data = await getHistory()
    historyData.value = data
  } catch (error) {
    console.error('加载历史失败:', error)
    ElMessage.error('加载历史记录失败')
  }
}

// 加载历史项
const loadHistoryItem = (item) => {
  detectionStore.setDetectionResult({
    orig_url: item.image_url,
    result_url: item.result_image_url,
    detections: item.results
  })
  showHistoryDialog.value = false
  ElMessage.success('已加载历史记录')
}

// 导出结果
const handleExport = () => {
  const data = {
    detections: detectionStore.detections,
    timestamp: new Date().toISOString(),
    model: detectionStore.selectedModel,
    confidence: detectionStore.confidence,
    iou: detectionStore.iou
  }
  
  let content = ''
  let filename = `detection_result_${Date.now()}`
  
  switch (exportFormat.value) {
    case 'JSON':
      content = JSON.stringify(data, null, 2)
      filename += '.json'
      break
    case 'CSV':
      content = convertToCSV(data.detections)
      filename += '.csv'
      break
    case 'TXT':
      content = JSON.stringify(data, null, 2)
      filename += '.txt'
      break
  }
  
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  
  showExportDialog.value = false
  ElMessage.success('导出成功！')
}

// 转换为 CSV
const convertToCSV = (detections) => {
  const headers = ['class', 'confidence', 'x', 'y', 'width', 'height']
  const rows = detections.map(d => 
    `${d.class},${d.confidence},${d.box?.x || ''},${d.box?.y || ''},${d.box?.width || ''},${d.box?.height || ''}`
  )
  return [headers.join(','), ...rows].join('\n')
}

// 格式化 JSON
const formatJSON = (data) => {
  return JSON.stringify(data, null, 2)
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 退出登录
const handleLogout = async () => {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await authStore.signOut()
  router.push('/login')
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.main-container {
  min-height: 100vh;
  background: #f5f5f5;
  transition: background-color 0.3s;
}

.main-container.dark {
  background: #0a0a0a;
}

.navbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.dark .navbar {
  background: #1a1a1a;
  border-bottom-color: #2a2a2a;
}

.navbar-content {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.main-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
}

.control-panel {
  height: fit-content;
  position: sticky;
  top: 100px;
}

.control-card {
  border-radius: 16px;
  border: none;
}

.dark .control-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.result-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  border-radius: 16px;
  border: none;
}

.dark .result-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
}

.dark .section-title {
  color: #d1d5db;
}

.slider-container {
  padding: 0 8px;
}

.upload-area {
  width: 100%;
}

:deep(.upload-area .el-upload) {
  width: 100%;
}

:deep(.upload-area .el-upload-dragger) {
  padding: 40px 20px;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
  background: #f9fafb;
  transition: all 0.3s;
}

.dark :deep(.upload-area .el-upload-dragger) {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

:deep(.upload-area .el-upload-dragger:hover) {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.upload-icon {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #374151;
  margin-bottom: 4px;
}

.dark .upload-text {
  color: #d1d5db;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.image-box {
  position: relative;
}

.image-label {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #6b7280;
}

.dark .image-label {
  color: #9ca3af;
}

.image-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  overflow: hidden;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
}

.dark .image-wrapper {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.json-viewer {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #1f2937;
  overflow-x: auto;
}

.dark .json-viewer {
  background: rgba(255, 255, 255, 0.03);
  color: #e5e7eb;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .control-panel {
    position: static;
  }
}
</style>
