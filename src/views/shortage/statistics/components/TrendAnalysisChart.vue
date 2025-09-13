<template>
  <div class="trend-analysis-chart">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <Icon icon="ep:data-line" />
            各类药品使用量变化趋势
          </span>
          <div class="actions">
            <el-radio-group v-model="displayType" size="small">
              <el-radio-button label="line">折线图</el-radio-button>
              <el-radio-button label="area">面积图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      <div ref="chartRef" class="chart-container" v-loading="loading"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { StatisticsApi, type TrendAnalysisVO } from '@/api/shortage/statistics'

const props = defineProps<{
  zoneId?: number | null
  startWeek?: string
  endWeek?: string
}>()

const emit = defineEmits<{
  loaded: []
}>()

const chartRef = ref<HTMLDivElement>()
const loading = ref(false)
const displayType = ref<'line' | 'area'>('line')
let chartInstance: echarts.ECharts | null = null
let chartData: TrendAnalysisVO[] = []

const fetchData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getTrendAnalysis({
      zoneId: props.zoneId,
      startWeek: props.startWeek,
      endWeek: props.endWeek
    })

    chartData = data
    await nextTick()
    renderChart()
    emit('loaded')
  } catch (error) {
    console.error('获取趋势数据失败:', error)
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value || !chartData.length) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 获取所有周期
  const allWeeks = [...new Set(
    chartData.flatMap(item =>
      item.dataPoints.map(point => point.week)
    )
  )].sort()

  // 配色方案
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#d87a80'
  ]

  // 构建系列数据
  const series = chartData.map((item, index) => ({
    name: item.drugCategory,
    type: 'line' as const,
    stack: displayType.value === 'area' ? 'total' : undefined,
    areaStyle: displayType.value === 'area' ? {} : undefined,
    smooth: true,
    data: allWeeks.map(week => {
      const point = item.dataPoints.find(p => p.week === week)
      return point ? point.usage / 10000 : 0 // 转换为万
    }),
    itemStyle: {
      color: colors[index % colors.length]
    },
    emphasis: {
      focus: 'series'
    }
  }))

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params: any) => {
        let html = `<div style="font-weight: bold">${params[0].name}</div>`
        params.forEach((param: any) => {
          if (param.value > 0) {
            html += `<div>${param.marker} ${param.seriesName}: ${param.value.toFixed(1)}万</div>`
          }
        })
        return html
      }
    },
    legend: {
      data: chartData.map(item => item.drugCategory),
      type: 'scroll',
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      top: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: allWeeks,
      axisLabel: {
        rotate: 45,
        interval: Math.floor(allWeeks.length / 8) // 自动调整显示间隔
      }
    },
    yAxis: {
      type: 'value',
      name: '使用量(万)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: series
  }

  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

watch(displayType, () => {
  renderChart()
})

watch(() => [props.zoneId, props.startWeek, props.endWeek], () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style lang="scss" scoped>
.trend-analysis-chart {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .chart-container {
    height: 400px;
    width: 100%;
  }
}
</style>