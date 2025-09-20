<template>
  <ContentWrap
    title="药品使用量环比情况"
    message="对比各类药品本期与上期的使用量变化，识别用药需求的增减趋势，支持动态调整采购策略"
    headerIcon="ep:sort"
    headerIconColor="#e6a23c"
    class="chart-card"
  >
    <template #header>
      <el-tag type="info" size="small" class="ml-auto">
        对比上周: {{ lastWeek }}
      </el-tag>
    </template>
    <div ref="chartRef" class="chart-container" v-loading="loading"></div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { StatisticsApi, type UsageChangeVO } from '@/api/shortage/statistics'
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
  // 如果必要参数为空，不执行请求
  if (!props.reportWeek) {
    console.log('等待报告周期参数')
    return
  }

  loading.value = true
  try {
    const data = await StatisticsApi.getUsageChange({
      zoneId: props.zoneId,
      reportWeek: props.reportWeek,
      areaCode: props.areaCode,
      orgIds: props.orgIds
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

  // 如果没有数据，显示空状态
  if (!data || data.length === 0) {
    const option: EChartsOption = {
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: {
          text: '暂无数据',
          fontSize: 14,
          fill: '#999'
        }
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
        data: []
      },
      yAxis: [
        {
          type: 'value',
          name: '使用量(万)',
          position: 'left'
        },
        {
          type: 'value',
          name: '变化率(%)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '本周使用量',
          type: 'bar',
          data: []
        },
        {
          name: '环比变化率',
          type: 'line',
          yAxisIndex: 1,
          data: []
        }
      ]
    }
    chartInstance.setOption(option, true)
    return
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

  chartInstance.setOption(option, true)

  // 响应式调整
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

watch(() => [props.zoneId, props.reportWeek, props.areaCode, props.orgIds], () => {
  fetchData()
})

onMounted(() => {
  // UsageChangeChart 组件初始化时不自动加载数据
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