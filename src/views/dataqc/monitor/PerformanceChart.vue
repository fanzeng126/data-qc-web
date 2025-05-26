<template>
  <div class="performance-chart" v-loading="loading">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="系统资源" name="resource">
        <div ref="resourceChart" class="chart-container"></div>
      </el-tab-pane>
      <el-tab-pane label="任务执行" name="task">
        <div ref="taskChart" class="chart-container"></div>
      </el-tab-pane>
      <el-tab-pane label="数据吞吐" name="throughput">
        <div ref="throughputChart" class="chart-container"></div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import { debounce } from 'lodash-es'

defineOptions({ name: 'PerformanceChart' })

// 定义数据类型接口
interface PerformanceDataItem {
  time?: string
  cpuUsage?: number
  memoryUsage?: number
  taskCount?: number
  successRate?: number
  dataVolume?: number
  processSpeed?: number
}

interface SystemMetrics {
  cpuUsage?: number
  memoryUsage?: number
  freePhysicalMemory?: number
  systemCpuUsage?: number
  memoryTotal?: number
}

const props = defineProps<{
  data: PerformanceDataItem[] | SystemMetrics
  loading: boolean
}>()

// 响应式数据
const activeTab = ref('resource')
const resourceChart = ref<HTMLDivElement>()
const taskChart = ref<HTMLDivElement>()
const throughputChart = ref<HTMLDivElement>()

// 图表实例管理
const chartInstances = reactive({
  resource: null as echarts.ECharts | null,
  task: null as echarts.ECharts | null,
  throughput: null as echarts.ECharts | null
})

// 数据适配器 - 将不同格式的数据统一处理
const adaptedData = computed(() => {
  if (!props.data) return []

  // 如果是数组，直接返回
  if (Array.isArray(props.data)) {
    return props.data as PerformanceDataItem[]
  }

  // 如果是系统指标对象，转换为时间序列格式
  const metricsData = props.data as SystemMetrics
  const now = new Date()
  const timePoints = []

  // 生成最近24个小时的模拟时间点
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    timePoints.push({
      time: time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      cpuUsage: metricsData.cpuUsage || 0,
      memoryUsage: metricsData.memoryUsage || 0,
      taskCount: Math.floor(Math.random() * 100) + 50, // 模拟数据
      successRate: Math.floor(Math.random() * 20) + 80, // 模拟数据
      dataVolume: Math.floor(Math.random() * 1000000) + 500000, // 模拟数据
      processSpeed: Math.floor(Math.random() * 50000) + 10000 // 模拟数据
    })
  }

  return timePoints
})

/** 安全的图表初始化基础方法 */
const safeInitChart = (
  chartRef: Ref<HTMLDivElement | undefined>,
  chartType: keyof typeof chartInstances,
  optionBuilder: () => any
) => {
  if (!chartRef.value) return

  // 销毁现有实例
  if (chartInstances[chartType]) {
    chartInstances[chartType]!.dispose()
    chartInstances[chartType] = null
  }

  try {
    // 创建新实例
    chartInstances[chartType] = echarts.init(chartRef.value)
    const option = optionBuilder()
    chartInstances[chartType]!.setOption(option, true) // 使用notMerge: true 确保完全替换
  } catch (error) {
    console.error(`初始化${chartType}图表失败:`, error)
  }
}

/** 初始化资源监控图表 */
const initResourceChart = () => {
  safeInitChart(resourceChart, 'resource', () => ({
    title: {
      text: '系统资源使用趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
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
      data: ['CPU使用率', '内存使用率'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: adaptedData.value.map(item => item.time || '')
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: 'CPU使用率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#1890ff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(24, 144, 255, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(24, 144, 255, 0.05)'
            }
          ])
        },
        data: adaptedData.value.map(item => item.cpuUsage || 0)
      },
      {
        name: '内存使用率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#52c41a'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(82, 196, 26, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(82, 196, 26, 0.05)'
            }
          ])
        },
        data: adaptedData.value.map(item => item.memoryUsage || 0)
      }
    ]
  }))
}

/** 初始化任务执行图表 */
const initTaskChart = () => {
  safeInitChart(taskChart, 'task', () => ({
    title: {
      text: '任务执行情况',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['执行任务数', '成功率'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: adaptedData.value.map(item => item.time || '')
    },
    yAxis: [
      {
        type: 'value',
        name: '任务数',
        position: 'left',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '成功率',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '执行任务数',
        type: 'bar',
        itemStyle: {
          color: '#722ed1'
        },
        data: adaptedData.value.map(item => item.taskCount || 0)
      },
      {
        name: '成功率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        itemStyle: {
          color: '#faad14'
        },
        data: adaptedData.value.map(item => item.successRate || 0)
      }
    ]
  }))
}

/** 初始化数据吞吐图表 */
const initThroughputChart = () => {
  safeInitChart(throughputChart, 'throughput', () => ({
    title: {
      text: '数据吞吐量',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params: any) {
        const time = params[0].axisValue
        let html = `<div>${time}</div>`
        params.forEach((param: any) => {
          html += `<div>${param.marker} ${param.seriesName}: ${formatDataSize(param.value)}</div>`
        })
        return html
      }
    },
    legend: {
      data: ['导入数据量', '处理速度'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: adaptedData.value.map(item => item.time || '')
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatDataSize(value)
      }
    },
    series: [
      {
        name: '导入数据量',
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#eb2f96'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(235, 47, 150, 0.3)'
            },
            {
              offset: 1,
              color: 'rgba(235, 47, 150, 0.05)'
            }
          ])
        },
        data: adaptedData.value.map(item => item.dataVolume || 0)
      },
      {
        name: '处理速度',
        type: 'line',
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#13c2c2'
        },
        data: adaptedData.value.map(item => item.processSpeed || 0)
      }
    ]
  }))
}

/** 格式化数据大小 */
const formatDataSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/** 处理标签页切换 */
const handleTabChange = (name: string) => {
  nextTick(() => {
    switch (name) {
      case 'resource':
        initResourceChart()
        break
      case 'task':
        initTaskChart()
        break
      case 'throughput':
        initThroughputChart()
        break
    }
  })
}

/** 调整图表大小 */
const resizeCharts = debounce(() => {
  Object.values(chartInstances).forEach(instance => {
    instance?.resize()
  })
}, 300)

/** 销毁所有图表实例 */
const disposeAllCharts = () => {
  Object.keys(chartInstances).forEach(key => {
    const chartKey = key as keyof typeof chartInstances
    if (chartInstances[chartKey]) {
      chartInstances[chartKey]!.dispose()
      chartInstances[chartKey] = null
    }
  })
}

/** 监听数据变化更新图表 */
watch(() => props.data, () => {
  if (!props.data) return

  // 延迟执行，避免数据更新过于频繁
  nextTick(() => {
    // 只更新当前显示的图表，避免不必要的渲染
    switch (activeTab.value) {
      case 'resource':
        initResourceChart()
        break
      case 'task':
        initTaskChart()
        break
      case 'throughput':
        initThroughputChart()
        break
    }
  })
}, { deep: true })

/** 初始化 */
onMounted(() => {
  // 初始化第一个图表
  nextTick(() => {
    initResourceChart()
  })

  // 监听窗口大小变化
  window.addEventListener('resize', resizeCharts)
})

/** 清理 */
onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  disposeAllCharts()
})
</script>

<style scoped>
.performance-chart {
  width: 100%;
  min-height: 400px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

:deep(.el-tabs__header) {
  margin-bottom: 16px;
}

:deep(.el-tabs__nav-wrap) {
  padding: 0 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

:deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-tabs__item.is-active) {
  color: #1890ff;
}
</style>
