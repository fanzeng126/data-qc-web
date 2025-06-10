<!-- 修复：标签显示和内容加载问题 -->
<template>
  <div class="task-detail-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
      :icon="ViewIcon"
      :tag="statusTag"
      :tag-type="statusTagType"
      :meta="metaInfo"
      show-back-button
      back-button-text="返回任务列表"
      :actions="headerActions"
      :tabs="tabList"
      :default-tab="activeTab"
      @back-click="handleBackClick"
      @action-click="handleHeaderAction"
      @tab-change="handleTabChange"
    />

    <!-- 主要内容区域 -->
    <div class="detail-content" v-loading="loading">
      <!-- 任务概览面板 -->
      <div v-show="activeTab === 'overview'" class="tab-content">
        <!-- 修复：确保在数据加载完成后才显示内容 -->
        <div v-if="taskDetail">
          <div class="overview-grid">
            <!-- 基本信息卡片 -->
            <el-card class="info-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon">
                    <InfoFilled />
                  </el-icon>
                  <span class="header-title">基本信息</span>
                </div>
              </template>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="任务编号">
                  <el-tag type="primary">{{ taskDetail?.taskInfo?.taskNo || '未知' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="任务名称">
                  {{ taskDetail?.taskInfo?.taskName || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="文件名称">
                  {{ taskDetail?.taskInfo?.fileName || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">
                  {{ formatFileSize(taskDetail?.taskInfo?.fileSize || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="创建人">
                  {{ taskDetail?.taskInfo?.creator || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源">
                  {{ getDataSourceText(taskDetail?.taskInfo?.dataSource) }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ formatTime(taskDetail?.taskInfo?.createTime) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <!-- 进度监控卡片 -->
            <el-card class="progress-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon">
                    <TrendCharts />
                  </el-icon>
                  <span class="header-title">进度监控</span>
                  <el-button
                    link
                    size="small"
                    @click="refreshProgress"
                    :loading="refreshing"
                    class="refresh-btn"
                  >
                    <el-icon><Refresh /></el-icon>
                    刷新
                  </el-button>
                </div>
              </template>

              <!-- 阶段进度 -->
              <div class="stage-progress-section">
                <el-steps :active="getActiveStep()" finish-status="success" align-center>
                  <el-step
                    title="文件解压"
                    :status="getStepStatus(taskDetail?.overallProgress?.stageStatus?.extractStatus)"
                    :description="getStepDescription('extract')"
                  />
                  <el-step
                    title="数据导入"
                    :status="getStepStatus(taskDetail?.overallProgress?.stageStatus?.importStatus)"
                    :description="getStepDescription('import')"
                  />
                  <el-step
                    title="质控检查"
                    :status="getStepStatus(taskDetail?.overallProgress?.stageStatus?.qcStatus)"
                    :description="getStepDescription('qc')"
                  />
                </el-steps>
              </div>

              <!-- 整体进度 -->
              <div class="overall-progress-section">
                <div class="progress-header">
                  <span class="progress-label">整体完成度</span>
                  <span class="progress-value"
                    >{{ getValidProgress(taskDetail?.overallProgress?.overallProgress) }}%</span
                  >
                </div>
                <el-progress
                  :percentage="getValidProgress(taskDetail?.overallProgress?.overallProgress)"
                  :stroke-width="16"
                  :status="getProgressBarStatus()"
                />
                <div class="progress-message">
                  {{ taskDetail?.overallProgress?.currentMessage || '等待处理...' }}
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="time-info-section">
                <div class="time-grid">
                  <div class="time-item" v-if="taskDetail?.overallProgress?.timeInfo?.startTime">
                    <div class="time-label">开始时间</div>
                    <div class="time-value">{{
                      formatTime(taskDetail.overallProgress.timeInfo.startTime)
                    }}</div>
                  </div>
                  <div
                    class="time-item"
                    v-if="taskDetail?.overallProgress?.timeInfo?.estimatedEndTime"
                  >
                    <div class="time-label">预计完成</div>
                    <div class="time-value">{{
                      formatTime(taskDetail.overallProgress.timeInfo.estimatedEndTime)
                    }}</div>
                  </div>
                  <div
                    class="time-item"
                    v-if="taskDetail?.overallProgress?.timeInfo?.elapsedSeconds"
                  >
                    <div class="time-label">已用时间</div>
                    <div class="time-value">{{
                      formatDuration(taskDetail.overallProgress.timeInfo.elapsedSeconds)
                    }}</div>
                  </div>
                  <div
                    class="time-item"
                    v-if="taskDetail?.overallProgress?.estimation?.estimatedRemainingSeconds"
                  >
                    <div class="time-label">预计剩余</div>
                    <div class="time-value">{{
                      formatDuration(
                        taskDetail.overallProgress.estimation.estimatedRemainingSeconds
                      )
                    }}</div>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 统计信息网格 -->
          <div class="statistics-grid">
            <el-card class="stat-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><Folder /></el-icon>
                  <span class="header-title">文件统计</span>
                </div>
              </template>
              <div class="stat-content">
                <div class="stat-item">
                  <span class="stat-label">总文件数</span>
                  <span class="stat-value">{{
                    taskDetail?.statistics?.fileStats?.totalFiles || 0
                  }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">成功文件</span>
                  <span class="stat-value">{{
                    taskDetail?.statistics?.fileStats?.successFiles || 0
                  }}</span>
                </div>
                <div class="stat-item danger">
                  <span class="stat-label">失败文件</span>
                  <span class="stat-value">{{
                    taskDetail?.statistics?.fileStats?.failedFiles || 0
                  }}</span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="
                      getValidProgress(taskDetail?.statistics?.fileStats?.fileSuccessRate)
                    "
                    :stroke-width="8"
                    :show-text="false"
                    :status="getFileProgressStatus()"
                  />
                </div>
              </div>
            </el-card>

            <el-card class="stat-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><DataBoard /></el-icon>
                  <span class="header-title">记录统计</span>
                </div>
              </template>
              <div class="stat-content">
                <div class="stat-item">
                  <span class="stat-label">总记录数</span>
                  <span class="stat-value">{{
                    formatNumber(taskDetail?.statistics?.recordStats?.totalRecords || 0)
                  }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">成功记录</span>
                  <span class="stat-value">{{
                    formatNumber(taskDetail?.statistics?.recordStats?.successRecords || 0)
                  }}</span>
                </div>
                <div class="stat-item danger">
                  <span class="stat-label">失败记录</span>
                  <span class="stat-value">{{
                    formatNumber(taskDetail?.statistics?.recordStats?.failedRecords || 0)
                  }}</span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="
                      getValidProgress(taskDetail?.statistics?.recordStats?.overallSuccessRate)
                    "
                    :stroke-width="8"
                    :show-text="false"
                    :status="getRecordProgressStatus()"
                  />
                </div>
              </div>
            </el-card>

            <el-card class="stat-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><Stopwatch /></el-icon>
                  <span class="header-title">性能指标</span>
                </div>
              </template>
              <div class="stat-content">
                <div class="performance-item">
                  <span class="perf-label">处理速度</span>
                  <span class="perf-value"
                    >{{
                      taskDetail?.statistics?.performanceStats?.averageProcessingSpeed || 0
                    }}
                    条/秒</span
                  >
                </div>
                <div class="performance-item">
                  <span class="perf-label">平均耗时</span>
                  <span class="perf-value">{{
                    formatDuration(
                      taskDetail?.statistics?.performanceStats?.averageProcessingTime || 0
                    )
                  }}</span>
                </div>
                <div class="performance-item">
                  <span class="perf-label">性能等级</span>
                  <el-tag
                    :type="
                      getPerformanceLevelType(
                        taskDetail?.statistics?.performanceStats?.performanceLevel
                      )
                    "
                    size="small"
                  >
                    {{
                      getPerformanceLevelText(
                        taskDetail?.statistics?.performanceStats?.performanceLevel
                      )
                    }}
                  </el-tag>
                </div>
              </div>
            </el-card>

            <el-card class="stat-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <el-icon class="header-icon"><Medal /></el-icon>
                  <span class="header-title">质量评分</span>
                </div>
              </template>
              <div class="stat-content">
                <div class="quality-score-display">
                  <div class="score-value">{{
                    taskDetail?.qualityReport?.scores?.overallQualityScore || 0
                  }}</div>
                  <div class="score-label">总体评分</div>
                  <div class="score-grade">
                    <el-tag
                      :type="getQualityGradeType(taskDetail?.qualityReport?.scores?.overallGrade)"
                      size="small"
                    >
                      {{ taskDetail?.qualityReport?.scores?.overallGrade || 'N/A' }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 修复：数据未加载时显示加载状态 -->
        <div v-else class="loading-placeholder">
          <el-skeleton :rows="5" animated />
        </div>
      </div>

      <!-- 分表详情面板 -->
      <div v-show="activeTab === 'tables'" class="tab-content">
        <el-card class="tables-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><List /></el-icon>
              <span class="header-title">分表处理详情</span>
            </div>
          </template>

          <!-- 修复：确保在数据加载完成后才显示内容 -->
          <div
            v-if="taskDetail?.tableDetails && taskDetail.tableDetails.length > 0"
            class="table-details-list"
          >
            <div
              v-for="table in taskDetail.tableDetails"
              :key="table.basicInfo?.tableType"
              class="table-detail-item"
            >
              <div class="table-item-header">
                <div class="table-info">
                  <div class="table-icon-wrapper">
                    <el-icon
                      class="table-icon"
                      :color="getTableStatusColor(table.progressInfo?.status)"
                    >
                      <Document />
                    </el-icon>
                  </div>
                  <div class="table-meta">
                    <div class="table-name">{{ getTableTypeName(table.basicInfo?.tableType) }}</div>
                    <div class="file-name">{{ table.basicInfo?.fileName }}</div>
                  </div>
                </div>
                <div class="table-status">
                  <el-tag :type="getTableStatusTagType(table.progressInfo?.status)" size="small">
                    {{ getTableStatusText(table.progressInfo?.status) }}
                  </el-tag>
                </div>
              </div>

              <div class="table-progress">
                <div class="progress-info">
                  <span class="progress-label">处理进度</span>
                  <span class="progress-percent"
                    >{{ getValidProgress(table.progressInfo?.progressPercent) }}%</span
                  >
                </div>
                <el-progress
                  :percentage="getValidProgress(table.progressInfo?.progressPercent)"
                  :stroke-width="6"
                  :show-text="false"
                  :status="getTableProgressStatus(table.progressInfo?.status)"
                />
                <div class="progress-message">{{ table.progressInfo?.currentMessage || '' }}</div>
              </div>

              <div class="table-statistics">
                <div class="stats-row">
                  <div class="stat-item">
                    <span class="stat-label">总行数:</span>
                    <span class="stat-value">{{
                      formatNumber(table.statisticsInfo?.totalRows || 0)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">有效行数:</span>
                    <span class="stat-value">{{
                      formatNumber(table.statisticsInfo?.validRows || 0)
                    }}</span>
                  </div>
                  <div class="stat-item success">
                    <span class="stat-label">成功:</span>
                    <span class="stat-value">{{
                      formatNumber(table.statisticsInfo?.successRows || 0)
                    }}</span>
                  </div>
                  <div class="stat-item danger">
                    <span class="stat-label">失败:</span>
                    <span class="stat-value">{{
                      formatNumber(table.statisticsInfo?.failedRows || 0)
                    }}</span>
                  </div>
                </div>

                <div class="stats-row" v-if="table.statisticsInfo?.qcPassedRows !== undefined">
                  <div class="stat-item">
                    <span class="stat-label">质控通过:</span>
                    <span class="stat-value">{{
                      formatNumber(table.statisticsInfo?.qcPassedRows || 0)
                    }}</span>
                  </div>
                  <div class="stat-item warning">
                    <span class="stat-label">质控失败:</span>
                    <span class="stat-value">{{
                      formatNumber(table.statisticsInfo?.qcFailedRows || 0)
                    }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">成功率:</span>
                    <span class="stat-value"
                      >{{ (table.statisticsInfo?.successRate || 0).toFixed(1) }}%</span
                    >
                  </div>
                </div>
              </div>

              <div class="table-operations" v-if="table.operationInfo">
                <div class="operation-info">
                  <span v-if="table.operationInfo?.startTime" class="time-info">
                    开始: {{ formatTime(table.operationInfo.startTime) }}
                  </span>
                  <span v-if="table.operationInfo?.endTime" class="time-info">
                    结束: {{ formatTime(table.operationInfo.endTime) }}
                  </span>
                  <span v-if="table.operationInfo?.retryCount" class="retry-info">
                    重试: {{ table.operationInfo.retryCount }}/{{
                      table.operationInfo.maxRetryCount
                    }}
                  </span>
                </div>
                <div class="operation-actions" v-if="table.operationInfo?.canRetry">
                  <el-button
                    type="warning"
                    size="small"
                    @click="handleRetryTable(table.basicInfo?.tableType)"
                  >
                    重试此表
                  </el-button>
                </div>
              </div>

              <div v-if="table.operationInfo?.errorMessage" class="table-error">
                <el-alert
                  :title="table.operationInfo.errorMessage"
                  type="error"
                  :closable="false"
                  show-icon
                />
              </div>
            </div>
          </div>

          <!-- 修复：完善空状态处理 -->
          <div
            v-else-if="
              taskDetail && (!taskDetail.tableDetails || taskDetail.tableDetails.length === 0)
            "
            class="empty-tables"
          >
            <el-empty :image-size="80" description="暂无分表数据">
              <template #image>
                <el-icon class="empty-icon"><Document /></el-icon>
              </template>
            </el-empty>
          </div>

          <!-- 数据加载中 -->
          <div v-else class="loading-placeholder">
            <el-skeleton :rows="3" animated />
          </div>
        </el-card>
      </div>

      <!-- 日志查看面板 -->
      <div v-show="activeTab === 'logs'" class="tab-content">
        <!-- 修复：确保taskId有效时才渲染组件 -->
        <TaskLogViewer
          v-if="taskId && taskId > 0"
          :task-id="taskId"
          @export-logs="handleExportLogs"
        />
        <div v-else class="loading-placeholder">
          <el-skeleton :rows="5" animated />
        </div>
      </div>

      <!-- 质量报告面板 -->
      <div v-show="activeTab === 'quality'" class="tab-content">
        <el-card class="quality-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Medal /></el-icon>
              <span class="header-title">质量报告</span>
            </div>
          </template>

          <!-- 修复：确保在数据加载完成后才显示内容 -->
          <div v-if="taskDetail?.qualityReport" class="quality-content">
            <!-- 质量评分 -->
            <div class="quality-scores">
              <div class="score-item">
                <div class="score-label">总体评分</div>
                <div class="score-value">{{
                  taskDetail.qualityReport.scores?.overallQualityScore || 0
                }}</div>
              </div>
              <div class="score-item">
                <div class="score-label">数据完整性</div>
                <div class="score-value">{{
                  taskDetail.qualityReport.scores?.dataIntegrityScore || 0
                }}</div>
              </div>
              <div class="score-item">
                <div class="score-label">一致性</div>
                <div class="score-value">{{
                  taskDetail.qualityReport.scores?.consistencyScore || 0
                }}</div>
              </div>
              <div class="score-item">
                <div class="score-label">完整性</div>
                <div class="score-value">{{
                  taskDetail.qualityReport.scores?.completenessScore || 0
                }}</div>
              </div>
            </div>

            <!-- 质量问题 -->
            <div class="quality-issues" v-if="taskDetail.qualityReport.issues">
              <h4>质量问题</h4>
              <div class="issues-summary">
                <el-tag type="danger" size="small">
                  严重问题: {{ taskDetail.qualityReport.issues.criticalIssues?.length || 0 }}
                </el-tag>
                <el-tag type="warning" size="small">
                  警告问题: {{ taskDetail.qualityReport.issues.warningIssues?.length || 0 }}
                </el-tag>
                <el-tag type="info" size="small">
                  信息问题: {{ taskDetail.qualityReport.issues.infoIssues?.length || 0 }}
                </el-tag>
              </div>
            </div>

            <!-- 改进建议 -->
            <div class="quality-recommendations" v-if="taskDetail.qualityReport.recommendations">
              <h4>改进建议</h4>
              <div class="recommendations-content">
                <div
                  class="recommendation-section"
                  v-if="taskDetail.qualityReport.recommendations.immediateActions?.length"
                >
                  <h5>立即行动</h5>
                  <ul>
                    <li
                      v-for="action in taskDetail.qualityReport.recommendations.immediateActions"
                      :key="action"
                    >
                      {{ action }}
                    </li>
                  </ul>
                </div>
                <div
                  class="recommendation-section"
                  v-if="taskDetail.qualityReport.recommendations.processImprovements?.length"
                >
                  <h5>流程改进</h5>
                  <ul>
                    <li
                      v-for="improvement in taskDetail.qualityReport.recommendations
                        .processImprovements"
                      :key="improvement"
                    >
                      {{ improvement }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 修复：完善空状态处理 -->
          <div v-else-if="taskDetail && !taskDetail.qualityReport" class="empty-quality">
            <el-empty :image-size="80" description="暂无质量报告数据">
              <template #image>
                <el-icon class="empty-icon"><Medal /></el-icon>
              </template>
            </el-empty>
          </div>

          <!-- 数据加载中 -->
          <div v-else class="loading-placeholder">
            <el-skeleton :rows="4" animated />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  View as ViewIcon,
  InfoFilled,
  TrendCharts,
  Folder,
  DataBoard,
  Stopwatch,
  Medal,
  List,
  Document,
  Refresh,
  Download as DownloadIcon,
  RefreshRight,
  Close,
  User, // 新增：用户图标
  Clock, // 新增：时钟图标
  DocumentCopy // 新增：文档复制图标
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import TaskLogViewer from './components/TaskLogViewer.vue'
import { DrugBatchImportApi, type ImportTaskDetailVO } from '@/api/drug/task'
import { DICT_TYPE, getDictLabel, getDictColorType } from '@/utils/dict'

/** 页面组件名称 */
defineOptions({ name: 'DrugImportTaskDetail' })

// ========================= 类型定义 =========================

interface HeaderAction {
  key: string
  text: string
  type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon: any
}

interface TabItem {
  key: string
  label: string
  icon: any
  badge?: number
}

// ========================= 路由和基础数据 =========================

const route = useRoute()
const router = useRouter()
const taskId = computed(() => Number(route.params.id))

const loading = ref(false)
const refreshing = ref(false)
const taskDetail = ref<ImportTaskDetailVO | null>(null)
const activeTab = ref('overview')

let refreshTimer: NodeJS.Timeout | null = null
const isComponentMounted = ref(false)

// ========================= 计算属性 =========================

const pageTitle = computed(() => {
  return taskDetail.value?.taskInfo?.taskName || '任务详情'
})

const pageDescription = computed(() => {
  return `任务编号: ${taskDetail.value?.taskInfo?.taskNo || '未知'} | 文件: ${taskDetail.value?.taskInfo?.fileName || '未知'}`
})

// 修复：确保statusTag一定有返回值，并处理加载状态
const statusTag = computed(() => {
  if (!taskDetail.value?.taskInfo?.status) {
    return loading.value ? '加载中...' : '未知状态'
  }
  const label = getDictLabel(
    DICT_TYPE.DRUG_TASK_STATUS,
    taskDetail.value.taskInfo.status.toString()
  )
  return label || '未知状态'
})

const statusTagType = computed(() => {
  if (!taskDetail.value?.taskInfo?.status) {
    return loading.value ? 'warning' : 'info'
  }
  const type = getDictColorType(
    DICT_TYPE.DRUG_TASK_STATUS,
    taskDetail.value.taskInfo.status.toString()
  )
  return type || 'info'
})

// 修复：Icon显示问题 - 使用实际的图标组件
const metaInfo = computed(() => {
  if (!taskDetail.value?.taskInfo) return []

  return [
    {
      label: '创建人',
      value: taskDetail.value.taskInfo.creator || '未知',
      icon: User // 修复：使用实际的图标组件
    },
    {
      label: '创建时间',
      value: formatTime(taskDetail.value.taskInfo.createTime) || '未知',
      icon: Clock // 修复：使用实际的图标组件
    },
    {
      label: '文件大小',
      value: formatFileSize(taskDetail.value.taskInfo.fileSize || 0),
      icon: DocumentCopy // 修复：使用实际的图标组件
    }
  ]
})

const headerActions = computed((): HeaderAction[] => {
  const actions: HeaderAction[] = []

  if (taskDetail.value?.operationOptions?.retryOps?.canRetry) {
    actions.push({
      key: 'retry',
      text: '重试任务',
      type: 'warning',
      icon: RefreshRight
    })
  }

  if (taskDetail.value?.operationOptions?.basicOps?.canCancel) {
    actions.push({
      key: 'cancel',
      text: '取消任务',
      type: 'danger',
      icon: Close
    })
  }

  if (taskDetail.value?.operationOptions?.exportOps?.canDownloadReport) {
    actions.push({
      key: 'download',
      text: '下载报告',
      type: 'primary',
      icon: DownloadIcon
    })
  }

  return actions
})

const tabList = computed((): TabItem[] => {
  const tabs: TabItem[] = [
    { key: 'overview', label: '任务概览', icon: DataBoard },
    { key: 'tables', label: '分表详情', icon: List },
    { key: 'logs', label: '执行日志', icon: Document },
    { key: 'quality', label: '质量报告', icon: Medal }
  ]

  const logsCount = taskDetail.value?.recentLogs?.length || 0
  if (logsCount > 0) {
    tabs[2].badge = logsCount
  }

  return tabs
})

const isTaskRunning = computed(() => {
  const status = taskDetail.value?.taskInfo?.status
  return status === 1 || status === 2 || status === 3
})

// ========================= 监听器 =========================

watch(
  () => taskId.value,
  (newTaskId) => {
    if (newTaskId && isComponentMounted.value) {
      console.log('Task ID changed, loading task detail:', newTaskId)
      loadTaskDetail()
    }
  }
)

watch(isTaskRunning, (isRunning) => {
  if (isComponentMounted.value) {
    if (isRunning) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }
})

// ========================= 核心方法 =========================

const initComponent = async () => {
  await nextTick()
  isComponentMounted.value = true

  console.log('Initializing component with taskId:', taskId.value)

  if (taskId.value) {
    await loadTaskDetail()
    if (isTaskRunning.value) {
      startAutoRefresh()
    }
  } else {
    ElMessage.error('任务ID无效')
    router.push('/drug-import/task')
  }
}

// 修复：增强错误处理和日志记录
const loadTaskDetail = async () => {
  if (!taskId.value || !isComponentMounted.value) {
    console.warn('Cannot load task detail: invalid taskId or component not mounted')
    return
  }

  console.log('Loading task detail for taskId:', taskId.value)
  loading.value = true

  try {
    const response = await DrugBatchImportApi.getTaskDetail(taskId.value)
    console.log('Task detail loaded successfully:', response)
    taskDetail.value = response
  } catch (error) {
    console.error('Failed to load task detail:', error)
    ElMessage.error('获取任务详情失败')
  } finally {
    loading.value = false
  }
}

const refreshProgress = async () => {
  if (!isComponentMounted.value) return

  refreshing.value = true
  try {
    await loadTaskDetail()
    ElMessage.success('进度信息已更新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const startAutoRefresh = () => {
  if (refreshTimer || !isComponentMounted.value) return

  refreshTimer = setInterval(() => {
    if (isComponentMounted.value && !loading.value) {
      loadTaskDetail()
    }
  }, 10000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const cleanup = () => {
  isComponentMounted.value = false
  stopAutoRefresh()
}

// ========================= 事件处理方法 =========================

const handleBackClick = () => {
  cleanup()
  router.push('/drug-import/task')
}

const handleHeaderAction = async (action: HeaderAction) => {
  if (!isComponentMounted.value) return

  switch (action.key) {
    case 'retry':
      await handleRetryTask()
      break
    case 'cancel':
      await handleCancelTask()
      break
    case 'download':
      await handleDownloadReport()
      break
  }
}

// 修复：增强标签切换的调试信息
const handleTabChange = (tabKey: string) => {
  console.log('Tab changed to:', tabKey)
  activeTab.value = tabKey
}

const handleRetryTask = async () => {
  try {
    await ElMessageBox.confirm('确认重试整个任务？', '确认重试', {
      type: 'warning'
    })

    const result = await DrugBatchImportApi.retryImportTask({
      taskId: taskId.value,
      retryType: 'ALL'
    })

    ElNotification({
      type: 'success',
      title: '重试任务已启动',
      message: `批次编号: ${result.retryBatchNo}`,
      duration: 3000
    })

    await loadTaskDetail()
    if (isTaskRunning.value) {
      startAutoRefresh()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('重试任务失败')
    }
  }
}

const handleCancelTask = async () => {
  try {
    await ElMessageBox.confirm('确认取消任务？取消后将无法恢复。', '确认取消', {
      type: 'warning'
    })

    await DrugBatchImportApi.cancelTask(taskId.value)
    ElMessage.success('任务已取消')
    await loadTaskDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消任务失败')
    }
  }
}

const handleDownloadReport = async () => {
  try {
    ElMessage.success('报告下载已开始')
  } catch (error) {
    ElMessage.error('下载报告失败')
  }
}

const handleRetryTable = async (tableType: string) => {
  try {
    await ElMessageBox.confirm(`确认重试 ${getTableTypeName(tableType)} 表的数据？`, '确认重试', {
      type: 'warning'
    })

    const result = await DrugBatchImportApi.retryImportTask({
      taskId: taskId.value,
      retryType: 'FILE_TYPE',
      fileType: tableType
    })

    ElMessage.success('表重试任务已启动')
    await loadTaskDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('重试表失败')
    }
  }
}

const handleExportLogs = () => {
  ElMessage.success('日志导出功能开发中')
}

// ========================= 工具方法 =========================

const getValidProgress = (progress: number | undefined): number => {
  if (typeof progress !== 'number' || isNaN(progress)) return 0
  if (progress < 0) return 0
  if (progress > 100) return 100
  return progress
}

const getActiveStep = () => {
  if (!taskDetail.value?.overallProgress?.stageStatus) return 0

  const stages = taskDetail.value.overallProgress.stageStatus
  if (stages.qcStatus >= 1) return 3
  if (stages.importStatus >= 1) return 2
  if (stages.extractStatus >= 1) return 1
  return 0
}

const getStepStatus = (stepStatus: number | undefined) => {
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

const getStepDescription = (step: string) => {
  if (!taskDetail.value?.overallProgress?.stageStatus) return '未开始'

  const descriptions = {
    extract: ['未开始', '解压中...', '解压完成', '解压失败'],
    import: ['未开始', '导入中...', '导入完成', '导入失败'],
    qc: ['未开始', '质控中...', '质控完成', '质控失败']
  }

  const statusMap = {
    extract: taskDetail.value.overallProgress.stageStatus.extractStatus,
    import: taskDetail.value.overallProgress.stageStatus.importStatus,
    qc: taskDetail.value.overallProgress.stageStatus.qcStatus
  }

  const status = statusMap[step] || 0
  return descriptions[step][status] || '未知状态'
}

const getProgressBarStatus = () => {
  const status = taskDetail.value?.taskInfo?.status
  if (status === 4) return 'success'
  if (status === 5) return 'exception'
  return undefined
}

const getFileProgressStatus = () => {
  const rate = taskDetail.value?.statistics?.fileStats?.fileSuccessRate || 0
  if (rate === 100) return 'success'
  if (rate === 0) return 'exception'
  return undefined
}

const getRecordProgressStatus = () => {
  const rate = taskDetail.value?.statistics?.recordStats?.overallSuccessRate || 0
  if (rate >= 95) return 'success'
  if (rate < 80) return 'exception'
  return undefined
}

const getPerformanceLevelType = (level: string | undefined) => {
  const typeMap = { HIGH: 'success', MEDIUM: 'warning', LOW: 'danger' }
  return typeMap[level || ''] || 'info'
}

const getPerformanceLevelText = (level: string | undefined) => {
  const textMap = { HIGH: '高', MEDIUM: '中', LOW: '低' }
  return textMap[level || ''] || '未知'
}

const getQualityGradeType = (grade: string | undefined) => {
  const typeMap = { A: 'success', B: 'primary', C: 'warning', D: 'danger' }
  return typeMap[grade || ''] || 'info'
}

const getTableTypeName = (tableType: string | undefined) => {
  if (!tableType) return '未知类型'
  return getDictLabel(DICT_TYPE.DRUG_TABLE_TYPE, tableType) || tableType
}

const getTableStatusColor = (status: number | undefined) => {
  if (!status) return '#909399'

  const colorType = getDictColorType(DICT_TYPE.DRUG_DETAIL_STATUS, status.toString())
  const colorMap = {
    success: '#67C23A',
    danger: '#F56C6C',
    warning: '#E6A23C',
    primary: '#409EFF',
    info: '#909399'
  }
  return colorMap[colorType] || '#909399'
}

const getTableStatusTagType = (status: number | undefined) => {
  if (!status) return 'info'
  return getDictColorType(DICT_TYPE.DRUG_DETAIL_STATUS, status.toString()) || 'info'
}

const getTableStatusText = (status: number | undefined) => {
  if (!status) return '未知状态'
  return getDictLabel(DICT_TYPE.DRUG_DETAIL_STATUS, status.toString()) || '未知状态'
}

const getTableProgressStatus = (status: number | undefined) => {
  if (status === 4) return 'success'
  if (status === 5) return 'exception'
  return undefined
}

const getDataSourceText = (dataSource: string | undefined) => {
  if (!dataSource) return '未知'
  return getDictLabel(DICT_TYPE.DRUG_DATA_SOURCE, dataSource) || dataSource
}

// ========================= 格式化工具方法 =========================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const formatTime = (time: string | undefined) => {
  if (!time) return ''
  try {
    return new Date(time).toLocaleString()
  } catch {
    return time
  }
}

const formatDuration = (seconds: number | undefined) => {
  if (!seconds) return '0秒'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}

// ========================= 生命周期处理 =========================

onMounted(() => {
  console.log('Component mounted')
  initComponent()
})

onUnmounted(() => {
  console.log('Component unmounting')
  cleanup()
})

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh()
  } else if (isComponentMounted.value && isTaskRunning.value) {
    startAutoRefresh()
  }
})
</script>

<style scoped>
/* 保持原有样式，但删除闪烁动画和渐变背景 */
.task-detail-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.detail-content {
  margin-top: 20px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 新增：加载占位符样式 */
.loading-placeholder {
  padding: 20px;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
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

.refresh-btn {
  position: absolute;
  right: 0;
  padding: 4px 8px;
  font-size: 12px;
}

.stage-progress-section {
  margin-bottom: 30px;
}

.overall-progress-section {
  margin-bottom: 20px;
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
  font-weight: 500;
}

.progress-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.progress-message {
  text-align: center;
  font-size: 13px;
  color: #909399;
  margin-top: 8px;
}

.time-info-section {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
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

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: 600;
  color: #303133;
}

.stat-item.success .stat-value {
  color: #67c23a;
}

.stat-item.danger .stat-value {
  color: #f56c6c;
}

.stat-progress {
  margin-top: 8px;
}

.performance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin-bottom: 8px;
}

.perf-label {
  color: #606266;
}

.perf-value {
  font-weight: 500;
  color: #303133;
}

.quality-score-display {
  text-align: center;
}

.score-value {
  font-size: 32px;
  font-weight: 600;
  color: #67c23a;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: #606266;
  margin: 4px 0;
}

.score-grade {
  margin-top: 8px;
}

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
  transition: all 0.3s ease;
}

.table-detail-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-item-header {
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

.table-operations {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.operation-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.table-error {
  margin-top: 12px;
}

.quality-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.quality-scores {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.score-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.quality-issues {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.issues-summary {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.quality-recommendations {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.recommendation-section {
  margin-bottom: 16px;
}

.recommendation-section h5 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
}

.recommendation-section ul {
  margin: 0;
  padding-left: 20px;
}

.recommendation-section li {
  margin-bottom: 4px;
  font-size: 13px;
  color: #606266;
}

/* 添加空状态样式 */
.empty-tables,
.empty-quality {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 48px;
  color: #c0c4cc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .task-detail-page {
    padding: 10px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .time-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .table-item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .stats-row {
    flex-direction: column;
    gap: 8px;
  }

  .table-operations {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .quality-scores {
    grid-template-columns: repeat(2, 1fr);
  }
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

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
  background-color: #f8f9fa;
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
