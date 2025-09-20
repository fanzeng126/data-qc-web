<template>
  <div class="step-content">
    <div class="upload-section">
      <!-- 批量上传区域 -->
      <div class="batch-upload">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".zip,.xlsx"
          :show-file-list="false"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽ZIP压缩包到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持上传包含所有Excel文件的ZIP压缩包，或分别上传单个Excel文件
            </div>
          </template>
        </el-upload>
      </div>

      <!-- 文件列表 -->
      <div class="file-list">
        <h4>文件上传状态</h4>
        <el-table :data="fileList" stripe>
          <el-table-column prop="name" label="文件名称" width="200" />
          <el-table-column prop="type" label="数据类型" width="150">
            <template #default="{ row }">
              <el-tag size="small">{{ getFileTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <div class="file-status">
                <el-icon v-if="row.status === 'uploaded'" class="status-icon success">
                  <CircleCheck />
                </el-icon>
                <el-icon v-else-if="row.status === 'failed'" class="status-icon error">
                  <CircleClose />
                </el-icon>
                <el-icon v-else class="status-icon waiting">
                  <Clock />
                </el-icon>
                <span>{{ getFileStatusText(row.status) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="文件大小" width="120">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="recordCount" label="数据条数" width="120">
            <template #default="{ row }">
              {{ row.recordCount || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="200">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 'uploaded'"
                link
                type="primary"
                size="small"
                @click="handleViewFileData(row)"
              >
                查看数据
              </el-button>
              <el-button
                v-if="row.status === 'failed'"
                link
                type="warning"
                size="small"
                @click="handleReuploadFile(row)"
              >
                重新上传
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleRemoveFile(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="upload-actions">
          <el-button @click="handlePrevStep">返回准备</el-button>
          <el-button
            type="primary"
            @click="handleStartPreQC"
            :disabled="!allFilesUploaded"
          >
            开始前置质控
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UploadFilled,
  CircleCheck,
  CircleClose,
  Clock
} from '@element-plus/icons-vue'
import type { Step1Props, Step1Emits, FileInfo } from './types'

// 定义组件名称
defineOptions({ name: 'Step1Upload' })

// Props
const props = defineProps<Step1Props>()

// Emits
const emit = defineEmits<Step1Emits>()

// 获取文件类型文本
const getFileTypeText = (type: string) => {
  const map: Record<string, string> = {
    hospital: '医院信息',
    catalog: '药品目录',
    inbound: '入库记录',
    outbound: '出库记录',
    usage: '使用记录'
  }
  return map[type] || type
}

// 获取文件状态文本
const getFileStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待上传',
    uploading: '上传中',
    uploaded: '已上传',
    failed: '上传失败'
  }
  return map[status] || status
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 处理文件改变
const handleFileChange = (uploadFile: any) => {
  emit('file-change', uploadFile)
}

// 查看文件数据
const handleViewFileData = (file: FileInfo) => {
  emit('view-file-data', file)
}

// 重新上传文件
const handleReuploadFile = (file: FileInfo) => {
  emit('reupload-file', file)
}

// 删除文件
const handleRemoveFile = (file: FileInfo) => {
  emit('remove-file', file)
}

// 返回上一步
const handlePrevStep = () => {
  emit('prev-step')
}

// 开始前置质控
const handleStartPreQC = () => {
  emit('start-pre-qc')
}
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

/* 上传区域样式 */
.upload-section {
  max-width: 1000px;
  margin: 0 auto;
}

.batch-upload {
  margin-bottom: 30px;
}

:deep(.upload-dragger) {
  width: 100%;
}

:deep(.el-upload-dragger) {
  padding: 40px;
  border-radius: 8px;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.file-list h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.file-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-icon {
  font-size: 16px;
}

.status-icon.success {
  color: #67c23a;
}

.status-icon.error {
  color: #f56c6c;
}

.status-icon.waiting {
  color: #909399;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>