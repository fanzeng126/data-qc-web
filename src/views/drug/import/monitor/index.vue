<template>
  <div class="drug-import-progress-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
      :show-back-button="true"
      back-button-text="返回列表"
      @back-click="handleBack"
    >
      <template #extra>
        <el-button type="primary" @click="refreshProgress" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新进度
        </el-button>
        <el-button v-if="progressData.canRetry" type="warning" @click="handleRetry">
          <el-icon><RefreshRight /></el-icon>
          重试任务
        </el-button>
      </template>
    </PageHeader>

    <div v-loading="loading" class="progress-content">
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
            <span class="progress-percentage"
              >{{ getValidProgress(progressData.overallProgress) }}%</span
            >
          </div>

          <el-progress
            :percentage="getValidProgress(progressData.overallProgress)"
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
              <el-switch
                v-model="autoRefresh"
                @change="handleAutoRefreshChange"
                active-text="自动刷新"
                inactive-text="手动刷新"
              />
            </div>
          </div>
        </template>

        <!-- 表进度列表 -->
        <div class="table-progress-list" v-if="progressData.tableProgress?.length">
          <div
            v-for="table in progressData.tableProgress"
            :key="`table-${table.tableType}`"
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
                  <div class="table-stage">{{ table.currentStage || '等待处理' }}</div>
                </div>
              </div>
              <div class="table-status">
                <el-tag :type="getStatusTagType(table.status)" size="small" class="status-tag">
                  {{ getTableStatusDisplay(table.status) }}
                </el-tag>
                <div class="progress-text">{{ formatProgressText(table.progress) }}</div>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="table-progress-bar">
              <el-progress
                :percentage="getValidProgress(table.progress)"
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

        <!-- 暂无进度数据 -->
        <div v-else class="no-progress-data">
          <el-empty description="暂无进度数据">
            <el-button type="primary" @click="refreshProgress">刷新数据</el-button>
          </el-empty>
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
            <div class="header-right">
              <span class="timeline-count">{{ timelineEvents.length }} 个事件</span>
            </div>
          </div>
        </template>

        <el-timeline class="process-timeline">
          <el-timeline-item
            v-for="event in timelineEvents"
            :key="event.id"
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

    <!-- 重试确认对话框 -->
    <RetryConfirmDialog
      v-model="retryDialogVisible"
      :task="currentTask"
      @confirm="handleRetryConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import {
  DataAnalysis,
  List,
  Refresh,
  Document,
  Clock,
  Operation,
  RefreshRight,
  SuccessFilled,
  WarningFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  DrugBatchImportApi,
  type ImportProgressVO,
  type ImportTaskRespVO,
  TASK_STATUS
} from '@/api/drug/task'

// 添加字典导入 - 这是状态管理统一化的基础
import { DICT_TYPE, getDictLabel, getDictColorType } from '@/utils/dict'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import RetryConfirmDialog from '../task/components/RetryConfirmDialog.vue'

/** 组件名称定义 */
defineOptions({ name: 'DrugImportProgressPage' })

const route = useRoute()
const router = useRouter()

// ========================= 类型定义 =========================

// 时间线事件的类型接口 - 明确定义确保类型安全
interface TimelineEvent {
  id: string // 唯一标识符，避免Vue的key重复警告
  timestamp: string // 格式化后的时间戳
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info' // 严格的类型约束
  icon: any // 图标组件
  title: string // 事件标题
  description?: string // 可选的事件描述
}

// ========================= 响应式数据 =========================

const loading = ref(false)
const refreshing = ref(false)
const autoRefresh = ref(true)
const refreshTimer = ref<number | null>(null)
const retryDialogVisible = ref(false)

/** 任务ID - 从路由参数中获取 */
const taskId = ref<number>(Number(route.params.id || route.query.id))

/** 进度数据 - 响应式数据结构，存储所有进度相关信息 */
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

/** 当前任务信息 - 用于重试对话框 */
const currentTask = ref<ImportTaskRespVO | null>(null)

// ========================= 计算属性 =========================

const pageTitle = computed(() => {
  return `导入进度监控 - ${progressData.taskNo || '未知任务'}`
})

const pageDescription = computed(() => {
  const status = getStatusText(progressData.overallStatus)
  const progress = getValidProgress(progressData.overallProgress)
  return `任务状态：${status} | 完成进度：${progress}% | 最后更新：${formatTime(new Date().toISOString())}`
})

/** 时间线事件 - 修复类型和重复键问题 */
const timelineEvents = computed((): TimelineEvent[] => {
  const events: TimelineEvent[] = []

  // 生成唯一ID的辅助函数 - 避免Vue的key重复警告
  const generateEventId = (type: string, index: number = 0, timestamp: string = ''): string => {
    // 确保timestamp是字符串类型，避免replace方法调用错误
    const safeTimestamp = timestamp || '' // 处理null/undefined情况
    const cleanTimestamp =
      typeof safeTimestamp === 'string'
        ? safeTimestamp.replace(/[^\w]/g, '_')
        : String(safeTimestamp).replace(/[^\w]/g, '_') // 强制转换为字符串

    return `${type}_${index}_${cleanTimestamp}`
  }

  // 任务开始事件
  if (progressData.startTime) {
    events.push({
      id: generateEventId('task_start', 0, progressData.startTime),
      timestamp: formatTime(progressData.startTime),
      type: 'primary',
      icon: SuccessFilled,
      title: '任务开始',
      description: '开始执行导入任务'
    })
  }

  // 根据表进度生成事件 - 为每个表的开始和结束创建事件
  progressData.tableProgress?.forEach((table, index) => {
    if (table.startTime) {
      events.push({
        id: generateEventId('table_start', index, table.startTime),
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
        id: generateEventId('table_end', index, table.endTime),
        timestamp: formatTime(table.endTime),
        type,
        icon,
        title: `${table.tableName} 处理完成`,
        description: `状态：${getTableStatusDisplay(table.status)} | 成功：${formatNumber(table.successRecords)} | 失败：${formatNumber(table.failedRecords)}`
      })
    }
  })

  // 任务完成事件
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
      id: generateEventId('task_end', 0, progressData.estimatedEndTime),
      timestamp: formatTime(progressData.estimatedEndTime),
      type,
      icon,
      title: '任务完成',
      description: `最终状态：${getStatusText(progressData.overallStatus)}`
    })
  }

  // 按时间排序返回事件列表
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
})

// ========================= 监听器 =========================

watch(
  () => route.params.id,
  (newTaskId) => {
    if (newTaskId) {
      taskId.value = Number(newTaskId)
      loadProgress()
    }
  }
)

watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// ========================= 生命周期 =========================

onMounted(() => {
  if (taskId.value) {
    loadProgress()
    if (autoRefresh.value) {
      startAutoRefresh()
    }
  } else {
    ElMessage.error('任务ID参数缺失')
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// ========================= 核心方法 =========================

/** 加载进度数据 - 核心数据获取方法 */
const loadProgress = async () => {
  if (!taskId.value) {
    return
  }

  loading.value = true
  try {
    const data = await DrugBatchImportApi.getTaskProgress(taskId.value)
    Object.assign(progressData, data)

    // 如果任务已完成，停止自动刷新 - 避免不必要的网络请求
    if (data.overallStatus >= 4) {
      stopAutoRefresh()
    }

    // 构建当前任务信息（用于重试对话框）
    if (!currentTask.value) {
      currentTask.value = {
        id: data.taskId,
        taskNo: data.taskNo,
        taskName: data.taskName,
        status: data.overallStatus,
        canRetry: data.canRetry
      } as ImportTaskRespVO
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

/** 开始自动刷新 - 实时监控的核心机制 */
const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }

  refreshTimer.value = window.setInterval(() => {
    if (!loading.value && !refreshing.value) {
      loadProgress()
    }
  }, 3000) // 3秒刷新一次，平衡实时性和性能
}

/** 停止自动刷新 */
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

/** 自动刷新开关变化处理 */
const handleAutoRefreshChange = (value: boolean) => {
  if (value) {
    ElMessage.success('已开启自动刷新')
    startAutoRefresh()
  } else {
    ElMessage.info('已关闭自动刷新')
    stopAutoRefresh()
  }
}

/** 处理重试 */
const handleRetry = () => {
  retryDialogVisible.value = true
}

/** 重试确认 */
const handleRetryConfirm = async (params: any) => {
  try {
    const result = await DrugBatchImportApi.retryImportTask(params)

    ElNotification({
      type: 'success',
      title: '重试任务已启动',
      message: `批次编号：${result.retryBatchNo}`,
      duration: 3000
    })

    // 重新开始监控
    await loadProgress()
    if (!autoRefresh.value) {
      autoRefresh.value = true
    }
  } catch (error) {
    ElMessage.error('重试任务失败')
  }
}

/** 返回列表 */
const handleBack = () => {
  router.push('/drug-import/task')
}

// ========================= 状态处理方法（核心修复部分）=========================

/** 处理进度百分比，确保在有效范围内 - 防止Element Plus警告 */
const getValidProgress = (progress: number): number => {
  // 处理各种异常情况，确保组件的健壮性
  if (typeof progress !== 'number' || isNaN(progress)) return 0
  if (progress < 0) return 0 // 失败状态(-1)转换为0
  if (progress > 100) return 100 // 超过100的值限制为100
  return progress
}

/** 格式化进度显示文本 - 提供更友好的用户体验 */
const formatProgressText = (progress: number): string => {
  if (progress === -1) return '失败'
  if (progress === 0) return '等待中'
  if (typeof progress !== 'number' || isNaN(progress)) return '计算中'
  return `${progress}%`
}

/** 获取状态标签类型 - 使用字典统一管理 */
const getStatusTagType = (status: number) => {
  return getDictColorType(DICT_TYPE.DRUG_TASK_STATUS, status.toString()) || 'info'
}

/** 获取状态文本 - 使用字典确保一致性 */
const getStatusText = (status: number) => {
  return getDictLabel(DICT_TYPE.DRUG_TASK_STATUS, status.toString()) || '未知状态'
}

/** 获取表状态显示文本 - 处理缺失的statusDisplay字段 */
const getTableStatusDisplay = (status: number) => {
  // 这里使用任务状态字典，如果将来有专门的表状态字典可以替换
  return getDictLabel(DICT_TYPE.DRUG_TASK_STATUS, status.toString()) || '未知状态'
}

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  return undefined
}

/** 获取表图标颜色 - 根据状态提供视觉反馈 */
const getTableIconColor = (status: number) => {
  const colorMap = {
    0: '#909399', // 等待中 - 灰色
    1: '#E6A23C', // 进行中 - 橙色
    2: '#E6A23C', // 进行中 - 橙色
    3: '#E6A23C', // 进行中 - 橙色
    4: '#67C23A', // 成功 - 绿色
    5: '#F56C6C', // 失败 - 红色
    6: '#409EFF' // 部分成功 - 蓝色
  }
  return colorMap[status] || '#909399'
}

/** 获取状态指示器类名 - 提供动画和视觉效果 */
const getStatusIndicatorClass = (status: number) => {
  const classMap = {
    0: 'pending', // 等待中
    1: 'processing', // 进行中（带动画）
    2: 'processing', // 进行中（带动画）
    3: 'processing', // 进行中（带动画）
    4: 'success', // 成功
    5: 'error', // 失败
    6: 'warning' // 部分成功
  }
  return classMap[status] || 'pending'
}

/** 判断表是否处于活跃状态 - 影响UI显示效果 */
const isTableActive = (status: number) => {
  return status >= 1 && status <= 3 // 正在处理的状态
}

// ========================= 工具方法 =========================

/** 格式化数字 - 提供千分位分隔符 */
const formatNumber = (num: number) => {
  if (!num || typeof num !== 'number') return '0'
  return num.toLocaleString()
}

/** 格式化时间 - 统一时间显示格式 */
const formatTime = (time: string) => {
  if (!time) return ''
  try {
    return new Date(time).toLocaleString()
  } catch (error) {
    return time // 如果格式化失败，返回原始值
  }
}

/** 格式化持续时间 - 友好的时间显示 */
const formatDuration = (seconds: number) => {
  if (!seconds || typeof seconds !== 'number') return '计算中'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}
</script>

<style scoped>
.drug-import-progress-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 20px;
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

.timeline-count {
  font-size: 12px;
  color: #909399;
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

.no-progress-data {
  padding: 40px 0;
  text-align: center;
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
  max-height: 400px;
  overflow-y: auto;
}

/* 滚动条样式 */
:deep(.el-card__body) {
  padding: 20px;
}

.progress-content::-webkit-scrollbar {
  width: 6px;
}

.progress-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.progress-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.progress-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .drug-import-progress-page {
    padding: 10px;
  }

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
