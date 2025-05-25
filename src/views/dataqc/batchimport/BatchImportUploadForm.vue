<template>
  <Dialog v-model="dialogVisible" title="批量导入数据" width="600px">
    <div class="upload-container">
      <!-- 上传说明 -->
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        class="mb-4"
      >
        <template #default>
          <div class="text-sm space-y-2">
            <p>1. 请上传包含药品数据的ZIP压缩包文件</p>
            <p>2. 压缩包中应包含以下Excel文件（至少包含药品目录文件）：</p>
            <div class="ml-4 space-y-1">
              <p>• 公立医疗机构基本情况.xlsx</p>
              <p>• 公立医疗机构药品目录.xlsx <span class="text-red-500">（必需）</span></p>
              <p>• 公立医疗机构药品入库情况.xlsx</p>
              <p>• 公立医疗机构药品出库情况.xlsx</p>
              <p>• 公立医疗机构药品使用情况.xlsx</p>
            </div>
            <p>3. 系统将按照依赖关系自动进行导入处理</p>
            <p>4. 导入过程为异步处理，可在任务列表中查看进度</p>
          </div>
        </template>
      </el-alert>

      <!-- 文件上传区域 -->
      <el-upload
        ref="uploadRef"
        v-model:file-list="fileList"
        :auto-upload="false"
        :disabled="uploading"
        :limit="1"
        :on-exceed="handleExceed"
        :before-upload="beforeUpload"
        accept=".zip,.rar"
        drag
        class="upload-area"
      >
        <div class="upload-content">
          <Icon icon="ep:upload-filled" class="upload-icon" />
          <div class="upload-text">
            <p class="primary-text">点击选择文件或将文件拖拽到此处</p>
            <p class="secondary-text">只支持 ZIP、RAR 格式的压缩包文件，且文件大小不超过 100MB</p>
          </div>
        </div>
        <template #tip>
          <div class="upload-tip">
            <p class="text-gray-500 text-sm">
              温馨提示：上传前请确保压缩包中的Excel文件格式正确，避免导入失败
            </p>
          </div>
        </template>
      </el-upload>

      <!-- 上传进度 -->
      <div v-if="uploading" class="upload-progress">
        <el-progress
          :percentage="uploadProgress"
          :stroke-width="8"
          status="success"
        />
        <p class="text-center text-sm text-gray-600 mt-2">
          正在上传文件，请稍候...
        </p>
      </div>

      <!-- 文件信息显示 -->
      <div v-if="fileList.length > 0 && !uploading" class="file-info">
        <div class="info-item">
          <span class="label">文件名称：</span>
          <span class="value">{{ fileList[0].name }}</span>
        </div>
        <div class="info-item">
          <span class="label">文件大小：</span>
          <span class="value">{{ formatFileSize(fileList[0].size) }}</span>
        </div>
        <div class="info-item">
          <span class="label">上传时间：</span>
          <span class="value">{{ new Date().toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="uploading">
          取 消
        </el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="fileList.length === 0"
        >
          {{ uploading ? '上传中...' : '开始导入' }}
        </el-button>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as BatchImportApi from '@/api/dataqc/batchImport'

defineOptions({ name: 'BatchImportUploadForm' })

const message = useMessage()

const dialogVisible = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const fileList = ref([])
const uploadRef = ref()

/** 打开对话框 */
const open = () => {
  dialogVisible.value = true
  resetForm()
}

/** 重置表单 */
const resetForm = () => {
  fileList.value = []
  uploading.value = false
  uploadProgress.value = 0
  uploadRef.value?.clearFiles()
}

/** 文件数量超出限制 */
const handleExceed = () => {
  message.warning('最多只能上传一个压缩包文件！')
}

/** 上传前校验 */
const beforeUpload = (file) => {
  // 检查文件格式
  const isValidFormat = file.name.toLowerCase().endsWith('.zip') ||
    file.name.toLowerCase().endsWith('.rar')
  if (!isValidFormat) {
    message.error('只支持 ZIP、RAR 格式的文件！')
    return false
  }

  // 检查文件大小（100MB = 100 * 1024 * 1024 bytes）
  const isValidSize = file.size < 100 * 1024 * 1024
  if (!isValidSize) {
    message.error('文件大小不能超过 100MB！')
    return false
  }

  return true
}

/** 执行上传 */
const handleUpload = async () => {
  if (fileList.value.length === 0) {
    message.warning('请先选择要上传的文件！')
    return
  }

  try {
    uploading.value = true
    uploadProgress.value = 0

    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)

    // 执行上传
    const result = await BatchImportApi.batchImport(fileList.value[0].raw)

    // 清除进度模拟
    clearInterval(progressInterval)
    uploadProgress.value = 100

    // 显示结果
    message.success(result.message || '文件上传成功，导入任务已创建！')

    // 关闭对话框并刷新列表
    dialogVisible.value = false
    emit('success')

  } catch (error) {
    message.error(error.message || '文件上传失败，请重试！')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

/** 取消操作 */
const handleCancel = () => {
  if (uploading.value) {
    message.confirm('正在上传中，确定要取消吗？').then(() => {
      dialogVisible.value = false
      resetForm()
    })
  } else {
    dialogVisible.value = false
    resetForm()
  }
}

/** 格式化文件大小 */
const formatFileSize = (size: number) => {
  if (size === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(size) / Math.log(k))
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 暴露方法
defineExpose({ open })

// 定义事件
const emit = defineEmits(['success'])
</script>

<style scoped>
.upload-container {
  padding: 10px 0;
}

.upload-area {
  margin: 20px 0;
}

.upload-content {
  padding: 40px 20px;
  text-align: center;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.primary-text {
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 8px 0;
}

.secondary-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.upload-tip {
  text-align: center;
  margin-top: 10px;
}

.upload-progress {
  margin: 20px 0;
}

.file-info {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 16px;
  margin: 20px 0;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.value {
  color: #606266;
  flex: 1;
  word-break: break-all;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: #f0f9ff;
}

:deep(.el-upload-dragger.is-dragover) {
  border-color: #409eff;
  background: #e6f7ff;
}
</style>
