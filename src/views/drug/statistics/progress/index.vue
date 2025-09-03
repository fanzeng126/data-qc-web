<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import * as echarts from 'echarts'
import { ElCard, ElRow, ElCol, ElStatistic, ElButton, ElTooltip } from 'element-plus'
import type { ECharts } from 'echarts'
import { getInstitutionReportStats, type InstitutionReportStatsVO } from '@/api/drug/statistics'

// 数据
const reportStats = ref<InstitutionReportStatsVO | null>(null)
const loading = ref(false)
const currentYear = ref('2021')

// 图表实例
const progressChart = ref<HTMLElement | null>(null)
const provinceChart = ref<HTMLElement | null>(null)
const cityDetailChart = ref<HTMLElement | null>(null)
let progressEchart: ECharts | null = null
let provinceEchart: ECharts | null = null
let cityDetailEchart: ECharts | null = null

// 计算属性
const basicStats = computed(() => reportStats.value?.basicStats || {
  totalInstitutions: 2734,
  reportRate: 83,
  openTime: '2022-04-22',
  deadlineTime: '2022-05-05',
  reportedInstitutions: 871,
  unreportedInstitutions: 1863,
  unregisteredInstitutions: 212
})

const levelStats = computed(() => reportStats.value?.levelStats || {
  level3: { count: 75, rate: 75 },
  level2: { count: 65, rate: 65 },
  baseLevel: { count: 69, rate: 69 }
})

const cityReports = computed(() => reportStats.value?.cityReports || [
  { cityName: '枣庄市', reportRate: 80, formula: '0/33/33', level3Stats: { reported: 0, total: 33 }, level2Stats: { reported: 2, total: 71 }, baseStats: { reported: 0, total: 11 } },
  { cityName: '潍坊市', reportRate: 100, formula: '0/0/0', level3Stats: { reported: 0, total: 0 }, level2Stats: { reported: 0, total: 0 }, baseStats: { reported: 0, total: 0 } },
  { cityName: '烟台市', reportRate: 90, formula: '0/0/0', level3Stats: { reported: 0, total: 0 }, level2Stats: { reported: 0, total: 0 }, baseStats: { reported: 0, total: 0 } },
  { cityName: '威海市', reportRate: 10, formula: '0/0/0', level3Stats: { reported: 0, total: 0 }, level2Stats: { reported: 0, total: 0 }, baseStats: { reported: 0, total: 0 } },
  { cityName: '东营市', reportRate: 20, formula: '0/0/0', level3Stats: { reported: 0, total: 0 }, level2Stats: { reported: 0, total: 0 }, baseStats: { reported: 0, total: 0 } },
  { cityName: '菏泽市', reportRate: 30, formula: '0/0/0', level3Stats: { reported: 0, total: 0 }, level2Stats: { reported: 0, total: 0 }, baseStats: { reported: 0, total: 0 } },
  { cityName: '青岛市', reportRate: 90, formula: '0/0/0', level3Stats: { reported: 0, total: 0 }, level2Stats: { reported: 0, total: 0 }, baseStats: { reported: 0, total: 0 } }
])

const detailCards = computed(() => reportStats.value?.detailCards || {
  totalInstitutions: 2734,
  reportedCount: 871,
  unreportedCount: 1863,
  unregisteredCount: 212,
  internalAuditCount: 24,
  managedUsers: 5
})

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const result = await getInstitutionReportStats(currentYear.value)
    reportStats.value = result
  } catch (error) {
    console.error('获取机构填报统计失败:', error)
  } finally {
    loading.value = false
  }
}

// 初始化进度圆环图表
const initProgressCharts = () => {
  if (!progressChart.value) return
  
  progressEchart = echarts.init(progressChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        name: '三级',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['25%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: levelStats.value.level3.rate,
            name: '已完成',
            itemStyle: { color: '#4A90E2' }
          },
          {
            value: 100 - levelStats.value.level3.rate,
            name: '未完成',
            itemStyle: { color: '#E5E5E5' }
          }
        ]
      },
      {
        name: '二级',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: levelStats.value.level2.rate,
            name: '已完成',
            itemStyle: { color: '#7ED321' }
          },
          {
            value: 100 - levelStats.value.level2.rate,
            name: '未完成',
            itemStyle: { color: '#E5E5E5' }
          }
        ]
      },
      {
        name: '基层',
        type: 'pie',
        radius: ['40%', '55%'],
        center: ['75%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: levelStats.value.baseLevel.rate,
            name: '已完成',
            itemStyle: { color: '#F5A623' }
          },
          {
            value: 100 - levelStats.value.baseLevel.rate,
            name: '未完成',
            itemStyle: { color: '#E5E5E5' }
          }
        ]
      }
    ]
  }
  
  progressEchart.setOption(option)
}

// 初始化全省概览柱状图
const initProvinceChart = () => {
  if (!provinceChart.value) return
  
  provinceEchart = echarts.init(provinceChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const item = params[0]
        const cityData = cityReports.value.find(city => city.cityName === item.name)
        return `
          ${item.name}<br/>
          <span style="color:#4A90E2;">上报率: ${item.value}%</span><br/>
          级别: ${cityData?.formula || ''}
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: cityReports.value.map(item => item.cityName),
      axisLabel: {
        interval: 0,
        rotate: 0,
        fontSize: 11,
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '上报率(%)',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: cityReports.value.map(item => ({
          value: item.reportRate,
          itemStyle: {
            color: item.reportRate >= 80 ? '#4A90E2' : '#F39800'
          }
        })),
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
  
  provinceEchart.setOption(option)
}

// 初始化市级详情图表
const initCityDetailChart = () => {
  if (!cityDetailChart.value) return
  
  cityDetailEchart = echarts.init(cityDetailChart.value)
  
  // 以淄博市数据为例
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['三级', '二级', '基层'],
      textStyle: {
        color: '#666'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['已上报', '未上报', '未注册'],
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      }
    },
    series: [
      {
        name: '三级',
        type: 'bar',
        stack: 'total',
        data: [30, 35, 27],
        itemStyle: {
          color: '#4A90E2'
        }
      },
      {
        name: '二级', 
        type: 'bar',
        stack: 'total',
        data: [35, 27, 0],
        itemStyle: {
          color: '#7ED321'
        }
      },
      {
        name: '基层',
        type: 'bar',
        stack: 'total', 
        data: [27, 0, 0],
        itemStyle: {
          color: '#F5A623'
        }
      }
    ]
  }
  
  cityDetailEchart.setOption(option)
}

// 生命周期
onMounted(async () => {
  await fetchData()
  setTimeout(() => {
    initProgressCharts()
    initProvinceChart()
    initCityDetailChart()
  }, 100)
})

// 返回全省界面（模拟功能）
const backToProvince = () => {
  console.log('返回全省界面')
}
</script>

<template>
  <div class="institution-progress-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ currentYear }}年上报数据</h1>
        <div class="header-info">
          <div class="basic-info">
            <span class="info-item">
              <strong>{{ basicStats.totalInstitutions }}家</strong>
              应监测机构数
            </span>
            <span class="info-item">
              <strong class="report-rate">{{ basicStats.reportRate }}%</strong>
              上报率
            </span>
            <span class="info-item">
              开放时间: {{ basicStats.openTime }}
            </span>
            <span class="info-item">
              截止时间: {{ basicStats.deadlineTime }}
            </span>
            <span class="status-badge">上报任务已完成</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计内容区域 -->
    <div class="content-section">
      <el-row :gutter="24">
        <!-- 左侧内容 -->
        <el-col :span="16">
          <!-- 进度环形图 -->
          <el-card class="progress-card" shadow="never">
            <div class="progress-section">
              <div class="progress-charts" ref="progressChart"></div>
              <div class="progress-labels">
                <div class="progress-item">
                  <div class="progress-percentage" style="color: #4A90E2;">{{ levelStats.level3.rate }}%</div>
                  <div class="progress-name">三级</div>
                  <div class="progress-range">0% - 100%</div>
                </div>
                <div class="progress-item">
                  <div class="progress-percentage" style="color: #7ED321;">{{ levelStats.level2.rate }}%</div>
                  <div class="progress-name">二级</div>
                  <div class="progress-range">0% - 100%</div>
                </div>
                <div class="progress-item">
                  <div class="progress-percentage" style="color: #F5A623;">{{ levelStats.baseLevel.rate }}%</div>
                  <div class="progress-name">基层</div>
                  <div class="progress-range">0% - 100%</div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 全省概览 -->
          <el-card class="province-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">全省概览</span>
                <el-tooltip content="查看各区域可查看信息" placement="top">
                  <i class="el-icon-question"></i>
                </el-tooltip>
              </div>
            </template>
            <div class="province-chart" ref="provinceChart"></div>
            <div class="legend-info">
              <span class="legend-item">
                <span class="legend-color" style="background: #4A90E2;"></span>
                已上报
              </span>
              <span class="legend-item">
                <span class="legend-color" style="background: #F39800;"></span>
                未上报
              </span>
            </div>
          </el-card>

          <!-- 淄博市医疗机构上报情况 -->
          <el-card class="city-detail-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span class="card-title">淄博市医疗机构上报情况</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="backToProvince"
                  class="back-btn"
                >
                  <i class="el-icon-back"></i>
                  返回全省界面
                </el-button>
              </div>
            </template>
            <div class="city-detail-chart" ref="cityDetailChart"></div>
          </el-card>
        </el-col>

        <!-- 右侧统计信息 -->
        <el-col :span="8">
          <div class="stats-sidebar">
            <!-- 统计卡片 -->
            <el-card class="stat-item" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ detailCards.totalInstitutions }}家</div>
                <div class="stat-label">应监测机构数</div>
              </div>
            </el-card>

            <el-card class="stat-item" shadow="never">
              <div class="stat-content">
                <div class="stat-number primary">{{ detailCards.reportedCount }}家</div>
                <div class="stat-label">已上报数</div>
              </div>
            </el-card>

            <el-card class="stat-item" shadow="never">
              <div class="stat-content">
                <div class="stat-number warning">{{ detailCards.unreportedCount }}家</div>
                <div class="stat-label">未上报数</div>
              </div>
            </el-card>

            <el-card class="stat-item" shadow="never">
              <div class="stat-content">
                <div class="stat-number danger">{{ detailCards.unregisteredCount }}家</div>
                <div class="stat-label">未注册数</div>
              </div>
            </el-card>

            <el-card class="stat-item" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ detailCards.internalAuditCount }}家</div>
                <div class="stat-label">监管外上报</div>
              </div>
            </el-card>

            <el-card class="stat-item" shadow="never">
              <div class="stat-content">
                <div class="stat-number">{{ detailCards.managedUsers }}</div>
                <div class="stat-label">管理用户数</div>
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style scoped>
.institution-progress-container {
  padding: 24px;
  background: #f0f2f5;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  padding: 24px 32px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
}

.page-title {
  margin: 0 0 16px 0;
  font-size: 28px;
  font-weight: 600;
}

.basic-info {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.info-item {
  font-size: 14px;
  opacity: 0.9;
}

.info-item strong {
  font-size: 18px;
  margin-right: 4px;
}

.report-rate {
  color: #52c41a !important;
}

.status-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.content-section {
  margin-top: 24px;
}

/* 进度卡片 */
.progress-card {
  margin-bottom: 24px;
  border: none;
  border-radius: 8px;
}

.progress-section {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.progress-charts {
  flex: 1;
  height: 200px;
}

.progress-labels {
  display: flex;
  justify-content: space-around;
  width: 400px;
  margin-left: 40px;
}

.progress-item {
  text-align: center;
}

.progress-percentage {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
}

.progress-name {
  font-size: 16px;
  color: #333;
  margin-bottom: 4px;
}

.progress-range {
  font-size: 12px;
  color: #999;
}

/* 全省概览卡片 */
.province-card {
  margin-bottom: 24px;
  border: none;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.province-chart {
  height: 300px;
  margin-bottom: 16px;
}

.legend-info {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

/* 城市详情卡片 */
.city-detail-card {
  border: none;
  border-radius: 8px;
}

.back-btn {
  color: #1890ff;
  padding: 0;
}

.back-btn:hover {
  color: #40a9ff;
}

.city-detail-chart {
  height: 300px;
}

/* 右侧统计 */
.stats-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
  padding: 8px 0;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-number.primary {
  color: #1890ff;
}

.stat-number.warning {
  color: #faad14;
}

.stat-number.danger {
  color: #ff4d4f;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .progress-section {
    flex-direction: column;
  }
  
  .progress-labels {
    margin-left: 0;
    margin-top: 20px;
  }
}

@media (max-width: 768px) {
  .institution-progress-container {
    padding: 16px;
  }
  
  .basic-info {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .content-section :deep(.el-col) {
    margin-bottom: 16px;
  }
}
</style>