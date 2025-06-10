<template>
  <div class="task-statistics-page">
    <!-- 页面头部 -->
    <PageHeader
      title="任务统计分析"
      content="全面了解数据导入任务的执行情况，包括完成率、耗时分析、失败原因分布等关键指标"
    />

    <!-- 时间范围选择 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标展示 -->
    <el-row :gutter="20" class="metric-cards">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon" style="background-color: #e6f2ff;">
              <el-icon :size="24" color="#409eff"><DataAnalysis /></el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">{{ metrics.totalTasks }}</div>
              <div class="metric-label">任务总数</div>
              <div class="metric-trend">
                <span class="trend-text">环比</span>
                <span class="trend-value" :class="getTrendClass(metrics.taskGrowth)">
                  {{ formatTrend(metrics.taskGrowth) }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon" style="background-color: #e6f9e6;">
              <el-icon :size="24" color="#67c23a"><CircleCheck /></el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">{{ metrics.successRate }}%</div>
              <div class="metric-label">成功率</div>
              <div class="metric-trend">
                <span class="trend-text">较上期</span>
                <span class="trend-value" :class="getTrendClass(metrics.successRateTrend)">
                  {{ formatTrend(metrics.successRateTrend, true) }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon" style="background-color: #fff4e6;">
              <el-icon :size="24" color="#e6a23c"><Clock /></el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">{{ formatDuration(metrics.avgDuration) }}</div>
              <div class="metric-label">平均耗时</div>
              <div class="metric-trend">
                <span class="trend-text">效率</span>
                <span class="trend-value" :class="getTrendClass(-metrics.durationTrend)">
                  {{ formatTrend(-metrics.durationTrend) }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon" style="background-color: #fef0f0;">
              <el-icon :size="24" color="#f56c6c"><WarningFilled /></el-icon>
            </div>
            <div class="metric-data">
              <div class="metric-value">{{ metrics.failureCount }}</div>
              <div class="metric-label">失败任务</div>
              <div class="metric-trend">
                <span class="trend-text">失败率</span>
                <span class="trend-value danger">
                  {{ (metrics.failureRate || 0).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 任务完成趋势 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="chart-header">
              <span class="chart-title">任务完成趋势</span>
              <el-radio-group v-model="trendPeriod" size="small" @change="updateTrendChart">
                <el-radio-button label="day">按天</el-radio-button>
                <el-radio-button label="week">按周</el-radio-button>
                <el-radio-button label="month">按月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div id="trendChart" style="height: 350px"></div>
        </el-card>
      </el-col>

      <!-- 任务状态分布 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span class="chart-title">任务状态分布</span>
          </template>
          <div id="statusChart" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 失败原因分析 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span class="chart-title">失败原因TOP10</span>
          </template>
          <div id="failureChart" style="height: 350px"></div>
        </el-card>
      </el-col>

      <!-- 耗时分布 -->
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span class="chart-title">任务耗时分布</span>
          </template>
          <div id="durationChart" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="chart-title">任务明细数据</span>
          <el-button type="primary" link @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </template>

      <el-table
        :data="tableData"
        stripe
        border
        style="width: 100%"
        height="400"
      >
        <el-table-column prop="date" label="日期" width="120" fixed="left" />
        <el-table-column prop="totalTasks" label="任务总数" width="100" align="center" />
        <el-table-column prop="successTasks" label="成功任务" width="100" align="center">
          <template #default="{ row }">
            <span class="success-text">{{ row.successTasks }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failedTasks" label="失败任务" width="100" align="center">
          <template #default="{ row }">
            <span class="danger-text">{{ row.failedTasks }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="partialTasks" label="部分成功" width="100" align="center">
          <template #default="{ row }">
            <span class="warning-text">{{ row.partialTasks }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="successRate" label="成功率" width="100" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.successRate"
              :stroke-width="6"
              :status="row.successRate >= 90 ? 'success' : row.successRate < 70 ? 'exception' : ''"
            />
          </template>
        </el-table-column>
        <el-table-column prop="avgDuration" label="平均耗时" width="120" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.avgDuration) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalRecords" label="处理记录数" width="120" align="right">
          <template #default="{ row }">
            {{ row.totalRecords.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="avgRecordsPerTask" label="平均记录数/任务" width="140" align="right">
          <template #default="{ row }">
            {{ row.avgRecordsPerTask.toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  DataAnalysis,
  CircleCheck,
  Clock,
  WarningFilled,
  Download
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/PageHeader/index.vue'
import { DrugStatisticsApi } from '@/api/drug/statistics'

/** 页面名称 */
defineOptions({ name: 'TaskStatistics' })

// 响应式数据
const dateRange = ref([])
const trendPeriod = ref('day')

const metrics = reactive({
  totalTasks: 0,
  taskGrowth: 0,
  successRate: 0,
  successRateTrend: 0,
  avgDuration: 0,
  durationTrend: 0,
  failureCount: 0,
  failureRate: 0
})

const tableData = ref([])

// 图表实例
let trendChart = null
let statusChart = null
let failureChart = null
let durationChart = null

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  },
  {
    text: '最近一月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    }
  },
  {
    text: '最近三月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    }
  }
]

// 生命周期
onMounted(() => {
  initDateRange()
  initCharts()
  loadData()
})

onUnmounted(() => {
  disposeCharts()
})

// 方法
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
  dateRange.value = [formatDate(start), formatDate(end)]
}

const initCharts = () => {
  trendChart = echarts.init(document.getElementById('trendChart'))
  statusChart = echarts.init(document.getElementById('statusChart'))
  failureChart = echarts.init(document.getElementById('failureChart'))
  durationChart = echarts.init(document.getElementById('durationChart'))

  window.addEventListener('resize', handleResize)
}

const disposeCharts = () => {
  window.removeEventListener('resize', handleResize)

  ;[trendChart, statusChart, failureChart, durationChart].forEach(chart => {
    if (chart) {
      chart.dispose()
    }
  })
}

const handleResize = () => {
  ;[trendChart, statusChart, failureChart, durationChart].forEach(chart => {
    if (chart) {
      chart.resize()
    }
  })
}

const loadData = async () => {
  try {
    const [startDate, endDate] = dateRange.value

    // 加载指标数据
    const metricsData = await DrugStatisticsApi.getTaskMetrics({ startDate, endDate })
    Object.assign(metrics, metricsData)

    // 加载图表数据
    const [trendData, statusData, failureData, durationData, detailData] = await Promise.all([
      DrugStatisticsApi.getTaskTrend({ startDate, endDate, period: trendPeriod.value }),
      DrugStatisticsApi.getTaskStatusDistribution({ startDate, endDate }),
      DrugStatisticsApi.getFailureReasons({ startDate, endDate, limit: 10 }),
      DrugStatisticsApi.getDurationDistribution({ startDate, endDate }),
      DrugStatisticsApi.getTaskDetails({ startDate, endDate })
    ])

    updateTrendChart(trendData)
    updateStatusChart(statusData)
    updateFailureChart(failureData)
    updateDurationChart(durationData)
    tableData.value = detailData

  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error('加载统计数据失败:', error)
  }
}

const updateTrendChart = async (data?: any) => {
  if (!data) {
    const [startDate, endDate] = dateRange.value
    data = await DrugStatisticsApi.getTaskTrend({
      startDate,
      endDate,
      period: trendPeriod.value
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['任务总数', '成功任务', '失败任务']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '任务总数',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#409eff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: data.total
      },
      {
        name: '成功任务',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#67c23a'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: data.success
      },
      {
        name: '失败任务',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#f56c6c'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.1)' }
          ])
        },
        emphasis: {
          focus: 'series'
        },
        data: data.failed
      }
    ]
  }

  trendChart.setOption(option)
}

const updateStatusChart = (data: any) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      bottom: '0%',
      left: 'center'
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: data.completed, name: '已完成', itemStyle: { color: '#67c23a' } },
          { value: data.failed, name: '失败', itemStyle: { color: '#f56c6c' } },
          { value: data.partialSuccess, name: '部分成功', itemStyle: { color: '#e6a23c' } },
          { value: data.processing, name: '处理中', itemStyle: { color: '#409eff' } },
          { value: data.cancelled, name: '已取消', itemStyle: { color: '#909399' } }
        ]
      }
    ]
  }

  statusChart.setOption(option)
}

const updateFailureChart = (data: any) => {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: data.reasons.map(item => item.reason)
    },
    series: [
      {
        name: '失败次数',
        type: 'bar',
        data: data.reasons.map(item => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#f56c6c' },
            { offset: 1, color: '#fbc4c4' }
          ])
        }
      }
    ]
  }

  failureChart.setOption(option)
}

const updateDurationChart = (data: any) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '耗时分布',
        type: 'pie',
        radius: '50%',
        data: [
          { value: data.lessThan1Min, name: '小于1分钟', itemStyle: { color: '#67c23a' } },
          { value: data.between1And5Min, name: '1-5分钟', itemStyle: { color: '#409eff' } },
          { value: data.between5And10Min, name: '5-10分钟', itemStyle: { color: '#e6a23c' } },
          { value: data.moreThan10Min, name: '大于10分钟', itemStyle: { color: '#f56c6c' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  durationChart.setOption(option)
}

const handleDateChange = () => {
  loadData()
}

const refreshData = () => {
  ElMessage.success('数据刷新中...')
  loadData()
}

const exportData = async () => {
  try {
    const [startDate, endDate] = dateRange.value
    await DrugStatisticsApi.exportTaskStatistics({ startDate, endDate })
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 工具函数
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDuration = (seconds: number): string => {
  if (!seconds) return '0秒'
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}

const formatTrend = (value: number, isPercentage = false): string => {
  const sign = value > 0 ? '+' : ''
  const unit = isPercentage ? 'pp' : '%'
  return `${sign}${value.toFixed(1)}${unit}`
}

const getTrendClass = (value: number): string => {
  if (value > 0) return 'trend-up'
  if (value < 0) return 'trend-down'
  return 'trend-flat'
}
</script>

<style scoped>
.task-statistics-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.metric-cards {
  margin-bottom: 20px;
}

.metric-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.metric-data {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.trend-text {
  color: #909399;
}

.trend-value {
  font-weight: 500;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-flat {
  color: #909399;
}

.trend-value.danger {
  color: #f56c6c;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  height: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.success-text {
  color: #67c23a;
  font-weight: 500;
}

.danger-text {
  color: #f56c6c;
  font-weight: 500;
}

.warning-text {
  color: #e6a23c;
  font-weight: 500;
}

:deep(.el-card__body) {
  padding: 0;
}

.metric-card :deep(.el-card__body) {
  padding: 0;
}

.chart-card :deep(.el-card__body) {
  padding: 20px;
}

.table-card :deep(.el-card__body) {
  padding: 20px;
}
</style>
