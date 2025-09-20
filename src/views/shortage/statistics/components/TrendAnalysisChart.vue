<template>
  <ContentWrap
    title="各类药品使用量变化趋势"
    message="展示各类药品在过去12周的使用量变化趋势，帮助掌握药品需求的季节性变化规律"
    headerIcon="ep:data-line"
    headerIconColor="#67c23a"
    class="chart-card"
  >
    <template #header>
      <el-radio-group v-model="displayType" size="small" class="ml-auto">
        <el-radio-button label="line">折线图</el-radio-button>
        <el-radio-button label="area">面积图</el-radio-button>
      </el-radio-group>
    </template>
    <div ref="chartRef" class="chart-container" v-loading="loading"></div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { StatisticsApi, type TrendAnalysisVO } from '@/api/shortage/statistics'
import { ContentWrap } from '@/components/ContentWrap'

const props = defineProps<{
  zoneId?: number | null
  startWeek?: string
  endWeek?: string
  areaCode?: string | null
  orgIds?: number[]
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
  // 如果必要参数为空，不执行请求
  if (!props.endWeek) {
    console.log('等待报告周期参数')
    return
  }

  loading.value = true
  try {
    const data = await StatisticsApi.getTrendAnalysis({
      zoneId: props.zoneId,
      startWeek: props.startWeek,
      endWeek: props.endWeek,
      areaCode: props.areaCode,
      orgIds: props.orgIds
    })

    chartData = data
    await nextTick()
    renderChart(data)
    emit('loaded')
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    // 错误时清空数据
    chartData = []
    await nextTick()
    renderChart([])
  } finally {
    loading.value = false
  }
}

const renderChart = (data?: TrendAnalysisVO[]) => {
  if (!chartRef.value) return

  // 使用传入的数据，如果没有传入则使用缓存的数据
  const currentData = data ?? chartData

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 如果没有数据，显示空图表
  if (!currentData.length) {
    chartInstance.clear()
    const option: EChartsOption = {
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
        data: [],
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
        data: [],
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: '使用量(万)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: []
    }
    chartInstance.setOption(option)
    return
  }

  // 获取所有周期
  const allWeeks = [...new Set(
    currentData.flatMap(item =>
      item.dataPoints.map(point => point.week)
    )
  )].sort()

  // 配色方案
  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#d87a80'
  ]

  // 构建系列数据
  const series = currentData.map((item, index) => ({
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
      data: currentData.map(item => item.drugCategory),
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

watch(() => [props.zoneId, props.startWeek, props.endWeek, props.areaCode, props.orgIds], () => {
  fetchData()
})

onMounted(() => {
  // TrendAnalysisChart 组件初始化时不自动加载数据
  // 等待父组件传递完整参数后由 watch 触发加载
})

onBeforeUnmount(() => {
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style lang="scss" scoped>
.chart-card {
  :deep(.el-card__body) {
    padding: 16px !important;
  }
}

.chart-container {
  height: 400px;
  width: 100%;
}
</style>
