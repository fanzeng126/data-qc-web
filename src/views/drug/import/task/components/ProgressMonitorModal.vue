<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="1000px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="progress-monitor-dialog"
  >
    <div v-loading="loading" class="progress-monitor-content">
      <!-- 任务概览卡片 -->
      <el-card class="task-overview-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-icon class="header-icon"><DataAnalysis /></el-icon>
              <span class="header-title">{{ progressData.taskName || '数据导入任务' }}</span>
            </div>
            <div class="header-right">
              <el-tag
                :type="getStatusTagType(progressData.overallStatus)"
                size="large"
                class="status-tag"
              >
                {{ getStatusText(progressData.overallStatus) }}
              </el-tag>
            </div>
          </div>
        </template>

        <!-- 总体进度展示 -->
        <div class="overall-progress-section">
          <div class="progress-header">
            <span class="progress-label">总体进度</span>
            <span class="progress-percentage">{{ progressData.overallProgress || 0 }}%</span>
          </div>

          <el-progress
            :percentage="progressData.overallProgress || 0"
            :stroke-width="16"
            :show-text="false"
            :status="getProgressStatus(progressData.overallStatus)"
            class="main-progress"
          />

          <div class="progress-details">
            <div class="current-stage">
              <el-icon><Operation /></el-icon>
              当前阶段：{{ progressData.currentStage || '准备中' }}
            </div>
            <div class="current-message" v-if="progressData.currentMessage">
              {{ progressData.currentMessage }}
            </div>
            <div class="time-info" v-if="progressData.estimatedRemainingTime">
              <el-icon><Clock /></el-icon>
              预计剩余时间：{{ formatDuration(progressData.estimatedRemainingTime) }}
            </div>
          </div>
        </div>

        <!-- 统计数据网格 -->
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ progressData.totalFiles || 0 }}</div>
            <div class="stat-label">文件总数</div>
            <div class="stat-icon">📁</div>
          </div>
          <div class="stat-item success">
            <div class="stat-value">{{ progressData.successFiles || 0 }}</div>
            <div class="stat-label">成功文件</div>
            <div class="stat-icon">✅</div>
          </div>
          <div class="stat-item danger">
            <div class="stat-value">{{ progressData.failedFiles || 0 }}</div>
            <div class="stat-label">失败文件</div>
            <div class="stat-icon">❌</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatNumber(progressData.totalRecords) }}</div>
            <div class="stat-label">总记录数</div>
            <div class="stat-icon">📊</div>
          </div>
          <div class="stat-item success">
            <div class="stat-value">{{ formatNumber(progressData.successRecords) }}</div>
            <div class="stat-label">成功记录</div>
            <div class="stat-icon">✅</div>
          </div>
          <div class="stat-item danger">
            <div class="stat-value">{{ formatNumber(progressData.failedRecords) }}</div>
            <div class="stat-label">失败记录</div>
            <div class="stat-icon">❌</div>
          </div>
        </div>
      </el-card>

      <!-- 分表进度详情 -->
      <el-card class="table-progress-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-icon class="header-icon"><List /></el-icon>
              <span class="header-title">分表处理进度</span>
            </div>
            <div class="header-right">
              <el-button
                type="primary"
                size="small"
                @click="refreshProgress"
                :loading="refreshing"
                circle
              >
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </div>
        </template>

        <!-- 表进度列表 -->
        <div class="table-progress-list">
          <div
            v-for="table in progressData.tableProgress || []"
            :key="table.tableType"
            class="table-progress-item"
            :class="{ 'is-active': isTableActive(table.status) }"
          >
            <!-- 表头信息 -->
            <div class="table-header">
              <div class="table-info">
                <div class="table-icon-wrapper">
                  <el-icon class="table-icon" :color="getTableIconColor(table.status)" :size="24">
                    <Document />
                  </el-icon>
                  <div
                    class="status-indicator"
                    :class="getStatusIndicatorClass(table.status)"
                  ></div>
                </div>
                <div class="table-details">
                  <div class="table-name">{{ table.tableName }}</div>
                  <div class="file-name" v-if="table.fileName">{{ table.fileName }}</div>
                  <div class="table-stage">{{ table.currentStage }}</div>
                </div>
              </div>
              <div class="table-status">
                <el-tag :type="getStatusTagType(table.status)" size="small" class="status-tag">
                  {{ table.statusDisplay }}
                </el-tag>
                <div class="progress-text">{{ table.progress || 0 }}%</div>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="table-progress-bar">
              <el-progress
                :percentage="table.progress || 0"
                :stroke-width="8"
                :status="getProgressStatus(table.status)"
                :show-text="false"
              />
              <div class="progress-message" v-if="table.currentMessage">
                {{ table.currentMessage }}
              </div>
            </div>

            <!-- 详细统计 -->
            <div class="table-stats">
              <div class="stats-row">
                <div class="stat-group">
                  <span class="stat-label">总行数:</span>
                  <strong class="stat-value">{{ formatNumber(table.totalRecords) }}</strong>
                </div>
                <div class="stat-group success">
                  <span class="stat-label">成功:</span>
                  <strong class="stat-value">{{ formatNumber(table.successRecords) }}</strong>
                </div>
                <div class="stat-group danger">
                  <span class="stat-label">失败:</span>
                  <strong class="stat-value">{{ formatNumber(table.failedRecords) }}</strong>
                </div>
                <div class="stat-group" v-if="table.qcPassedRows !== undefined">
                  <span class="stat-label">质控通过:</span>
                  <strong class="stat-value">{{ formatNumber(table.qcPassedRows) }}</strong>
                </div>
                <div class="stat-group warning" v-if="table.qcFailedRows !== undefined">
                  <span class="stat-label">质控失败:</span>
                  <strong class="stat-value">{{ formatNumber(table.qcFailedRows) }}</strong>
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="time-info" v-if="table.startTime || table.endTime">
                <span v-if="table.startTime" class="time-item">
                  开始: {{ formatTime(table.startTime) }}
                </span>
                <span v-if="table.endTime" class="time-item">
                  结束: {{ formatTime(table.endTime) }}
                </span>
              </div>
            </div>

            <!-- 错误信息 -->
            <div v-if="table.errorMessage" class="table-error">
              <el-alert
                :title="table.errorMessage"
                type="error"
                :closable="false"
                show-icon
                class="error-alert"
              />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 时间线信息 -->
      <el-card class="timeline-card" shadow="hover" v-if="timelineEvents.length > 0">
        <template #header>
          <div class="card-header">
            <div class="header-left">
              <el-icon class="header-icon"><Clock /></el-icon>
              <span class="header-title">处理时间线</span>
            </div>
          </div>
        </template>

        <el-timeline class="process-timeline">
          <el-timeline-item
            v-for="event in timelineEvents"
            :key="event.timestamp"
            :timestamp="event.timestamp"
            :type="event.type"
            :icon="event.icon"
            placement="top"
          >
            <div class="timeline-content">
              <div class="timeline-title">{{ event.title }}</div>
              <div class="timeline-description" v-if="event.description">
                {{ event.description }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
<!--        <el-button v-if="progressData.canRetry" type="warning" @click="handleRetry">
          重试任务
        </el-button>-->
        <el-button type="primary" @click="refreshProgress" :loading="refreshing">
          刷新进度
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  List,
  Refresh,
  Document,
  Clock,
  Operation,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  DrugBatchImportApi,
  type ImportProgressVO,
  TASK_STATUS,
  TASK_STATUS_TEXT
} from '@/api/drug/task'

/** 组件名称定义 */
defineOptions({ name: 'ProgressMonitorModal' })

/** 组件属性 */
interface Props {
  modelValue: boolean
  taskId?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  autoRefresh: true,
  refreshInterval: 3000
})

/** 组件事件 */
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  retry: [taskId: number]
}>()

// ========================= 响应式数据 =========================

const dialogVisible = ref(false)
const loading = ref(false)
const refreshing = ref(false)
const refreshTimer = ref<number | null>(null)

/** 进度数据 */
const progressData = reactive<ImportProgressVO>({
  taskId: 0,
  taskNo: '',
  taskName: '',
  overallStatus: 0,
  overallProgress: 0,
  currentMessage: '',
  currentStage: '',
  totalFiles: 0,
  successFiles: 0,
  failedFiles: 0,
  totalRecords: 0,
  successRecords: 0,
  failedRecords: 0,
  tableProgress: [],
  canRetry: false
})

// ========================= 计算属性 =========================

const dialogTitle = computed(() => {
  return `任务进度监控 - ${progressData.taskNo || '未知任务'}`
})

/** 时间线事件 */
const timelineEvents = computed(() => {
  const events = []

  if (progressData.startTime) {
    events.push({
      timestamp: formatTime(progressData.startTime),
      type: 'primary',
      icon: SuccessFilled,
      title: '任务开始',
      description: '开始执行导入任务'
    })
  }

  // 根据表进度生成事件
  progressData.tableProgress?.forEach((table) => {
    if (table.startTime) {
      events.push({
        timestamp: formatTime(table.startTime),
        type: 'info',
        icon: Operation,
        title: `开始处理 ${table.tableName}`,
        description: table.fileName ? `文件：${table.fileName}` : undefined
      })
    }

    if (table.endTime) {
      const type = table.status === 4 ? 'success' : table.status === 5 ? 'danger' : 'warning'
      const icon =
        table.status === 4 ? SuccessFilled : table.status === 5 ? CircleCloseFilled : WarningFilled

      events.push({
        timestamp: formatTime(table.endTime),
        type,
        icon,
        title: `${table.tableName} 处理完成`,
        description: `状态：${table.statusDisplay} | 成功：${table.successRecords} | 失败：${table.failedRecords}`
      })
    }
  })

  if (progressData.estimatedEndTime && progressData.overallStatus >= 4) {
    const type =
      progressData.overallStatus === 4
        ? 'success'
        : progressData.overallStatus === 5
          ? 'danger'
          : 'warning'
    const icon =
      progressData.overallStatus === 4
        ? SuccessFilled
        : progressData.overallStatus === 5
          ? CircleCloseFilled
          : WarningFilled

    events.push({
      timestamp: formatTime(progressData.estimatedEndTime),
      type,
      icon,
      title: '任务完成',
      description: `最终状态：${getStatusText(progressData.overallStatus)}`
    })
  }

  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
})

// ========================= 监听器 =========================

watch(
  () => props.modelValue,
  (val) => {
    dialogVisible.value = val
    if (val && props.taskId) {
      loadProgress()
      if (props.autoRefresh) {
        startAutoRefresh()
      }
    }
  }
)

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    stopAutoRefresh()
  }
})

watch(
  () => props.taskId,
  (newTaskId) => {
    if (newTaskId && dialogVisible.value) {
      loadProgress()
    }
  }
)

// ========================= 生命周期 =========================

onMounted(() => {
  if (dialogVisible.value && props.taskId) {
    loadProgress()
    if (props.autoRefresh) {
      startAutoRefresh()
    }
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// ========================= 核心方法 =========================

/** 加载进度数据 */
const loadProgress = async () => {
  if (!props.taskId) {
    ElMessage.warning('任务ID不能为空')
    return
  }

  loading.value = true
  try {
    const data = await DrugBatchImportApi.getTaskProgress(props.taskId)
    Object.assign(progressData, data)

    // 如果任务已完成，停止自动刷新
    if (data.overallStatus >= 4) {
      stopAutoRefresh()
    }
  } catch (error) {
    ElMessage.error('获取进度信息失败')
    console.error('加载进度失败:', error)
  } finally {
    loading.value = false
  }
}

/** 刷新进度 */
const refreshProgress = async () => {
  refreshing.value = true
  try {
    await loadProgress()
    ElMessage.success('进度已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/** 开始自动刷新 */
const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }

  refreshTimer.value = window.setInterval(() => {
    if (!loading.value && !refreshing.value) {
      loadProgress()
    }
  }, props.refreshInterval)
}

/** 停止自动刷新 */
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

/** 处理重试 */
const handleRetry = async () => {
  try {
    await ElMessageBox.confirm('确认重试此任务？将重新处理失败的部分。', '确认重试', {
      type: 'warning'
    })

    emit('retry', props.taskId!)
    handleClose()
  } catch (error) {
    // 用户取消
  }
}

/** 关闭对话框 */
const handleClose = () => {
  dialogVisible.value = false
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

/** 获取状态文本 */
const getStatusText = (status: number) => {
  return TASK_STATUS_TEXT[status] || '未知'
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

/** 获取状态指示器类名 */
const getStatusIndicatorClass = (status: number) => {
  const classMap = {
    0: 'pending',
    1: 'processing',
    2: 'processing',
    3: 'processing',
    4: 'success',
    5: 'error',
    6: 'warning'
  }
  return classMap[status] || 'pending'
}

/** 判断表是否处于活跃状态 */
const isTableActive = (status: number) => {
  return status >= 1 && status <= 3
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

/** 格式化持续时间 */
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}
</script>

<style scoped>
.progress-monitor-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.status-tag {
  font-weight: 600;
}

/* 任务概览卡片样式 */
.task-overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.task-overview-card :deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.task-overview-card .header-title,
.task-overview-card .header-icon {
  color: white;
}

.overall-progress-section {
  margin: 20px 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 16px;
  font-weight: 500;
  opacity: 0.9;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 600;
}

.main-progress {
  margin-bottom: 16px;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.current-stage,
.current-message,
.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  position: relative;
  transition: transform 0.2s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.stat-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 16px;
  opacity: 0.6;
}

.stat-item.success .stat-value {
  color: #67c23a;
}

.stat-item.danger .stat-value {
  color: #f56c6c;
}

/* 分表进度卡片样式 */
.table-progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-progress-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.table-progress-item.is-active {
  border-color: #409eff;
  background: #f0f9ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.table-icon-wrapper {
  position: relative;
}

.status-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator.pending {
  background-color: #909399;
}

.status-indicator.processing {
  background-color: #e6a23c;
  animation: pulse 2s infinite;
}

.status-indicator.success {
  background-color: #67c23a;
}

.status-indicator.error {
  background-color: #f56c6c;
}

.status-indicator.warning {
  background-color: #409eff;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.file-name {
  font-size: 12px;
  color: #909399;
}

.table-stage {
  font-size: 12px;
  color: #606266;
}

.table-status {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.table-progress-bar {
  margin: 16px 0;
}

.progress-message {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.table-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-group {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  color: #303133;
}

.stat-group.success .stat-value {
  color: #67c23a;
}

.stat-group.danger .stat-value {
  color: #f56c6c;
}

.stat-group.warning .stat-value {
  color: #e6a23c;
}

.time-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.table-error {
  margin-top: 12px;
}

.error-alert {
  border-radius: 6px;
}

/* 时间线样式 */
.timeline-content {
  padding-left: 12px;
}

.timeline-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-description {
  font-size: 12px;
  color: #909399;
}

.process-timeline {
  max-height: 300px;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 滚动条样式 */
:deep(.el-card__body) {
  padding: 20px;
}

.progress-monitor-content::-webkit-scrollbar {
  width: 6px;
}

.progress-monitor-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.progress-monitor-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.progress-monitor-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-row {
    flex-direction: column;
    gap: 8px;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .table-status {
    align-items: flex-start;
  }
}
</style>
