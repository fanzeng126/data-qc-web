<template>
  <div class="stat-card" :class="{ 'is-loading': loading, [`status-${status}`]: status }">
    <div class="stat-card-inner" @click="handleClick">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon"><Loading /></el-icon>
      </div>

      <!-- 主要内容 -->
      <div class="stat-content">
        <!-- 左侧数值区域 -->
        <div class="stat-main">
          <div class="stat-value-wrapper">
            <span class="stat-value" :style="{ color: color }">
              {{ formattedValue }}
            </span>
            <span v-if="suffix" class="stat-suffix">{{ suffix }}</span>
          </div>
          <div class="stat-title">{{ title }}</div>

          <!-- 趋势指示器 -->
          <div v-if="trend !== undefined" class="stat-trend" :class="getTrendClass()">
            <el-icon class="trend-icon">
              <component :is="getTrendIcon()" />
            </el-icon>
            <span class="trend-value">{{ Math.abs(trend) }}%</span>
            <span class="trend-label">{{ getTrendLabel() }}</span>
          </div>
        </div>

        <!-- 右侧图标区域 -->
        <div class="stat-icon-wrapper">
          <div class="stat-icon" :style="{ backgroundColor: iconBgColor }">
            <el-icon :color="color" :size="iconSize">
              <component :is="iconComponent" />
            </el-icon>
          </div>

          <!-- 状态指示器 -->
          <div v-if="status" class="status-indicator" :class="`status-${status}`">
            <div class="status-dot"></div>
          </div>
        </div>
      </div>

      <!-- 底部附加信息 -->
      <div v-if="description || hasFooterSlot" class="stat-footer">
        <slot name="footer">
          <span class="stat-description">{{ description }}</span>
        </slot>
      </div>

      <!-- 迷你图表区域 -->
      <div v-if="chartData && chartData.length > 0" class="stat-chart">
        <div class="mini-chart" ref="chartRef"></div>
      </div>
    </div>

    <!-- 悬浮效果 -->
    <div class="hover-overlay"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, useSlots } from 'vue'
import {
  Loading,
  TrendCharts,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  CircleCheck,
  Clock,
  DataBoard,
  User,
  Folder,
  Document,
  Setting
} from '@element-plus/icons-vue'

/** 组件名称定义 */
defineOptions({ name: 'StatCard' })

/** 组件属性 */
interface Props {
  title: string
  value: number | string
  suffix?: string
  icon?: string
  color?: string
  description?: string
  trend?: number
  loading?: boolean
  clickable?: boolean
  status?: 'processing' | 'success' | 'warning' | 'error'
  chartData?: number[]
  iconSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#409eff',
  iconSize: 24,
  clickable: false
})

/** 组件事件 */
const emit = defineEmits<{
  click: []
}>()

// ========================= 响应式数据 =========================

const chartRef = ref<HTMLElement>()
const slots = useSlots()

// ========================= 计算属性 =========================

/** 格式化数值 */
const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }

  if (props.value >= 1000000) {
    return (props.value / 1000000).toFixed(1) + 'M'
  }
  if (props.value >= 1000) {
    return (props.value / 1000).toFixed(1) + 'K'
  }
  return props.value.toLocaleString()
})

/** 图标组件 */
const iconComponent = computed(() => {
  const iconMap = {
    'Calendar': Calendar,
    'Loading': Loading,
    'CircleCheck': CircleCheck,
    'Clock': Clock,
    'TrendCharts': TrendCharts,
    'DataBoard': DataBoard,
    'User': User,
    'Folder': Folder,
    'Document': Document,
    'Setting': Setting
  }

  return iconMap[props.icon] || TrendCharts
})

/** 图标背景色 */
const iconBgColor = computed(() => {
  return props.color + '20' // 20% 透明度
})

/** 是否有底部插槽 */
const hasFooterSlot = computed(() => {
  return !!slots.footer
})

// ========================= 方法 =========================

/** 获取趋势类名 */
const getTrendClass = () => {
  if (props.trend === undefined) return ''

  if (props.trend > 0) return 'trend-up'
  if (props.trend < 0) return 'trend-down'
  return 'trend-flat'
}

/** 获取趋势图标 */
const getTrendIcon = () => {
  if (props.trend === undefined) return Minus

  if (props.trend > 0) return ArrowUp
  if (props.trend < 0) return ArrowDown
  return Minus
}

/** 获取趋势标签 */
const getTrendLabel = () => {
  if (props.trend === undefined) return ''

  if (props.trend > 0) return '较昨日'
  if (props.trend < 0) return '较昨日'
  return '与昨日持平'
}

/** 处理点击事件 */
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}

/** 渲染迷你图表 */
const renderMiniChart = () => {
  if (!chartRef.value || !props.chartData || props.chartData.length === 0) {
    return
  }

  // 这里可以集成第三方图表库，如 Chart.js、ECharts 等
  // 为了简化，这里只做一个简单的 SVG 线图
  const width = chartRef.value.clientWidth
  const height = chartRef.value.clientHeight
  const data = props.chartData

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const svg = `
    <svg width="${width}" height="${height}">
      <polyline
        points="${points}"
        fill="none"
        stroke="${props.color}"
        stroke-width="2"
        opacity="0.8"
      />
    </svg>
  `

  chartRef.value.innerHTML = svg
}

// ========================= 生命周期 =========================

onMounted(() => {
  if (props.chartData && props.chartData.length > 0) {
    renderMiniChart()
  }
})
</script>

<style scoped>
.stat-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  height: 120px;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-card:hover .hover-overlay {
  opacity: 1;
}

.stat-card-inner {
  position: relative;
  height: 100%;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 2;
}

/* 加载状态 */
.is-loading .stat-card-inner {
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.loading-icon {
  font-size: 24px;
  color: #409eff;
  animation: rotation 2s linear infinite;
}

@keyframes rotation {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 主要内容区域 */
.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex: 1;
}

.stat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value-wrapper {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  transition: color 0.3s ease;
}

.stat-suffix {
  font-size: 16px;
  font-weight: 500;
  color: #64748b;
}

.stat-title {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin-top: 4px;
}

/* 趋势指示器 */
.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  font-weight: 500;
}

.trend-icon {
  font-size: 14px;
}

.trend-value {
  font-weight: 600;
}

.trend-label {
  color: #94a3b8;
}

.stat-trend.trend-up {
  color: #10b981;
}

.stat-trend.trend-down {
  color: #f59e0b;
}

.stat-trend.trend-flat {
  color: #64748b;
}

/* 图标区域 */
.stat-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

/* 状态指示器 */
.status-indicator {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.status-processing .status-dot {
  background-color: #f59e0b;
}

.status-indicator.status-success .status-dot {
  background-color: #10b981;
}

.status-indicator.status-warning .status-dot {
  background-color: #f59e0b;
}

.status-indicator.status-error .status-dot {
  background-color: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 底部信息 */
.stat-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.stat-description {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.4;
}

/* 迷你图表 */
.stat-chart {
  margin-top: 12px;
  height: 40px;
}

.mini-chart {
  width: 100%;
  height: 100%;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.stat-card:hover .mini-chart {
  opacity: 1;
}

/* 悬浮效果 */
.hover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 12px;
  z-index: 1;
}

/* 状态主题色 */
.stat-card.status-processing .stat-card-inner {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.stat-card.status-success .stat-card-inner {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.stat-card.status-warning .stat-card-inner {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fed7aa 100%);
}

.stat-card.status-error .stat-card-inner {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .stat-card {
    height: 100px;
  }

  .stat-card-inner {
    padding: 16px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-title {
    font-size: 13px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-trend {
    margin-top: 4px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .stat-card-inner {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-color: #475569;
  }

  .stat-title {
    color: #94a3b8;
  }

  .stat-description {
    color: #64748b;
  }

  .trend-label {
    color: #64748b;
  }

  .stat-footer {
    border-top-color: #475569;
  }
}

/* 特殊动画效果 */
.stat-card.clickable:active {
  transform: translateY(-2px) scale(0.98);
}

.stat-value {
  background: linear-gradient(135deg, currentColor 0%, currentColor 100%);
  background-clip: text;
  -webkit-background-clip: text;
}

/* 数值跳动动画 */
@keyframes countUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.stat-value {
  animation: countUp 0.6s ease-out;
}

/* 图标旋转动画（处理中状态） */
.status-processing .stat-icon {
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}
</style>
