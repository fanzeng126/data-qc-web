<template>
  <div class="task-expand-content">
    <!-- 基本信息行 -->
    <div class="expand-section">
      <h4 class="section-title">
        <el-icon><InfoFilled /></el-icon>
        基本信息
      </h4>
      <div class="basic-info-grid">
        <div class="info-item">
          <span class="info-label">文件路径:</span>
          <span class="info-value" :title="task.filePath">
            {{ task.filePath || '-' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">文件大小:</span>
          <span class="info-value">{{ formatFileSize(task.fileSize || 0) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">执行模式:</span>
          <span class="info-value">{{ getExecuteModeText(task.executeMode) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">数据来源:</span>
          <span class="info-value">{{ getDataSourceText(task.dataSource) || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间:</span>
          <span class="info-value">{{ formatTime(task.createTime) }}</span>
        </div>
        <div class="info-item" v-if="task.description">
          <span class="info-label">任务描述:</span>
          <span class="info-value">{{ task.description }}</span>
        </div>
      </div>
    </div>

    <!-- 处理进度行 - 基于qc_stages -->
    <div class="expand-section">
      <h4 class="section-title">
        <el-icon><TrendCharts /></el-icon>
        处理进度详情
      </h4>
      <div class="progress-details">
        <!-- 阶段进度指示器 -->
        <div class="stage-indicators">
          <div
            v-for="(stage, index) in processStages"
            :key="stage.name"
            class="stage-item"
            :class="getStageClass(stage.status)"
          >
            <div class="stage-icon">
              <el-icon><component :is="getStageIcon(stage.name)" /></el-icon>
            </div>
            <div class="stage-content">
              <div class="stage-title">{{ stage.name }}</div>
              <div class="stage-status">{{ stage.message || getStageStatusText(stage.status) }}</div>
              <div class="stage-time" v-if="stage.endTime">
                {{ formatTime(stage.endTime) }}
              </div>
              <div class="stage-duration" v-if="stage.duration">
                耗时: {{ formatDurationFromMs(stage.duration) }}
              </div>
            </div>
            <!-- 连接线 -->
            <div v-if="index < processStages.length - 1" class="stage-connector" :class="getConnectorClass(stage.status)"></div>
          </div>
        </div>

        <!-- 总体进度条 -->
        <div class="overall-progress">
<!--          <div class="progress-header">
            <span class="progress-label">总体进度</span>
            <span class="progress-value">{{ task.progressPercent || 0 }}%</span>
          </div>-->
          <el-progress
            :percentage="task.progressPercent || 0"
            :stroke-width="12"
            :status="getProgressStatus(task.status)"
          >
            <template #default="{ percentage }">
              <span class="progress-text">{{ percentage }}%</span>
            </template>
          </el-progress>
          <div class="progress-message" v-if="task.message">
            {{ task.message }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数据统计行 -->
    <div class="expand-section">
      <h4 class="section-title">
        <el-icon><DataAnalysis /></el-icon>
        数据统计
      </h4>
      <div class="statistics-grid">
        <!-- 文件统计 - 增强显示 -->
        <div class="stat-card files">
          <div class="stat-header">
            <el-icon class="stat-icon"><Folder /></el-icon>
            <span class="stat-title">文件统计</span>
          </div>
          <div class="stat-content">
            <div class="stat-main">
              <span class="stat-value">{{ task.successFiles || 0 }}</span>
              <span class="stat-total">/ {{ task.totalFiles || 0 }}</span>
            </div>
            <div class="stat-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">成功:</span>
                <span class="breakdown-value success">{{ task.successFiles || 0 }}</span>
              </div>
              <div class="breakdown-item" v-if="task.warningFiles && task.warningFiles > 0">
                <span class="breakdown-label">警告:</span>
                <span class="breakdown-value warning">{{ task.warningFiles }}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">失败:</span>
                <span class="breakdown-value error">{{ task.failedFiles || 0 }}</span>
              </div>
            </div>
            <div class="stat-label">文件处理情况</div>
            <div class="stat-progress">
              <el-progress
                :percentage="fileSuccessRate"
                :stroke-width="4"
                :show-text="false"
                :status="getFileProgressStatus(fileSuccessRate)"
              />
            </div>
          </div>
        </div>

        <!-- 记录统计 - 增强显示 -->
        <div class="stat-card records">
          <div class="stat-header">
            <el-icon class="stat-icon"><DataBoard /></el-icon>
            <span class="stat-title">记录统计</span>
          </div>
          <div class="stat-content">
            <div class="stat-main">
              <span class="stat-value">{{ formatNumber(task.successRecords || 0) }}</span>
              <span class="stat-total">/ {{ formatNumber(task.totalRecords || 0) }}</span>
            </div>
            <div class="stat-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">成功:</span>
                <span class="breakdown-value success">{{ formatNumber(task.successRecords || 0) }}</span>
              </div>
              <div class="breakdown-item" v-if="task.warningRecords && task.warningRecords > 0">
                <span class="breakdown-label">警告:</span>
                <span class="breakdown-value warning">{{ formatNumber(task.warningRecords) }}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">失败:</span>
                <span class="breakdown-value error">{{ formatNumber(task.failedRecords || 0) }}</span>
              </div>
              <div class="breakdown-item" v-if="task.anomalyRecords && task.anomalyRecords > 0">
                <span class="breakdown-label">异常:</span>
                <span class="breakdown-value anomaly">{{ formatNumber(task.anomalyRecords) }}</span>
              </div>
            </div>
            <div class="stat-label">记录处理情况</div>
            <div class="stat-progress">
              <el-progress
                :percentage="recordSuccessRate"
                :stroke-width="4"
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
        </div>

        <!-- 规则统计 - 增强显示 -->
        <div class="stat-card rules" v-if="task.totalRules && task.totalRules > 0">
          <div class="stat-header">
            <el-icon class="stat-icon"><Checked /></el-icon>
            <span class="stat-title">规则检查</span>
          </div>
          <div class="stat-content">
            <div class="stat-main">
              <span class="stat-value">{{ task.passedRules || 0 }}</span>
              <span class="stat-total">/ {{ task.totalRules || 0 }}</span>
            </div>
            <div class="stat-breakdown">
              <div class="breakdown-item">
                <span class="breakdown-label">通过:</span>
                <span class="breakdown-value success">{{ task.passedRules || 0 }}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">已执行:</span>
                <span class="breakdown-value processing">{{ task.executedRules || 0 }}</span>
              </div>
              <div class="breakdown-item">
                <span class="breakdown-label">失败:</span>
                <span class="breakdown-value error">{{ task.failedRules || 0 }}</span>
              </div>
            </div>
            <div class="stat-label">规则通过情况</div>
            <div class="stat-progress">
              <el-progress
                :percentage="rulePassRate"
                :stroke-width="4"
                :show-text="false"
                :status="getRuleProgressStatus(rulePassRate)"
              />
            </div>
          </div>
        </div>

        <!-- 性能指标 - 增强显示 -->
        <div class="stat-card performance">
          <div class="stat-header">
            <el-icon class="stat-icon"><Stopwatch /></el-icon>
            <span class="stat-title">性能指标</span>
          </div>
          <div class="stat-content">
            <div class="performance-metrics">
              <div class="metric-item">
                <span class="metric-label">处理耗时:</span>
                <span class="metric-value">{{ formatDurationFromMs(task.durationMs) || '计算中...' }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">处理速度:</span>
                <span class="metric-value">{{ processingSpeed }}</span>
              </div>
              <div class="metric-item" v-if="task.avgRecordTime">
                <span class="metric-label">单条记录:</span>
                <span class="metric-value">{{ task.avgRecordTime }}ms</span>
              </div>
              <div class="metric-item" v-if="task.startTime && task.endTime">
                <span class="metric-label">实际耗时:</span>
                <span class="metric-value">{{ getActualDuration(task.startTime, task.endTime) }}</span>
              </div>
              <div class="metric-item" v-if="task.totalRecords">
                <span class="metric-label">吞吐量:</span>
                <span class="metric-value">{{ getThroughput(task) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 质量评分 - 增强显示 -->
        <div class="stat-card quality" v-if="task.qualityScore">
          <div class="stat-header">
            <el-icon class="stat-icon"><Medal /></el-icon>
            <span class="stat-title">质量评分</span>
          </div>
          <div class="stat-content">
            <div class="quality-score">
              <div class="score-value" :class="getQualityScoreClass(task.qualityScore)">
                {{ task.qualityScore }}
              </div>
              <div class="score-label">质量分</div>
              <div class="score-description">{{ getQualityDescription(task.qualityScore) }}</div>
              <div class="score-breakdown" v-if="task.scoreDetail">
                <div class="breakdown-item" v-for="(score, dimension) in getScoreBreakdown(task.scoreDetail)" :key="dimension">
                  <span class="breakdown-label">{{ dimension }}:</span>
                  <span class="breakdown-value">{{ score }}</span>
                </div>
              </div>
            </div>
            <!-- 质量等级指示器 -->
            <div class="quality-indicator">
              <div class="indicator-bar" :class="getQualityLevelClass(task.qualityScore)">
                <div class="indicator-fill" :style="{ width: `${task.qualityScore}%` }"></div>
              </div>
              <div class="indicator-labels">
                <span class="label-item" :class="{ active: task.qualityScore >= 90 }">优秀</span>
                <span class="label-item" :class="{ active: task.qualityScore >= 70 && task.qualityScore < 90 }">良好</span>
                <span class="label-item" :class="{ active: task.qualityScore >= 50 && task.qualityScore < 70 }">一般</span>
                <span class="label-item" :class="{ active: task.qualityScore < 50 }">较差</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误信息行（如果有错误） -->
    <div v-if="task.errorMessage" class="expand-section error-section">
      <h4 class="section-title">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        错误信息
      </h4>
      <div class="error-content">
        <el-alert
          :title="task.errorMessage"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        >
          <template #default>
            <div v-if="task.errorDetail" class="error-detail">
              <details class="error-details-toggle">
                <summary>查看详细错误信息</summary>
                <pre class="error-detail-text">{{ formatErrorDetail(task.errorDetail) }}</pre>
              </details>
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <!-- 操作建议行 -->
    <div class="expand-section">
      <h4 class="section-title">
        <el-icon><Lightning /></el-icon>
        操作建议
      </h4>
      <div class="suggestions-content">
        <div class="suggestion-list">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.type"
            class="suggestion-item"
            :class="suggestion.type"
          >
            <el-icon class="suggestion-icon">
              <component :is="suggestion.icon" />
            </el-icon>
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-description">{{ suggestion.description }}</div>
            </div>
            <div class="suggestion-action" v-if="suggestion.action">
              <el-button size="small" type="primary" link @click="suggestion.action">
                {{ suggestion.actionText }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  InfoFilled,
  TrendCharts,
  DataAnalysis,
  Box,
  Upload,
  CircleCheck,
  Folder,
  DataBoard,
  Stopwatch,
  Medal,
  WarningFilled,
  Lightning,
  View,
  RefreshRight,
  Download,
  Checked,
  DocumentChecked,
  Setting
} from '@element-plus/icons-vue'
import type { ImportTaskRespVO } from '@/api/drug/task'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { TASK_STATUS } from '@/api/drug/task'

/** 组件名称定义 */
defineOptions({ name: 'TaskExpandContent' })

/** 组件属性 */
interface Props {
  task: ImportTaskRespVO
}

const props = defineProps<Props>()

/** 组件事件 */
interface Emits {
  (e: 'retry-task', task: ImportTaskRespVO): void
  (e: 'download-report', task: ImportTaskRespVO): void
  (e: 'download-error-file', task: ImportTaskRespVO): void
  (e: 'view-details', task: ImportTaskRespVO): void
}

const emit = defineEmits<Emits>()

// ========================= 响应式数据 =========================

/** 展开状态管理 */
const expandedSections = ref({
  basicInfo: true,
  progress: true,
  statistics: true,
  error: true,
  suggestions: true
})

/** 刷新状态 */
const isRefreshing = ref(false)

// ========================= 工具方法 =========================

/** 格式化文件大小 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 格式化数字（带缓存） */
const formatNumberCache = new Map<number, string>()
const formatNumber = (num: number) => {
  if (!num) return '0'
  
  if (formatNumberCache.has(num)) {
    return formatNumberCache.get(num)!
  }
  
  const result = num.toLocaleString()
  formatNumberCache.set(num, result)
  return result
}

/** 格式化时间（带缓存） */
const formatTimeCache = new Map<string, string>()
const formatTime = (time: string) => {
  if (!time) return ''
  
  if (formatTimeCache.has(time)) {
    return formatTimeCache.get(time)!
  }
  
  const result = new Date(time).toLocaleString()
  formatTimeCache.set(time, result)
  return result
}

/** 格式化毫秒数为可读时间 */
const formatDurationFromMs = (durationMs: number) => {
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

/** 获取执行模式文本 */
const getExecuteModeText = (mode: number) => {
  const modeMap = {
    1: '仅前置质控',
    2: '仅后置质控',
    3: '全部执行'
  }
  return modeMap[mode] || '未知模式'
}
/** 获取数据来源文本 */
const getDataSourceText = (value: string) => {
  return getDictLabel(DICT_TYPE.DRUG_DATA_SOURCE, value)
}
/** 获取处理阶段数据 */
const getProcessStages = (task: ImportTaskRespVO) => {
  // 从 qc_stages JSON 字段解析阶段信息
  if (task.qcStages) {
    let stages = task.qcStages
    
    // 如果是字符串，尝试解析为 JSON
    if (typeof task.qcStages === 'string') {
      try {
        stages = JSON.parse(task.qcStages)
      } catch (error) {
        console.warn('Failed to parse qcStages JSON:', error)
        stages = null
      }
    }
    
    // 如果解析成功且是数组，返回阶段数据
    if (stages && Array.isArray(stages)) {
      return stages
    }
  }

  // 如果没有 qc_stages 数据，使用默认阶段
  return [
    { name: '文件解析', status: 0 },
    { name: '基础验证', status: 0 },
    { name: '前置质控', status: 0 },
    { name: '数据导入', status: 0 }
  ]
}

/** 获取阶段状态文本 */
const getStageStatusText = (status: number) => {
  const statusMap = {
    0: '待开始',
    1: '进行中',
    2: '已完成',
    3: '失败'
  }
  return statusMap[status] || '未知状态'
}

/** 获取阶段图标 */
const getStageIcon = (stageName: string) => {
  const iconMap = {
    '文件解析': Box,
    '基础验证': DocumentChecked,
    '前置质控': Checked,
    '数据导入': Upload,
    '后置质控': CircleCheck
  }
  return iconMap[stageName] || Setting
}

/** 获取阶段样式类 */
const getStageClass = (status: number) => {
  const classMap = {
    0: 'pending',
    1: 'processing',
    2: 'completed',
    3: 'failed'
  }
  return classMap[status] || 'pending'
}

/** 获取连接线样式类 */
const getConnectorClass = (status: number) => {
  if (status === 2) return 'completed'
  if (status === 3) return 'failed'
  return 'pending'
}

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  return undefined
}

/** 获取文件成功率 */
const getFileSuccessRate = (task: ImportTaskRespVO) => {
  if (!task.totalFiles || task.totalFiles === 0) return 0
  return Math.round((task.successFiles / task.totalFiles) * 100)
}

/** 获取记录成功率 */
const getRecordSuccessRate = (task: ImportTaskRespVO) => {
  if (!task.totalRecords || task.totalRecords === 0) return 0
  return Math.round((task.successRecords / task.totalRecords) * 100)
}

/** 获取规则通过率 */
const getRulePassRate = (task: ImportTaskRespVO) => {
  if (!task.totalRules || task.totalRules === 0) return 0
  return Math.round((task.passedRules / task.totalRules) * 100)
}

/** 获取处理速度 */
const getProcessingSpeed = (task: ImportTaskRespVO) => {
  if (!task.startTime || !task.totalRecords || !task.durationMs) return '-'

  const recordsPerSecond = (task.successRecords || 0) / (task.durationMs / 1000)
  if (recordsPerSecond < 1) {
    return `${(recordsPerSecond * 60).toFixed(1)}条/分钟`
  }
  return `${recordsPerSecond.toFixed(1)}条/秒`
}

/** 获取实际耗时 */
const getActualDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-'
  
  try {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    return formatDurationFromMs(durationMs)
  } catch (error) {
    return '-'
  }
}

/** 获取文件进度状态 */
const getFileProgressStatus = (rate: number) => {
  if (rate === 100) return 'success'
  if (rate >= 80) return undefined
  return 'exception'
}

/** 获取规则进度状态 */
const getRuleProgressStatus = (rate: number) => {
  if (rate >= 90) return 'success'
  if (rate >= 70) return undefined
  return 'warning'
}

/** 获取质量评分样式类 */
const getQualityScoreClass = (score: number) => {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'average'
  if (score >= 60) return 'poor'
  return 'very-poor'
}

/** 获取质量描述 */
const getQualityDescription = (score: number) => {
  if (score >= 95) return '优秀'
  if (score >= 85) return '良好'
  if (score >= 70) return '一般'
  if (score >= 50) return '较差'
  return '很差'
}

/** 获取评分明细 */
const getScoreBreakdown = (scoreDetail: any) => {
  if (!scoreDetail) return {}

  let parsedDetail = scoreDetail
  
  // 如果是字符串，尝试解析为 JSON
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
    // 格式化数值，保留两位小数
    breakdown[displayName] = typeof value === 'number' ? value.toFixed(2) : value
  })

  return breakdown
}

/** 格式化错误详情 */
const formatErrorDetail = (errorDetail: any) => {
  if (!errorDetail) return ''

  try {
    if (typeof errorDetail === 'string') {
      return JSON.stringify(JSON.parse(errorDetail), null, 2)
    }
    return JSON.stringify(errorDetail, null, 2)
  } catch {
    return String(errorDetail)
  }
}

/** 获取操作建议 */
const getSuggestions = (task: ImportTaskRespVO) => {
  const suggestions = []

  // 根据任务状态生成不同建议
  switch (task.status) {
    case TASK_STATUS.PENDING:
    case TASK_STATUS.PARSING:
    case TASK_STATUS.QC_PRE_CHECKING:
    case TASK_STATUS.IMPORTING:
    case TASK_STATUS.QC_POST_CHECKING:
      suggestions.push({
        type: 'info',
        icon: View,
        title: '实时监控',
        description: '任务正在处理中，可以点击"查看进度"实时监控处理状态',
        actionText: '查看详情',
        action: () => {
          emit('view-details', task)
        }
      })
      break

    case TASK_STATUS.FAILED:
      suggestions.push({
        type: 'warning',
        icon: RefreshRight,
        title: '重试任务',
        description: '任务执行失败，建议检查错误信息后选择合适的重试策略',
        actionText: '立即重试',
        action: () => {
          emit('retry-task', task)
        }
      })
      break

    case TASK_STATUS.PARTIAL_SUCCESS:
      suggestions.push({
        type: 'warning',
        icon: RefreshRight,
        title: '部分重试',
        description: '部分数据处理失败，建议使用"仅失败部分重试"功能处理失败的数据',
        actionText: '部分重试',
        action: () => {
          emit('retry-task', task)
        }
      })
      break

    case TASK_STATUS.COMPLETED:
      suggestions.push({
        type: 'success',
        icon: Download,
        title: '下载报告',
        description: '任务已成功完成，可以下载详细的处理报告进行查看和存档',
        actionText: '下载报告',
        action: () => {
          emit('download-report', task)
        }
      })

      // 如果有错误文件，添加下载错误文件的建议
      if (task.hasErrorFile) {
        suggestions.push({
          type: 'info',
          icon: Download,
          title: '错误文件',
          description: '检测到有错误记录，可以下载错误文件进行数据修正',
          actionText: '下载错误文件',
          action: () => {
            emit('download-error-file', task)
          }
        })
      }
      break
  }

  // 根据成功率添加建议
  const recordRate = getRecordSuccessRate(task)
  if (recordRate < 80 && recordRate > 0) {
    suggestions.push({
      type: 'warning',
      icon: WarningFilled,
      title: '数据质量检查',
      description: '记录成功率较低，建议检查源数据格式是否符合要求',
      actionText: '查看规范',
      action: () => {
        // 这里可以打开数据规范文档或页面
        window.open('/data-specification', '_blank')
      }
    })
  }

  // 根据质量评分添加建议
  if (task.qualityScore && task.qualityScore < 70) {
    suggestions.push({
      type: 'warning',
      icon: Medal,
      title: '提升数据质量',
      description: '当前数据质量评分较低，建议优化数据源质量后重新导入',
      actionText: '查看质量报告',
      action: () => {
        // 这里可以打开质量报告页面
        emit('view-details', task)
      }
    })
  }

  return suggestions
}

// ========================= 计算属性 =========================

/** 处理阶段数据（使用计算属性优化） */
const processStages = computed(() => getProcessStages(props.task))

/** 文件成功率 */
const fileSuccessRate = computed(() => getFileSuccessRate(props.task))

/** 记录成功率 */
const recordSuccessRate = computed(() => getRecordSuccessRate(props.task))

/** 规则通过率 */
const rulePassRate = computed(() => getRulePassRate(props.task))

/** 处理速度 */
const processingSpeed = computed(() => getProcessingSpeed(props.task))

/** 操作建议 */
const suggestions = computed(() => getSuggestions(props.task))

// ========================= 方法 =========================

/** 切换区块展开状态 */
const toggleSection = (section: string) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

/** 获取吞吐量 */
const getThroughput = (task: ImportTaskRespVO) => {
  if (!task?.totalRecords || !task?.durationMs || task.durationMs === 0) return '-'
  
  const recordsPerSecond = task.totalRecords / (task.durationMs / 1000)
  if (recordsPerSecond < 1) {
    return `${(recordsPerSecond * 60).toFixed(1)}条/分钟`
  }
  return `${recordsPerSecond.toFixed(1)}条/秒`
}

/** 获取百分比 */
const getPercentage = (value: number | undefined, total: number | undefined) => {
  if (!value || !total || total === 0) return 0
  return Math.round((value / total) * 100)
}

/** 获取质量等级样式类 */
const getQualityLevelClass = (score: number | undefined) => {
  if (!score) return 'level-poor'
  if (score >= 90) return 'level-excellent'
  if (score >= 70) return 'level-good'
  if (score >= 50) return 'level-average'
  return 'level-poor'
}
</script>

<style scoped>
.task-expand-content {
  padding: 0;
  background-color: #fafafa;
}

.expand-section {
  margin-bottom: 24px;
}

.expand-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.section-title .error-icon {
  color: #f56c6c;
}

/* 基本信息样式 */
.basic-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.info-label {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  color: #303133;
  word-break: break-all;
}

/* 进度详情样式 */
.progress-details {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ebeef5;
}

.stage-indicators {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
}

.stage-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.stage-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.stage-content {
  text-align: center;
}

.stage-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stage-status {
  font-size: 12px;
  margin-bottom: 2px;
}

.stage-time {
  font-size: 11px;
  color: #909399;
}

.stage-duration {
  font-size: 11px;
  color: #409eff;
  margin-top: 2px;
}

.stage-error {
  margin-top: 4px;
}

.error-text {
  font-size: 11px;
  color: #f56c6c;
  font-weight: 500;
}

.stage-connector {
  position: absolute;
  top: 24px;
  left: 50%;
  width: calc(100% - 60px);
  height: 2px;
  z-index: 1;
}

/* 阶段状态样式 */
.stage-item.pending .stage-icon {
  background-color: #f4f4f5;
  color: #909399;
}

.stage-connector.pending {
  background-color: #e4e7ed;
}

.stage-item.processing .stage-icon {
  background-color: #fdf6ec;
  color: #e6a23c;
  animation: pulse 2s infinite;
}

.stage-connector.processing {
  background-color: #f5dab1;
}

.stage-item.completed .stage-icon {
  background-color: #f0f9ff;
  color: #67c23a;
}

.stage-connector.completed {
  background-color: #b3e5fc;
}

.stage-item.failed .stage-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}

.stage-connector.failed {
  background-color: #fbc4c4;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.overall-progress {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
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
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.progress-message {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
  text-align: center;
}

/* 统计网格样式 */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 18px;
  color: #409eff;
}

.stat-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-total {
  font-size: 14px;
  color: #909399;
}

.stat-secondary {
  font-size: 11px;
  color: #909399;
}

.warning-text {
  color: #e6a23c;
}

.secondary-text {
  color: #606266;
}

.stat-breakdown {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
}

.breakdown-label {
  color: #909399;
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
}

.stat-progress {
  margin-top: 4px;
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.metric-label {
  color: #606266;
}

.metric-value {
  color: #303133;
  font-weight: 500;
}

/* 质量评分样式 */
.quality-score {
  text-align: center;
}

.score-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.score-value.excellent {
  color: #67c23a;
}

.score-value.good {
  color: #409eff;
}

.score-value.average {
  color: #e6a23c;
}

.score-value.poor {
  color: #f56c6c;
}

.score-value.very-poor {
  color: #f56c6c;
}

.score-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.score-description {
  font-size: 11px;
  color: #606266;
  margin-top: 4px;
}

.score-breakdown {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 质量等级指示器 */
.quality-indicator {
  margin-top: 12px;
}

.indicator-bar {
  height: 6px;
  background: #f0f2f5;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
}

.indicator-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 3px;
}

.indicator-bar.level-excellent .indicator-fill {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.indicator-bar.level-good .indicator-fill {
  background: linear-gradient(90deg, #409eff, #66b1ff);
}

.indicator-bar.level-average .indicator-fill {
  background: linear-gradient(90deg, #e6a23c, #ebb563);
}

.indicator-bar.level-poor .indicator-fill {
  background: linear-gradient(90deg, #f56c6c, #f89898);
}

.indicator-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
}

.label-item {
  color: #c0c4cc;
  transition: color 0.3s ease;
}

.label-item.active {
  color: #303133;
  font-weight: 600;
}

.chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.chart-bar {
  width: 20px;
  min-height: 2px;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.chart-item.success .chart-bar {
  background: #67c23a;
}

.chart-item.warning .chart-bar {
  background: #e6a23c;
}

.chart-item.error .chart-bar {
  background: #f56c6c;
}

.chart-item.anomaly .chart-bar {
  background: #909399;
}

.chart-label {
  font-size: 10px;
  color: #909399;
}

.chart-value {
  font-size: 10px;
  color: #303133;
  font-weight: 600;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-icon {
  font-size: 18px;
  color: #409eff;
}

.stat-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.stat-total {
  font-size: 14px;
  color: #909399;
}

.stat-secondary {
  font-size: 11px;
  color: #909399;
}

.warning-text {
  color: #e6a23c;
}

.secondary-text {
  color: #606266;
}

.stat-breakdown {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
}

.breakdown-label {
  color: #909399;
}

.breakdown-value {
  font-weight: 500;
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
}

.stat-progress {
  margin-top: 4px;
}

.performance-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.metric-label {
  color: #606266;
}

.metric-value {
  color: #303133;
  font-weight: 500;
}

.quality-score {
  text-align: center;
}

.score-value {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
}

.score-value.excellent {
  color: #67c23a;
}

.score-value.good {
  color: #409eff;
}

.score-value.average {
  color: #e6a23c;
}

.score-value.poor {
  color: #f56c6c;
}

.score-value.very-poor {
  color: #f56c6c;
}

.score-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.score-description {
  font-size: 11px;
  color: #606266;
  margin-top: 4px;
}

.score-breakdown {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 错误信息样式 */
.error-section {
  background-color: #fef0f0;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #fbc4c4;
}

.error-content {
  margin: 0;
}

.error-alert {
  border: none;
  background: transparent;
}

.error-detail {
  margin-top: 8px;
}

.error-details-toggle {
  cursor: pointer;
}

.error-details-toggle summary {
  font-size: 12px;
  color: #606266;
  outline: none;
  user-select: none;
}

.error-details-toggle summary:hover {
  color: #303133;
}

.error-detail-text {
  margin-top: 8px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 11px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* 操作建议样式 */
.suggestions-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  background: #fafafa;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  background: #f0f9ff;
  border-color: #b3d8ff;
}

.suggestion-item.info {
  border-left: 4px solid #409eff;
}

.suggestion-item.warning {
  border-left: 4px solid #e6a23c;
}

.suggestion-item.success {
  border-left: 4px solid #67c23a;
}

.suggestion-item.error {
  border-left: 4px solid #f56c6c;
}

.suggestion-icon {
  font-size: 16px;
  margin-top: 2px;
  flex-shrink: 0;
}

.suggestion-item.info .suggestion-icon {
  color: #409eff;
}

.suggestion-item.warning .suggestion-icon {
  color: #e6a23c;
}

.suggestion-item.success .suggestion-icon {
  color: #67c23a;
}

.suggestion-item.error .suggestion-icon {
  color: #f56c6c;
}

.suggestion-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.suggestion-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.suggestion-action {
  flex-shrink: 0;
  align-self: flex-start;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .statistics-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  
  .stat-card {
    padding: 12px;
  }
}

@media (max-width: 768px) {
  .task-expand-content {
    padding: 0;
  }
  
  .expand-section {
    margin-bottom: 16px;
  }
  
  .basic-info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .statistics-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stage-indicators {
    flex-direction: column;
    gap: 16px;
  }
  
  .stage-item {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    text-align: left;
  }
  
  .stage-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .stage-connector {
    display: none;
  }
  
  .suggestion-item {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .suggestion-action {
    align-self: stretch;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 13px;
  }
  
  .stat-value {
    font-size: 18px;
  }
  
  .score-value {
    font-size: 28px;
  }
}
</style>
