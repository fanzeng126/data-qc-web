<template>
  <div class="region-statistics-chart">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <Icon icon="ep:map-location" />
            各地区药品使用量分布
          </span>
          <el-select v-model="selectedCategory" size="small" style="width: 150px">
            <el-option label="全部药品" value="" />
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
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
import { StatisticsApi, type RegionStatisticsVO } from '@/api/shortage/statistics'

const props = defineProps<{
  zoneId?: number | null
  reportWeek?: string
}>()

const emit = defineEmits<{
  loaded: []
}>()

const chartRef = ref<HTMLDivElement>()
const loading = ref(false)
const selectedCategory = ref('')
const rawData = ref<RegionStatisticsVO[]>([])
let chartInstance: echarts.ECharts | null = null

const categories = computed(() => {
  return [...new Set(rawData.value.map(item => item.drugCategory))]
})

const filteredData = computed(() => {
  if (!selectedCategory.value) {
    // 聚合所有药品的数据
    const aggregated = new Map<string, RegionStatisticsVO>()
    rawData.value.forEach(item => {
      const existing = aggregated.get(item.regionName)
      if (existing) {
        existing.usageAmount += item.usageAmount
        existing.stockAmount += item.stockAmount
      } else {
        aggregated.set(item.regionName, { ...item })
      }
    })
    return Array.from(aggregated.values())
  } else {
    return rawData.value.filter(item => item.drugCategory === selectedCategory.value)
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const data = await StatisticsApi.getRegionStatistics({
      zoneId: props.zoneId,
      reportWeek: props.reportWeek
    })

    rawData.value = data
    await nextTick()
    renderChart()
    emit('loaded')
  } catch (error) {
    console.error('获取地域统计数据失败:', error)
  } finally {
    loading.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const data = filteredData.value
  const regions = [...new Set(data.map(item => item.regionName))]

  // 按地区聚合数据
  const usageByRegion = regions.map(region => {
    const regionData = data.filter(item => item.regionName === region)
    return {
      name: region,
      usage: regionData.reduce((sum, item) => sum + item.usageAmount, 0) / 10000,
      stock: regionData.reduce((sum, item) => sum + item.stockAmount, 0) / 10000,
      orgs: regionData[0]?.reportingOrganizations || 0
    }
  })

  // 按使用量排序
  usageByRegion.sort((a, b) => b.usage - a.usage)

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const region = params[0].name
        const usage = params[0].value
        const stock = params[1]?.value || 0
        return `
          <div style="font-weight: bold">${region}</div>
          <div>使用量: ${usage.toFixed(1)}万</div>
          <div>库存量: ${stock.toFixed(1)}万</div>
        `
      }
    },
    legend: {
      data: ['使用量', '库存量'],
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
      data: usageByRegion.map(item => item.name),
      axisLabel: {
        rotate: 45,
        interval: 0,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '数量(万)',
      axisLabel: {
        formatter: '{value}'
      }
    },
    series: [
      {
        name: '使用量',
        type: 'bar',
        data: usageByRegion.map(item => item.usage),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#91ccff' }
          ])
        },
        barWidth: '30%'
      },
      {
        name: '库存量',
        type: 'bar',
        data: usageByRegion.map(item => item.stock),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#b3e19d' }
          ])
        },
        barWidth: '30%'
      }
    ]
  }

  chartInstance.setOption(option)

  // 响应式调整
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
}

watch([selectedCategory, filteredData], () => {
  renderChart()
})

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
.region-statistics-chart {
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