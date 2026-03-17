import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDetectionStore = defineStore('detection', () => {
    const confidence = ref(0.25)
    const iou = ref(0.7)
    const selectedModel = ref('STD-DETR')
    const detectionMode = ref('upload') // 'upload' or 'realtime'

    const originalImage = ref(null)
    const resultImage = ref(null)
    const detections = ref([])
    const loading = ref(false)

    const setConfidence = (value) => {
        confidence.value = value
    }

    const setIou = (value) => {
        iou.value = value
    }

    const setModel = (model) => {
        selectedModel.value = model
    }

    const setDetectionMode = (mode) => {
        detectionMode.value = mode
    }

    const setDetectionResult = (result) => {
        originalImage.value = result.orig_url
        resultImage.value = result.result_url
        detections.value = result.detections || []
    }

    const clearResult = () => {
        originalImage.value = null
        resultImage.value = null
        detections.value = []
    }

    return {
        confidence,
        iou,
        selectedModel,
        detectionMode,
        originalImage,
        resultImage,
        detections,
        loading,
        setConfidence,
        setIou,
        setModel,
        setDetectionMode,
        setDetectionResult,
        clearResult
    }
})
