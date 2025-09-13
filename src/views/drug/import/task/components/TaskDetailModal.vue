<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1200px"
    :close-on-click-modal="false"
    class="task-detail-dialog"
  >
    <div v-loading="loading" class="task-detail-content">
      <div v-if="taskDetail" class="detail-container">
        <!-- 基本信息卡片 -->
        <el-card class="basic-info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><InfoFilled /></el-icon>
              <span class="header-title">基本信息</span>
            </div>
          </template>

          <el-descriptions :column="3" border>
            <el-descriptions-item label="任务编号" :span="1">
              <el-tag type="primary">{{ taskDetail.taskNo }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="任务名称" :span="2">
              {{ taskDetail.taskName }}
            </el-descriptions-item>

            <el-descriptions-item label="文件名称">
              {{ taskDetail.fileName }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(taskDetail.fileSize) }}
            </el-descriptions-item>
            <el-descriptions-item label="任务状态">
              <el-tag :type="getStatusTagType(taskDetail.status)" effect="dark">
                {{ taskDetail.statusDisplay }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">
              {{ taskDetail.creator }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatTime(taskDetail.createTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 处理进度卡片 -->
        <el-card class="progress-info-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><TrendCharts /></el-icon>
              <span class="header-title">处理进度</span>
            </div>
          </template>

          <!-- 阶段进度 -->
          <div class="stage-progress">
            <el-steps :active="getActiveStep(taskDetail)" finish-status="success" align-center>
              <el-step
                title="文件解压"
                :status="getStepStatus(taskDetail.extractStatus)"
                :description="getStepDescription('extract', taskDetail)"
              />
              <el-step
                title="数据导入"
                :status="getStepStatus(taskDetail.importStatus)"
                :description="getStepDescription('import', taskDetail)"
              />
              <el-step
                title="质控检查"
                :status="getStepStatus(taskDetail.qcStatus)"
                :description="getStepDescription('qc', taskDetail)"
              />
            </el-steps>
          </div>

          <!-- 整体进度条 -->
          <div class="overall-progress">
            <div class="progress-header">
              <span class="progress-label">整体完成度</span>
              <span class="progress-value">{{ taskDetail.progressPercent }}%</span>
            </div>
            <el-progress
              :percentage="taskDetail.progressPercent"
              :stroke-width="16"
              :status="getProgressStatus(taskDetail.status)"
            />
          </div>

          <!-- 时间信息 -->
          <div class="time-info-grid">
            <div class="time-item" v-if="taskDetail.startTime">
              <div class="time-label">开始时间</div>
              <div class="time-value">{{ formatTime(taskDetail.startTime) }}</div>
            </div>
            <div class="time-item" v-if="taskDetail.extractEndTime">
              <div class="time-label">解压完成</div>
              <div class="time-value">{{ formatTime(taskDetail.extractEndTime) }}</div>
            </div>
            <div class="time-item" v-if="taskDetail.importEndTime">
              <div class="time-label">导入完成</div>
              <div class="time-value">{{ formatTime(taskDetail.importEndTime) }}</div>
            </div>
            <div class="time-item" v-if="taskDetail.qcEndTime">
              <div class="time-label">质控完成</div>
              <div class="time-value">{{ formatTime(taskDetail.qcEndTime) }}</div>
            </div>
            <div class="time-item" v-if="taskDetail.endTime">
              <div class="time-label">结束时间</div>
              <div class="time-value">{{ formatTime(taskDetail.endTime) }}</div>
            </div>
            <div class="time-item" v-if="getDuration(taskDetail)">
              <div class="time-label">总耗时</div>
              <div class="time-value">{{ getDuration(taskDetail) }}</div>
            </div>
          </div>
        </el-card>

        <!-- 统计信息卡片 -->
        <el-card class="statistics-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><DataAnalysis /></el-icon>
              <span class="header-title">处理统计</span>
            </div>
          </template>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-header">
                <el-icon class="stat-icon"><Folder /></el-icon>
                <span class="stat-title">文件统计</span>
              </div>
              <div class="stat-content">
                <div class="stat-row">
                  <span class="stat-label">总文件数:</span>
                  <span class="stat-value">{{ taskDetail.totalFiles }}</span>
                </div>
                <div class="stat-row success">
                  <span class="stat-label">成功文件:</span>
                  <span class="stat-value">{{ taskDetail.successFiles }}</span>
                </div>
                <div class="stat-row danger">
                  <span class="stat-label">失败文件:</span>
                  <span class="stat-value">{{ taskDetail.failedFiles }}</span>
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <el-icon class="stat-icon"><DataBoard /></el-icon>
                <span class="stat-title">记录统计</span>
              </div>
              <div class="stat-content">
                <div class="stat-row">
                  <span class="stat-label">总记录数:</span>
                  <span class="stat-value">{{ formatNumber(taskDetail.totalRecords) }}</span>
                </div>
                <div class="stat-row success">
                  <span class="stat-label">成功记录:</span>
                  <span class="stat-value">{{ formatNumber(taskDetail.successRecords) }}</span>
                </div>
                <div class="stat-row danger">
                  <span class="stat-label">失败记录:</span>
                  <span class="stat-value">{{ formatNumber(taskDetail.failedRecords) }}</span>
                </div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-header">
                <el-icon class="stat-icon"><TrendCharts /></el-icon>
                <span class="stat-title">成功率</span>
              </div>
              <div class="stat-content">
                <div class="success-rate-display">
                  <div class="rate-value">{{ getSuccessRate(taskDetail) }}%</div>
                  <div class="rate-label">数据成功率</div>
                </div>
                <el-progress
                  :percentage="getSuccessRate(taskDetail)"
                  :stroke-width="8"
                  :show-text="false"
                  :status="
                    getSuccessRate(taskDetail) >= 95
                      ? 'success'
                      : getSuccessRate(taskDetail) >= 80
                        ? undefined
                        : 'exception'
                  "
                />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 分表详情卡片 -->
        <el-card class="table-details-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><List /></el-icon>
              <span class="header-title">分表处理详情</span>
            </div>
          </template>

          <div class="table-details-list">
            <div
              v-for="detail in taskDetail.taskDetails || []"
              :key="detail.id"
              class="table-detail-item"
            >
              <div class="table-detail-header">
                <div class="table-info">
                  <div class="table-icon-wrapper">
                    <el-icon class="table-icon" :color="getTableIconColor(detail.status)">
                      <Document />
                    </el-icon>
                  </div>
                  <div class="table-meta">
                    <div class="table-name">{{ detail.tableName }}</div>
                    <div class="file-name">{{ detail.fileName }}</div>
                  </div>
                </div>
                <div class="table-status">
                  <el-tag :type="getStatusTagType(detail.status)" size="small">
                    {{ detail.statusDisplay }}
                  </el-tag>
                </div>
              </div>

              <!-- 处理进度 -->
              <div class="table-progress">
                <div class="progress-info">
                  <span class="progress-label">处理进度</span>
                  <span class="progress-percent">{{ detail.progressPercent }}%</span>
                </div>
                <el-progress
                  :percentage="detail.progressPercent"
                  :stroke-width="6"
                  :show-text="false"
                  :status="getProgressStatus(detail.status)"
                />
              </div>

              <!-- 详细统计 -->
              <div class="table-statistics">
                <div class="stats-row">
                  <div class="stat-item">
                    <span class="stat-label">总行数:</span>
                    <span class="stat-value">{{ formatNumber(detail.totalRows) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">有效行数:</span>
                    <span class="stat-value">{{ formatNumber(detail.validRows) }}</span>
                  </div>
                  <div class="stat-item success">
                    <span class="stat-label">成功:</span>
                    <span class="stat-value">{{ formatNumber(detail.successRows) }}</span>
                  </div>
                  <div class="stat-item danger">
                    <span class="stat-label">失败:</span>
                    <span class="stat-value">{{ formatNumber(detail.failedRows) }}</span>
                  </div>
                </div>

                <div class="stats-row" v-if="detail.qcPassedRows !== undefined">
                  <div class="stat-item">
                    <span class="stat-label">质控通过:</span>
                    <span class="stat-value">{{ formatNumber(detail.qcPassedRows) }}</span>
                  </div>
                  <div class="stat-item warning">
                    <span class="stat-label">质控失败:</span>
                    <span class="stat-value">{{ formatNumber(detail.qcFailedRows) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">重试次数:</span>
                    <span class="stat-value"
                      >{{ detail.retryCount }}/{{ detail.maxRetryCount }}</span
                    >
                  </div>
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="table-time-info" v-if="detail.startTime || detail.endTime">
                <div class="time-row">
                  <span v-if="detail.startTime" class="time-item">
                    开始: {{ formatTime(detail.startTime) }}
                  </span>
                  <span v-if="detail.endTime" class="time-item">
                    结束: {{ formatTime(detail.endTime) }}
                  </span>
                </div>
              </div>

              <!-- 错误信息 -->
              <div v-if="detail.errorMessage" class="table-error">
                <el-alert :title="detail.errorMessage" type="error" :closable="false" show-icon />
              </div>
            </div>
          </div>
        </el-card>

        <!-- 错误信息卡片 -->
        <el-card
          v-if="taskDetail.errorMessage || taskDetail.errorDetail"
          class="error-info-card"
          shadow="never"
        >
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon error-icon"><WarningFilled /></el-icon>
              <span class="header-title">错误信息</span>
            </div>
          </template>

          <div class="error-content">
            <div v-if="taskDetail.errorMessage" class="error-message">
              <div class="error-label">错误描述:</div>
              <div class="error-text">{{ taskDetail.errorMessage }}</div>
            </div>

            <div v-if="taskDetail.errorDetail" class="error-detail">
              <div class="error-label">详细信息:</div>
              <el-input
                v-model="formattedErrorDetail"
                type="textarea"
                :rows="6"
                readonly
                class="error-detail-textarea"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
<!--        <el-button v-if="taskDetail?.canRetry" type="warning" @click="handleRetry">
          重试任务
        </el-button>-->
        <el-button type="primary" @click="openProgressMonitor"> 查看进度 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  InfoFilled,
  TrendCharts,
  DataAnalysis,
  Folder,
  DataBoard,
  List,
  Document,
  WarningFilled
} from '@element-plus/icons-vue'
import { DrugBatchImportApi, type ImportTaskDetailVO, TASK_STATUS } from '@/api/drug/task'

/** 组件名称定义 */
defineOptions({ name: 'TaskDetailModal' })

/** 组件属性 */
interface Props {
  modelValue: boolean
  taskId?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

/** 组件事件 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  retry: [taskId: number]
  monitor: [taskId: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = ref(false)
const loading = ref(false)
const taskDetail = ref<ImportTaskDetailVO | null>(null)

// ========================= 计算属性 =========================

const dialogTitle = computed(() => {
  return `任务详情 - ${taskDetail.value?.taskNo || '未知任务'}`
})

const formattedErrorDetail = computed(() => {
  if (!taskDetail.value?.errorDetail) return ''

  try {
    const detail =
      typeof taskDetail.value.errorDetail === 'string'
        ? JSON.parse(taskDetail.value.errorDetail)
        : taskDetail.value.errorDetail
    return JSON.stringify(detail, null, 2)
  } catch {
    return String(taskDetail.value.errorDetail)
  }
})

// ========================= 监听器 =========================

watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
    if (val && props.taskId) {
      loadTaskDetail()
    }
  }
)

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// ========================= 核心方法 =========================

/** 加载任务详情 */
const loadTaskDetail = async () => {
  if (!props.taskId) {
    ElMessage.warning('任务ID不能为空')
    return
  }

  loading.value = true
  try {
    taskDetail.value = await DrugBatchImportApi.getTaskDetail(props.taskId)
  } catch (error) {
    ElMessage.error('获取任务详情失败')
    console.error('加载任务详情失败:', error)
  } finally {
    loading.value = false
  }
}

/** 关闭对话框 */
const handleClose = () => {
  dialogVisible.value = false
}

/** 处理重试 */
const handleRetry = () => {
  if (props.taskId) {
    emit('retry', props.taskId)
    handleClose()
  }
}

/** 打开进度监控 */
const openProgressMonitor = () => {
  if (props.taskId) {
    emit('monitor', props.taskId)
  }
}

// ========================= 工具方法 =========================

/** 获取状态标签类型 */
const getStatusTagType = (status: number) => {
  const typeMap = {
    [TASK_STATUS.PENDING]: 'info',
    [TASK_STATUS.EXTRACTING]: 'warning',
    [TASK_STATUS.IMPORTING]: 'warning',
    [TASK_STATUS.QC_CHECKING]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.FAILED]: 'danger',
    [TASK_STATUS.PARTIAL_SUCCESS]: 'primary',
    [TASK_STATUS.CANCELLED]: 'info'
  }
  return typeMap[status] || 'info'
}

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  return undefined
}

/** 获取表图标颜色 */
const getTableIconColor = (status: number) => {
  const colorMap = {
    0: '#909399',
    1: '#E6A23C',
    2: '#E6A23C',
    3: '#E6A23C',
    4: '#67C23A',
    5: '#F56C6C',
    6: '#409EFF'
  }
  return colorMap[status] || '#909399'
}

/** 获取活跃步骤 */
const getActiveStep = (task: ImportTaskDetailVO) => {
  if (task.qcStatus >= 1) return 3
  if (task.importStatus >= 1) return 2
  if (task.extractStatus >= 1) return 1
  return 0
}

/** 获取步骤状态 */
const getStepStatus = (stepStatus: number) => {
  switch (stepStatus) {
    case 0:
      return 'wait'
    case 1:
      return 'process'
    case 2:
      return 'finish'
    case 3:
      return 'error'
    default:
      return 'wait'
  }
}

/** 获取步骤描述 */
const getStepDescription = (step: string, task: ImportTaskDetailVO) => {
  const descriptions = {
    extract: ['未开始', '解压中...', '解压完成', '解压失败'],
    import: ['未开始', '导入中...', '导入完成', '导入失败'],
    qc: ['未开始', '质控中...', '质控完成', '质控失败']
  }

  const statusMap = {
    extract: task.extractStatus,
    import: task.importStatus,
    qc: task.qcStatus
  }

  const status = statusMap[step] || 0
  return descriptions[step][status] || '未知状态'
}

/** 获取成功率 */
const getSuccessRate = (task: ImportTaskDetailVO) => {
  if (!task.totalRecords || task.totalRecords === 0) return 0
  return Math.round((task.successRecords / task.totalRecords) * 100)
}

/** 获取任务持续时间 */
const getDuration = (task: ImportTaskDetailVO) => {
  if (!task.startTime || !task.endTime) return null

  const start = new Date(task.startTime).getTime()
  const end = new Date(task.endTime).getTime()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) return `${duration}秒`
  if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`
  return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分`
}

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 格式化数字 */
const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化时间 */
const formatTime = (time: string) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}
</script>

<style scoped>
.task-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-icon.error-icon {
  color: #f56c6c;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

/* 进度信息卡片样式 */
.stage-progress {
  margin-bottom: 30px;
}

.overall-progress {
  margin: 20px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
}

.progress-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.time-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.time-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.time-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.time-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

/* 统计信息卡片样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.stat-icon {
  font-size: 20px;
  color: #409eff;
}

.stat-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  color: #303133;
  font-weight: 500;
}

.stat-row.success .stat-value {
  color: #67c23a;
}

.stat-row.danger .stat-value {
  color: #f56c6c;
}

.stat-row.warning .stat-value {
  color: #e6a23c;
}

.success-rate-display {
  text-align: center;
  margin-bottom: 12px;
}

.rate-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.rate-label {
  font-size: 12px;
  color: #909399;
}

/* 分表详情样式 */
.table-details-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-detail-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.table-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(64, 158, 255, 0.1);
}

.table-icon {
  font-size: 20px;
}

.table-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.file-name {
  font-size: 12px;
  color: #909399;
}

.table-progress {
  margin: 16px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-percent {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.table-statistics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.table-time-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.time-row {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.table-error {
  margin-top: 12px;
}

/* 错误信息卡片样式 */
.error-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.error-message {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-label {
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
}

.error-text {
  padding: 12px;
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
  color: #f56c6c;
  font-size: 13px;
  line-height: 1.5;
}

.error-detail-textarea {
  font-family: 'Courier New', monospace;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 滚动条样式 */
.task-detail-content::-webkit-scrollbar {
  width: 6px;
}

.task-detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.task-detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.task-detail-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .time-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .stats-row {
    flex-direction: column;
    gap: 8px;
  }

  .time-row {
    flex-direction: column;
    gap: 8px;
  }
}

/* 卡片样式优化 */
:deep(.el-card) {
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-descriptions) {
  margin: 0;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

:deep(.el-descriptions__content) {
  color: #303133;
}

:deep(.el-steps) {
  margin: 20px 0;
}

:deep(.el-step__title) {
  font-size: 14px;
  font-weight: 600;
}

:deep(.el-step__description) {
  font-size: 12px;
}
</style>
