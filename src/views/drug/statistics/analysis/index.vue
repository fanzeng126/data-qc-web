<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { ElCard, ElTabPane, ElTabs, ElInputNumber, ElInput, ElButton, ElRow, ElCol, ElSelect, ElOption, ElDatePicker, ElSpace, ElDivider } from 'element-plus'
import { Medicine, DataLine, OfficeBuilding, TrendCharts, CircleCheck, Filter, Calendar, MapLocation, Money, Promotion, SuccessFilled } from '@element-plus/icons-vue'
import type { ECharts } from 'echarts'
import { getAccessToken } from '@/utils/auth'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

// API 前缀
const API_PREFIX = 'http://localhost:48080/admin-api/analysis/'

// 响应式数据引用
const drugAllocationData = ref<any[]>([])
const proportionTrendData = ref<any[]>([])
const keyDrugsData = ref<any[]>([])
const basicEquipData = ref<any[]>([])
const basicUsageData = ref<any[]>([])
const basisRegionData = ref<any[]>([])
const yearOnYearData = ref<any[]>([])
const fixedBaseData = ref<any[]>([])
const cityComparisonData = ref<any[]>([])
const hospitalEfficiencyData = ref<any[]>([])

// 筛选条件
const selectedHospitals = ref<string[]>([])
const selectedTimeRange = ref<string>('')
const selectedRegion = ref<string>('')
const comparisonMode = ref<string>('none')

// 筛选选项
const hospitalOptions = ref<any[]>([])
const regionOptions = ref<any[]>([])
const timeRangeOptions = [
  { label: '近7天', value: '7' },
  { label: '近30天', value: '30' },
  { label: '近3个月', value: '90' },
  { label: '近6个月', value: '180' },
  { label: '近1年', value: '365' }
]
const comparisonOptions = [
  { label: '无对比', value: 'none' },
  { label: '同比', value: 'yoy' },
  { label: '环比', value: 'mom' }
]

// 参数输入
const baseYear = ref<number>(2023)
const domainCode = ref<string>('')
const activeTab = ref<string>('overview')
const allocationChart = ref<HTMLElement | null>(null)
const proportionChart = ref<HTMLElement | null>(null)
const keyDrugsChart = ref<HTMLElement | null>(null)
const equipChart = ref<HTMLElement | null>(null)
const usageChart = ref<HTMLElement | null>(null)
const regionChart = ref<HTMLElement | null>(null)
const yearOnYearChart = ref<HTMLElement | null>(null)
const fixedBaseChart = ref<HTMLElement | null>(null)
const cityChart = ref<HTMLElement | null>(null)
const efficiencyChart = ref<HTMLElement | null>(null)

const isChartsInitialized = ref(false)

// 统计数据计算
const statistics = computed(() => {
  const totalDrugs = drugAllocationData.value.reduce((sum, item) => sum + parseInt(item.totalDrugsConfigured || 0), 0)
  const basicDrugs = basicEquipData.value.reduce((sum, item) => sum + parseInt(item.basicDrugs || 0), 0)
  const totalHospitals = new Set(drugAllocationData.value.map(item => item.hospitalCode)).size
  const avgUsageRate = drugAllocationData.value.length > 0
    ? (drugAllocationData.value.reduce((sum, item) => sum + parseFloat(item.usageRatePercent || 0), 0) / drugAllocationData.value.length).toFixed(1)
    : 0

  return {
    totalDrugs,
    basicDrugs,
    totalHospitals,
    avgUsageRate
  }
})
let allocationEchart: ECharts | null = null
let proportionEchart: ECharts | null = null
let keyDrugsEchart: ECharts | null = null
let equipEchart: ECharts | null = null
let usageEchart: ECharts | null = null
let regionEchart: ECharts | null = null
let yearOnYearEchart: ECharts | null = null
let fixedBaseEchart: ECharts | null = null
let cityEchart: ECharts | null = null
let efficiencyEchart: ECharts | null = null

// 扩展统计数据计算
const extendedStatistics = computed(() => {
  // 基础统计
  const basicStats = statistics.value

  // 扩展统计指标
  const totalAmount = drugAllocationData.value.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0)
  const avgAmountPerHospital = basicStats.totalHospitals > 0 ? totalAmount / basicStats.totalHospitals : 0
  const basicDrugUsageRate = basicUsageData.value.length > 0
    ? (basicUsageData.value.reduce((sum, item) => sum + parseFloat(item.basicDrugAmountRate || 0), 0) / basicUsageData.value.length).toFixed(1)
    : 0
  const complianceRate = hospitalEfficiencyData.value.length > 0
    ? (hospitalEfficiencyData.value.filter(item => parseFloat(item.efficiencyScore) >= 80).length / hospitalEfficiencyData.value.length * 100).toFixed(1)
    : 0

  return {
    ...basicStats,
    totalAmount,
    avgAmountPerHospital,
    basicDrugUsageRate,
    complianceRate
  }
})

// 获取数据函数
const fetchData = async (method: string, params?: any) => {
  const url = `${API_PREFIX}${method}${params ? `?${new URLSearchParams(params)}` : ''}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + getAccessToken()
    }
  })
  const result = await response.json()
  return result.data
}

// 初始化筛选选项
const initFilterOptions = async () => {
  try {
    let params = {}
    params.orgs = selectedHospitals.value
    // 获取医院列表
    const hospitalList = await fetchData('hospitalList',params)
    hospitalOptions.value = hospitalList.map(item => ({
      label: item.organizationName,
      value: item.hospitalCode
    }))

    // 获取地区列表
    const regionList = await fetchData('regionList')
    regionOptions.value = regionList.map(item => ({
      label: item.regionName,
      value: item.domainCode
    }))
  } catch (error) {
    console.error('筛选选项加载失败:', error)
  }
}

// 应用筛选条件
const applyFilters = async () => {
  const filters = {
    hospitals: selectedHospitals.value,
    timeRange: selectedTimeRange.value,
    region: selectedRegion.value,
    comparison: comparisonMode.value
  }

  try {
    // 重新获取数据
    drugAllocationData.value = await fetchData('drugAllocationRate', filters)
    proportionTrendData.value = await fetchData('proportionTrend', filters)
    keyDrugsData.value = await fetchData('keyDrugsProportionTrend', filters)
    basicEquipData.value = await fetchData('basicDrugsEquipRate', filters)
    basicUsageData.value = await fetchData('basicDrugsUsageRate', filters)
    basisRegionData.value = await fetchData('basisDrugUsageByRegion', filters)
    yearOnYearData.value = await fetchData('drugUsageYearOnYear', filters)
    fixedBaseData.value = await fetchData('drugUsageFixedBase', { baseYear: baseYear.value })
    cityComparisonData.value = await fetchData('provincialCityComparison', { domainCode: domainCode.value })
    hospitalEfficiencyData.value = await fetchData('hospitalEfficiencyComparison')
    // 使用新的初始化方法
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    initChartsForActiveTab()
  } catch (error) {
    console.error('数据筛选失败:', error)
  }
}

// 重置筛选条件
const resetFilters = () => {
  selectedHospitals.value = []
  selectedTimeRange.value = ''
  selectedRegion.value = ''
  comparisonMode.value = 'none'
  applyFilters()
}
const initData = async () => {
  try {
    drugAllocationData.value = await fetchData('drugAllocationRate')
    proportionTrendData.value = await fetchData('proportionTrend')
    keyDrugsData.value = await fetchData('keyDrugsProportionTrend')
    basicEquipData.value = await fetchData('basicDrugsEquipRate')
    basicUsageData.value = await fetchData('basicDrugsUsageRate')
    basisRegionData.value = await fetchData('basisDrugUsageByRegion')
    yearOnYearData.value = await fetchData('drugUsageYearOnYear')
    fixedBaseData.value = await fetchData('drugUsageFixedBase', { baseYear: baseYear.value })
    cityComparisonData.value = await fetchData('provincialCityComparison', { domainCode: domainCode.value })
    hospitalEfficiencyData.value = await fetchData('hospitalEfficiencyComparison')
  } catch (error) {
    console.error('数据加载失败:', error)
  }
}

// 通用图表配置
// const getChartTheme = () => ({
//   backgroundColor: 'transparent',
//   textStyle: {
//     fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif'
//   },
//   color: ['#1890FF', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2'],
//   grid: {
//     left: '3%',
//     right: '4%',
//     bottom: '3%',
//     containLabel: true
//   }
// })
// 通用图表配置
const getChartTheme = () => ({
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif'
  },
  color: ['#1890FF', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2'],
  grid: {
    left: '8%',
    right: '8%',
    bottom: '8%',
    top: '15%',
    containLabel: true
  }
})
// 初始化图表

// 初始化其他图表
const initOtherCharts = () => {
  // 5. 基本药物使用率
  const topUsageData = basicUsageData.value.slice(0, 8)
  usageEchart = echarts.init(usageChart.value!)
  usageEchart.setOption({
    ...getChartTheme(),
    grid: {
      left: '10%',  // 增加左侧边距
      right: '10%',  // 增加右侧边距
      bottom: '10%',  // 增加底部边距
      top: '30%',
      containLabel: true
    },
    title: {
      text: '基本药物使用率对比',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8'
    },
    legend: {
      top: 30,
      textStyle: { color: '#666' }
    },
    xAxis: {
      type: 'category',
      data: topUsageData.map(item => item.organizationName),
      axisLabel: { rotate: 45, color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: {
      type: 'value',
      name: '占比(%)',
      nameTextStyle: { color: '#666' },
      axisLabel: { color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: '数量占比',
        type: 'bar',
        data: topUsageData.map(item => item.basicDrugQuantityRate),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '金额占比',
        type: 'bar',
        data: topUsageData.map(item => item.basicDrugAmountRate),
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }
    ]
  })

  // 6. 地区间基本药物使用对比
  regionEchart = echarts.init(regionChart.value!)
  regionEchart.setOption({
    ...getChartTheme(),
    title: {
      text: '地区间基本药物使用对比分析',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8'
    },
    legend: {
      top: 30,
      textStyle: { color: '#666' }
    },
    xAxis: {
      type: 'category',
      data: basisRegionData.value.map(item => item.domainCode),
      axisLabel: {
        rotate: 0,
        color: '#666',
        formatter: function(value) {
          // 显示省级代码的后两位
          return value.slice(-2)
        }
      },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '配备率/使用率(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      {
        type: 'value',
        name: '使用金额(万元)',
        nameTextStyle: { color: '#666' },
        axisLabel: {
          color: '#666',
          formatter: function(value) {
            return (value / 10000).toFixed(0)
          }
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      }
    ],
    series: [
      {
        name: '基药配备率',
        type: 'bar',
        data: basisRegionData.value.map(item => item.basicDrugEquipmentRate),
        itemStyle: {
          color: '#1890FF',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '基药金额占比',
        type: 'bar',
        data: basisRegionData.value.map(item => item.basicDrugAmountRate),
        itemStyle: {
          color: '#52C41A',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '基药使用金额',
        type: 'line',
        yAxisIndex: 1,
        data: basisRegionData.value.map(item => item.basicDrugUsageAmount),
        smooth: true,
        lineStyle: { width: 3, color: '#FAAD14' },
        symbolSize: 6,
        itemStyle: { color: '#FAAD14' }
      }
    ]
  })

  // 7. 药品使用同比分析（年同比）
  yearOnYearEchart = echarts.init(yearOnYearChart.value!)
  yearOnYearEchart.setOption({
    ...getChartTheme(),
    title: {
      text: '药品使用年同比增长率分析',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      formatter: function(params) {
        let result = `${params[0].name}<br/>`
        params.forEach(param => {
          const value = param.value
          const color = value >= 0 ? '#52C41A' : '#F5222D'
          result += `<span style="color:${color}">${param.seriesName}: ${value}%</span><br/>`
        })
        return result
      }
    },
    legend: {
      top: 30,
      textStyle: { color: '#666' }
    },
    xAxis: {
      type: 'category',
      data: yearOnYearData.value.slice(0, 10).map(item => item.organizationName),
      axisLabel: { rotate: 45, color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: {
      type: 'value',
      name: '同比增长率(%)',
      nameTextStyle: { color: '#666' },
      axisLabel: { color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: '金额同比',
        type: 'bar',
        data: yearOnYearData.value.slice(0, 10).map(item => {
          const value = parseFloat(item.amountYoyRate || 0)
          return {
            value: value,
            itemStyle: {
              color: value >= 0 ? '#52C41A' : '#F5222D',
              borderRadius: [4, 4, 0, 0]
            }
          }
        })
      },
      {
        name: '数量同比',
        type: 'line',
        data: yearOnYearData.value.slice(0, 10).map(item => parseFloat(item.quantityYoyRate || 0)),
        smooth: true,
        lineStyle: { width: 3, color: '#1890FF' },
        symbolSize: 6,
        itemStyle: { color: '#1890FF' }
      },
      {
        name: '品种数同比',
        type: 'line',
        data: yearOnYearData.value.slice(0, 10).map(item => parseFloat(item.varietiesYoyRate || 0)),
        smooth: true,
        lineStyle: { width: 3, color: '#722ED1' },
        symbolSize: 6,
        itemStyle: { color: '#722ED1' }
      }
    ]
  })

  // 8. 定基比分析（初始化，具体数据通过queryFixedBase更新）
  fixedBaseEchart = echarts.init(fixedBaseChart.value!)
  fixedBaseEchart.setOption({
    ...getChartTheme(),
    title: {
      text: `以${baseYear.value}年为基期的定基比分析`,
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      formatter: function(params) {
        let result = `${params[0].name}<br/>`
        params.forEach(param => {
          result += `${param.seriesName}: ${param.value}%<br/>`
        })
        return result
      }
    },
    legend: {
      top: 30,
      textStyle: { color: '#666' }
    },
    xAxis: {
      type: 'category',
      data: fixedBaseData.value.map(item => item.organizationName),
      axisLabel: { rotate: 45, color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: {
      type: 'value',
      name: '定基指数(%)',
      nameTextStyle: { color: '#666' },
      axisLabel: { color: '#666' },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [
      {
        name: '金额定基指数',
        type: 'bar',
        data: fixedBaseData.value.map(item => parseFloat(item.amountFixedBaseIndex || 0)),
        itemStyle: {
          color: '#1890FF',
          borderRadius: [4, 4, 0, 0]
        }
      },
      {
        name: '数量定基指数',
        type: 'line',
        data: fixedBaseData.value.map(item => parseFloat(item.quantityFixedBaseIndex || 0)),
        smooth: true,
        lineStyle: { width: 3, color: '#52C41A' },
        symbolSize: 6,
        itemStyle: { color: '#52C41A' }
      },
      {
        name: '品种数定基指数',
        type: 'line',
        data: fixedBaseData.value.map(item => parseFloat(item.varietiesFixedBaseIndex || 0)),
        smooth: true,
        lineStyle: { width: 3, color: '#FAAD14' },
        symbolSize: 6,
        itemStyle: { color: '#FAAD14' }
      }
    ]
  })

  // 9. 省内各地市对比（初始化，具体数据通过queryCityComparison更新）
  cityEchart = echarts.init(cityChart.value!)
  cityEchart.setOption({
    ...getChartTheme(),
    title: {
      text: '省内各地市药品使用对比分析',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      // formatter: function(params) {
      //   const param = params[0]
      //   const data = cityComparisonData.value.find(item => item.cityCode === param.name)
      //   if (!data) return param.name
      //
      //   return `
      //     ${param.name}<br/>
      //     医疗机构数: ${data.hospitalCount}家<br/>
      //     药品品种数: ${data.drugVarieties}种<br/>
      //     总使用金额: ¥${(param.value / 10000).toFixed(2)}万元<br/>
      //     基药使用率: ${data.basicDrugRate}%<br/>
      //     次均药品费用: ¥${data.avgAmountPerVisit}<br/>
      //     金额排名: 第${data.amountRank}名
      //   `
      // }
    },
    xAxis: {
      type: 'category',
      data: cityComparisonData.value.map(item => item.cityCode),
      axisLabel: {
        rotate: 45,
        color: '#666',
        formatter: function(value) {
          return `${value}市`
        }
      },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: {
      type: 'value',
      name: '使用金额(万元)',
      nameTextStyle: { color: '#666' },
      axisLabel: {
        color: '#666',
        formatter: function(value) {
          return (value / 10000).toFixed(0)
        }
      },
      axisLine: { lineStyle: { color: '#e8e8e8' } },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      name: '总使用金额',
      type: 'bar',
      data: cityComparisonData.value.map(item => ({
        value: parseFloat(item.totalUsageAmount || 0),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      })),
      label: {
        show: true,
        position: 'top',
        formatter: function(params) {
          return (params.value / 10000).toFixed(1) + '万'
        },
        fontSize: 11,
        color: '#666'
      }
    }]
  })

  // 10. 医疗机构效率对比分析
  efficiencyEchart = echarts.init(efficiencyChart.value!)

  // 取前15个机构进行展示，避免图表过于拥挤
  const topEfficiencyData = hospitalEfficiencyData.value.slice(0, 15)

  efficiencyEchart.setOption({
    ...getChartTheme(),
    title: {
      text: '医疗机构药品使用效率综合评分',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      formatter: function(params) {
        const param = params[0]
        const data = topEfficiencyData.find(item => item.organizationName === param.name)
        if (!data) return param.name

        return `
          <strong>${param.name}</strong><br/>
          综合效率得分: <strong style="color:#1890FF">${param.value}分</strong><br/>
          效率排名: 第${data.efficiencyRank}名<br/>
          <hr style="margin:8px 0;border:none;border-top:1px solid #eee;">
          药品利用率: ${data.drugUtilizationRate}%<br/>
          库存周转率: ${data.inventoryTurnoverRate}%<br/>
          集中采购率: ${data.centralizedRate}%<br/>
          一致性评价使用率: ${data.consistencyUsageRate}%<br/>
          <hr style="margin:8px 0;border:none;border-top:1px solid #eee;">
          床位数: ${data.bedCount}张<br/>
          年诊疗人次: ${data.visitCount}人次<br/>
          在用药品品种: ${data.usedDrugVarieties}种
        `
      }
    },
    legend: {
      top: 30,
      textStyle: { color: '#666' }
    },
    xAxis: {
      type: 'category',
      data: topEfficiencyData.map(item => item.organizationName),
      axisLabel: {
        rotate: 45,
        color: '#666',
        formatter: function(value) {
          // 如果机构名称过长，进行截断显示
          return value.length > 8 ? value.substring(0, 8) + '...' : value
        }
      },
      axisLine: { lineStyle: { color: '#e8e8e8' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '综合得分',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        max: 100
      },
      {
        type: 'value',
        name: '各项指标(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        max: 100
      }
    ],
    series: [
      {
        name: '综合效率得分',
        type: 'bar',
        data: topEfficiencyData.map(item => ({
          value: parseFloat(item.efficiencyScore || 0),
          itemStyle: {
            color: function(params) {
              const score = params.value
              if (score >= 80) return '#52C41A'      // 绿色 - 优秀
              else if (score >= 60) return '#1890FF' // 蓝色 - 良好
              else if (score >= 40) return '#FAAD14' // 橙色 - 一般
              else return '#F5222D'                   // 红色 - 较差
            },
            borderRadius: [4, 4, 0, 0]
          }
        })),
        label: {
          show: true,
          position: 'top',
          formatter: '{c}分',
          fontSize: 11,
          fontWeight: 'bold'
        }
      },
      {
        name: '药品利用率',
        type: 'line',
        yAxisIndex: 1,
        data: topEfficiencyData.map(item => parseFloat(item.drugUtilizationRate || 0)),
        smooth: true,
        lineStyle: { width: 2, color: '#722ED1' },
        symbolSize: 4,
        itemStyle: { color: '#722ED1' }
      },
      {
        name: '集中采购率',
        type: 'line',
        yAxisIndex: 1,
        data: topEfficiencyData.map(item => parseFloat(item.centralizedRate || 0)),
        smooth: true,
        lineStyle: { width: 2, color: '#13C2C2' },
        symbolSize: 4,
        itemStyle: { color: '#13C2C2' }
      }
    ]
  })


  // 其他图表的初始化代码...
}

// 查询带参数的数据
const queryFixedBase = async () => {
  try {
    fixedBaseData.value = await fetchData('drugUsageFixedBase', { baseYear: baseYear.value })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    initFixedBaseChart()
  } catch (error) {
    console.error('定基比数据查询失败:', error)
  }
}

const queryCityComparison = async () => {
  try {
    cityComparisonData.value = await fetchData('provincialCityComparison', { domainCode: domainCode.value })
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))
    initCityChart()
  } catch (error) {
    console.error('城市对比数据查询失败:', error)
  }
}

// 响应式图表尺寸调整
const resizeCharts = () => {
  const charts = [
    allocationEchart, proportionEchart, keyDrugsEchart, equipEchart,
    usageEchart, regionEchart, yearOnYearEchart, fixedBaseEchart,
    cityEchart, efficiencyEchart
  ]

  charts.forEach(chart => {
    if (chart && chart.getDom && chart.getDom()) {
      try {
        chart.resize()
      } catch (error) {
        console.warn('图表resize失败:', error)
      }
    }
  })
}

// 添加对activeTab的监听，当切换tab时重新初始化相应图表
watch(activeTab, async (newTab) => {
  if (isChartsInitialized.value) {
    await nextTick()
    // 等待tab内容渲染完成
    await new Promise(resolve => setTimeout(resolve, 50))
    initChartsForTab(newTab)
  }
})

// 新增：根据当前激活的tab初始化图表
const initChartsForActiveTab = () => {
  initChartsForTab(activeTab.value)
}

// 新增：为特定tab初始化图表
const initChartsForTab = (tabName) => {
  switch (tabName) {
    case 'overview':
      initOverviewCharts()
      break
    case 'key-drugs':
      initKeyDrugsChart()
      break
    case 'basic-drugs':
      initBasicDrugsCharts()
      break
    case 'region':
      initRegionChart()
      break
    case 'trend':
      initTrendChart()
      break
    case 'fixed-base':
      initFixedBaseChart()
      break
    case 'city':
      initCityChart()
      break
    case 'efficiency':
      initEfficiencyChart()
      break
  }
}

// 新增：安全地初始化单个图表的辅助函数
const safeInitChart = (chartRef, chartInstance, initFunction) => {
  if (!chartRef.value) {
    console.warn('图表DOM元素不存在')
    return null
  }

  // 检查DOM元素是否有有效的尺寸
  const rect = chartRef.value.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) {
    console.warn('图表容器尺寸为0，延迟初始化')
    // 延迟重试
    setTimeout(() => {
      safeInitChart(chartRef, chartInstance, initFunction)
    }, 100)
    return null
  }

  // 如果图表实例已存在，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 初始化新的图表实例
  const newChart = echarts.init(chartRef.value)
  initFunction(newChart)

  return newChart
}


const initOverviewCharts = () => {
  // 1. 药品配备率与使用率
  const initAllocationChart = (chart) => {
    const filteredAllocationData = selectedHospitals.value.length > 0
      ? drugAllocationData.value.filter(item => selectedHospitals.value.includes(item.hospitalCode))
      : drugAllocationData.value

    if (filteredAllocationData.length === 0) {
      console.warn('药品配备数据为空')
      return
    }

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '药品配备率与使用率分析',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' },
        subtext: selectedHospitals.value.length > 0 ? `已筛选 ${selectedHospitals.value.length} 家机构` : '全部机构'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        textStyle: { color: '#666' },
        formatter: function(params) {
          let result = `<strong>${params[0].name}</strong><br/>`
          params.forEach(param => {
            const icon = param.seriesType === 'bar' ? '■ ' : '●'
            result += `<span style="color:${param.color}">${icon} ${param.seriesName}: ${param.value}${param.seriesName.includes('率') ? '%' : ''}</span><br/>`
          })
          return result
        }
      },
      legend: {
        top: 35,
        textStyle: { color: '#666' }
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: {
            title: {
              zoom: '区域缩放',
              back: '区域缩放还原'
            }
          },
          restore: {
            title: '还原'
          },
          saveAsImage: {
            title: '保存为图片'
          }
        },
        right: 20,
        top: 20
      },
      xAxis: {
        type: 'category',
        data: filteredAllocationData.map(item => item.organizationName || '未知机构'),
        axisLabel: {
          rotate: 45,
          color: '#666',
          formatter: function(value) {
            return value.length > 8 ? value.substring(0, 8) + '...' : value
          }
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: [
        {
          type: 'value',
          name: '配备总数',
          nameTextStyle: { color: '#666' },
          axisLabel: { color: '#666' },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        {
          type: 'value',
          name: '使用率(%)',
          nameTextStyle: { color: '#666' },
          axisLabel: { color: '#666' },
          axisLine: { lineStyle: { color: '#e8e8e8' } }
        }
      ],
      series: [
        {
          name: '配备总数',
          type: 'bar',
          data: filteredAllocationData.map(item => parseInt(item.totalDrugsConfigured || 0)),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4facfe' },
              { offset: 1, color: '#00f2fe' }
            ])
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ])
            }
          }
        },
        {
          name: '使用率',
          type: 'line',
          yAxisIndex: 1,
          data: filteredAllocationData.map(item => parseFloat(item.usageRatePercent || 0)),
          smooth: true,
          lineStyle: { width: 3, color: '#ff6b6b' },
          symbolSize: 8,
          symbol: 'circle',
          itemStyle: { color: '#ff6b6b' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 107, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 107, 0.05)' }
            ])
          }
        }
      ],
      dataZoom: [
        {
          type: 'slider',
          show: filteredAllocationData.length > 10,
          xAxisIndex: [0],
          start: 0,
          end: 100
        }
      ]
    })
  }

  // 2. 基药/非基药占比趋势
  const initProportionChart = (chart) => {
    if (proportionTrendData.value.length === 0) {
      console.warn('占比趋势数据为空')
      return
    }

    const months = [...new Set(proportionTrendData.value.map(item => item.monthPeriod))].sort()
    const basicData = months.map(m => {
      const item = proportionTrendData.value.find(d => d.monthPeriod === m && d.drugType === '基本药物')
      return {
        value: parseFloat(item?.amountPercentage || 0),
        amount: parseFloat(item?.totalAmount || 0)
      }
    })
    const nonBasicData = months.map(m => {
      const item = proportionTrendData.value.find(d => d.monthPeriod === m && d.drugType === '非基本药物')
      return {
        value: parseFloat(item?.amountPercentage || 0),
        amount: parseFloat(item?.totalAmount || 0)
      }
    })

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '基药/非基药使用金额占比趋势',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' },
        subtext: comparisonMode.value === 'yoy' ? '同比数据' : comparisonMode.value === 'mom' ? '环比数据' : '当期数据'
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        formatter: function(params) {
          let result = `<strong>${params[0].name}</strong><br/>`
          let total = 0
          params.forEach(param => {
            const data = param.data
            result += `<span style="color:${param.color}">▪ ${param.seriesName}: ${data.value}% (${(data.amount/10000).toFixed(1)}万元)</span><br/>`
            total += data.value
          })
          result += `<hr style="margin:4px 0;border:none;border-top:1px solid #eee;">总计: ${total.toFixed(1)}%`
          return result
        }
      },
      legend: {
        top: 35,
        textStyle: { color: '#666' }
      },
      toolbox: {
        show: true,
        feature: {
          magicType: {
            type: ['line', 'bar', 'stack'],
            title: {
              line: '切换为折线图',
              bar: '切换为柱状图',
              stack: '切换为堆积'
            }
          },
          restore: { title: '还原' },
          saveAsImage: { title: '保存为图片' }
        },
        right: 20,
        top: 20
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: {
        type: 'value',
        name: '占比(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: {
          color: '#666',
          formatter: '{value}%'
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } },
        max: 100
      },
      series: [
        {
          name: '基本药物',
          type: 'bar',
          stack: 'total',
          data: basicData,
          itemStyle: {
            borderRadius: [0, 0, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#52C41A' },
              { offset: 1, color: '#95de64' }
            ])
          }
        },
        {
          name: '非基本药物',
          type: 'bar',
          stack: 'total',
          data: nonBasicData,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#fa8c16' },
              { offset: 1, color: '#ffd666' }
            ])
          }
        }
      ]
    })
  }

  allocationEchart = safeInitChart(allocationChart, allocationEchart, initAllocationChart)
  proportionEchart = safeInitChart(proportionChart, proportionEchart, initProportionChart)
}

// 修改 initKeyDrugsChart 函数
const initKeyDrugsChart = () => {
  const initKeyDrugs = (chart) => {
    if (keyDrugsData.value.length === 0) {
      console.warn('重点药品数据为空')
      return
    }

    const dataCount = Math.min(keyDrugsData.value.length, 8)
    const topKeyDrugs = keyDrugsData.value.slice(0, dataCount)

    chart.setOption({
      title: {
        text: '重点监管药品使用金额 TOP ' + dataCount,
        left: 'center',
        top: 10,
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: '#262626'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        textStyle: { color: '#666' },
        formatter: function(params) {
          const param = params[0]
          const value = param.value
          return `${param.name}<br/>${param.seriesName}: ￥${(value / 10000).toFixed(2)}万元`
        }
      },
      grid: {
        left: '10%',
        right: '10%',
        top: '15%',
        bottom: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: topKeyDrugs.map(item => item.drugName || '未知药品'),
        axisLabel: {
          interval: 0,
          rotate: 45,
          formatter: function(value) {
            if (value.length > 12) {
              return value.substring(0, 12) + '...'
            }
            return value
          },
          fontSize: 12,
          color: '#333',
          align: 'right',
          verticalAlign: 'top'
        },
        axisTick: {
          alignWithLabel: true,
          length: 3
        },
        axisLine: {
          lineStyle: { color: '#e8e8e8' }
        }
      },
      yAxis: {
        type: 'value',
        name: '使用金额(万元)',
        nameLocation: 'end',
        nameGap: 15,
        nameTextStyle: {
          color: '#666',
          fontSize: 13
        },
        min: 0,
        axisLabel: {
          formatter: function(value) {
            return (value / 10000).toFixed(0)
          },
          color: '#666'
        },
        axisLine: {
          lineStyle: { color: '#e8e8e8' }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        },
        splitNumber: 5
      },
      series: [{
        name: '使用金额',
        type: 'bar',
        data: topKeyDrugs.map(item => parseFloat(item.totalAmount || 0)),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0984e3' },
            { offset: 0.5, color: '#0984e3' },
            { offset: 1, color: '#74b9ff' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '90%',
        label: {
          show: true,
          position: 'top',
          formatter: function(params) {
            const value = params.value
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万'
            }
            return value.toFixed(0)
          },
          fontSize: 11,
          color: '#0984e3',
          fontWeight: 'bold'
        },
        emphasis: {
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#00cec9' },
              { offset: 1, color: '#00b894' }
            ])
          }
        }
      }],
      dataZoom: dataCount > 6 ? [{
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100,
        height: 20,
        bottom: 5,
        handleSize: '100%',
        handleStyle: {
          color: '#0984e3'
        },
        textStyle: {
          color: '#666'
        },
        borderColor: '#e8e8e8'
      }] : []
    })
  }

  keyDrugsEchart = safeInitChart(keyDrugsChart, keyDrugsEchart, initKeyDrugs)
}

// 修改 initBasicDrugsCharts 函数
const initBasicDrugsCharts = () => {
  // 基本药物配备率
  const initEquipChart = (chart) => {
    if (basicEquipData.value.length === 0) {
      console.warn('基本药物配备数据为空')
      return
    }

    const topEquipData = basicEquipData.value.slice(0, 15)
    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '基本药物配备率',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8'
      },
      xAxis: {
        type: 'category',
        data: topEquipData.map(item => item.organizationName || '未知机构'),
        axisLabel: { rotate: 45, color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: {
        type: 'value',
        name: '配备率(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [{
        type: 'bar',
        data: topEquipData.map(item => parseFloat(item.basicDrugRate || 0)),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: '#52C41A'
        }
      }]
    })
  }

  // 基本药物使用率
  const initUsageChart = (chart) => {
    if (basicUsageData.value.length === 0) {
      console.warn('基本药物使用数据为空')
      return
    }

    const topUsageData = basicUsageData.value.slice(0, 8)
    chart.setOption({
      ...getChartTheme(),
      grid: {
        left: '10%',
        right: '10%',
        bottom: '10%',
        top: '30%',
        containLabel: true
      },
      title: {
        text: '基本药物使用率对比',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8'
      },
      legend: {
        top: 30,
        textStyle: { color: '#666' }
      },
      xAxis: {
        type: 'category',
        data: topUsageData.map(item => item.organizationName || '未知机构'),
        axisLabel: { rotate: 45, color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: {
        type: 'value',
        name: '占比(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          name: '数量占比',
          type: 'bar',
          data: topUsageData.map(item => parseFloat(item.basicDrugQuantityRate || 0)),
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '金额占比',
          type: 'bar',
          data: topUsageData.map(item => parseFloat(item.basicDrugAmountRate || 0)),
          itemStyle: { borderRadius: [4, 4, 0, 0] }
        }
      ]
    })
  }

  equipEchart = safeInitChart(equipChart, equipEchart, initEquipChart)
  usageEchart = safeInitChart(usageChart, usageEchart, initUsageChart)
}

// 修改其他初始化函数，添加数据检查和错误处理...

// 修改 initRegionChart
const initRegionChart = () => {
  const initRegion = (chart) => {
    if (basisRegionData.value.length === 0) {
      console.warn('地区基本药物数据为空')
      return
    }

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '地区间基本药物使用对比分析',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8'
      },
      legend: {
        top: 30,
        textStyle: { color: '#666' }
      },
      xAxis: {
        type: 'category',
        data: basisRegionData.value.map(item => item.domainCode || '未知地区'),
        axisLabel: {
          rotate: 0,
          color: '#666',
          formatter: function(value) {
            return value.slice(-2)
          }
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: [
        {
          type: 'value',
          name: '配备率/使用率(%)',
          nameTextStyle: { color: '#666' },
          axisLabel: { color: '#666' },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          splitLine: { lineStyle: { color: '#f0f0f0' } }
        },
        {
          type: 'value',
          name: '使用金额(万元)',
          nameTextStyle: { color: '#666' },
          axisLabel: {
            color: '#666',
            formatter: function(value) {
              return (value / 10000).toFixed(0)
            }
          },
          axisLine: { lineStyle: { color: '#e8e8e8' } }
        }
      ],
      series: [
        {
          name: '基药配备率',
          type: 'bar',
          data: basisRegionData.value.map(item => parseFloat(item.basicDrugEquipmentRate || 0)),
          itemStyle: {
            color: '#1890FF',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '基药金额占比',
          type: 'bar',
          data: basisRegionData.value.map(item => parseFloat(item.basicDrugAmountRate || 0)),
          itemStyle: {
            color: '#52C41A',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '基药使用金额',
          type: 'line',
          yAxisIndex: 1,
          data: basisRegionData.value.map(item => parseFloat(item.basicDrugUsageAmount || 0)),
          smooth: true,
          lineStyle: { width: 3, color: '#FAAD14' },
          symbolSize: 6,
          itemStyle: { color: '#FAAD14' }
        }
      ]
    })
  }

  regionEchart = safeInitChart(regionChart, regionEchart, initRegion)
}

// 继续修改其他图表初始化函数...
const initTrendChart = () => {
  const initTrend = (chart) => {
    if (yearOnYearData.value.length === 0) {
      console.warn('年同比数据为空')
      return
    }

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '药品使用年同比增长率分析',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        formatter: function(params) {
          let result = `${params[0].name}<br/>`
          params.forEach(param => {
            const value = param.value
            const color = value >= 0 ? '#52C41A' : '#F5222D'
            result += `<span style="color:${color}">${param.seriesName}: ${value}%</span><br/>`
          })
          return result
        }
      },
      legend: {
        top: 30,
        textStyle: { color: '#666' }
      },
      xAxis: {
        type: 'category',
        data: yearOnYearData.value.slice(0, 10).map(item => item.organizationName || '未知机构'),
        axisLabel: { rotate: 45, color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: {
        type: 'value',
        name: '同比增长率(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          name: '金额同比',
          type: 'bar',
          data: yearOnYearData.value.slice(0, 10).map(item => {
            const value = parseFloat(item.amountYoyRate || 0)
            return {
              value: value,
              itemStyle: {
                color: value >= 0 ? '#52C41A' : '#F5222D',
                borderRadius: [4, 4, 0, 0]
              }
            }
          })
        },
        {
          name: '数量同比',
          type: 'line',
          data: yearOnYearData.value.slice(0, 10).map(item => parseFloat(item.quantityYoyRate || 0)),
          smooth: true,
          lineStyle: { width: 3, color: '#1890FF' },
          symbolSize: 6,
          itemStyle: { color: '#1890FF' }
        },
        {
          name: '品种数同比',
          type: 'line',
          data: yearOnYearData.value.slice(0, 10).map(item => parseFloat(item.varietiesYoyRate || 0)),
          smooth: true,
          lineStyle: { width: 3, color: '#722ED1' },
          symbolSize: 6,
          itemStyle: { color: '#722ED1' }
        }
      ]
    })
  }

  yearOnYearEchart = safeInitChart(yearOnYearChart, yearOnYearEchart, initTrend)
}

const initFixedBaseChart = () => {
  const initFixedBase = (chart) => {
    if (fixedBaseData.value.length === 0) {
      console.warn('定基比数据为空')
      return
    }

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: `以${baseYear.value}年为基期的定基比分析`,
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        formatter: function(params) {
          let result = `${params[0].name}<br/>`
          params.forEach(param => {
            result += `${param.seriesName}: ${param.value}%<br/>`
          })
          return result
        }
      },
      legend: {
        top: 30,
        textStyle: { color: '#666' }
      },
      xAxis: {
        type: 'category',
        data: fixedBaseData.value.map(item => item.organizationName || '未知机构'),
        axisLabel: { rotate: 45, color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: {
        type: 'value',
        name: '定基指数(%)',
        nameTextStyle: { color: '#666' },
        axisLabel: { color: '#666' },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [
        {
          name: '金额定基指数',
          type: 'bar',
          data: fixedBaseData.value.map(item => parseFloat(item.amountFixedBaseIndex || 0)),
          itemStyle: {
            color: '#1890FF',
            borderRadius: [4, 4, 0, 0]
          }
        },
        {
          name: '数量定基指数',
          type: 'line',
          data: fixedBaseData.value.map(item => parseFloat(item.quantityFixedBaseIndex || 0)),
          smooth: true,
          lineStyle: { width: 3, color: '#52C41A' },
          symbolSize: 6,
          itemStyle: { color: '#52C41A' }
        },
        {
          name: '品种数定基指数',
          type: 'line',
          data: fixedBaseData.value.map(item => parseFloat(item.varietiesFixedBaseIndex || 0)),
          smooth: true,
          lineStyle: { width: 3, color: '#FAAD14' },
          symbolSize: 6,
          itemStyle: { color: '#FAAD14' }
        }
      ]
    })
  }

  fixedBaseEchart = safeInitChart(fixedBaseChart, fixedBaseEchart, initFixedBase)
}

const initCityChart = () => {
  const initCity = (chart) => {
    if (cityComparisonData.value.length === 0) {
      console.warn('城市对比数据为空')
      return
    }

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '省内各地市药品使用对比分析',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8'
      },
      xAxis: {
        type: 'category',
        data: cityComparisonData.value.map(item => item.cityCode || '未知城市'),
        axisLabel: {
          rotate: 45,
          color: '#666',
          formatter: function(value) {
            return `${value}市`
          }
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: {
        type: 'value',
        name: '使用金额(万元)',
        nameTextStyle: { color: '#666' },
        axisLabel: {
          color: '#666',
          formatter: function(value) {
            return (value / 10000).toFixed(0)
          }
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } },
        splitLine: { lineStyle: { color: '#f0f0f0' } }
      },
      series: [{
        name: '总使用金额',
        type: 'bar',
        data: cityComparisonData.value.map(item => ({
          value: parseFloat(item.totalUsageAmount || 0),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#667eea' },
              { offset: 1, color: '#764ba2' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        })),
        label: {
          show: true,
          position: 'top',
          formatter: function(params) {
            return (params.value / 10000).toFixed(1) + '万'
          },
          fontSize: 11,
          color: '#666'
        }
      }]
    })
  }

  cityEchart = safeInitChart(cityChart, cityEchart, initCity)
}

const initEfficiencyChart = () => {
  const initEfficiency = (chart) => {
    if (hospitalEfficiencyData.value.length === 0) {
      console.warn('医疗机构效率数据为空')
      return
    }

    const topEfficiencyData = hospitalEfficiencyData.value.slice(0, 15)

    chart.setOption({
      ...getChartTheme(),
      title: {
        text: '医疗机构药品使用效率综合评分',
        textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderColor: '#e8e8e8',
        formatter: function(params) {
          const param = params[0]
          const data = topEfficiencyData.find(item => item.organizationName === param.name)
          if (!data) return param.name

          return `
            <strong>${param.name}</strong><br/>
            综合效率得分: <strong style="color:#1890FF">${param.value}分</strong><br/>
            效率排名: 第${data.efficiencyRank || '未知'}名<br/>
            <hr style="margin:8px 0;border:none;border-top:1px solid #eee;">
            药品利用率: ${data.drugUtilizationRate || 0}%<br/>
            库存周转率: ${data.inventoryTurnoverRate || 0}%<br/>
            集中采购率: ${data.centralizedRate || 0}%<br/>
            一致性评价使用率: ${data.consistencyUsageRate || 0}%<br/>
            <hr style="margin:8px 0;border:none;border-top:1px solid #eee;">
            床位数: ${data.bedCount || 0}张 <br/>
            年诊疗人次: ${data.visitCount || 0}人次<br/>
            在用药品品种: ${data.usedDrugVarieties || 0}种
          `
        }
      },
      legend: {
        top: 30,
        textStyle: { color: '#666' }
      },
      xAxis: {
        type: 'category',
        data: topEfficiencyData.map(item => item.organizationName || '未知机构'),
        axisLabel: {
          rotate: 45,
          color: '#666',
          formatter: function(value) {
            return value.length > 8 ? value.substring(0, 8) + '...' : value
          }
        },
        axisLine: { lineStyle: { color: '#e8e8e8' } }
      },
      yAxis: [
        {
          type: 'value',
          name: '综合得分',
          nameTextStyle: { color: '#666' },
          axisLabel: { color: '#666' },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          max: 100
        },
        {
          type: 'value',
          name: '各项指标(%)',
          nameTextStyle: { color: '#666' },
          axisLabel: { color: '#666' },
          axisLine: { lineStyle: { color: '#e8e8e8' } },
          max: 100
        }
      ],
      series: [
        {
          name: '综合效率得分',
          type: 'bar',
          data: topEfficiencyData.map(item => ({
            value: parseFloat(item.efficiencyScore || 0),
            itemStyle: {
              color: function(params) {
                const score = params.value
                if (score >= 80) return '#52C41A'
                else if (score >= 60) return '#1890FF'
                else if (score >= 40) return '#FAAD14'
                else return '#F5222D'
              },
              borderRadius: [4, 4, 0, 0]
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}分',
            fontSize: 11,
            fontWeight: 'bold'
          }
        },
        {
          name: '药品利用率',
          type: 'line',
          yAxisIndex: 1,
          data: topEfficiencyData.map(item => parseFloat(item.drugUtilizationRate || 0)),
          smooth: true,
          lineStyle: { width: 2, color: '#722ED1' },
          symbolSize: 4,
          itemStyle: { color: '#722ED1' }
        },
        {
          name: '集中采购率',
          type: 'line',
          yAxisIndex: 1,
          data: topEfficiencyData.map(item => parseFloat(item.centralizedRate || 0)),
          smooth: true,
          lineStyle: { width: 2, color: '#13C2C2' },
          symbolSize: 4,
          itemStyle: { color: '#13C2C2' }
        }
      ]
    })
  }

  efficiencyEchart = safeInitChart(efficiencyChart, efficiencyEchart, initEfficiency)
}

// 生命周期钩子
onMounted(async () => {
  try {
    await initFilterOptions()
    await initData()

    // 使用 nextTick 确保DOM完全渲染后再初始化图表
    await nextTick()

    // 等待一个额外的渲染周期，确保所有元素都有正确的尺寸
    await new Promise(resolve => setTimeout(resolve, 100))

    // 检查当前激活的tab，只初始化可见的图表
    initChartsForActiveTab()
    isChartsInitialized.value = true

    // 监听窗口大小变化
    window.addEventListener('resize', resizeCharts)
  } catch (error) {
    console.error('组件初始化失败:', error)
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)

  // 销毁所有图表实例
  const charts = [
    allocationEchart, proportionEchart, keyDrugsEchart, equipEchart,
    usageEchart, regionEchart, yearOnYearEchart, fixedBaseEchart,
    cityEchart, efficiencyEchart
  ]

  charts.forEach(chart => {
    if (chart && chart.dispose) {
      try {
        chart.dispose()
      } catch (error) {
        console.warn('图表销毁失败:', error)
      }
    }
  })
})
</script>

<template>
  <div class="drug-analysis-container">
    <!-- 页面头部 -->
    <PageHeader
      title="药品统计分析"
      content="药品配备、使用情况综合分析报告"
      :icon="TrendCharts"
    />

    <!-- 筛选区域 -->
    <el-card class="filter-section" shadow="hover">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="filter-item">
            <div class="filter-label">
              <el-icon><OfficeBuilding /></el-icon>
              <span>医疗机构</span>
            </div>
            <el-select
              v-model="selectedHospitals"
              multiple
              placeholder="选择医疗机构"
              clearable
              collapse-tags
              collapse-tags-tooltip
              style="width: 100%"
            >
              <el-option
                v-for="(item,idx) in hospitalOptions"
                :key="idx"
                :label="item.label"
                :value="item.label"
              />
            </el-select>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <div class="filter-item">
            <div class="filter-label">
              <el-icon><Calendar /></el-icon>
              <span>时间范围</span>
            </div>
            <el-select
              v-model="selectedTimeRange"
              placeholder="选择时间范围"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="item in timeRangeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <div class="filter-item">
            <div class="filter-label">
              <el-icon><MapLocation /></el-icon>
              <span>所属地区</span>
            </div>
            <el-select
              v-model="selectedRegion"
              placeholder="选择地区"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="item in regionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <div class="filter-item">
            <div class="filter-label">
              <el-icon><DataLine /></el-icon>
              <span>对比模式</span>
            </div>
            <el-select
              v-model="comparisonMode"
              placeholder="选择对比模式"
              style="width: 100%"
            >
              <el-option
                v-for="item in comparisonOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <div class="filter-actions">
        <el-button type="primary" @click="applyFilters">
          <el-icon><Filter /></el-icon>
          应用筛选
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <!-- 第一行统计卡片 -->
      <el-row :gutter="24" class="statistics-cards">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="药品总数"
            :value="statistics.totalDrugs"
            icon="Medicine"
            color="#667eea"
            description="系统中的药品种类总数"
            suffix="种"
            :trend="12.5"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="基药品种"
            :value="statistics.basicDrugs"
            icon="CircleCheck"
            color="#52c41a"
            description="基本药物品种数量"
            suffix="种"
            :trend="8.2"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="医疗机构"
            :value="statistics.totalHospitals"
            icon="OfficeBuilding"
            color="#faad14"
            description="合作医疗机构数"
            suffix="家"
            :trend="5.6"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="平均使用率"
            :value="statistics.avgUsageRate"
            icon="DataLine"
            color="#722ed1"
            description="药品平均使用率"
            suffix="%"
            :trend="-2.3"
          />
        </el-col>
      </el-row>

      <!-- 第二行统计卡片 -->
      <el-row :gutter="24" class="statistics-cards" style="margin-top: 24px;">
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="药品采购总额"
            :value="extendedStatistics.totalAmount"
            icon="Money"
            color="#ff6b6b"
            description="本期药品采购总金额"
            suffix="元"
            :trend="15.8"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="单位平均采购额"
            :value="extendedStatistics.avgAmountPerHospital"
            icon="TrendCharts"
            color="#4ecdc4"
            description="医疗机构平均采购额"
            suffix="元"
            :trend="6.7"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="基药使用率"
            :value="extendedStatistics.basicDrugUsageRate"
            icon="Promotion"
            color="#95e1d3"
            description="基本药物使用占比"
            suffix="%"
            :trend="3.4"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :lg="6">
          <StatCard
            title="合规达标率"
            :value="extendedStatistics.complianceRate"
            icon="SuccessFilled"
            color="#ffd93d"
            description="机构合规达标比例"
            suffix="%"
            :trend="9.2"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 图表展示区域 -->
    <div class="charts-section">
      <el-card class="charts-container">
        <el-tabs v-model="activeTab" type="border-card" class="analysis-tabs">
          <el-tab-pane label="概览分析" name="overview">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <div ref="allocationChart" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <div ref="proportionChart" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="重点药品监管" name="key-drugs">
            <el-card class="chart-card" shadow="hover">
              <div ref="keyDrugsChart" class="chart-container-large"></div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="基药分析" name="basic-drugs">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <div ref="equipChart" class="chart-container"></div>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card class="chart-card" shadow="hover">
                  <div ref="usageChart" class="chart-container"></div>
                </el-card>
              </el-col>
            </el-row>
          </el-tab-pane>

          <el-tab-pane label="地区对比" name="region">
            <el-card class="chart-card" shadow="hover">
              <div ref="regionChart" class="chart-container-large"></div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="趋势分析" name="trend">
            <el-card class="chart-card" shadow="hover">
              <div ref="yearOnYearChart" class="chart-container-large"></div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="定基比分析" name="fixed-base">
            <el-card class="chart-card" shadow="hover">
              <div class="chart-controls">
                <span class="control-label">基期年份：</span>
                <el-input-number
                  v-model="baseYear"
                  :min="2000"
                  :max="new Date().getFullYear()"
                  size="small"
                  class="control-input"
                />
                <el-button type="primary" size="small" @click="queryFixedBase" class="control-btn">
                  查询分析
                </el-button>
              </div>
              <div ref="fixedBaseChart" class="chart-container-large"></div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="省内对比" name="city">
            <el-card class="chart-card" shadow="hover">
              <div class="chart-controls">
                <span class="control-label">省级代码：</span>
                <el-input
                  v-model="domainCode"
                  placeholder="请输入省级代码"
                  size="small"
                  class="control-input"
                />
                <el-button type="primary" size="small" @click="queryCityComparison" class="control-btn">
                  查询分析
                </el-button>
              </div>
              <div ref="cityChart" class="chart-container-large"></div>
            </el-card>
          </el-tab-pane>

          <el-tab-pane label="效率对比" name="efficiency">
            <el-card class="chart-card" shadow="hover">
              <div ref="efficiencyChart" class="chart-container-large"></div>
            </el-card>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>
  </div>
</template>

<style scoped>


/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式设计 */
@media (width <= 1200px) {
  .statistics-cards .el-col {
    margin-bottom: 16px;
  }

  .filter-section .el-col {
    margin-bottom: 12px;
  }

  .chart-container,
  .chart-container-large {
    height: 400px;
  }
}

@media (width <= 768px) {
  .drug-analysis-container {
    padding: 16px;
  }

  .statistics-cards .el-col {
    margin-bottom: 12px;
  }

  .filter-section .el-col {
    margin-bottom: 12px;
  }

  .filter-actions {
    flex-direction: column;
  }

  .filter-actions .el-button {
    width: 100%;
  }

  .chart-container,
  .chart-container-large {
    height: 350px;
  }

  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-label {
    margin-bottom: 8px;
  }

  .control-input {
    width: 100%;
    margin-right: 0;
    margin-bottom: 12px;
  }

  .analysis-tabs :deep(.el-tabs__item) {
    padding: 0 16px;
  }

  .analysis-tabs :deep(.el-tabs__content) {
    padding: 16px;
  }
}

.drug-analysis-container {
  min-height: 100vh;
  padding: 24px;
  background: #f8fafc;
}

/* 筛选区域样式 */
.filter-section {
  margin-bottom: 24px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
}

.filter-section :deep(.el-card__body) {
  padding: 24px;
}

.filter-item {
  margin-bottom: 16px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.filter-label .el-icon {
  font-size: 16px;
  color: #667eea;
}

.filter-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 12px;
}

.filter-actions .el-button {
  min-width: 120px;
}

.statistics-section {
  margin-bottom: 24px;
}

.statistics-cards {
  margin-bottom: 0;
}

.charts-section {
  margin-bottom: 24px;
}

.charts-container {
  overflow: hidden;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 6%);
}

.analysis-tabs {
  border: none;
  box-shadow: none;
}

.analysis-tabs :deep(.el-tabs__header) {
  margin: 0;
  background: #fafbfc;
  border-bottom: 1px solid #e8eaec;
  border-radius: 8px 8px 0 0;
}

.analysis-tabs :deep(.el-tabs__item) {
  height: 48px;
  padding: 0 24px;
  font-weight: 500;
  line-height: 48px;
  color: #666;
  border: none;
  transition: all 0.3s ease;
}

.analysis-tabs :deep(.el-tabs__item:hover) {
  color: #1890ff;
  background: rgb(24 144 255 / 5%);
}

.analysis-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
  background: white;
  border-bottom: 2px solid #1890ff;
}

.analysis-tabs :deep(.el-tabs__content) {
  padding: 24px;
  background: white;
}

.chart-card {
  margin-bottom: 24px;
  border: 1px solid #e8eaec;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 4%);
  transition: all 0.3s ease;
}

.chart-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgb(0 0 0 / 8%);
}

.chart-card :deep(.el-card__body) {
  padding: 24px;
}

.chart-container {
  width: 100%;
  height: 450px;
  max-width: 100%;
}

.chart-container-large {
  width: 100%;
  height: 550px;
  max-width: 100%;
}

.chart-controls {
  display: flex;
  padding: 16px;
  margin-bottom: 20px;
  background: #fafbfc;
  border: 1px solid #e8eaec;
  border-radius: 8px;
  align-items: center;
}

.control-label {
  margin-right: 12px;
  font-weight: 500;
  color: #262626;
}

.control-input {
  width: 180px;
  margin-right: 12px;
}

.control-btn {
  font-weight: 500;
  border-radius: 6px;
}

.chart-card {
  animation: fadeInUp 0.6s ease-out;
}

.statistics-cards .el-col:nth-child(1) { animation: fadeInUp 0.6s ease-out 0.1s both; }

.statistics-cards .el-col:nth-child(2) { animation: fadeInUp 0.6s ease-out 0.2s both; }

.statistics-cards .el-col:nth-child(3) { animation: fadeInUp 0.6s ease-out 0.3s both; }

.statistics-cards .el-col:nth-child(4) { animation: fadeInUp 0.6s ease-out 0.4s both; }

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #666;
}

/* 无数据状态 */
.no-data-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  color: #999;
}

.no-data-icon {
  margin-bottom: 16px;
  font-size: 64px;
  opacity: 0.5;
}

.no-data-text {
  font-size: 16px;
}
</style>
