<template>
  <ContentWrap
    title="药品库存可用周数"
    message="分析各类药品的库存可用周数，结合医院库存和企业库存，评估药品供应保障能力"
    headerIcon="ep:calendar"
    headerIconColor="#409eff"
    class="chart-card"
  >
    <template #header>
      <el-tag size="small" class="ml-auto">
        {{ reportWeek }}
      </el-tag>
    </template>
    <div ref="chartRef" class="chart-container" v-loading="loading"></div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { StatisticsApi, type StockWeeksStatisticsVO } from '@/api/shortage/statistics'
import { ContentWrap } from '@/components/ContentWrap'

const props = defineProps<{
  zoneId?: number | null
  reportWeek?: string
  areaCode?: string | null
  orgIds?: number[]
}>()

const emit = defineEmits<{
  loaded: []
}>()

const chartRef = ref<HTMLDivElement>()
const loading = ref(false)
let chartInstance: echarts.ECharts | null = null

const fetchData = async () => {
  // 如果必要参数为空，不执行请求
  if (!props.reportWeek) {
    console.log('等待报告周期参数')
    return
  }

  loading.value = true
  try {
    const data = await StatisticsApi.getStockWeeks({
      zoneId: props.zoneId,
      reportWeek: props.reportWeek,
      areaCode: props.areaCode,
      orgIds: props.orgIds
    })

    await nextTick()
    renderChart(data)
    emit('loaded')
  } catch (error) {
    console.error('获取库存周数数据失败:', error)
  } finally {
    loading.value = false
  }
}

const renderChart = (data: StockWeeksStatisticsVO[]) => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const categories = data.map(item => item.drugCategory)
  const hospitalData = data.map(item => item.hospitalStock / 10000) // 转换为万
  const enterpriseData = data.map(item => item.enterpriseStock / 10000)
  const weeksData = data.map(item => item.availableWeeks)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const category = params[0].name
        let html = `<div style="font-weight: bold">${category}</div>`
        params.forEach((param: any) => {
          const value = param.seriesName.includes('可用周数')
            ? param.value + '周'
            : param.value + '万'
          html += `<div>${param.marker} ${param.seriesName}: ${value}</div>`
        })
        return html
      }
    },
    legend: {
      data: ['医疗机构库存', '储备企业库存', '可用周数'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '10%',
      top: '10%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 11
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '库存量(万)',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#5470c6'
          }
        }
      },
      {
        type: 'value',
        name: '可用周数',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#91cc75'
          }
        }
      }
    ],
    series: [
      {
        name: '医疗机构库存',
        type: 'bar',
        stack: 'total',
        data: hospitalData,
        itemStyle: {
          color: '#5470c6'
        },
        barWidth: '40%'
      },
      {
        name: '储备企业库存',
        type: 'bar',
        stack: 'total',
        data: enterpriseData,
        itemStyle: {
          color: '#fac858'
        }
      },
      {
        name: '可用周数',
        type: 'line',
        yAxisIndex: 1,
        data: weeksData,
        itemStyle: {
          color: '#91cc75'
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }

  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

watch(() => [props.zoneId, props.reportWeek, props.areaCode, props.orgIds], () => {
  fetchData()
})

onMounted(() => {
  // StockWeeksChart 组件初始化时不自动加载数据
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