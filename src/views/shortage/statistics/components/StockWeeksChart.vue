<template>
  <div class="stock-weeks-chart">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <Icon icon="ep:data-analysis" />
            药品库存可用周数
          </span>
          <span class="subtitle">{{ reportWeek }}</span>
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
import { StatisticsApi, type StockWeeksStatisticsVO } from '@/api/shortage/statistics'

const props = defineProps<{
  zoneId?: number | null
  reportWeek?: string
}>()

const emit = defineEmits<{
  loaded: []
}>()

const chartRef = ref<HTMLDivElement>()
const loading = ref(false)
let chartInstance: echarts.ECharts | null = null

const fetchData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getStockWeeks({
      zoneId: props.zoneId,
      reportWeek: props.reportWeek
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

watch(() => [props.zoneId, props.reportWeek], () => {
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
.stock-weeks-chart {
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

    .subtitle {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }
  }

  .chart-container {
    height: 350px;
    width: 100%;
  }
}
</style>