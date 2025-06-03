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
          <span class="info-label">导入类型:</span>
          <span class="info-value">
            {{ task.importType === 1 ? '单文件导入' : '压缩包导入' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">创建时间:</span>
          <span class="info-value">{{ formatTime(task.createTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 处理进度行 -->
    <div class="expand-section">
      <h4 class="section-title">
        <el-icon><TrendCharts /></el-icon>
        处理进度详情
      </h4>
      <div class="progress-details">
        <!-- 阶段进度指示器 -->
        <div class="stage-indicators">
          <div
            class="stage-item"
            :class="getStageClass('extract', task)"
          >
            <div class="stage-icon">
              <el-icon><Box /></el-icon>
            </div>
            <div class="stage-content">
              <div class="stage-title">文件解压</div>
              <div class="stage-status">{{ getStageStatus('extract', task) }}</div>
              <div class="stage-time" v-if="task.extractEndTime">
                {{ formatTime(task.extractEndTime) }}
              </div>
            </div>
          </div>

          <div class="stage-connector"></div>

          <div
            class="stage-item"
            :class="getStageClass('import', task)"
          >
            <div class="stage-icon">
              <el-icon><Upload /></el-icon>
            </div>
            <div class="stage-content">
              <div class="stage-title">数据导入</div>
              <div class="stage-status">{{ getStageStatus('import', task) }}</div>
              <div class="stage-time" v-if="task.importEndTime">
                {{ formatTime(task.importEndTime) }}
              </div>
            </div>
          </div>

          <div class="stage-connector"></div>

          <div
            class="stage-item"
            :class="getStageClass('qc', task)"
          >
            <div class="stage-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stage-content">
              <div class="stage-title">质控检查</div>
              <div class="stage-status">{{ getStageStatus('qc', task) }}</div>
              <div class="stage-time" v-if="task.qcEndTime">
                {{ formatTime(task.qcEndTime) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 总体进度条 -->
        <div class="overall-progress">
          <div class="progress-header">
            <span class="progress-label">总体进度</span>
            <span class="progress-value">{{ task.progressPercent || 0 }}%</span>
          </div>
          <el-progress
            :percentage="task.progressPercent || 0"
            :stroke-width="12"
            :status="getProgressStatus(task.status)"
          />
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
        <div class="stat-card files">
          <div class="stat-header">
            <el-icon class="stat-icon"><Folder /></el-icon>
            <span class="stat-title">文件处理</span>
          </div>
          <div class="stat-content">
            <div class="stat-main">
              <span class="stat-value">{{ task.successFiles || 0 }}</span>
              <span class="stat-total">/ {{ task.totalFiles || 0 }}</span>
            </div>
            <div class="stat-label">成功/总计</div>
            <div class="stat-progress">
              <el-progress
                :percentage="getFileSuccessRate(task)"
                :stroke-width="4"
                :show-text="false"
                :status="getFileSuccessRate(task) === 100 ? 'success' : undefined"
              />
            </div>
          </div>
        </div>

        <div class="stat-card records">
          <div class="stat-header">
            <el-icon class="stat-icon"><DataBoard /></el-icon>
            <span class="stat-title">记录处理</span>
          </div>
          <div class="stat-content">
            <div class="stat-main">
              <span class="stat-value">{{ formatNumber(task.successRecords || 0) }}</span>
              <span class="stat-total">/ {{ formatNumber(task.totalRecords || 0) }}</span>
            </div>
            <div class="stat-label">成功/总计</div>
            <div class="stat-progress">
              <el-progress
                :percentage="getRecordSuccessRate(task)"
                :stroke-width="4"
                :show-text="false"
                :status="getRecordSuccessRate(task) >= 95 ? 'success' : getRecordSuccessRate(task) >= 80 ? undefined : 'exception'"
              />
            </div>
          </div>
        </div>

        <div class="stat-card performance">
          <div class="stat-header">
            <el-icon class="stat-icon"><Stopwatch /></el-icon>
            <span class="stat-title">性能指标</span>
          </div>
          <div class="stat-content">
            <div class="performance-metrics">
              <div class="metric-item">
                <span class="metric-label">处理耗时:</span>
                <span class="metric-value">{{ getDuration(task) || '计算中...' }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">处理速度:</span>
                <span class="metric-value">{{ getProcessingSpeed(task) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-card quality">
          <div class="stat-header">
            <el-icon class="stat-icon"><Medal /></el-icon>
            <span class="stat-title">质量评分</span>
          </div>
          <div class="stat-content">
            <div class="quality-score">
              <div class="score-value">{{ getQualityScore(task) }}</div>
              <div class="score-label">质量分</div>
              <div class="score-description">{{ getQualityDescription(task) }}</div>
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
            v-for="suggestion in getSuggestions(task)"
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
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  Download
} from '@element-plus/icons-vue'
import type { ImportTaskRespVO } from '@/api/drug/task'
import { TASK_STATUS } from '@/api/drug/task'

/** 组件名称定义 */
defineOptions({ name: 'TaskExpandContent' })

/** 组件属性 */
interface Props {
  task: ImportTaskRespVO
}

const props = defineProps<Props>()

// ========================= 工具方法 =========================

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

/** 获取阶段状态 */
const getStageStatus = (stage: string, task: ImportTaskRespVO) => {
  const statusMap = {
    extract: task.extractStatus,
    import: task.importStatus,
    qc: task.qcStatus
  }

  const status = statusMap[stage] || 0
  const textMap = {
    0: '未开始',
    1: '进行中',
    2: '已完成',
    3: '失败'
  }

  return textMap[status] || '未知'
}

/** 获取阶段样式类 */
const getStageClass = (stage: string, task: ImportTaskRespVO) => {
  const statusMap = {
    extract: task.extractStatus,
    import: task.importStatus,
    qc: task.qcStatus
  }

  const status = statusMap[stage] || 0
  const classMap = {
    0: 'pending',
    1: 'processing',
    2: 'completed',
    3: 'failed'
  }

  return classMap[status] || 'pending'
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

/** 获取持续时间 */
const getDuration = (task: ImportTaskRespVO) => {
  if (!task.startTime) return null

  const endTime = task.endTime || new Date().toISOString()
  const start = new Date(task.startTime).getTime()
  const end = new Date(endTime).getTime()
  const duration = Math.floor((end - start) / 1000)

  if (duration < 60) return `${duration}秒`
  if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`
  return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分`
}

/** 获取处理速度 */
const getProcessingSpeed = (task: ImportTaskRespVO) => {
  if (!task.startTime || !task.totalRecords) return '-'

  const endTime = task.endTime || new Date().toISOString()
  const start = new Date(task.startTime).getTime()
  const end = new Date(endTime).getTime()
  const durationSeconds = (end - start) / 1000

  if (durationSeconds <= 0) return '-'

  const recordsPerSecond = task.successRecords / durationSeconds
  if (recordsPerSecond < 1) {
    return `${(recordsPerSecond * 60).toFixed(1)}条/分钟`
  }
  return `${recordsPerSecond.toFixed(1)}条/秒`
}

/** 获取质量评分 */
const getQualityScore = (task: ImportTaskRespVO) => {
  const recordRate = getRecordSuccessRate(task)
  const fileRate = getFileSuccessRate(task)

  // 综合文件成功率和记录成功率计算质量分
  const score = Math.round((recordRate * 0.7 + fileRate * 0.3))
  return Math.min(100, Math.max(0, score))
}

/** 获取质量描述 */
const getQualityDescription = (task: ImportTaskRespVO) => {
  const score = getQualityScore(task)

  if (score >= 95) return '优秀'
  if (score >= 85) return '良好'
  if (score >= 70) return '一般'
  if (score >= 50) return '较差'
  return '很差'
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
    case TASK_STATUS.EXTRACTING:
    case TASK_STATUS.IMPORTING:
    case TASK_STATUS.QC_CHECKING:
      suggestions.push({
        type: 'info',
        icon: View,
        title: '实时监控',
        description: '任务正在处理中，可以点击"查看进度"实时监控处理状态'
      })
      break

    case TASK_STATUS.FAILED:
      suggestions.push({
        type: 'warning',
        icon: RefreshRight,
        title: '重试任务',
        description: '任务执行失败，建议检查错误信息后选择合适的重试策略'
      })
      break

    case TASK_STATUS.PARTIAL_SUCCESS:
      suggestions.push({
        type: 'warning',
        icon: RefreshRight,
        title: '部分重试',
        description: '部分数据处理失败，建议使用"仅失败部分重试"功能处理失败的数据'
      })
      break

    case TASK_STATUS.COMPLETED:
      suggestions.push({
        type: 'success',
        icon: Download,
        title: '下载报告',
        description: '任务已成功完成，可以下载详细的处理报告进行查看和存档'
      })
      break
  }

  // 根据成功率添加建议
  const recordRate = getRecordSuccessRate(task)
  if (recordRate < 80 && recordRate > 0) {
    suggestions.push({
      type: 'warning',
      icon: WarningFilled,
      title: '数据质量检查',
      description: '记录成功率较低，建议检查源数据格式是否符合要求'
    })
  }

  return suggestions
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

.stage-connector {
  width: 60px;
  height: 2px;
  margin: 0 10px;
  margin-top: -20px;
}

/* 阶段状态样式 */
.stage-item.pending .stage-icon {
  background-color: #f4f4f5;
  color: #909399;
}

.stage-item.pending .stage-connector {
  background-color: #e4e7ed;
}

.stage-item.processing .stage-icon {
  background-color: #fdf6ec;
  color: #e6a23c;
  animation: pulse 2s infinite;
}

.stage-item.processing .stage-connector {
  background-color: #f5dab1;
}

.stage-item.completed .stage-icon {
  background-color: #f0f9ff;
  color: #67c23a;
}

.stage-item.completed .stage-connector {
  background-color: #b3e5fc;
}

.stage-item.failed .stage-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}

.stage-item.failed .stage-connector {
  background-color: #fbc4c4;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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

/* 统计网格样式 */
.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  color: #67c23a;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  color: #606266;
  margin: 4px 0;
}

.score-description {
  font-size: 11px;
  color: #909399;
}

/* 错误信息样式 */
.error-section {
  background: #fef0f0;
  border-radius: 6px;
  padding: 16px;
  border: 1px solid #fbc4c4;
}

.error-content {
  margin-top: 8px;
}

.error-alert {
  border-radius: 6px;
}

.error-detail {
  margin-top: 12px;
}

.error-details-toggle {
  cursor: pointer;
  font-size: 13px;
  color: #409eff;
}

.error-details-toggle summary {
  outline: none;
  user-select: none;
}

.error-detail-text {
  margin-top: 8px;
  padding: 12px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #742a2a;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* 建议样式 */
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
  border-left: 4px solid transparent;
}

.suggestion-item.info {
  background: #f0f9ff;
  border-left-color: #409eff;
}

.suggestion-item.success {
  background: #f0f9ff;
  border-left-color: #67c23a;
}

.suggestion-item.warning {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.suggestion-icon {
  margin-top: 2px;
  font-size: 16px;
}

.suggestion-item.info .suggestion-icon {
  color: #409eff;
}

.suggestion-item.success .suggestion-icon {
  color: #67c23a;
}

.suggestion-item.warning .suggestion-icon {
  color: #e6a23c;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.suggestion-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .basic-info-grid {
    grid-template-columns: 1fr;
  }

  .statistics-grid {
    grid-template-columns: 1fr;
  }

  .stage-indicators {
    flex-direction: column;
    gap: 16px;
  }

  .stage-connector {
    width: 2px;
    height: 30px;
    margin: 8px 0;
  }

  .stage-item {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .stage-content {
    text-align: left;
  }
}
</style>
