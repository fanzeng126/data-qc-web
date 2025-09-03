<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { ElCard, ElTabPane, ElTabs, ElInputNumber, ElInput, ElButton, ElRow, ElCol, ElStatistic, ElIcon } from 'element-plus'
import type { ECharts } from 'echarts'
import { getAccessToken } from '@/utils/auth'

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

// 参数输入
const baseYear = ref<number>(2023)
const domainCode = ref<string>('')
const activeTab = ref<string>('overview')

// 图表实例引用
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

// ECharts 实例
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

// 初始化所有数据
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
const getChartTheme = () => ({
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif'
  },
  color: ['#1890FF', '#52C41A', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2'],
  grid: {
    left: '10%',  // 增加左侧边距
    right: '10%',  // 增加右侧边距
    bottom: '10%',  // 增加底部边距
    containLabel: true
  }
})
// 初始化图表
const initCharts = () => {
  // 1. 药品配备率与使用率
  allocationEchart = echarts.init(allocationChart.value!)
  allocationEchart.setOption({
    ...getChartTheme(),
    title: {
      text: '药品配备率与使用率分析',
      textStyle: { fontSize: 16, fontWeight: 'bold', color: '#262626' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e8e8e8',
      textStyle: { color: '#666' }
    },
    legend: {
      top: 30,
      textStyle: { color: '#666' }
    },
    xAxis: {
      type: 'category',
      data: drugAllocationData.value.map(item => item.organizationName),
      axisLabel: { rotate: 45, color: '#666' },
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
        data: drugAllocationData.value.map(item => item.totalDrugsConfigured),
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '使用率',
        type: 'line',
        yAxisIndex: 1,
        data: drugAllocationData.value.map(item => item.usageRatePercent),
        smooth: true,
        lineStyle: { width: 3 },
        symbolSize: 6
      }
    ]
  })

  // 2. 基药/非基药占比趋势
  const months = [...new Set(proportionTrendData.value.map(item => item.monthPeriod))]
  const basicData = months.map(m => proportionTrendData.value.find(d => d.monthPeriod === m && d.drugType === '基本药物')?.amountPercentage || 0)
  const nonBasicData = months.map(m => proportionTrendData.value.find(d => d.monthPeriod === m && d.drugType === '非基本药物')?.amountPercentage || 0)

  proportionEchart = echarts.init(proportionChart.value!)
  proportionEchart.setOption({
    ...getChartTheme(),
    title: {
      text: '基药/非基药使用金额占比趋势',
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
      data: months,
      axisLabel: { color: '#666' },
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
        name: '基本药物',
        type: 'bar',
        stack: 'total',
        data: basicData,
        itemStyle: { borderRadius: [0, 0, 0, 0] }
      },
      {
        name: '非基本药物',
        type: 'bar',
        stack: 'total',
        data: nonBasicData,
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }
    ]
  })

  // 3. 重点监管药品
  // 根据数据量动态决定显示条数，避免Y轴拥挤
  const dataCount = Math.min(keyDrugsData.value.length, 8) // 最多显示8条，避免拥挤
  const topKeyDrugs = keyDrugsData.value.slice(0, dataCount)

  keyDrugsEchart = echarts.init(keyDrugsChart.value!)
  keyDrugsEchart.setOption({
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
      bottom: '20%',  // 增加底部空间给倾斜的标签
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: topKeyDrugs.map(item => item.drugName),
      axisLabel: {
        interval: 0,  // 显示所有标签
        rotate: 45,   // 旋转45度，避免重叠
        formatter: function(value) {
          // 智能截断过长的药品名称
          if (value.length > 12) {
            return value.substring(0, 12) + '...'
          }
          return value
        },
        fontSize: 12,
        color: '#333',
        align: 'right',  // 右对齐使旋转后的文字更易读
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
          type: 'dashed'  // 使用虚线，视觉上更清爽
        }
      },
      splitNumber: 5
    },
    series: [{
      name: '使用金额',
      type: 'bar',
      data: topKeyDrugs.map(item => item.totalAmount),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [  // 改为垂直渐变
          { offset: 0, color: '#0984e3' },
          { offset: 0.5, color: '#0984e3' },
          { offset: 1, color: '#74b9ff' }
        ]),
        borderRadius: [4, 4, 0, 0]  // 顶部圆角
      },
      barWidth: '90%',  // 适当的柱子宽度
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
    // 添加数据缩放功能（如果数据较多时可以滚动查看）
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

  // 4. 基本药物配备率（取前15个）
  const topEquipData = basicEquipData.value.slice(0, 15)
  equipEchart = echarts.init(equipChart.value!)
  equipEchart.setOption({
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
      data: topEquipData.map(item => item.organizationName),
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
      data: topEquipData.map(item => item.basicDrugRate),
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: '#52C41A'
      }
    }]
  })

  // 继续初始化其他图表...
  initOtherCharts()
}

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
  fixedBaseData.value = await fetchData('drugUsageFixedBase', { baseYear: baseYear.value })
  if (fixedBaseEchart) {
    fixedBaseEchart.setOption({
      xAxis: { data: fixedBaseData.value.map(item => item.organizationName) },
      series: [{ data: fixedBaseData.value.map(item => item.amountFixedBaseIndex) }],
      series: [
        {
          data: fixedBaseData.value.map(item => parseFloat(item.amountFixedBaseIndex || 0))
        },
        {
          data: fixedBaseData.value.map(item => parseFloat(item.quantityFixedBaseIndex || 0))
        },
        {
          data: fixedBaseData.value.map(item => parseFloat(item.varietiesFixedBaseIndex || 0))
        }
      ]
    })
  }
}

const queryCityComparison = async () => {
  cityComparisonData.value = await fetchData('provincialCityComparison', { domainCode: domainCode.value })
  if (cityEchart) {
    cityEchart.setOption({
      xAxis: { data: cityComparisonData.value.map(item => item.cityCode) },
      series: [
        { data: cityComparisonData.value.map(item => item.totalUsageAmount || 0) },

      ]
    })
  }
}
const setMychart = async ()=> {
  //原生js写法
  //这是一个封装好的方法，兼容IE，第一个参数，element,第二个属性，css样式
  function getStyle(obj, attr) {
    if (obj.currentStyle) {
      return obj.currentStyle[attr];
    } else {
      return document.defaultView.getComputedStyle(obj, null)[attr];
    }
  }

  //获取父元素
  let echarts = document.querySelector('.chart-container');
  //获取父元素宽高
  let echartsWidth = getStyle(echarts, 'width');
  let echartsHeight = getStyle(echarts, 'height');
  //获取图表元素
  let myChart = document.querySelector('#TotalRevenueChartContainer');
  //将父元素宽高赋值给图表
  myChart.style.width = echartsWidth;
  myChart.style.height = echartsHeight;
}

// 生命周期钩子
onMounted(async () => {
  await initData()
  setTimeout(() => {
    initCharts()
  }, 1000)
  // await setMychart()
})
</script>

<template>
  <div class="drug-analysis-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">药品统计分析</h1>
        <p class="page-subtitle">药品配备、使用情况综合分析报告</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <el-row :gutter="24" class="statistics-cards">
        <el-col :span="6">
          <el-card class="stat-card stat-card-blue" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="el-icon-medicine"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalDrugs }}</div>
                <div class="stat-label">药品总数</div>
                <div class="stat-desc">系统中的药品种类总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-card-green" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.basicDrugs }}</div>
                <div class="stat-label">基药品种</div>
                <div class="stat-desc">基本药物品种数量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-card-orange" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="el-icon-office-building"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalHospitals }}</div>
                <div class="stat-label">医疗机构</div>
                <div class="stat-desc">合作医疗机构数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card stat-card-purple" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.avgUsageRate }}%</div>
                <div class="stat-label">平均使用率</div>
                <div class="stat-desc">药品平均使用率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表展示区域 -->
    <div class="charts-section">
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
    </div>
  </div>
</template>

<style scoped>
.drug-analysis-container {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 32px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
}

.page-subtitle {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.statistics-section {
  margin-bottom: 24px;
}

.statistics-cards {
  margin-bottom: 0;
}

.stat-card {
  border: none;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 120px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.stat-card-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card-green {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-card-orange {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-card-purple {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0;
}

.stat-icon {
  font-size: 48px;
  margin-right: 20px;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  opacity: 0.9;
}

.stat-desc {
  font-size: 12px;
  opacity: 0.7;
}

.charts-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.analysis-tabs {
  border: none;
}

.analysis-tabs :deep(.el-tabs__header) {
  background: #fafbfc;
  border-bottom: 1px solid #e8eaec;
  margin: 0;
}

.analysis-tabs :deep(.el-tabs__item) {
  color: #666;
  font-weight: 500;
  transition: all 0.3s ease;
}

.analysis-tabs :deep(.el-tabs__item:hover) {
  color: #1890ff;
}

.analysis-tabs :deep(.el-tabs__item.is-active) {
  color: #1890ff;
  background: white;
}

.analysis-tabs :deep(.el-tabs__content) {
  padding: 24px;
}

.chart-card {
  border: 1px solid #e8eaec;
  border-radius: 8px;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.chart-card :deep(.el-card__body) {
  padding: 20px;
}

.chart-container {
  height: 400px;
  width: 380px;
}

.chart-container-large {
  height: 500px;
  width: 700px;
}

.chart-controls {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 8px;
  border: 1px solid #e8eaec;
}

.control-label {
  font-weight: 500;
  color: #262626;
  margin-right: 12px;
}

.control-input {
  margin-right: 12px;
  width: 180px;
}

.control-btn {
  border-radius: 6px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .statistics-cards .el-col {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .drug-analysis-container {
    padding: 16px;
  }

  .header-content {
    padding: 24px;
  }

  .page-title {
    font-size: 24px;
  }

  .stat-content {
    flex-direction: column;
    text-align: center;
  }

  .stat-icon {
    margin-right: 0;
    margin-bottom: 8px;
    font-size: 32px;
  }

  .stat-value {
    font-size: 24px;
  }

  .chart-container,
  .chart-container-large {
    height: 300px;
  }

  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .control-label {
    margin-bottom: 8px;
  }

  .control-input {
    margin-right: 0;
    margin-bottom: 12px;
    width: 100%;
  }
}

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

.stat-card,
.chart-card {
  animation: fadeInUp 0.6s ease-out;
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }

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
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-text {
  font-size: 16px;
}
</style>
