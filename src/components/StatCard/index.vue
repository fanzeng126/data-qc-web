<template>
  <el-card class="stat-card" :class="{ 'is-loading': loading }">
    <div class="stat-content">
      <!-- 卡片头部 -->
      <div class="stat-header">
        <div class="stat-info">
          <div class="stat-title">{{ title }}</div>
          <div class="stat-description" v-if="description">{{ description }}</div>
        </div>
        <div class="stat-icon" :style="{ backgroundColor: color }">
          <el-icon :size="20">
            <component :is="iconComponent" />
          </el-icon>
        </div>
      </div>

      <!-- 数值显示 -->
      <div class="stat-value-section">
        <div class="stat-value">
          <span class="value">{{ loading ? '-' : formattedValue }}</span>
          <span class="suffix" v-if="suffix">{{ suffix }}</span>
        </div>

        <!-- 趋势显示 -->
        <div class="stat-trend" v-if="trend !== undefined && !loading">
          <el-icon :class="trendClass" :size="12">
            <ArrowUp v-if="trend > 0" />
            <ArrowDown v-if="trend < 0" />
            <Minus v-if="trend === 0" />
          </el-icon>
          <span :class="trendClass">{{ Math.abs(trend) }}%</span>
        </div>
      </div>

      <!-- 额外信息 -->
      <div class="stat-footer" v-if="rate !== undefined || footerText">
        <span v-if="rate !== undefined" class="rate-text"> 占比: {{ rate }}% </span>
        <span v-if="footerText" class="footer-text">
          {{ footerText }}
        </span>
      </div>

      <!-- 加载状态 -->
      <div class="loading-overlay" v-if="loading">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, Minus, Loading } from '@element-plus/icons-vue'
import * as Icons from '@element-plus/icons-vue'

interface Props {
  title: string // 卡片标题
  value: number | string // 统计值
  suffix?: string // 后缀（如%、条、个等）
  icon: string // 图标名称
  color?: string // 主题色
  trend?: number // 趋势（正数上升，负数下降）
  rate?: number // 占比
  description?: string // 描述信息
  footerText?: string // 底部文本
  loading?: boolean // 加载状态
}

const props = withDefaults(defineProps<Props>(), {
  color: '#409eff',
  loading: false
})

// 图标组件
const iconComponent = computed(() => {
  return Icons[props.icon as keyof typeof Icons] || Icons.Document
})

// 格式化显示值
const formattedValue = computed(() => {
  if (typeof props.value === 'string') {
    return props.value
  }

  // 数字格式化：超过万的显示为万，超过亿的显示为亿
  if (props.value >= 100000000) {
    return (props.value / 100000000).toFixed(1) + '亿'
  } else if (props.value >= 10000) {
    return (props.value / 10000).toFixed(1) + '万'
  } else {
    return props.value.toLocaleString()
  }
})

// 趋势样式类
const trendClass = computed(() => {
  if (props.trend === undefined) return ''

  return {
    'trend-up': props.trend > 0,
    'trend-down': props.trend < 0,
    'trend-stable': props.trend === 0
  }
})
</script>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  border: none;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-loading {
    pointer-events: none;
  }

  :deep(.el-card__body) {
    padding: 12px;
  }
}

.stat-content {
  position: relative;
  min-height: 70px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 13px;
  color: #666666;
  font-weight: 500;
  margin-bottom: 2px;
  line-height: 1.2;
}

.stat-description {
  font-size: 11px;
  color: #999999;
  line-height: 1.2;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.9;
  flex-shrink: 0;
}

.stat-value-section {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.stat-value {
  display: flex;
  align-items: baseline;

  .value {
    font-size: 22px;
    font-weight: 600;
    color: #303133;
    line-height: 1;
  }

  .suffix {
    font-size: 13px;
    color: #606266;
    margin-left: 3px;
    font-weight: 500;
  }
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 1px;
  font-size: 11px;
  font-weight: 500;

  &.trend-up {
    color: #67c23a;
  }

  &.trend-down {
    color: #f56c6c;
  }

  &.trend-stable {
    color: #909399;
  }
}

.stat-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #909399;
}

.rate-text {
  font-weight: 500;
}

.footer-text {
  color: #606266;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;

  .is-loading {
    font-size: 20px;
    color: #409eff;
    animation: rotating 2s linear infinite;
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stat-card {
    margin-bottom: 8px;

    :deep(.el-card__body) {
      padding: 10px;
    }
  }

  .stat-header {
    margin-bottom: 6px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
  }

  .stat-value .value {
    font-size: 20px;
  }

  .stat-value .suffix {
    font-size: 12px;
  }
}

/* 暗黑模式适配 */
.dark .stat-card {
  background-color: #1d1e1f;
  border-color: #414243;

  .stat-title {
    color: #cccccc;
  }

  .stat-description {
    color: #999999;
  }

  .stat-value .value {
    color: #ffffff;
  }

  .stat-value .suffix {
    color: #cccccc;
  }

  .stat-footer {
    color: #999999;
  }
}
</style>
