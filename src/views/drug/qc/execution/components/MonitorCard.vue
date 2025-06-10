<template>
  <div class="monitor-card" :class="cardStatusClass">
    <div class="card-content">
      <!-- 卡片头部 -->
      <div class="card-header">
        <div class="header-left">
          <div class="card-title">{{ title }}</div>
          <div class="card-description" v-if="description">{{ description }}</div>
        </div>
        <div class="header-right">
          <!-- 状态指示器 -->
          <div class="status-indicator" :class="statusClass" v-if="showStatus">
            <div class="status-dot"></div>
            <span class="status-text">{{ statusText }}</span>
          </div>
          <!-- 图标 -->
          <div class="card-icon" :style="{ backgroundColor: iconColor }">
            <el-icon :size="iconSize">
              <component :is="iconComponent" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 主要数值区域 -->
      <div class="value-section">
        <div class="main-value">
          <span class="value-number" :class="valueStatusClass">
            {{ loading ? '-' : formattedValue }}
          </span>
          <span class="value-suffix" v-if="suffix">{{ suffix }}</span>
        </div>

        <!-- 趋势显示 -->
        <div class="trend-section" v-if="trend !== undefined && !loading">
          <div class="trend-indicator" :class="trendClass">
            <el-icon :size="16">
              <TrendCharts v-if="trend > 0" />
              <Bottom v-if="trend < 0" />
              <Minus v-if="trend === 0" />
            </el-icon>
            <span class="trend-value">{{ formatTrend(trend) }}</span>
          </div>
          <span class="trend-label">{{ trendLabel }}</span>
        </div>
      </div>

      <!-- 进度条（可选） -->
      <div class="progress-section" v-if="showProgress">
        <el-progress
          :percentage="progressPercentage"
          :stroke-width="6"
          :show-text="false"
          :status="progressStatus"
          class="monitor-progress"
        />
        <div class="progress-info">
          <span class="progress-text">{{ progressText }}</span>
          <span class="progress-percentage">{{ progressPercentage }}%</span>
        </div>
      </div>

      <!-- 详细信息区域 -->
      <div class="details-section" v-if="details?.length">
        <div class="detail-grid">
          <div v-for="detail in details" :key="detail.label" class="detail-item">
            <span class="detail-label">{{ detail.label }}:</span>
            <span class="detail-value" :class="getDetailValueClass(detail)">
              {{ detail.value }}{{ detail.suffix || '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="actions-section" v-if="actions?.length">
        <div class="action-buttons">
          <el-button
            v-for="action in actions"
            :key="action.key"
            :type="action.type || 'text'"
            :size="action.size || 'small'"
            :icon="action.icon"
            @click="handleAction(action)"
            :loading="action.loading"
            :disabled="action.disabled"
          >
            {{ action.label }}
          </el-button>
        </div>
      </div>

      <!-- 警告信息 -->
      <div class="warning-section" v-if="warningMessage">
        <el-alert
          :title="warningMessage"
          type="warning"
          :show-icon="false"
          :closable="false"
          class="warning-alert"
        />
      </div>

      <!-- 加载遮罩 -->
      <div class="loading-overlay" v-if="loading">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        <span class="loading-text">{{ loadingText || '加载中...' }}</span>
      </div>

      <!-- 实时更新指示器 -->
      <div class="update-indicator" v-if="showUpdateIndicator && !loading">
        <div class="update-dot" :class="{ active: isUpdating }"></div>
        <span class="update-text">{{ lastUpdateTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { TrendCharts, Bottom, Minus, Loading } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'

interface DetailItem {
  label: string
  value: string | number
  suffix?: string
  status?: 'normal' | 'warning' | 'danger' | 'success'
}

interface ActionItem {
  key: string
  label: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
  size?: 'large' | 'default' | 'small'
  icon?: any
  loading?: boolean
  disabled?: boolean
}

interface Props {
  title: string // 卡片标题
  value: number | string // 主要数值
  suffix?: string // 数值后缀
  description?: string // 描述信息
  icon: string // 图标名称
  iconColor?: string // 图标背景色
  iconSize?: number // 图标大小
  trend?: number // 趋势值（百分比）
  trendLabel?: string // 趋势标签
  loading?: boolean // 加载状态
  loadingText?: string // 加载文本
  status?: 'normal' | 'warning' | 'danger' | 'success' // 状态
  showStatus?: boolean // 是否显示状态指示器
  showProgress?: boolean // 是否显示进度条
  progressPercentage?: number // 进度百分比
  progressText?: string // 进度文本
  details?: DetailItem[] // 详细信息
  actions?: ActionItem[] // 操作按钮
  warningMessage?: string // 警告信息
  showUpdateIndicator?: boolean // 是否显示更新指示器
  lastUpdateTime?: string // 最后更新时间
  isUpdating?: boolean // 是否正在更新
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#409eff',
  iconSize: 24,
  trendLabel: '较上期',
  loading: false,
  status: 'normal',
  showStatus: false,
  showProgress: false,
  progressPercentage: 0,
  showUpdateIndicator: false,
  isUpdating: false
})

const emit = defineEmits<{
  action: [key: string, action: ActionItem]
}>()

// ========================= 计算属性 =========================

/** 图标组件 */
const iconComponent = computed(() => {
  return Icons[props.icon as keyof typeof Icons] || Icons.Document
})

/** 格式化数值显示 */
const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }

  // 对数字进行智能格式化
  if (props.value >= 100000000) {
    return (props.value / 100000000).toFixed(1) + '亿'
  } else if (props.value >= 10000) {
    return (props.value / 10000).toFixed(1) + '万'
  } else if (props.value >= 1000) {
    return props.value.toLocaleString()
  } else {
    return props.value.toString()
  }
})

/** 卡片状态样式类 */
const cardStatusClass = computed(() => {
  return {
    [`status-${props.status}`]: true,
    'is-loading': props.loading,
    'has-warning': props.warningMessage
  }
})

/** 数值状态样式类 */
const valueStatusClass = computed(() => {
  if (props.status === 'danger') return 'value-danger'
  if (props.status === 'warning') return 'value-warning'
  if (props.status === 'success') return 'value-success'
  return 'value-normal'
})

/** 状态指示器样式类 */
const statusClass = computed(() => {
  return `status-${props.status}`
})

/** 状态文本 */
const statusText = computed(() => {
  const statusMap = {
    normal: '正常',
    success: '良好',
    warning: '警告',
    danger: '异常'
  }
  return statusMap[props.status] || '未知'
})

/** 趋势样式类 */
const trendClass = computed(() => {
  if (props.trend === undefined) return ''

  return {
    'trend-up': props.trend > 0,
    'trend-down': props.trend < 0,
    'trend-stable': props.trend === 0
  }
})

/** 进度条状态 */
const progressStatus = computed(() => {
  if (props.progressPercentage >= 90) return 'exception'
  if (props.progressPercentage >= 70) return 'warning'
  return undefined
})

// ========================= 方法 =========================

/** 格式化趋势显示 */
const formatTrend = (trend: number): string => {
  const absValue = Math.abs(trend)
  if (absValue === 0) return '0%'
  return `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`
}

/** 处理操作按钮点击 */
const handleAction = (action: ActionItem) => {
  emit('action', action.key, action)
}

/** 获取详细信息值样式类 */
const getDetailValueClass = (detail: DetailItem): string => {
  if (!detail.status) return ''
  return `detail-${detail.status}`
}
</script>

<style lang="scss" scoped>
.monitor-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }

  &.is-loading {
    pointer-events: none;
  }

  // 状态边框
  &.status-warning {
    border-left: 4px solid #e6a23c;
  }

  &.status-danger {
    border-left: 4px solid #f56c6c;
  }

  &.status-success {
    border-left: 4px solid #67c23a;
  }

  &.has-warning {
    background: linear-gradient(145deg, #fffbf0 0%, #fef7e0 100%);
  }
}

.card-content {
  padding: 20px;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;

  .header-left {
    flex: 1;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.2;
}

.card-description {
  font-size: 13px;
  color: #909399;
  line-height: 1.3;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  &.status-normal {
    background-color: #f0f9ff;
    color: #0369a1;

    .status-dot {
      background-color: #0369a1;
    }
  }

  &.status-success {
    background-color: #f0fdf4;
    color: #15803d;

    .status-dot {
      background-color: #15803d;
    }
  }

  &.status-warning {
    background-color: #fffbeb;
    color: #d97706;

    .status-dot {
      background-color: #d97706;
    }
  }

  &.status-danger {
    background-color: #fef2f2;
    color: #dc2626;

    .status-dot {
      background-color: #dc2626;
    }
  }
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.value-section {
  margin-bottom: 16px;

  .main-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 8px;

    .value-number {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      transition: color 0.3s ease;

      &.value-normal {
        color: #303133;
      }

      &.value-success {
        color: #67c23a;
      }

      &.value-warning {
        color: #e6a23c;
      }

      &.value-danger {
        color: #f56c6c;
      }
    }

    .value-suffix {
      font-size: 18px;
      color: #606266;
      font-weight: 500;
    }
  }

  .trend-section {
    display: flex;
    align-items: center;
    gap: 8px;

    .trend-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;

      &.trend-up {
        background-color: #f0f9ff;
        color: #059669;
      }

      &.trend-down {
        background-color: #fef2f2;
        color: #dc2626;
      }

      &.trend-stable {
        background-color: #f8fafc;
        color: #6b7280;
      }
    }

    .trend-label {
      font-size: 12px;
      color: #909399;
    }
  }
}

.progress-section {
  margin-bottom: 16px;

  .monitor-progress {
    margin-bottom: 8px;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;

    .progress-text {
      color: #606266;
    }

    .progress-percentage {
      color: #303133;
      font-weight: 500;
    }
  }
}

.details-section {
  margin-bottom: 16px;

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    padding: 6px 0;

    .detail-label {
      color: #909399;
    }

    .detail-value {
      font-weight: 500;

      &.detail-normal {
        color: #303133;
      }

      &.detail-success {
        color: #67c23a;
      }

      &.detail-warning {
        color: #e6a23c;
      }

      &.detail-danger {
        color: #f56c6c;
      }
    }
  }
}

.actions-section {
  margin-bottom: 16px;

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.warning-section {
  margin-bottom: 16px;

  .warning-alert {
    border-radius: 8px;

    :deep(.el-alert__content) {
      font-size: 12px;
    }
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  backdrop-filter: blur(2px);

  .loading-icon {
    font-size: 28px;
    color: #409eff;
    margin-bottom: 8px;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 14px;
    color: #606266;
  }
}

.update-indicator {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #c0c4cc;

  .update-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #c0c4cc;
    transition: all 0.3s ease;

    &.active {
      background-color: #67c23a;
      animation: pulse 1.5s infinite;
    }
  }

  .update-text {
    white-space: nowrap;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .monitor-card {
    .card-content {
      padding: 16px;
    }

    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-right {
        width: 100%;
        justify-content: space-between;
      }
    }

    .card-icon {
      width: 48px;
      height: 48px;
    }

    .value-section .main-value .value-number {
      font-size: 28px;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      justify-content: center;
    }
  }
}

/* 暗黑模式适配 */
.dark .monitor-card {
  background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
  color: #ffffff;

  .card-title {
    color: #ffffff;
  }

  .card-description {
    color: #b3b3b3;
  }

  &.has-warning {
    background: linear-gradient(145deg, #2d2417 0%, #3d2f1a 100%);
  }

  .value-section .main-value .value-number.value-normal {
    color: #ffffff;
  }

  .loading-overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }
}
</style>
