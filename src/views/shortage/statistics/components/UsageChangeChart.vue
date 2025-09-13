<template>
  <div class="usage-change-chart">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <Icon icon="ep:trend-charts" />
            药品使用量环比情况
          </span>
          <el-tag type="info" size="small">
            对比上周: {{ lastWeek }}
          </el-tag>
        </div>
      </template>
      <div ref="chartRef" class="chart-container" v-loading="loading"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { StatisticsApi, type UsageChangeVO } from '@/api/shortage/statistics'

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

const lastWeek = computed(() => {
  if (!props.reportWeek) return ''
  const [year, week] = props.reportWeek.split('-')
  const weekNum = parseInt(week)
  if (weekNum > 1) {
    return `${year}-${String(weekNum - 1).padStart(2, '0')}`
  } else {
    return `${parseInt(year) - 1}-52`
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getUsageChange({
      zoneId: props.zoneId,
      reportWeek: props.reportWeek
    })

    await nextTick()
    renderChart(data)
    emit('loaded')
  } catch (error) {
    console.error('获取使用量环比数据失败:', error)
  } finally {
    loading.value = false
  }
}

const renderChart = (data: UsageChangeVO[]) => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 按变化率排序
  const sortedData = [...data].sort((a, b) => b.changeRate - a.changeRate)

  const categories = sortedData.map(item => item.drugCategory)
  const currentData = sortedData.map(item => item.currentUsage / 10000) // 转换为万
  const changeRates = sortedData.map(item => item.changeRate)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const category = params[0].name
        const current = params[0].value
        const rate = params[1]?.value || 0
        const trend = rate > 0 ? '↑' : rate < 0 ? '↓' : '-'
        const color = rate > 0 ? '#67c23a' : rate < 0 ? '#f56c6c' : '#909399'

        return `
          <div style="font-weight: bold">${category}</div>
          <div>本周使用量: ${current.toFixed(1)}万</div>
          <div>环比变化: <span style="color: ${color}">${trend} ${Math.abs(rate).toFixed(1)}%</span></div>
        `
      }
    },
    legend: {
      data: ['本周使用量', '环比变化率'],
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
        name: '使用量(万)',
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
        name: '变化率(%)',
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#91cc75'
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: '本周使用量',
        type: 'bar',
        data: currentData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#5470c6' },
            { offset: 1, color: '#91ccff' }
          ])
        },
        barWidth: '40%'
      },
      {
        name: '环比变化率',
        type: 'line',
        yAxisIndex: 1,
        data: changeRates,
        itemStyle: {
          color: (params: any) => {
            return params.value > 0 ? '#67c23a' : params.value < 0 ? '#f56c6c' : '#909399'
          }
        },
        lineStyle: {
          width: 2
        },
        symbol: 'circle',
        symbolSize: 8,
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const val = params.value
            const trend = val > 0 ? '↑' : val < 0 ? '↓' : ''
            return trend + Math.abs(val).toFixed(1) + '%'
          },
          color: 'inherit'
        }
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
.usage-change-chart {
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
    height: 350px;
    width: 100%;
  }
}
</style>