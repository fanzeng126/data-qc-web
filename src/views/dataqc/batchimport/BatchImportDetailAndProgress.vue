<!-- 任务详情对话框组件 -->
<template>
  <Dialog v-model="detailVisible" title="导入任务详情" width="1000px">
    <div v-loading="detailLoading" class="task-detail">
      <!-- 任务基本信息 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:info-filled" />
            <span>任务基本信息</span>
          </div>
        </template>
        <div class="detail-content">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">任务编号：</span>
                <span class="value">{{ taskDetail.taskNo }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">任务名称：</span>
                <span class="value">{{ taskDetail.taskName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">上传文件：</span>
                <span class="value">{{ taskDetail.fileName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">任务状态：</span>
                <el-tag :type="getStatusTagType(taskDetail.status)">
                  {{ getStatusText(taskDetail.status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">文件总数：</span>
                <span class="value">{{ taskDetail.totalFiles || 0 }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">成功文件：</span>
                <span class="value text-green-600">{{ taskDetail.successFiles || 0 }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">失败文件：</span>
                <span class="value text-red-600">{{ taskDetail.failFiles || 0 }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">开始时间：</span>
                <span class="value">{{ formatTime(taskDetail.startTime) }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <span class="label">结束时间：</span>
                <span class="value">{{ formatTime(taskDetail.endTime) }}</span>
              </div>
            </el-col>
          </el-row>
          <div v-if="taskDetail.errorMsg" class="error-message">
            <div class="detail-item">
              <span class="label">错误信息：</span>
              <span class="value text-red-600">{{ taskDetail.errorMsg }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 处理明细 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:list" />
            <span>处理明细</span>
          </div>
        </template>
        <el-table :data="taskDetail.details || []" style="width: 100%">
          <el-table-column prop="fileType" label="文件类型" width="120">
            <template #default="scope">
              {{ scope.row.fileTypeDisplay || scope.row.fileType }}
            </template>
          </el-table-column>
          <el-table-column prop="fileName" label="文件名" show-overflow-tooltip />
          <el-table-column prop="tableName" label="目标表名" width="140" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)" size="small">
                {{ scope.row.statusDisplay || getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数据统计" width="120" align="center">
            <template #default="scope">
              <div class="text-xs">
                <div>总数: {{ scope.row.totalRows || 0 }}</div>
                <div class="text-green-600">成功: {{ scope.row.successRows || 0 }}</div>
                <div class="text-red-600">失败: {{ scope.row.failRows || 0 }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            prop="startTime"
            label="开始时间"
            width="150"
            :formatter="timeFormatter"
          />
          <el-table-column prop="endTime" label="结束时间" width="150" :formatter="timeFormatter" />
          <el-table-column prop="errorMsg" label="错误信息" show-overflow-tooltip>
            <template #default="scope">
              <span v-if="scope.row.errorMsg" class="text-red-600">
                {{ scope.row.errorMsg }}
              </span>
              <span v-else class="text-gray-400">无</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </Dialog>

  <!-- 进度查看对话框 -->
  <Dialog v-model="progressVisible" title="导入进度监控" width="800px">
    <div v-loading="progressLoading" class="progress-monitor">
      <!-- 总体进度 -->
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:data-line" />
            <span>总体进度</span>
            <el-button
              type="primary"
              size="small"
              @click="refreshProgress"
              :loading="progressLoading"
              style="margin-left: auto"
            >
              刷新
            </el-button>
          </div>
        </template>
        <div class="progress-summary">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="progress-item">
                <div class="progress-info">
                  <span class="progress-label">任务进度</span>
                  <span class="progress-percentage"
                    >{{ progressData.progressPercentage || 0 }}%</span
                  >
                </div>
                <el-progress
                  :percentage="progressData.progressPercentage || 0"
                  :stroke-width="12"
                  :show-text="false"
                />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ progressData.totalFiles || 0 }}</span>
                  <span class="stat-label">总文件数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value text-green-600">{{
                    progressData.successFiles || 0
                  }}</span>
                  <span class="stat-label">已完成</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value text-red-600">{{ progressData.failFiles || 0 }}</span>
                  <span class="stat-label">失败数</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value text-blue-600">{{ getProcessingFiles() }}</span>
                  <span class="stat-label">处理中</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 详细进度 -->
      <el-card class="progress-card">
        <template #header>
          <div class="card-header">
            <Icon icon="ep:monitor" />
            <span>详细进度</span>
          </div>
        </template>
        <div class="progress-details">
          <div
            v-for="detail in progressData.details || []"
            :key="detail.id"
            class="progress-detail-item"
          >
            <div class="detail-header">
              <div class="detail-title">
                <Icon icon="ep:document" class="detail-icon" />
                <span>{{ detail.fileTypeDisplay || detail.fileType }}</span>
                <el-tag :type="getStatusTagType(detail.status)" size="small">
                  {{ detail.statusDisplay || getStatusText(detail.status) }}
                </el-tag>
              </div>
              <div class="detail-stats" v-if="detail.totalRows">
                <span class="stat-text">
                  {{ detail.successRows || 0 }} / {{ detail.totalRows || 0 }}
                  <span class="text-gray-500">条记录</span>
                </span>
              </div>
            </div>
            <div class="detail-progress">
              <el-progress
                :percentage="calculateDetailProgress(detail)"
                :stroke-width="6"
                :status="getProgressStatus(detail.status)"
              />
            </div>
            <div v-if="detail.errorMsg" class="detail-error">
              <Icon icon="ep:warning" class="error-icon" />
              <span class="error-text">{{ detail.errorMsg }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import * as BatchImportApi from '@/api/dataqc/batchImport'

defineOptions({ name: 'BatchImportDetailAndProgress' })

const message = useMessage()

// 详情对话框状态
const detailVisible = ref(false)
const detailLoading = ref(false)
const taskDetail = ref({})

// 进度对话框状态
const progressVisible = ref(false)
const progressLoading = ref(false)
const progressData = ref({})
const progressTimer = ref(null)

/** 打开详情对话框 */
const openDetail = async (row) => {
  detailVisible.value = true
  detailLoading.value = true

  try {
    const data = await BatchImportApi.getBatchImportTask(row.id)
    taskDetail.value = data || {}
  } catch (error) {
    message.error('获取任务详情失败')
  } finally {
    detailLoading.value = false
  }
}

/** 打开进度对话框 */
const openProgress = async (taskId) => {
  progressVisible.value = true
  progressLoading.value = true

  try {
    await loadProgress(taskId)
    // 如果任务还在进行中，开启定时刷新
    if (progressData.value.status === 1) {
      startProgressTimer(taskId)
    }
  } catch (error) {
    message.error('获取任务进度失败')
  } finally {
    progressLoading.value = false
  }
}

/** 加载进度数据 */
const loadProgress = async (taskId) => {
  const data = await BatchImportApi.getBatchImportProgress(taskId)
  progressData.value = data || {}
}

/** 刷新进度 */
const refreshProgress = async () => {
  if (!progressData.value.taskId) return

  progressLoading.value = true
  try {
    await loadProgress(progressData.value.taskId)
  } catch (error) {
    message.error('刷新进度失败')
  } finally {
    progressLoading.value = false
  }
}

/** 开启进度定时器 */
const startProgressTimer = (taskId) => {
  progressTimer.value = setInterval(async () => {
    try {
      await loadProgress(taskId)
      // 如果任务完成，停止定时器
      if (progressData.value.status >= 2) {
        stopProgressTimer()
      }
    } catch (error) {
      stopProgressTimer()
    }
  }, 3000) // 每3秒刷新一次
}

/** 停止进度定时器 */
const stopProgressTimer = () => {
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
    progressTimer.value = null
  }
}

/** 获取处理中的文件数 */
const getProcessingFiles = () => {
  const total = progressData.value.totalFiles || 0
  const success = progressData.value.successFiles || 0
  const fail = progressData.value.failFiles || 0
  return Math.max(0, total - success - fail)
}

/** 计算详细进度百分比 */
const calculateDetailProgress = (detail) => {
  if (!detail.totalRows || detail.totalRows === 0) {
    return detail.status >= 2 ? 100 : 0
  }
  const processed = (detail.successRows || 0) + (detail.failRows || 0)
  return Math.round((processed / detail.totalRows) * 100)
}

/** 获取进度条状态 */
const getProgressStatus = (status) => {
  switch (status) {
    case 2:
      return 'success'
    case 3:
      return 'exception'
    default:
      return undefined
  }
}

/** 获取状态标签类型 */
const getStatusTagType = (status) => {
  const typeMap = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'primary'
  }
  return typeMap[status] || 'info'
}

/** 获取状态文本 */
const getStatusText = (status) => {
  const textMap = {
    0: '待处理',
    1: '解压中',
    2: '导入中',
    3: '质控中',
    4: '完成',
    5: '失败',
    6: '部分成功'
  }
  return textMap[status] || '未知'
}

/** 格式化时间 */
const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

/** 时间格式化器 */
const timeFormatter = (row, column, cellValue) => {
  return formatTime(cellValue)
}

/** 对话框关闭事件 */
watch(progressVisible, (visible) => {
  if (!visible) {
    stopProgressTimer()
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopProgressTimer()
})

// 暴露方法
defineExpose({
  openDetail,
  openProgress,
  open: openDetail // 兼容主页面调用
})
</script>

<style scoped>
.task-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.detail-content {
  padding: 0;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #606266;
  width: 80px;
  flex-shrink: 0;
}

.value {
  color: #303133;
  flex: 1;
  word-break: break-all;
}

.error-message {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.progress-monitor {
  max-height: 600px;
  overflow-y: auto;
}

.progress-card {
  margin-bottom: 20px;
}

.progress-summary {
  padding: 10px 0;
}

.progress-item {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-percentage {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.progress-details {
  padding: 10px 0;
}

.progress-detail-item {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.progress-detail-item:last-child {
  margin-bottom: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-icon {
  color: #409eff;
}

.detail-stats {
  font-size: 14px;
}

.stat-text {
  color: #606266;
}

.detail-progress {
  margin-bottom: 8px;
}

.detail-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #f56c6c;
  background: #fef0f0;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #fbc4c4;
}

.error-icon {
  font-size: 14px;
}

.error-text {
  flex: 1;
}
</style>
