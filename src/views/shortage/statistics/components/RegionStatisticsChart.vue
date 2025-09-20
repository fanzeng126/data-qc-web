<template>
  <ContentWrap
    title="各地区药品使用量分布"
    message="按地区统计药品使用情况，发现地区间差异，为区域化供应管理和资源调配提供依据"
    headerIcon="ep:map-location"
    headerIconColor="#909399"
    class="chart-card"
  >
    <template #header>
      <el-select v-model="selectedCategory" size="small" style="width: 150px" placeholder="选择药品类别" class="ml-auto" @change="handleCategoryChange">
        <el-option label="全部药品" value="" />
        <el-option
          v-for="category in categories"
          :key="category"
          :label="category"
          :value="category"
        />
      </el-select>
    </template>
    <div ref="chartRef" class="chart-container" v-loading="loading"></div>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { StatisticsApi, type RegionStatisticsVO } from '@/api/shortage/statistics'
import { ContentWrap } from '@/components/ContentWrap'

const props = defineProps<{
  zoneId?: number | null
  reportWeek?: string
  areaCode?: string | null
  orgIds?: number[]
  drugCategories?: string[]
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
  // 优先使用父组件传递的分类数据
  if (props.drugCategories && props.drugCategories.length > 0) {
    return props.drugCategories
  }
  // 回退到从区域统计数据中提取分类
  return [...new Set(rawData.value.map(item => item.drugCategory))]
})

// 由于现在直接从后端获取对应分类的数据，不再需要前端过滤
// const filteredData = computed(() => {
//   if (!selectedCategory.value) {
//     // 聚合所有药品的数据
//     const aggregated = new Map<string, RegionStatisticsVO>()
//     rawData.value.forEach(item => {
//       const existing = aggregated.get(item.regionName)
//       if (existing) {
//         existing.usageAmount += item.usageAmount
//         existing.stockAmount += item.stockAmount
//       } else {
//         aggregated.set(item.regionName, { ...item })
//       }
//     })
//     return Array.from(aggregated.values())
//   } else {
//     return rawData.value.filter(item => item.drugCategory === selectedCategory.value)
//   }
// })

const fetchData = async () => {
  // 如果必要参数为空，不执行请求
  if (!props.reportWeek) {
    console.log('等待报告周期参数')
    return
  }

  loading.value = true
  try {
    const params = {
      zoneId: props.zoneId,
      reportWeek: props.reportWeek,
      areaCode: props.areaCode,
      orgIds: props.orgIds,
      // 如果选择了特定分类，传递给后端
      drugCategory: selectedCategory.value || undefined
    }

    const data = await StatisticsApi.getRegionStatistics(params)

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

const handleCategoryChange = () => {
  // 分类选择变化时重新获取数据
  fetchData()
}

const renderChart = () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const data = rawData.value
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

// 移除对 selectedCategory 和 filteredData 的监听，改为在选择变化时直接重新获取数据
// watch([selectedCategory, filteredData], () => {
//   renderChart()
// })

watch(() => [props.zoneId, props.reportWeek, props.areaCode, props.orgIds], () => {
  fetchData()
})

onMounted(() => {
  // RegionStatisticsChart 组件初始化时不自动加载数据
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
