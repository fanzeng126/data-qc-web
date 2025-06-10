<template>
  <div class="result-card" :class="cardClass">
    <div class="card-content">
      <!-- 卡片头部：标题和图标区域 -->
      <div class="card-header">
        <div class="header-left">
          <div class="card-title">{{ title }}</div>
          <div class="card-description" v-if="description">{{ description }}</div>
        </div>
        <div class="header-right">
          <!-- 图标区域 -->
          <div class="card-icon" :style="{ backgroundColor: iconColor }">
            <el-icon :size="iconSize">
              <component :is="iconComponent" />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 主要数值显示区域 -->
      <div class="value-section">
        <div class="main-value">
          <span class="value-number" :class="valueClass">
            {{ loading ? '-' : formattedValue }}
          </span>
          <span class="value-suffix" v-if="suffix">{{ suffix }}</span>
        </div>

        <!-- 百分比或比率显示 -->
        <div class="rate-display" v-if="rate !== undefined && !loading">
          <div class="rate-indicator" :class="getRateClass(rate)">
            <span class="rate-value">{{ rate }}%</span>
          </div>
        </div>
      </div>

      <!-- 趋势显示（可选） -->
      <div class="trend-section" v-if="showTrend && trend !== undefined && !loading">
        <div class="trend-indicator" :class="trendClass">
          <el-icon :size="14">
            <CaretTop v-if="trend > 0" />
            <CaretBottom v-if="trend < 0" />
            <Minus v-if="trend === 0" />
          </el-icon>
          <span class="trend-value">{{ formatTrend(trend) }}</span>
        </div>
        <span class="trend-label">{{ trendLabel }}</span>
      </div>

      <!-- 详细信息列表（可选） */
      <div class="details-section" v-if="details && details.length > 0">
        <div class="detail-item" v-for="detail in details" :key="detail.label">
          <span class="detail-label">{{ detail.label }}:</span>
          <span class="detail-value" :class="getDetailValueClass(detail)">
            {{ detail.value }}{{ detail.suffix || '' }}
          </span>
        </div>
      </div>

      <!-- 操作按钮区域（可选） -->
      <div class="actions-section" v-if="actions && actions.length > 0">
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

      <!-- 加载状态遮罩 -->
      <div class="loading-overlay" v-if="loading">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CaretTop, CaretBottom, Minus, Loading } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'

/**
 * 这个组件就像一个精心设计的展示窗，用来清晰地展示质控结果的关键数据。
 * 它不仅要美观，更要让用户一眼就能理解数据的含义和重要性。
 */

interface DetailItem {
  label: string
  value: string | number
  suffix?: string
  status?: 'normal' | 'success' | 'warning' | 'danger'
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
  suffix?: string // 数值后缀（如%、个、条等）
  description?: string // 描述信息
  icon: string // 图标名称
  iconColor?: string // 图标背景色
  iconSize?: number // 图标大小
  rate?: number // 百分比率
  trend?: number // 趋势值（百分比）
  trendLabel?: string // 趋势标签
  showTrend?: boolean // 是否显示趋势
  loading?: boolean // 加载状态
  status?: 'normal' | 'success' | 'warning' | 'danger' // 卡片状态
  details?: DetailItem[] // 详细信息列表
  actions?: ActionItem[] // 操作按钮列表
}

const props = withDefaults(defineProps<Props>(), {
  iconColor: '#409eff',
  iconSize: 24,
  trendLabel: '较上期',
  showTrend: false,
  loading: false,
  status: 'normal'
})

const emit = defineEmits<{
  action: [key: string, action: ActionItem]
}>()

// ========================= 计算属性 =========================

/**
 * 图标组件 - 这个计算属性的作用就像一个智能翻译器，
 * 把字符串格式的图标名称转换成Vue组件，让我们能够动态显示不同的图标
 */
const iconComponent = computed(() => {
  return Icons[props.icon as keyof typeof Icons] || Icons.Document
})

/**
 * 格式化显示值 - 这个函数就像一个贴心的助手，
 * 它会根据数值的大小自动选择最合适的显示格式，让大数字更容易阅读
 */
const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }

  // 智能数字格式化：根据数值大小选择合适的单位
  if (props.value >= 100000000) {
    return (props.value / 100000000).toFixed(1) + '亿'
  } else if (props.value >= 10000) {
    return (props.value / 10000).toFixed(1) + '万'
  } else if (props.value >= 1000) {
    return props.value.toLocaleString() // 使用千分位分隔符
  } else {
    return props.value.toString()
  }
})

/**
 * 卡片样式类 - 这个计算属性决定了整个卡片的视觉风格，
 * 它会根据不同的状态应用不同的颜色主题，就像给卡片穿上不同颜色的外衣
 */
const cardClass = computed(() => {
  return [
    `card-${props.status}`,
    {
      'is-loading': props.loading
    }
  ]
})

/**
 * 数值样式类 - 根据卡片状态为数值添加相应的颜色，
 * 这样用户就能通过颜色快速判断数据的好坏
 */
const valueClass = computed(() => {
  return `value-${props.status}`
})

/**
 * 趋势样式类 - 这个计算属性就像交通信号灯，
 * 用不同颜色来表示数据变化的方向：绿色表示上升，红色表示下降
 */
const trendClass = computed(() => {
  if (props.trend === undefined) return ''

  return {
    'trend-up': props.trend > 0, // 上升趋势 - 绿色
    'trend-down': props.trend < 0, // 下降趋势 - 红色
    'trend-stable': props.trend === 0 // 稳定趋势 - 灰色
  }
})

// ========================= 方法 =========================

/**
 * 格式化趋势显示 - 这个函数负责将数字转换成易读的趋势格式，
 * 比如 +5.2% 或 -3.1%，让用户能够快速理解变化程度
 */
const formatTrend = (trend: number): string => {
  const absValue = Math.abs(trend)
  if (absValue === 0) return '0%'
  return `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`
}

/**
 * 获取比率样式类 - 根据比率的高低返回不同的样式类，
 * 这样我们就能用颜色来直观表示比率的好坏
 */
const getRateClass = (rate: number): string => {
  if (rate >= 90) return 'rate-excellent' // 优秀 - 深绿色
  if (rate >= 80) return 'rate-good' // 良好 - 绿色
  if (rate >= 60) return 'rate-average' // 一般 - 黄色
  return 'rate-poor' // 较差 - 红色
}

/**
 * 获取详细信息值的样式类 - 为详细信息中的每个值设置合适的颜色，
 * 让用户能够快速识别哪些数据需要关注
 */
const getDetailValueClass = (detail: DetailItem): string => {
  if (!detail.status) return ''
  return `detail-${detail.status}`
}

/**
 * 处理操作按钮点击 - 当用户点击操作按钮时，
 * 这个函数会将点击事件传递给父组件，让父组件知道用户想要执行什么操作
 */
const handleAction = (action: ActionItem) => {
  emit('action', action.key, action)
}
</script>

<style lang="scss" scoped>
.result-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafb 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;

  // 悬停效果 - 让卡片有"活力"，增强交互体验
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }

  // 加载状态 - 防止用户在加载时误操作
  &.is-loading {
    pointer-events: none;
  }

  // 不同状态的卡片样式 - 用颜色传达信息
  &.card-success {
    border-left: 4px solid #67c23a;
  }

  &.card-warning {
    border-left: 4px solid #e6a23c;
  }

  &.card-danger {
    border-left: 4px solid #f56c6c;
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
    flex-shrink: 0;
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

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
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
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
      transition: color 0.3s ease;

      // 不同状态的数值颜色
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
      font-size: 16px;
      color: #606266;
      font-weight: 500;
    }
  }

  .rate-display {
    .rate-indicator {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;

      // 不同比率等级的颜色
      &.rate-excellent {
        background-color: #f0f9ff;
        color: #059669;
      }

      &.rate-good {
        background-color: #ecfdf5;
        color: #16a34a;
      }

      &.rate-average {
        background-color: #fffbeb;
        color: #d97706;
      }

      &.rate-poor {
        background-color: #fef2f2;
        color: #dc2626;
      }
    }
  }
}

.trend-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .trend-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;

    // 趋势方向的颜色指示
    &.trend-up {
      background-color: #f0fdf4;
      color: #16a34a;
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

.details-section {
  margin-bottom: 16px;

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    font-size: 13px;

    .detail-label {
      color: #606266;
    }

    .detail-value {
      font-weight: 500;

      // 详细信息值的状态颜色
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
  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
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
  border-radius: 12px;

  .loading-icon {
    font-size: 24px;
    color: #409eff;
    animation: spin 1s linear infinite;
  }
}

// 旋转动画
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 - 确保在移动设备上也有良好的显示效果 */
@media (max-width: 768px) {
  .result-card {
    .card-content {
      padding: 16px;
    }

    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-right {
        width: 100%;
        display: flex;
        justify-content: flex-end;
      }
    }

    .card-icon {
      width: 40px;
      height: 40px;
    }

    .value-section .main-value .value-number {
      font-size: 24px;
    }

    .action-buttons {
      justify-content: center;
    }
  }
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .result-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: #ffffff;

    .card-title {
      color: #ffffff;
    }

    .card-description {
      color: #b3b3b3;
    }

    .value-section .main-value .value-number.value-normal {
      color: #ffffff;
    }

    .loading-overlay {
      background-color: rgba(0, 0, 0, 0.8);
    }
  }
}
</style>
