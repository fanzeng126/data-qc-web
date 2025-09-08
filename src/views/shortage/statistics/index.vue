<template>
  <div class="statistics-container">
    <!-- 页面头部 -->
    <PageHeader
      title="短缺药品统计分析"
      content="全面监控和分析药品短缺情况，提供多维度统计报表"
      :actions="headerActions"
      @action-click="handleHeaderAction"
    >
      <template #extra>
        <el-form :model="queryParams" :inline="true" class="search-form">
          <el-form-item label="专区">
            <el-select
              v-model="queryParams.zoneId"
              placeholder="全部"
              clearable
              style="width: 130px"
              @change="loadAllData"
            >
              <el-option label="全部" :value="null" />
              <el-option
                v-for="zone in zoneList"
                :key="zone.id"
                :label="zone.zoneName"
                :value="zone.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间">
            <el-select
              v-model="queryParams.reportWeek"
              placeholder="选择周期"
              style="width: 130px"
              @change="loadAllData"
            >
              <el-option
                v-for="week in weekOptions"
                :key="week.value"
                :label="week.label"
                :value="week.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              @click="loadAllData"
            >
              <el-icon v-if="!loading"><Refresh /></el-icon>
              <el-icon v-else><Loading /></el-icon>
              刷新
            </el-button>
          </el-form-item>
        </el-form>
      </template>
    </PageHeader>

    <!-- 核心指标卡片 - 新增的4个主要指标 -->
    <div class="core-stats-cards">
      <el-row :gutter="20">
        <!-- 填报机构数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(64, 158, 255, 0.1)">
              <Icon icon="ep:office-building" class="stat-icon" style="color: #409eff" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="simpleOverview?.reportOrgCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">家</span>
              </div>
              <div class="stat-label">填报机构数</div>
            </div>
          </div>
        </el-col>

        <!-- 填报药品数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(103, 194, 58, 0.1)">
              <Icon icon="ep:medicine-box" class="stat-icon" style="color: #67c23a" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="simpleOverview?.reportDrugCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">种</span>
              </div>
              <div class="stat-label">填报药品数</div>
            </div>
          </div>
        </el-col>

        <!-- 短缺药品数 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(245, 108, 108, 0.1)">
              <Icon icon="ep:warning-filled" class="stat-icon" style="color: #f56c6c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="simpleOverview?.shortageDrugCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">种</span>
              </div>
              <div class="stat-label">短缺药品数</div>
            </div>
          </div>
        </el-col>

        <!-- 填报完成率 -->
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(230, 162, 60, 0.1)">
              <Icon icon="ep:circle-check-filled" class="stat-icon" style="color: #e6a23c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="simpleOverview?.completionRate || 0"
                  :duration="1500"
                  :decimals="1"
                />
                <span class="stat-suffix">%</span>
              </div>
              <div class="stat-label">填报完成率</div>
              <el-progress
                :percentage="simpleOverview?.completionRate || 0"
                :stroke-width="3"
                :show-text="false"
                :color="getCompletionColor(simpleOverview?.completionRate || 0)"
                class="stat-progress"
              />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 其他指标 -->
    <div class="other-stats-cards" v-if="overview">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(230, 162, 60, 0.1)">
              <Icon icon="ep:grid" class="stat-icon" style="color: #e6a23c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.dosageFormCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">类</span>
              </div>
              <div class="stat-label">剂型分类</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(144, 147, 153, 0.1)">
              <Icon icon="ep:trend-charts" class="stat-icon" style="color: #909399" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.weeklyUsageTotal || 0"
                  :duration="1500"
                />
              </div>
              <div class="stat-label">周使用量</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(64, 158, 255, 0.1)">
              <Icon icon="ep:goods" class="stat-icon" style="color: #409eff" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.currentStockTotal || 0"
                  :duration="1500"
                />
              </div>
              <div class="stat-label">实时库存</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div class="core-stat-card">
            <div class="stat-icon-wrapper" style="background: rgba(245, 108, 108, 0.1)">
              <Icon icon="ep:bell" class="stat-icon" style="color: #f56c6c" />
            </div>
            <div class="stat-content">
              <div class="stat-value">
                <CountTo
                  :start-val="0"
                  :end-val="overview?.stockAlertCount || 0"
                  :duration="1500"
                />
                <span class="stat-suffix">个</span>
              </div>
              <div class="stat-label">库存预警</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 - 优化布局 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 供应状况分布 - 紧凑版 -->
      <el-col :xs="24" :sm="12" :md="8">
        <ContentWrap class="chart-card">
          <div class="card-header-compact">
            <Icon icon="ep:pie-chart" />
            <span>供应状况分布</span>
          </div>
          <div class="supply-distribution-compact">
            <div ref="supplyPieChartRef" class="compact-pie-chart"></div>
            <div class="distribution-legend">
              <div v-for="item in supplyDistribution" :key="item.supplyStatus"
                   class="legend-item-compact">
                <div class="legend-dot" :style="{ backgroundColor: getStatusColor(item.supplyStatus) }"></div>
                <span class="legend-label">{{ item.statusName }}</span>
                <span class="legend-value">{{ item.percentage }}%</span>
                <span class="legend-trend" v-if="item.monthOnMonth">
                  <Icon :icon="getTrendIcon(item.monthOnMonth)" />
                </span>
              </div>
            </div>
          </div>
        </ContentWrap>
      </el-col>

      <!-- 剂型分类图 -->
      <el-col :xs="24" :sm="12" :md="8">
        <ContentWrap class="chart-card">
          <div class="card-header-compact">
            <Icon icon="ep:grid" />
            <span>剂型分类统计</span>
          </div>
          <div ref="dosageFormChartRef" class="chart-container-compact"></div>
        </ContentWrap>
      </el-col>

      <!-- 库存分析图 -->
      <el-col :xs="24" :sm="12" :md="8">
        <ContentWrap class="chart-card">
          <div class="card-header-compact">
            <Icon icon="ep:goods" />
            <span>库存分布分析</span>
          </div>
          <div ref="stockAnalysisChartRef" class="chart-container-compact"></div>
        </ContentWrap>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="16" class="chart-row">
      <!-- 周使用量趋势 -->
      <el-col :xs="24" :md="12">
        <ContentWrap class="chart-card">
          <div class="card-header-compact">
            <Icon icon="ep:trend-charts" />
            <span>周使用量趋势</span>
            <el-tag size="small" class="trend-tag">
              均值: {{ formatNumber(weeklyUsageTrend?.avgUsage) }}
            </el-tag>
          </div>
          <div ref="usageTrendChartRef" class="chart-container-medium"></div>
        </ContentWrap>
      </el-col>

      <!-- 短缺趋势预测 -->
      <el-col :xs="24" :md="12">
        <ContentWrap class="chart-card">
          <div class="card-header-compact">
            <Icon icon="ep:data-analysis" />
            <span>短缺趋势预测</span>
            <el-tag size="small" type="warning" class="trend-tag">
              含预测数据
            </el-tag>
          </div>
          <div ref="shortageTrendChartRef" class="chart-container-medium"></div>
        </ContentWrap>
      </el-col>
    </el-row>

    <!-- 短缺药品详情表格 -->
    <ContentWrap>
      <div class="card-header-compact" style="margin-bottom: 16px">
        <Icon icon="ep:warning" />
        <span>短缺药品详情</span>
        <el-badge :value="shortageDetails.length" class="item" type="danger" />
      </div>

      <el-table :data="shortageDetails" border v-loading="loading" size="small">
        <el-table-column label="药品名称" prop="drugName" width="180" fixed>
          <template #default="scope">
            <el-tooltip :content="scope.row.drugName + ' - ' + scope.row.dosageForm">
              <span class="drug-name">{{ scope.row.drugName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="剂型" prop="dosageForm" width="100" />
        <el-table-column label="短缺机构" prop="shortageOrgCount" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" type="warning">{{ scope.row.shortageOrgCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="严重短缺" prop="severeShortageOrgCount" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" type="danger">{{ scope.row.severeShortageOrgCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="平均库存(天)" prop="avgStockDays" width="110" align="center">
          <template #default="scope">
            <el-progress
              :percentage="Math.min(scope.row.avgStockDays * 10, 100)"
              :color="getStockDaysColor(scope.row.avgStockDays)"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="stock-days-text"
                  :style="{ color: getStockDaysColor(scope.row.avgStockDays) }">
              {{ scope.row.avgStockDays.toFixed(1) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" :type="getRiskLevelType(scope.row.riskLevel)">
              {{ scope.row.riskLevelName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="viewDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="tablePageNo"
          v-model:page-size="tablePageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="shortageTotal"
          layout="total, sizes, prev, pager, next, jumper"
          size="small"
          @size-change="loadShortageDetails"
          @current-change="loadShortageDetails"
        />
      </div>
    </ContentWrap>

    <!-- 机构排名 -->
    <ContentWrap>
      <div class="card-header-compact" style="margin-bottom: 16px">
        <Icon icon="ep:trophy" />
        <span>机构填报排名</span>
      </div>

      <el-table :data="orgRanking" stripe size="small" max-height="300">
        <el-table-column label="排名" prop="rank" width="60" align="center">
          <template #default="scope">
            <div class="rank-badge" :class="'rank-' + scope.row.rank">
              {{ scope.row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="机构名称" prop="orgName" min-width="200" />
        <el-table-column label="完成率" prop="completionRate" width="100" align="center">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.completionRate"
              :color="getCompletionColor(scope.row.completionRate)"
              :stroke-width="4"
              :text-inside="true"
            />
          </template>
        </el-table-column>
        <el-table-column label="填报药品" prop="reportDrugCount" width="90" align="center" />
        <el-table-column label="短缺药品" prop="shortageDrugCount" width="90" align="center">
          <template #default="scope">
            <el-tag size="small" v-if="scope.row.shortageDrugCount > 0" type="warning">
              {{ scope.row.shortageDrugCount }}
            </el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="及时率" prop="timelyRate" width="80" align="center">
          <template #default="scope">
            {{ scope.row.timelyRate }}%
          </template>
        </el-table-column>
      </el-table>
    </ContentWrap>
  </div>

  <!-- 详情对话框 -->
  <DetailDialog ref="detailDialogRef" />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Refresh, Loading } from '@element-plus/icons-vue'
import { CountTo } from '@/components/CountTo'
import {
  ReportZoneApi,
  type ReportZoneVO
} from '@/api/shortage'
import {
  StatisticsApi,
  type StatisticsQueryVO,
  type StatisticsOverviewVO,
  type SimpleQueryVO,
  type SimpleOverviewVO,
  type SupplyDistributionVO,
  type ShortageDetailVO,
  type DosageFormChartVO,
  type WeeklyUsageTrendVO,
  type StockAnalysisVO,
  type OrgRankingVO,
  type DrugShortageTrendVO,
  formatNumber,
  getTrendIcon,
  getTrendColor
} from '@/api/shortage/statistics'
import * as echarts from 'echarts'
import DetailDialog from './components/DetailDialog.vue'
import PageHeader from '@/components/PageHeader/index.vue'

defineOptions({ name: 'ShortageStatisticsEnhanced' })

const message = useMessage()
const loading = ref(false)
const exportLoading = ref(false)

// 查询参数
const queryParams = reactive<StatisticsQueryVO>({
  zoneId: null,
  reportWeek: getCurrentWeek()
})

// 数据状态
const overview = ref<StatisticsOverviewVO>()
const simpleOverview = ref<SimpleOverviewVO>()  // 核心指标专用
const supplyDistribution = ref<SupplyDistributionVO[]>([])
const shortageDetails = ref<ShortageDetailVO[]>([])
const dosageFormData = ref<DosageFormChartVO[]>([])
const weeklyUsageTrend = ref<WeeklyUsageTrendVO>()
const stockAnalysis = ref<StockAnalysisVO>()
const orgRanking = ref<OrgRankingVO[]>([])
const shortageTrend = ref<DrugShortageTrendVO>()
const zoneList = ref<ReportZoneVO[]>([])

// 简化查询参数 - 专用于核心指标
const simpleQueryParams = computed<SimpleQueryVO>(() => ({
  zoneId: queryParams.zoneId,
  reportWeek: queryParams.reportWeek
}))

// 表格分页
const tablePageNo = ref(1)
const tablePageSize = ref(20)
const shortageTotal = ref(0)

// 图表实例
const supplyPieChartRef = ref()
const dosageFormChartRef = ref()
const stockAnalysisChartRef = ref()
const usageTrendChartRef = ref()
const shortageTrendChartRef = ref()

let supplyPieChart: echarts.ECharts | null = null
let dosageFormChart: echarts.ECharts | null = null
let stockAnalysisChart: echarts.ECharts | null = null
let usageTrendChart: echarts.ECharts | null = null
let shortageTrendChart: echarts.ECharts | null = null

// 头部操作按钮
const headerActions = computed(() => [
  {
    key: 'search',
    text: '查询',
    type: 'primary' as const,
    icon: 'Search',
    loading: loading.value,
    handler: () => loadAllData()
  },
  {
    key: 'reset',
    text: '重置',
    type: 'default' as const,
    icon: 'Refresh',
    handler: () => resetQuery()
  },
  {
    key: 'export',
    text: '导出',
    type: 'success' as const,
    icon: 'Download',
    loading: exportLoading.value,
    handler: () => handleExport()
  }
])

// 周期选项
const weekOptions = computed(() => {
  const options = []
  const now = new Date()

  for (let i = 0; i < 12; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i * 7)
    const week = getWeekNumber(date)
    const year = date.getFullYear()
    const weekStr = `${year}-${week.toString().padStart(2, '0')}`

    options.push({
      value: weekStr,
      label: `${weekStr}周${i === 0 ? ' (本周)' : ''}`
    })
  }

  return options
})

// 获取当前周期
function getCurrentWeek(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}`
}

// 获取周数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

// 处理头部操作
const handleHeaderAction = (action: any) => {
  if (action.handler) {
    action.handler()
  }
}

// 格式化统计值
const formatStatValue = (value: number | undefined, suffix: string): string => {
  if (value == null) return '0' + suffix

  if (suffix === '类' || suffix === '个') {
    return value + suffix
  }

  return formatNumber(value)
}

// 获取供应状态颜色
const getStatusColor = (status: number): string => {
  const colors: Record<number, string> = {
    1: '#67c23a',
    2: '#e6a23c',
    3: '#f56c6c',
    4: '#ff3333'
  }
  return colors[status] || '#909399'
}

// 获取库存天数颜色
const getStockDaysColor = (days: number): string => {
  if (days <= 3) return '#ff3333'
  if (days <= 7) return '#e6a23c'
  return '#67c23a'
}

// 获取风险等级类型
const getRiskLevelType = (level: number | undefined): string => {
  const types: Record<number, string> = {
    1: 'info',
    2: 'warning',
    3: 'danger'
  }
  return types[level || 1] || 'info'
}

// 获取完成率颜色
const getCompletionColor = (rate: number): string => {
  if (rate >= 95) return '#67c23a'
  if (rate >= 80) return '#e6a23c'
  return '#f56c6c'
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadSimpleOverview(),  // 新增简化概览
      loadOverview(),
      loadSupplyDistribution(),
      loadShortageDetails(),
      loadDosageFormChart(),
      loadWeeklyUsageTrend(),
      loadStockAnalysis(),
      loadOrgRanking(),
      loadShortageTrend()
    ])

    // 更新图表
    nextTick(() => {
      updateAllCharts()
    })
  } catch (error) {
    console.error('加载数据失败:', error)
    message.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载简化概览（核心指标专用）
const loadSimpleOverview = async () => {
  simpleOverview.value = await StatisticsApi.getSimpleOverview(simpleQueryParams.value)
}

// 加载总体概况
const loadOverview = async () => {
  overview.value = await StatisticsApi.getOverview(queryParams)
}

// 加载供应分布
const loadSupplyDistribution = async () => {
  supplyDistribution.value = await StatisticsApi.getSupplyDistribution(queryParams)
}

// 加载短缺详情
const loadShortageDetails = async () => {
  const params = {
    ...queryParams,
    pageNo: tablePageNo.value,
    pageSize: tablePageSize.value
  }
  const data = await StatisticsApi.getShortageDetails(params)
  shortageDetails.value = data.list || data
  shortageTotal.value = data.total || data.length
}

// 加载剂型统计
const loadDosageFormChart = async () => {
  dosageFormData.value = await StatisticsApi.getDosageFormChart(queryParams)
}

// 加载周使用量趋势
const loadWeeklyUsageTrend = async () => {
  weeklyUsageTrend.value = await StatisticsApi.getWeeklyUsageTrend(queryParams)
}

// 加载库存分析
const loadStockAnalysis = async () => {
  stockAnalysis.value = await StatisticsApi.getStockAnalysis(queryParams)
}

// 加载机构排名
const loadOrgRanking = async () => {
  orgRanking.value = await StatisticsApi.getOrgRanking({ ...queryParams, pageSize: 10 })
}

// 加载短缺趋势
const loadShortageTrend = async () => {
  shortageTrend.value = await StatisticsApi.getDrugShortageTrend(queryParams)
}

// 加载专区列表
const loadZoneList = async () => {
  try {
    const data = await ReportZoneApi.getPage({
      pageNo: 1,
      pageSize: 100,
      status: 1
    })
    zoneList.value = data.list
  } catch (error) {
    console.error('加载专区列表失败:', error)
  }
}

// 重置查询
const resetQuery = () => {
  queryParams.zoneId = null
  queryParams.reportWeek = getCurrentWeek()
  loadAllData()
}

// 导出报告
const handleExport = async () => {
  exportLoading.value = true
  try {
    await StatisticsApi.exportReport(queryParams)
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 查看详情
const detailDialogRef = ref()
const viewDetail = (item: ShortageDetailVO) => {
  detailDialogRef.value?.open(item)
}

// 更新所有图表
const updateAllCharts = () => {
  updateSupplyPieChart()
  updateDosageFormChart()
  updateStockAnalysisChart()
  updateUsageTrendChart()
  updateShortageTrendChart()
}

// 更新供应分布饼图
const updateSupplyPieChart = () => {
  if (!supplyPieChartRef.value || !supplyDistribution.value) return

  if (!supplyPieChart) {
    supplyPieChart = echarts.init(supplyPieChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: ['50%', '80%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: '12', fontWeight: 'bold' }
      },
      data: supplyDistribution.value.map(item => ({
        value: item.count,
        name: item.statusName,
        itemStyle: { color: getStatusColor(item.supplyStatus) }
      }))
    }]
  }

  supplyPieChart.setOption(option)
}

// 更新剂型分类图
const updateDosageFormChart = () => {
  if (!dosageFormChartRef.value || !dosageFormData.value) return

  if (!dosageFormChart) {
    dosageFormChart = echarts.init(dosageFormChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dosageFormData.value.map(item => item.dosageForm),
      axisTick: { alignWithLabel: true },
      axisLabel: { rotate: 45, fontSize: 10 }
    },
    yAxis: { type: 'value', name: '数量' },
    series: [
      {
        name: '药品数',
        type: 'bar',
        data: dosageFormData.value.map(item => item.drugCount),
        itemStyle: { color: '#409eff' }
      },
      {
        name: '短缺数',
        type: 'bar',
        data: dosageFormData.value.map(item => item.shortageCount),
        itemStyle: { color: '#f56c6c' }
      }
    ]
  }

  dosageFormChart.setOption(option)
}

// 更新库存分析图
const updateStockAnalysisChart = () => {
  if (!stockAnalysisChartRef.value || !stockAnalysis.value) return

  if (!stockAnalysisChart) {
    stockAnalysisChart = echarts.init(stockAnalysisChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [{
      type: 'pie',
      radius: '70%',
      data: stockAnalysis.value.distributions.map(item => ({
        value: item.count,
        name: item.range,
        itemStyle: {
          color: item.range.includes('0-3') ? '#f56c6c' :
            item.range.includes('4-7') ? '#e6a23c' :
              item.range.includes('8-14') ? '#409eff' : '#67c23a'
        }
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  stockAnalysisChart.setOption(option)
}

// 更新使用量趋势图
const updateUsageTrendChart = () => {
  if (!usageTrendChartRef.value || !weeklyUsageTrend.value) return

  if (!usageTrendChart) {
    usageTrendChart = echarts.init(usageTrendChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const weekIndex = params[0].dataIndex
        const usage = params[0].value
        const growth = weeklyUsageTrend.value!.growthRates[weekIndex]
        return `${params[0].name}<br/>
                使用量: ${formatNumber(usage)}<br/>
                环比: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`
      }
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: weeklyUsageTrend.value.weeks,
      axisTick: { alignWithLabel: true }
    },
    yAxis: {
      type: 'value',
      name: '使用量',
      axisLabel: {
        formatter: (value: number) => formatNumber(value)
      }
    },
    series: [{
      name: '使用量',
      type: 'line',
      smooth: true,
      data: weeklyUsageTrend.value.usageData,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      },
      itemStyle: { color: '#409eff' },
      markLine: {
        data: [{
          type: 'average',
          name: '平均值',
          label: { formatter: '均值: {c}' }
        }],
        lineStyle: { color: '#e6a23c' }
      }
    }]
  }

  usageTrendChart.setOption(option)
}

// 更新短缺趋势图
const updateShortageTrendChart = () => {
  if (!shortageTrendChartRef.value || !shortageTrend.value) return

  if (!shortageTrendChart) {
    shortageTrendChart = echarts.init(shortageTrendChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['短缺数', '严重短缺', '预测'],
      bottom: 0
    },
    grid: {
      top: '10%',
      left: '3%',
      right: '4%',
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [...shortageTrend.value.timeAxis, ...['预测1', '预测2', '预测3', '预测4']],
      axisTick: { alignWithLabel: true }
    },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '短缺率(%)', position: 'right' }
    ],
    series: [
      {
        name: '短缺数',
        type: 'line',
        data: shortageTrend.value.shortageCountTrend,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '严重短缺',
        type: 'line',
        data: shortageTrend.value.severeShortageCountTrend,
        itemStyle: { color: '#f56c6c' }
      },
      {
        name: '预测',
        type: 'line',
        data: [...new Array(shortageTrend.value.timeAxis.length).fill(null),
          ...(shortageTrend.value.forecastData || [])],
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#909399' }
      }
    ]
  }

  shortageTrendChart.setOption(option)
}

// 初始化
onMounted(() => {
  loadZoneList()
  loadAllData()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    supplyPieChart?.resize()
    dosageFormChart?.resize()
    stockAnalysisChart?.resize()
    usageTrendChart?.resize()
    shortageTrendChart?.resize()
  })
})

// 清理
onUnmounted(() => {
  supplyPieChart?.dispose()
  dosageFormChart?.dispose()
  stockAnalysisChart?.dispose()
  usageTrendChart?.dispose()
  shortageTrendChart?.dispose()
})
</script>

<style scoped lang="scss">
.statistics-container {
  padding: 8px;
}

.search-form {
  margin: 0;

  .el-form-item {
    margin-bottom: 0;
  }
}

// 核心指标卡片样式
.core-stats-cards {
  margin: 20px 0;
}

.core-stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  height: 120px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .stat-icon-wrapper {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    flex-shrink: 0;

    .stat-icon {
      font-size: 32px;
    }
  }

  .stat-content {
    flex: 1;
    min-width: 0;

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      line-height: 1.2;
      display: flex;
      align-items: baseline;

      .stat-suffix {
        font-size: 14px;
        font-weight: 400;
        color: #909399;
        margin-left: 4px;
      }
    }

    .stat-label {
      font-size: 14px;
      color: #606266;
      margin-top: 8px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
      font-size: 12px;
      color: #909399;
    }

    .stat-progress {
      margin-top: 8px;
    }
  }
}

// 其他指标
.other-stats-cards {
  margin: 20px 0;
}

.chart-row {
  margin-bottom: 16px;
}

.chart-card {
  height: 100%;
  padding: 12px !important;
}

.card-header-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;

  .trend-tag {
    margin-left: auto;
  }
}

.supply-distribution-compact {
  display: flex;
  align-items: center;
  gap: 16px;
}

.compact-pie-chart {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.distribution-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  color: #606266;
}

.legend-value {
  font-weight: 600;
  color: #303133;
}

.legend-trend {
  font-size: 10px;
  color: #909399;
}

.chart-container-compact {
  height: 180px;
}

.chart-container-medium {
  height: 280px;
}

.drug-name {
  font-weight: 500;
  color: #303133;
  cursor: pointer;

  &:hover {
    color: #409eff;
  }
}

.stock-days-text {
  font-size: 12px;
  font-weight: 600;
  margin-left: 4px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.rank-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;

  &.rank-1 {
    background: linear-gradient(135deg, #ffd700, #ffed4e);
    color: #fff;
  }

  &.rank-2 {
    background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
    color: #fff;
  }

  &.rank-3 {
    background: linear-gradient(135deg, #cd7f32, #e6a865);
    color: #fff;
  }
}

// 响应式布局
@media (max-width: 768px) {
  .core-stat-card {
    height: 100px;
    padding: 16px;

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;

      .stat-icon {
        font-size: 24px;
      }
    }

    .stat-content {
      .stat-value {
        font-size: 24px;
      }

      .stat-label {
        font-size: 12px;
      }
    }
  }

  .supply-distribution-compact {
    flex-direction: column;
  }

  .compact-pie-chart {
    width: 100%;
    height: 150px;
  }
}
</style>
