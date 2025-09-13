<!-- 修复：标签显示和内容加载问题 -->
<template>
  <div class="task-detail-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
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
                  <el-tag type="primary">{{ taskDetail?.taskNo || '未知' }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="任务名称">
                  {{ taskDetail?.taskName || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="文件路径">
                  {{ taskDetail?.filePath || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="文件大小">
                  {{ formatFileSize(taskDetail?.fileSize || 0) }}
                </el-descriptions-item>
                <el-descriptions-item label="创建人">
                  {{ taskDetail?.creator || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="数据源">
                  {{ getDataSourceText(taskDetail?.dataSource) }}
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">
                  {{ formatTime(taskDetail?.createTime) }}
                </el-descriptions-item>
                <el-descriptions-item label="执行模式" v-if="taskDetail?.executeMode">
                  {{ getExecuteModeText(taskDetail.executeMode) }}
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
                    v-for="(stage, index) in processStages"
                    :key="stage.name || index"
                    :title="stage.name"
                    :status="getStepStatus(stage.status)"
                    :description="stage.statusDescription"
                  />
                </el-steps>
              </div>

              <!-- 整体进度 -->
              <div class="overall-progress-section">
                <el-progress
                  :percentage="taskDetail?.progressPercent || 0"
                  :stroke-width="16"
                  :status="getProgressStatus(taskDetail?.status)"
                />
                <div class="progress-message">
                  {{ taskDetail?.message || '等待处理...' }}
                </div>
              </div>

              <!-- 时间信息 -->
              <div class="time-info-section">
                <div class="time-grid">
                  <div class="time-item" v-if="taskDetail?.startTime">
                    <div class="time-label">开始时间</div>
                    <div class="time-value">{{
                        formatTime(taskDetail.startTime)
                      }}</div>
                  </div>
                  <div
                    class="time-item"
                    v-if="taskDetail?.endTime"
                  >
                    <div class="time-label">结束时间</div>
                    <div class="time-value">{{
                        formatTime(taskDetail.endTime)
                      }}</div>
                  </div>
                  <div
                    class="time-item"
                    v-if="taskDetail?.durationMs"
                  >
                    <div class="time-label">处理耗时</div>
                    <div class="time-value">{{
                        formatDurationFromMs(taskDetail.durationMs)
                      }}</div>
                  </div>
                  <div
                    class="time-item"
                    v-if="taskDetail?.avgRecordTime"
                  >
                    <div class="time-label">平均记录时间</div>
                    <div class="time-value">{{ taskDetail.avgRecordTime }}ms</div>
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
                      taskDetail?.totalFiles || 0
                    }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">成功文件</span>
                  <span class="stat-value">{{
                      taskDetail?.successFiles || 0
                    }}</span>
                </div>
                <div class="stat-item danger">
                  <span class="stat-label">失败文件</span>
                  <span class="stat-value">{{
                      (taskDetail?.totalFiles || 0) - (taskDetail?.successFiles || 0)
                    }}</span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="fileSuccessRate"
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
                      formatNumber(taskDetail?.totalRecords || 0)
                    }}</span>
                </div>
                <div class="stat-item success">
                  <span class="stat-label">成功记录</span>
                  <span class="stat-value">{{
                      formatNumber(taskDetail?.successRecords || 0)
                    }}</span>
                </div>
                <div class="stat-item danger">
                  <span class="stat-label">失败记录</span>
                  <span class="stat-value">{{
                      formatNumber((taskDetail?.totalRecords || 0) - (taskDetail?.successRecords || 0))
                    }}</span>
                </div>
                <div class="stat-item warning" v-if="taskDetail?.warningRecords && taskDetail.warningRecords > 0">
                  <span class="stat-label">警告记录</span>
                  <span class="stat-value">{{
                      formatNumber(taskDetail.warningRecords)
                    }}</span>
                </div>
                <div class="stat-item info" v-if="taskDetail?.anomalyRecords && taskDetail.anomalyRecords > 0">
                  <span class="stat-label">异常记录</span>
                  <span class="stat-value">{{
                      formatNumber(taskDetail.anomalyRecords)
                    }}</span>
                </div>
                <div class="stat-progress">
                  <el-progress
                    :percentage="recordSuccessRate"
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
                  <span class="perf-value">{{ getProcessingSpeed(taskDetail) }}</span>
                </div>
                <div class="performance-item">
                  <span class="perf-label">平均耗时</span>
                  <span class="perf-value">{{
                      formatDurationFromMs(taskDetail?.durationMs || 0) || '计算中...'
                    }}</span>
                </div>
                <div class="performance-item" v-if="taskDetail?.avgRecordTime">
                  <span class="perf-label">单记录时间</span>
                  <span class="perf-value">{{ taskDetail.avgRecordTime }}ms</span>
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
                      taskDetail?.qualityScore || 0
                    }}</div>
                  <div class="score-label">总体评分</div>
                  <div class="score-grade" v-if="taskDetail?.qualityScore">
                    <el-tag
                      :type="getQualityGradeType(taskDetail.qualityScore)"
                      size="small"
                    >
                      {{ getQualityDescription(taskDetail.qualityScore) }}
                    </el-tag>
                  </div>
                  <!-- 评分明细 -->
                  <div class="score-breakdown" v-if="taskDetail?.scoreDetail">
                    <div class="breakdown-list">
                      <div class="breakdown-item" v-for="(score, dimension) in getScoreBreakdown(taskDetail.scoreDetail)" :key="dimension">
                        <span class="breakdown-label">{{ dimension }}:</span>
                        <span class="breakdown-value">{{ score }}</span>
                      </div>
                    </div>
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
            v-if="qcResultDetails && qcResultDetails.length > 0"
            class="table-details-list"
          >
            <div
              v-for="detail in qcResultDetails"
              :key="detail.tableType"
              class="table-detail-item"
            >
              <div class="table-item-header">
                <div class="table-info">
                  <div class="table-icon-wrapper">
                    <el-icon
                      class="table-icon"
                      :color="getQcTableStatusColor(detail)"
                    >
                      <Document />
                    </el-icon>
                  </div>
                  <div class="table-meta">
                    <div class="table-name">{{ detail.tableName }}</div>
                    <div class="file-name">{{ `${detail.tableType}.xlsx` }}</div>
                  </div>
                </div>
                <div class="table-status">
                  <el-tag :type="getQcTableStatusTagType(detail)" size="small">
                    {{ getQcTableStatusText(detail) }}
                  </el-tag>
                </div>
              </div>

              <div class="table-progress">
                <div class="progress-info">
                  <span class="progress-label">质控通过率</span>
                  <span class="progress-percent"
                  >{{ (detail.passRate || 0).toFixed(1) }}%</span
                  >
                </div>
                <el-progress
                  :percentage="detail.passRate || 0"
                  :stroke-width="6"
                  :show-text="false"
                  :status="getQcProgressStatus(detail)"
                />
                <div class="progress-message">{{ getQcProcessingMessage(detail) }}</div>
              </div>

              <div class="table-statistics">
                <div class="stats-row">
                  <div class="stat-item">
                    <span class="stat-label">检查记录:</span>
                    <span class="stat-value">{{
                        formatNumber(detail.checkedRecords || 0)
                      }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">执行规则:</span>
                    <span class="stat-value">{{
                        detail.totalRules || 0
                      }}</span>
                  </div>
                  <div class="stat-item success">
                    <span class="stat-label">通过规则:</span>
                    <span class="stat-value">{{
                        detail.passedRules || 0
                      }}</span>
                  </div>
                  <div class="stat-item danger">
                    <span class="stat-label">失败规则:</span>
                    <span class="stat-value">{{
                        detail.failedRules || 0
                      }}</span>
                  </div>
                </div>

                <div class="stats-row">
                  <div class="stat-item success">
                    <span class="stat-label">正常记录:</span>
                    <span class="stat-value">{{
                        formatNumber((detail.checkedRecords || 0) - (detail.errorRecords || 0))
                      }}</span>
                  </div>
                  <div class="stat-item danger">
                    <span class="stat-label">错误记录:</span>
                    <span class="stat-value">{{
                        formatNumber(detail.errorRecords || 0)
                      }}</span>
                  </div>
                  <div class="stat-item warning">
                    <span class="stat-label">警告记录:</span>
                    <span class="stat-value">{{
                        formatNumber(detail.warningRecords || 0)
                      }}</span>
                  </div>
                  <div class="stat-item info">
                    <span class="stat-label">异常记录:</span>
                    <span class="stat-value">{{
                        formatNumber(detail.anomalyRecords || 0)
                      }}</span>
                  </div>
                </div>
              </div>

              <!-- 规则详情展示 -->
              <div v-if="detail.ruleDetails && detail.ruleDetails.length > 0" class="rule-details">
                <div class="rule-details-header">
                  <span class="rule-details-title">质控规则详情</span>
                  <el-button link type="primary" size="small" @click="toggleRuleDetails(detail.tableType)">
                    {{ expandedRules.has(detail.tableType) ? '收起' : '展开' }}
                  </el-button>
                </div>

                <div v-if="expandedRules.has(detail.tableType)" class="rule-details-content">
                  <div
                    v-for="rule in detail.ruleDetails"
                    :key="rule.id"
                    class="rule-item"
                  >
                    <div class="rule-header">
                      <div class="rule-info">
                        <span class="rule-name">{{ rule.ruleName }}</span>
                        <el-tag :type="getRuleStatusTagType(rule.checkStatus)" size="small">
                          {{ getRuleStatusText(rule.checkStatus) }}
                        </el-tag>
                      </div>
                      <div class="rule-stats">
                        <span class="rule-stat">检查: {{ formatNumber(rule.checkedCount) }}</span>
                        <span class="rule-stat error" v-if="rule.errorCount">错误: {{ formatNumber(rule.errorCount) }}</span>
                        <span class="rule-stat warning" v-if="rule.warningCount">警告: {{ formatNumber(rule.warningCount) }}</span>
                      </div>
                    </div>
                    <div v-if="rule.errorMessage" class="rule-error">
                      <el-alert
                        :title="rule.errorMessage"
                        type="error"
                        :closable="false"
                        show-icon
                        size="small"
                      />
                    </div>
                    <div v-if="rule.fixSuggestion" class="rule-suggestion">
                      <el-alert
                        :title="rule.fixSuggestion"
                        type="info"
                        :closable="false"
                        show-icon
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 修复：完善空状态处理 -->
          <div
            v-else-if="
              taskDetail && (!qcResultDetails || qcResultDetails.length === 0)
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
          <div v-if="taskDetail" class="quality-content">
            <!-- 质量评分 -->
            <div class="quality-scores">
              <div class="score-item">
                <div class="score-label">总体评分</div>
                <div class="score-value">{{
                    taskDetail.qualityScore || 0
                  }}</div>
              </div>
              <!-- 评分明细显示 -->
              <div v-if="taskDetail.scoreDetail" class="score-breakdown-detail">
                <div class="score-item" v-for="(score, dimension) in getScoreBreakdown(taskDetail.scoreDetail)" :key="dimension">
                  <div class="score-label">{{ dimension }}</div>
                  <div class="score-value">{{ score }}</div>
                </div>
              </div>
            </div>

            <!-- 质量问题简化显示 -->
            <div class="quality-summary" v-if="taskDetail.warningRecords || taskDetail.anomalyRecords">
              <h4>数据质量概况</h4>
              <div class="quality-stats">
                <el-tag type="warning" size="small" v-if="taskDetail.warningRecords && taskDetail.warningRecords > 0">
                  警告记录: {{ formatNumber(taskDetail.warningRecords) }}
                </el-tag>
                <el-tag type="danger" size="small" v-if="taskDetail.anomalyRecords && taskDetail.anomalyRecords > 0">
                  异常记录: {{ formatNumber(taskDetail.anomalyRecords) }}
                </el-tag>
              </div>
            </div>

            <!-- 质量建议 -->
            <div class="quality-recommendations">
              <h4>质量建议</h4>
              <div class="recommendations-content">
                <div class="recommendation-item" v-if="getQualityScore(taskDetail) < 80">
                  <el-icon class="rec-icon warning"><WarningFilled /></el-icon>
                  <span>数据质量较低，建议检查源数据格式和完整性</span>
                </div>
                <div class="recommendation-item" v-if="(taskDetail.totalRecords || 0) > (taskDetail.successRecords || 0)">
                  <el-icon class="rec-icon info"><InfoFilled /></el-icon>
                  <span>存在失败记录，可下载错误文件进行数据修正</span>
                </div>
                <div class="recommendation-item" v-if="getQualityScore(taskDetail) >= 90">
                  <el-icon class="rec-icon success"><CircleCheckFilled /></el-icon>
                  <span>数据质量优秀，可以进入下一步数据处理流程</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 修复：完善空状态处理 -->
          <div v-if="taskDetail && !taskDetail.qualityScore" class="empty-quality">
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
  DocumentCopy, // 新增：文档复制图标
  WarningFilled,
  CircleCheckFilled,
  Box,
  Upload,
  CircleCheck,
  Checked,
  DocumentChecked,
  Setting
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import TaskLogViewer from './components/TaskLogViewer.vue'
import { DrugBatchImportApi, type ImportTaskDetailVO, type QcResultDetailVO, TASK_STATUS } from '@/api/drug/task'
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
const qcResultDetails = ref<QcResultDetailVO[]>([])
const activeTab = ref('overview')
const expandedRules = ref(new Set<string>())

let refreshTimer: NodeJS.Timeout | null = null
const isComponentMounted = ref(false)

// ========================= 计算属性 =========================

/** 解析分表进度JSON数据 */
const parsedTableProgress = computed(() => {
  // 从质控结果详情中构建分表进度信息
  return qcResultDetails.value.map(detail => ({
    tableType: detail.tableName,
    status: getTableStatusFromQcDetails(detail),
    progressPercent: detail.passRate || 0,
    totalRecords: detail.checkedRecords || 0,
    processedRecords: detail.checkedRecords || 0,
    successRecords: detail.checkedRecords - detail.errorRecords,
    failedRecords: detail.errorRecords || 0,
    warningRecords: detail.warningRecords || 0,
    anomalyRecords: detail.anomalyRecords || 0,
    startTime: null,
    endTime: null,
    errorMessage: detail.ruleDetails.find(r => r.checkStatus >= 1)?.errorMessage
  }))
})

/** 从质控详情获取表状态 */
const getTableStatusFromQcDetails = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return 'FAILED'
  if (detail.warningRules > 0) return 'WARNING'
  if (detail.passedRules > 0) return 'SUCCESS'
  return 'PENDING'
}

/** 解析处理阶段数据 */
const processStages = computed(() => {
  if (!taskDetail.value?.qcStages) {
    return [
      { name: '文件解析', status: 0, statusDescription: '待开始' },
      { name: '基础验证', status: 0, statusDescription: '待开始' },
      { name: '前置质控', status: 0, statusDescription: '待开始' },
      { name: '数据导入', status: 0, statusDescription: '待开始' }
    ]
  }

  try {
    const stages = typeof taskDetail.value.qcStages === 'string'
      ? JSON.parse(taskDetail.value.qcStages)
      : taskDetail.value.qcStages
    return Array.isArray(stages) ? stages : []
  } catch (error) {
    console.error('解析qc_stages失败:', error)
    return []
  }
})

const pageTitle = computed(() => {
  return taskDetail.value?.taskName || '任务详情'
})

const pageDescription = computed(() => {
  return `任务编号: ${taskDetail.value?.taskNo || '未知'} | 文件: ${taskDetail.value?.fileName || taskDetail.value?.filePath || '未知'}`
})

// 修复：确保statusTag一定有返回值，并处理加载状态
const statusTag = computed(() => {
  if (!taskDetail.value?.status) {
    return loading.value ? '加载中...' : '未知状态'
  }
  const label = getDictLabel(
    DICT_TYPE.DRUG_TASK_STATUS,
    taskDetail.value.status.toString()
  )
  return label || '未知状态'
})

const statusTagType = computed(() => {
  if (!taskDetail.value?.status) {
    return loading.value ? 'warning' : 'info'
  }
  const type = getDictColorType(
    DICT_TYPE.DRUG_TASK_STATUS,
    taskDetail.value.status.toString()
  )
  return type || 'info'
})

// 修复：Icon显示问题 - 使用实际的图标组件
const metaInfo = computed(() => {
  if (!taskDetail.value) return []

  return [
    {
      label: '创建人',
      value: taskDetail.value.creator || '未知',
      icon: User // 修复：使用实际的图标组件
    },
    {
      label: '创建时间',
      value: formatTime(taskDetail.value.createTime) || '未知',
      icon: Clock // 修复：使用实际的图标组件
    },
    {
      label: '文件大小',
      value: formatFileSize(taskDetail.value.fileSize || 0),
      icon: DocumentCopy // 修复：使用实际的图标组件
    }
  ]
})

const headerActions = computed((): HeaderAction[] => {
  const actions: HeaderAction[] = []

  // 根据任务状态和字段来决定显示哪些操作
  if (taskDetail.value?.status && (taskDetail.value.status === TASK_STATUS.FAILED || taskDetail.value.status === TASK_STATUS.PARTIAL_SUCCESS)) {
    actions.push({
      key: 'retry',
      text: '重试任务',
      type: 'warning',
      icon: RefreshRight
    })
  }

  if (taskDetail.value?.status && [TASK_STATUS.PENDING, TASK_STATUS.PARSING, TASK_STATUS.QC_PRE_CHECKING, TASK_STATUS.IMPORTING, TASK_STATUS.QC_POST_CHECKING].includes(taskDetail.value.status)) {
    actions.push({
      key: 'cancel',
      text: '取消任务',
      type: 'danger',
      icon: Close
    })
  }

  if (taskDetail.value?.status === TASK_STATUS.COMPLETED) {
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

  return tabs
})

const isTaskRunning = computed(() => {
  const status = taskDetail.value?.status
  return status === TASK_STATUS.PARSING || status === TASK_STATUS.QC_PRE_CHECKING || status === TASK_STATUS.IMPORTING || status === TASK_STATUS.QC_POST_CHECKING
})

// 计算属性
const fileSuccessRate = computed(() => {
  if (!taskDetail.value?.totalFiles || taskDetail.value.totalFiles === 0) return 0
  return Math.round((taskDetail.value.successFiles / taskDetail.value.totalFiles) * 100)
})

const recordSuccessRate = computed(() => {
  if (!taskDetail.value?.totalRecords || taskDetail.value.totalRecords === 0) return 0
  return Math.round((taskDetail.value.successRecords / taskDetail.value.totalRecords) * 100)
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
    router.push('/monitoring/drug-import/task')
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
    // 并行加载任务详情和质控结果详情
    const [taskDetailResponse, qcDetailsResponse] = await Promise.all([
      DrugBatchImportApi.getTaskDetail(taskId.value),
      DrugBatchImportApi.getQcResultDetails(taskId.value).catch(err => {
        console.warn('Failed to load QC details, will continue without it:', err)
        return []
      })
    ])

    console.log('Task detail loaded successfully:', taskDetailResponse)
    console.log('QC details loaded:', qcDetailsResponse)

    taskDetail.value = taskDetailResponse
    qcResultDetails.value = qcDetailsResponse || []
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
  router.push('/monitoring/drug-import/task')
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

// ========================= 质控详情相关方法 =========================

/** 切换规则详情展示 */
const toggleRuleDetails = (tableType: string) => {
  if (expandedRules.value.has(tableType)) {
    expandedRules.value.delete(tableType)
  } else {
    expandedRules.value.add(tableType)
  }
}

/** 获取质控表状态颜色 */
const getQcTableStatusColor = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return '#F56C6C'
  if (detail.warningRules > 0) return '#E6A23C'
  if (detail.passedRules > 0) return '#67C23A'
  return '#909399'
}

/** 获取质控表状态标签类型 */
const getQcTableStatusTagType = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return 'danger'
  if (detail.warningRules > 0) return 'warning'
  if (detail.passedRules > 0) return 'success'
  return 'info'
}

/** 获取质控表状态文本 */
const getQcTableStatusText = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return '检查失败'
  if (detail.warningRules > 0) return '检查警告'
  if (detail.passedRules > 0) return '检查通过'
  return '未检查'
}

/** 获取质控进度状态 */
const getQcProgressStatus = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) return 'exception'
  if (detail.passedRules === detail.totalRules && detail.totalRules > 0) return 'success'
  return undefined
}

/** 获取质控处理消息 */
const getQcProcessingMessage = (detail: QcResultDetailVO) => {
  if (detail.failedRules > 0) {
    return `检查完成 - 失败: ${detail.failedRules}条规则`
  }
  if (detail.warningRules > 0) {
    return `检查完成 - 警告: ${detail.warningRules}条规则`
  }
  if (detail.passedRules > 0) {
    return `检查完成 - 通过率: ${(detail.passRate || 0).toFixed(1)}%`
  }
  return '等待检查'
}

/** 获取规则状态标签类型 */
const getRuleStatusTagType = (status: number) => {
  switch (status) {
    case 0: return 'success' // 通过
    case 1: return 'danger' // 失败
    case 2: return 'warning' // 警告
    case 3: return 'danger' // 异常
    case 4: return 'info' // 跳过
    case 5: return 'danger' // 中断
    default: return 'info'
  }
}

/** 获取规则状态文本 */
const getRuleStatusText = (status: number) => {
  switch (status) {
    case 0: return '通过'
    case 1: return '失败'
    case 2: return '警告'
    case 3: return '异常'
    case 4: return '跳过'
    case 5: return '中断'
    default: return '未知'
  }
}

// ========================= 工具方法 =========================

const getActiveStep = () => {
  const stages = processStages.value
  if (!stages.length) return 0

  for (let i = stages.length - 1; i >= 0; i--) {
    if (stages[i].status >= 1) return i + 1
  }
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

/** 获取进度条状态 */
const getProgressStatus = (status: number | undefined) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  if (status === TASK_STATUS.CANCELLED) return 'warning'
  return undefined
}

const getFileProgressStatus = () => {
  const rate = fileSuccessRate.value
  if (rate === 100) return 'success'
  if (rate === 0) return 'exception'
  return undefined
}

const getRecordProgressStatus = () => {
  const rate = recordSuccessRate.value
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

const getTableStatusTagType = (status: number | string | undefined) => {
  if (!status) return 'info'

  // 处理字符串状态
  if (typeof status === 'string') {
    const statusMap = {
      'PENDING': 'info',
      'PROCESSING': 'warning',
      'SUCCESS': 'success',
      'FAILED': 'danger'
    }
    return statusMap[status] || 'info'
  }

  return getDictColorType(DICT_TYPE.DRUG_DETAIL_STATUS, status.toString()) || 'info'
}

const getTableStatusText = (status: number | string | undefined) => {
  if (!status) return '未知状态'

  // 处理字符串状态
  if (typeof status === 'string') {
    const statusMap = {
      'PENDING': '等待中',
      'PROCESSING': '处理中',
      'SUCCESS': '成功',
      'FAILED': '失败'
    }
    return statusMap[status] || '未知状态'
  }

  return getDictLabel(DICT_TYPE.DRUG_DETAIL_STATUS, status.toString()) || '未知状态'
}

const getTableProgressStatus = (status: number | string | undefined) => {
  // 处理字符串状态
  if (typeof status === 'string') {
    if (status === 'SUCCESS') return 'success'
    if (status === 'FAILED') return 'exception'
    return undefined
  }

  if (status === 4) return 'success'
  if (status === 5) return 'exception'
  return undefined
}

/** 获取表处理消息 */
const getTableProcessingMessage = (table: any) => {
  if (table.errorMessage) {
    return `错误: ${table.errorMessage}`
  }

  if (table.status === 'PROCESSING') {
    return `正在处理... ${table.processedRecords || 0}/${table.totalRecords || 0}`
  }

  if (table.status === 'SUCCESS') {
    return `处理完成 - 成功: ${table.successRecords || 0}, 失败: ${table.failedRecords || 0}`
  }

  if (table.status === 'FAILED') {
    return '处理失败'
  }

  return '等待处理'
}

/** 获取表处理耗时 */
const getTableProcessingDuration = (table: any) => {
  if (!table.startTime) {
    return '未开始'
  }

  const startTime = new Date(table.startTime).getTime()
  const endTime = table.endTime ? new Date(table.endTime).getTime() : Date.now()
  const duration = endTime - startTime

  if (duration < 1000) {
    return '< 1秒'
  }

  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}时${minutes % 60}分${seconds % 60}秒`
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

const getDataSourceText = (dataSource: string | undefined) => {
  if (!dataSource) return '未知'
  return getDictLabel(DICT_TYPE.DRUG_DATA_SOURCE, dataSource) || dataSource
}

/** 获取执行模式文本 */
const getExecuteModeText = (mode: number | undefined) => {
  if (!mode) return '未知模式'
  const modeMap = {
    1: '仅前置质控',
    2: '仅后置质控',
    3: '全部执行'
  }
  return modeMap[mode] || '未知模式'
}

/** 获取处理速度 */
const getProcessingSpeed = (task: any) => {
  if (!task?.startTime || !task?.totalRecords || !task?.durationMs) return '-'

  const recordsPerSecond = task.successRecords / (task.durationMs / 1000)
  if (recordsPerSecond < 1) {
    return `${(recordsPerSecond * 60).toFixed(1)}条/分钟`
  }
  return `${recordsPerSecond.toFixed(1)}条/秒`
}

/** 获取质量描述 */
const getQualityDescription = (score: number | undefined) => {
  if (!score) return '未知'
  if (score >= 95) return '优秀'
  if (score >= 85) return '良好'
  if (score >= 70) return '一般'
  if (score >= 50) return '较差'
  return '很差'
}

/** 获取质量评分 */
const getQualityScore = (task: any) => {
  return task?.qualityScore || 0
}

/** 获取评分明细 */
const getScoreBreakdown = (scoreDetail: any) => {
  if (!scoreDetail) return {}

  let parsedDetail = scoreDetail

  if (typeof scoreDetail === 'string') {
    try {
      parsedDetail = JSON.parse(scoreDetail)
    } catch {
      return {}
    }
  }

  const dimensionMap = {
    file: '文件质量',
    record: '记录质量',
    rule: '规则检查'
  }

  const breakdown = {}
  Object.keys(parsedDetail).forEach(key => {
    const displayName = dimensionMap[key] || key
    const value = parsedDetail[key]
    breakdown[displayName] = typeof value === 'number' ? value.toFixed(2) : value
  })

  return breakdown
}

/** 格式化毫秒数为可读时间 */
const formatDurationFromMs = (durationMs: number | undefined) => {
  if (!durationMs || durationMs === 0) return null

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
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

.score-breakdown-detail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.score-breakdown-detail .score-item {
  padding: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.quality-summary {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.quality-stats {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.quality-recommendations {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.recommendation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  background: #f8f9fa;
  font-size: 13px;
}

.rec-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.rec-icon.success {
  color: #67c23a;
}

.rec-icon.warning {
  color: #e6a23c;
}

.rec-icon.info {
  color: #409eff;
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

/* 规则详情样式 */
.rule-details {
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.rule-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-details-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.rule-details-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.rule-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-name {
  font-weight: 500;
  color: #303133;
  font-size: 13px;
}

.rule-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.rule-stat {
  color: #606266;
}

.rule-stat.error {
  color: #f56c6c;
}

.rule-stat.warning {
  color: #e6a23c;
}

.rule-error {
  margin-top: 8px;
}

.rule-suggestion {
  margin-top: 8px;
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
