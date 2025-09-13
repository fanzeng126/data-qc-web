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
<!--        <el-button v-if="progressData.canRetry" type="warning" @click="handleRetry">
          <el-icon><RefreshRight /></el-icon>
          重试任务
        </el-button>-->
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

        <!-- 统计信息网格 - 统一设计 -->
<!--
        <div class="statistics-grid">
          &lt;!&ndash; 文件统计卡片 &ndash;&gt;
          <el-card class="stat-card" shadow="hover">
            <div class="stat-header">
              <div class="stat-title-wrapper">
                <el-icon class="stat-icon"><Folder /></el-icon>
                <span class="stat-title">文件统计</span>
              </div>
              <el-tag
                :type="
                  fileSuccessRate === 100
                    ? 'success'
                    : fileSuccessRate >= 80
                      ? 'primary'
                      : 'danger'
                "
                size="small"
              >
                {{ fileSuccessRate }}%
              </el-tag>
            </div>
            <div class="stat-content">
              <div class="stat-main">
                <span class="stat-value">{{ progressData.successFiles || 0 }}</span>
                <span class="stat-total">/ {{ progressData.totalFiles || 0 }}</span>
              </div>
              <div class="stat-breakdown">
                <div class="breakdown-item">
                  <span class="breakdown-label">成功:</span>
                  <span class="breakdown-value success">{{ progressData.successFiles || 0 }}</span>
                </div>
                <div class="breakdown-item" v-if="progressData.warningFiles && progressData.warningFiles > 0">
                  <span class="breakdown-label">警告:</span>
                  <span class="breakdown-value warning">{{ progressData.warningFiles }}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">失败:</span>
                  <span class="breakdown-value error">{{ progressData.failedFiles || 0 }}</span>
                </div>
              </div>
              <div class="stat-label">文件处理情况</div>
              <div class="stat-progress">
                <el-progress
                  :percentage="fileSuccessRate"
                  :stroke-width="6"
                  :show-text="false"
                  :status="
                    fileSuccessRate === 100
                      ? 'success'
                      : fileSuccessRate >= 80
                        ? undefined
                        : 'exception'
                  "
                />
              </div>
            </div>
          </el-card>

          &lt;!&ndash; 记录统计卡片 &ndash;&gt;
          <el-card class="stat-card" shadow="hover">
            <div class="stat-header">
              <div class="stat-title-wrapper">
                <el-icon class="stat-icon"><TrendCharts /></el-icon>
                <span class="stat-title">记录统计</span>
              </div>
              <el-tag
                :type="
                  recordSuccessRate >= 95
                    ? 'success'
                    : recordSuccessRate >= 80
                      ? 'primary'
                      : 'danger'
                "
                size="small"
              >
                {{ recordSuccessRate }}%
              </el-tag>
            </div>
            <div class="stat-content">
              <div class="stat-main">
                <span class="stat-value">{{ formatNumber(progressData.successRecords || 0) }}</span>
                <span class="stat-total">/ {{ formatNumber(progressData.totalRecords || 0) }}</span>
              </div>
              <div class="stat-breakdown">
                <div class="breakdown-item">
                  <span class="breakdown-label">成功:</span>
                  <span class="breakdown-value success">{{ formatNumber(progressData.successRecords || 0) }}</span>
                </div>
                <div class="breakdown-item" v-if="progressData.warningRecords && progressData.warningRecords > 0">
                  <span class="breakdown-label">警告:</span>
                  <span class="breakdown-value warning">{{ formatNumber(progressData.warningRecords) }}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">失败:</span>
                  <span class="breakdown-value error">{{ formatNumber(progressData.failedRecords || 0) }}</span>
                </div>
                <div class="breakdown-item" v-if="progressData.anomalyRecords && progressData.anomalyRecords > 0">
                  <span class="breakdown-label">异常:</span>
                  <span class="breakdown-value anomaly">{{ formatNumber(progressData.anomalyRecords) }}</span>
                </div>
              </div>
              <div class="stat-label">记录处理情况</div>
              <div class="stat-progress">
                <el-progress
                  :percentage="recordSuccessRate"
                  :stroke-width="6"
                  :show-text="false"
                  :status="
                    recordSuccessRate >= 95
                      ? 'success'
                      : recordSuccessRate >= 80
                        ? undefined
                        : 'exception'
                  "
                />
              </div>
            </div>
          </el-card>

          &lt;!&ndash; 规则统计卡片 &ndash;&gt;
          <el-card class="stat-card" shadow="hover" v-if="progressData.totalRules && progressData.totalRules > 0">
            <div class="stat-header">
              <div class="stat-title-wrapper">
                <el-icon class="stat-icon"><Document /></el-icon>
                <span class="stat-title">规则检查</span>
              </div>
              <el-tag
                :type="
                  rulePassRate >= 90 ? 'success' : rulePassRate >= 70 ? 'primary' : 'warning'
                "
                size="small"
              >
                {{ rulePassRate }}%
              </el-tag>
            </div>
            <div class="stat-content">
              <div class="stat-main">
                <span class="stat-value">{{ progressData.passedRules || 0 }}</span>
                <span class="stat-total">/ {{ progressData.totalRules || 0 }}</span>
              </div>
              <div class="stat-breakdown">
                <div class="breakdown-item">
                  <span class="breakdown-label">通过:</span>
                  <span class="breakdown-value success">{{ progressData.passedRules || 0 }}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">已执行:</span>
                  <span class="breakdown-value processing">{{ progressData.executedRules || 0 }}</span>
                </div>
                <div class="breakdown-item">
                  <span class="breakdown-label">失败:</span>
                  <span class="breakdown-value error">{{ progressData.failedRules || 0 }}</span>
                </div>
              </div>
              <div class="stat-label">规则通过情况</div>
              <div class="stat-progress">
                <el-progress
                  :percentage="rulePassRate"
                  :stroke-width="6"
                  :show-text="false"
                  :status="
                    rulePassRate >= 90 ? 'success' : rulePassRate >= 70 ? undefined : 'warning'
                  "
                />
              </div>
            </div>
          </el-card>

          &lt;!&ndash; 性能指标卡片 &ndash;&gt;
          <el-card class="stat-card" shadow="hover">
            <div class="stat-header">
              <div class="stat-title-wrapper">
                <el-icon class="stat-icon"><Operation /></el-icon>
                <span class="stat-title">性能指标</span>
              </div>
            </div>
            <div class="stat-content">
              <div class="performance-metrics">
                <div class="metric-item">
                  <span class="metric-label">处理速度:</span>
                  <span class="metric-value">{{ getProcessingSpeed() }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">处理耗时:</span>
                  <span class="metric-value">{{ formatDuration(progressData.estimatedRemainingTime) }}</span>
                </div>
                <div class="metric-item" v-if="progressData.totalRecords">
                  <span class="metric-label">吞吐量:</span>
                  <span class="metric-value">{{ getThroughput() }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">当前阶段:</span>
                  <span class="metric-value">{{ getCurrentStageText(progressData.currentStage) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>
-->
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
  RefreshRight,
  Folder,
  CircleCheck,
  Warning,
  CircleClose,
  TrendCharts,
  Document
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

/** 文件成功率 */
const fileSuccessRate = computed(() => {
  if (!progressData.totalFiles || progressData.totalFiles === 0) return 0
  return Math.round(((progressData.successFiles || 0) / progressData.totalFiles) * 100)
})

/** 记录成功率 */
const recordSuccessRate = computed(() => {
  if (!progressData.totalRecords || progressData.totalRecords === 0) return 0
  return Math.round(((progressData.successRecords || 0) / progressData.totalRecords) * 100)
})

/** 规则通过率 */
const rulePassRate = computed(() => {
  if (!progressData.totalRules || progressData.totalRules === 0) return 0
  return Math.round(((progressData.passedRules || 0) / progressData.totalRules) * 100)
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

    // 检测任务是否真正结束：任务状态完成 且 日志包含"任务执行结束"
    if (data.overallStatus >= 5) {
      // 检查日志是否包含任务结束标识
      await checkTaskCompletionInLogs(data.overallStatus)
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
  router.push('/monitoring/drug-import/task')
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

/** 检查任务日志中是否包含结束标识 */
const checkTaskCompletionInLogs = async (taskStatus: number) => {
  try {
    const logResponse = await DrugBatchImportApi.getTaskLogs(taskId.value, 'ALL')
    if (logResponse.logs) {
      // 检查日志是否包含任务结束的关键字
      const completionKeywords = ['任务执行结束', '导入流程完成', 'IMPORT_TASK_COMPLETED']
      const hasCompletionLog = completionKeywords.some(keyword => 
        logResponse.logs.includes(keyword)
      )
      
      if (hasCompletionLog) {
        console.log('找到任务结束日志')
        // 找到结束日志，停止自动刷新
        stopAutoRefresh()
        if (autoRefresh.value) {
          autoRefresh.value = false
          ElMessage.info('任务已结束，自动刷新已停止')
        }
      }
      // 如果没有找到结束日志，继续刷新等待日志完整
    }
  } catch (error) {
    // 获取日志失败时，根据任务状态决定是否停止刷新
    console.warn('获取任务日志失败，使用状态判断:', error)
    // 如果任务状态是失败或取消，直接停止刷新
    if (taskStatus === 6 || taskStatus === 8) {
      stopAutoRefresh()
      if (autoRefresh.value) {
        autoRefresh.value = false
        ElMessage.info('任务已结束，自动刷新已停止')
      }
    }
  }
}

/** 格式化数字 - 提供千分位分隔符 */
const formatNumber = (num: number) => {
  if (!num || typeof num !== 'number') return '0'
  return num.toLocaleString()
}

/** 获取处理速度 */
const getProcessingSpeed = () => {
  if (!progressData.totalRecords || !progressData.successRecords) return '-'
  // 这里可以根据实际情况计算速度
  return `${Math.round(progressData.successRecords / 60)}条/分钟`
}

/** 获取吞吐量 */
const getThroughput = () => {
  if (!progressData.totalRecords) return '-'
  return `${Math.round(progressData.totalRecords / 3600)}条/小时`
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

/* 任务概览卡片样式 - 移除背景色 */
.task-overview-card {
  /* 移除背景色和边框样式，使用默认样式 */
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

/* 统计卡片网格样式 - 统一设计 */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  transition: all 0.3s ease;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 12px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 16px;
}

.stat-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 18px;
  color: #409eff;
}

.stat-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.stat-content {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-total {
  font-size: 16px;
  color: #909399;
}

.stat-breakdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.breakdown-label {
  color: #606266;
}

.breakdown-value {
  font-weight: 500;
}

.breakdown-value.success {
  color: #67c23a;
}

.breakdown-value.warning {
  color: #e6a23c;
}

.breakdown-value.error {
  color: #f56c6c;
}

.breakdown-value.anomaly {
  color: #909399;
}

.breakdown-value.processing {
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-progress {
  margin-top: 4px;
}

/* 性能指标样式 */
.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.metric-label {
  color: #606266;
}

.metric-value {
  color: #303133;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .drug-import-progress-page {
    padding: 10px;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stat-card {
    margin-bottom: 12px;
  }

  .stat-header {
    padding: 12px 16px 8px;
    margin-bottom: 12px;
  }

  .stat-content {
    padding: 0 16px 16px;
  }

  .stat-value {
    font-size: 20px;
  }

  .performance-metrics {
    gap: 8px;
  }

  .metric-item {
    font-size: 13px;
  }
}
</style>
