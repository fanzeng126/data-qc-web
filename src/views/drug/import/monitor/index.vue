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
        <el-switch
          v-model="autoRefresh"
          size="default"
          active-text="自动刷新"
          inactive-text="手动刷新"
          @change="handleAutoRefreshChange"
          style="margin-right: 12px"
        />
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
              当前阶段：{{ getCurrentStageText(progressData.currentStage) }}
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
          <!-- 文件统计 -->
          <div class="stat-section">
            <div class="section-title">文件统计</div>
            <div class="section-stats">
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
              <div class="stat-item warning">
                <div class="stat-value">{{ formatNumber(progressData.warningFiles) }}</div>
                <div class="stat-label">警告文件</div>
                <div class="stat-icon">⚠️</div>
              </div>
              <div class="stat-item danger">
                <div class="stat-value">{{ progressData.failedFiles || 0 }}</div>
                <div class="stat-label">失败文件</div>
                <div class="stat-icon">❌</div>
              </div>
            </div>
          </div>

          <!-- 记录统计 -->
          <div class="stat-section">
            <div class="section-title">记录统计</div>
            <div class="section-stats">
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
              <div class="stat-item warning">
                <div class="stat-value">{{ formatNumber(progressData.warningRecords) }}</div>
                <div class="stat-label">警告记录</div>
                <div class="stat-icon">⚠️</div>
              </div>
              <div class="stat-item anomaly">
                <div class="stat-value">{{ formatNumber(progressData.anomalyRecords) }}</div>
                <div class="stat-label">异常记录</div>
                <div class="stat-icon">🔍</div>
              </div>
            </div>
          </div>

          <!-- 规则统计 -->
          <div class="stat-section">
            <div class="section-title">规则统计</div>
            <div class="section-stats">
              <div class="stat-item">
                <div class="stat-value">{{ progressData.totalRules || 0 }}</div>
                <div class="stat-label">总规则数</div>
                <div class="stat-icon">📋</div>
              </div>
              <div class="stat-item processing">
                <div class="stat-value">{{ progressData.executedRules || 0 }}</div>
                <div class="stat-label">已执行规则</div>
                <div class="stat-icon">⚡</div>
              </div>
              <div class="stat-item success">
                <div class="stat-value">{{ progressData.passedRules || 0 }}</div>
                <div class="stat-label">通过规则</div>
                <div class="stat-icon">✅</div>
              </div>
              <div class="stat-item danger">
                <div class="stat-value">{{ progressData.failedRules || 0 }}</div>
                <div class="stat-label">失败规则</div>
                <div class="stat-icon">❌</div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 执行日志组件 -->
      <TaskLogViewer
        :task-id="taskId"
        :auto-refresh-interval="5000"
        :max-log-lines="1000"
        :max-display-logs="500"
        :auto-refresh-enabled="autoRefresh"
        @export-logs="handleExportLogs"
      />
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
  Refresh,
  Clock,
  Operation,
  RefreshRight
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
import TaskLogViewer from '../detail/components/TaskLogViewer.vue'

/** 组件名称定义 */
defineOptions({ name: 'DrugImportProgressPage' })

const route = useRoute()
const router = useRouter()

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
  warningFiles: 0,
  failedFiles: 0,
  totalRecords: 0,
  successRecords: 0,
  failedRecords: 0,
  warningRecords: 0,
  anomalyRecords: 0,
  totalRules: 0,
  executedRules: 0,
  passedRules: 0,
  failedRules: 0,
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

    // 如果任务已完成（状态 >= 5），停止自动刷新 - 避免不必要的网络请求
    // 状态说明：5=成功, 6=失败, 7=部分成功, 8=已取消
    if (data.overallStatus >= 5) {
      stopAutoRefresh()
      // 如果自动刷新开关是开启的，将其关闭
      if (autoRefresh.value) {
        autoRefresh.value = false
        ElMessage.info('任务已结束，自动刷新已停止')
      }
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
    // 检查是否需要提示任务已结束
    if (progressData.overallStatus >= 5) {
      const statusMessages = {
        5: '任务已成功完成',
        6: '任务执行失败',
        7: '任务部分成功',
        8: '任务已取消'
      }
      const message = statusMessages[progressData.overallStatus] || '任务已结束'
      ElMessage.info(message)
    } else {
      ElMessage.success('进度已刷新')
    }
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
    // 检查任务状态，如果已结束则不允许开启
    if (progressData.overallStatus >= 4) {
      autoRefresh.value = false
      ElMessage.warning('任务已结束，无需自动刷新')
      return
    }
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

/** 处理日志导出 */
const handleExportLogs = () => {
  console.log('导出日志')
}

/** 返回列表 */
const handleBack = () => {
  router.push('/drug-import/task')
}

// ========================= 状态处理方法 =========================

/** 处理进度百分比，确保在有效范围内 - 防止Element Plus警告 */
const getValidProgress = (progress: number): number => {
  // 处理各种异常情况，确保组件的健壮性
  if (typeof progress !== 'number' || isNaN(progress)) return 0
  if (progress < 0) return 0 // 失败状态(-1)转换为0
  if (progress > 100) return 100 // 超过100的值限制为100
  return progress
}

/** 获取状态标签类型 - 使用字典统一管理 */
const getStatusTagType = (status: number) => {
  return getDictColorType(DICT_TYPE.DRUG_TASK_STATUS, status.toString()) || 'info'
}

/** 获取状态文本 - 使用字典确保一致性 */
const getStatusText = (status: number) => {
  return getDictLabel(DICT_TYPE.DRUG_TASK_STATUS, status.toString()) || '未知状态'
}

/** 获取任务阶段的中文显示文本 */
const getCurrentStageText = (currentStage: string) => {
  const stageMapping: Record<string, string> = {
    // 基本阶段
    'WAITING': '等待开始',
    'EXTRACTING': '正在解压文件',
    'CREATING_QC': '正在创建质控记录',
    'PARSING': '正在解析数据',
    'IMPORTING_TO_PRE_TABLES': '正在导入数据到临时表',

    // 前置质控相关
    'GLOBAL_PRE_QC': '正在执行前置质控',
    'PRE_QC': '正在执行前置质控规则检查',
    'PRE_QC_COMPLETED': '前置质控完成',
    'PRE_QC_SQL': '正在执行前置质控规则检查',
    'PRE_QC_SQL_COMPLETED': '前置质控完成',

    // 导入阶段
    'IMPORTING': '正在导入数据',
    'IMPORTING_FROM_PRE_TABLES': '正在从临时表导入到正式表',

    // 后置质控相关
    'POST_QC': '正在执行后置质控',
    'POST_QC_SQL': '正在执行后置质控规则检查',
    'POST_QC_COMPLETED': '后置质控完成',
    'POST_QC_SQL_COMPLETED': '后置质控完成',

    // 完成状态
    'COMPLETED': '任务处理完成',
    'CANCELLED': '任务已取消'
  }

  return stageMapping[currentStage] || currentStage || '准备中'
}

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  if (status === TASK_STATUS.CANCELLED) return 'warning'
  return undefined
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

/* 任务概览卡片样式 - 改为更淡的背景色 */
.task-overview-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid rgba(102, 126, 234, 0.2);
  position: relative;
  overflow: hidden;
}

/* 添加一个装饰性的背景元素 */
.task-overview-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.05) 0%, transparent 70%);
  pointer-events: none;
}

.task-overview-card :deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.5);
  border-bottom: 1px solid rgba(102, 126, 234, 0.15);
  backdrop-filter: blur(10px);
}

/* 调整文字颜色为深色，提高可读性 */
.task-overview-card .header-title {
  color: #303133;
}

.task-overview-card .header-icon {
  color: #667eea;
}

.overall-progress-section {
  margin: 20px 0;
  position: relative;
  z-index: 1;
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
  color: #606266;
}

.progress-percentage {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.main-progress {
  margin-bottom: 16px;
}

/* 修改进度条的样式，使用主题色 */
.main-progress :deep(.el-progress-bar__outer) {
  background-color: rgba(102, 126, 234, 0.1);
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.current-stage,
.current-message,
.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 统计数据网格样式 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
  position: relative;
  z-index: 1;
}

.stat-section {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(102, 126, 234, 0.15);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.15);
}

.section-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  position: relative;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #303133;
}

.stat-label {
  font-size: 11px;
  color: #909399;
  line-height: 1.2;
}

.stat-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 12px;
  opacity: 0.6;
}

/* 不同类型的统计项颜色 */
.stat-item.success .stat-value {
  color: #67c23a;
}

.stat-item.danger .stat-value {
  color: #f56c6c;
}

.stat-item.warning .stat-value {
  color: #e6a23c;
}

.stat-item.anomaly .stat-value {
  color: #909399;
}

.stat-item.processing .stat-value {
  color: #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .section-stats {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
}

@media (max-width: 768px) {
  .drug-import-progress-page {
    padding: 10px;
  }

  .stats-grid {
    gap: 12px;
  }

  .section-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
