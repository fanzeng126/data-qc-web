<template>
  <div class="cost-analysis-container">
    <!-- 费用分析控制台 -->
    <!-- 这个控制台就像是财务分析师的工作台，提供各种分析工具和筛选条件 -->
    <div class="analysis-header">
      <el-card class="control-panel">
        <template #header>
          <div class="panel-header">
            <Icon icon="ep:money" class="header-icon" />
            <span class="header-title">费用分析控制台</span>
          </div>
        </template>

        <el-form :model="analysisParams" :inline="true" class="control-form">
          <el-form-item label="分析年度">
            <el-select v-model="analysisParams.year" @change="handleYearChange">
              <el-option
                v-for="year in availableYears"
                :key="year"
                :label="year + '年'"
                :value="year"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="对比维度">
            <el-select v-model="analysisParams.compareType" @change="handleCompareTypeChange">
              <el-option label="同比分析" value="yoy" />
              <el-option label="环比分析" value="mom" />
              <el-option label="预算对比" value="budget" />
            </el-select>
          </el-form-item>

          <el-form-item label="分析粒度">
            <el-radio-group v-model="analysisParams.granularity" @change="handleGranularityChange">
              <el-radio-button value="monthly">月度</el-radio-button>
              <el-radio-button value="quarterly">季度</el-radio-button>
              <el-radio-button value="yearly">年度</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="refreshAnalysis" :loading="loading">
              <Icon icon="ep:refresh" />
              更新分析
            </el-button>
            <el-button type="success" @click="handleExportReport">
              <Icon icon="ep:download" />
              导出报告
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 核心财务指标看板 -->
    <!-- 这个看板就像是企业的财务仪表盘，显示最关键的经济指标 -->
    <div class="financial-dashboard">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(indicator, index) in financialIndicators" :key="index">
          <el-card class="financial-card" :class="indicator.trend">
            <div class="financial-content">
              <div class="financial-icon-wrapper">
                <div class="financial-icon" :style="{ backgroundColor: indicator.color }">
                  <Icon :icon="indicator.icon" />
                </div>
                <div class="trend-indicator" v-if="indicator.changeRate !== undefined">
                  <Icon :icon="indicator.changeRate >= 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                  <span :class="indicator.changeRate >= 0 ? 'positive' : 'negative'">
                    {{ Math.abs(indicator.changeRate) }}%
                  </span>
                </div>
              </div>
              <div class="financial-details">
                <div class="financial-value">{{ indicator.value }}</div>
                <div class="financial-label">{{ indicator.label }}</div>
                <div class="financial-subtitle">{{ indicator.subtitle }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预算执行情况监控 -->
    <!-- 这个部分就像是项目管理中的进度条，显示预算的执行进度 -->
    <div class="budget-monitor">
      <el-card class="budget-card">
        <template #header>
          <div class="budget-header">
            <Icon icon="ep:aim" class="budget-icon" />
            <span class="budget-title">预算执行监控</span>
            <div class="budget-status">
              <el-tag :type="budgetExecutionLevel" class="execution-tag">
                执行率：{{ budgetExecutionRate }}%
              </el-tag>
            </div>
          </div>
        </template>

        <div class="budget-content">
          <el-row :gutter="20">
            <el-col :span="16">
              <div class="budget-progress-section">
                <div class="budget-metrics">
                  <div class="budget-metric">
                    <span class="metric-label">年度预算</span>
                    <span class="metric-value budget">¥{{ formatAmount(budgetData.totalBudget) }}</span>
                  </div>
                  <div class="budget-metric">
                    <span class="metric-label">已执行</span>
                    <span class="metric-value executed">¥{{ formatAmount(budgetData.executedAmount) }}</span>
                  </div>
                  <div class="budget-metric">
                    <span class="metric-label">剩余预算</span>
                    <span class="metric-value remaining">¥{{ formatAmount(budgetData.remainingAmount) }}</span>
                  </div>
                </div>

                <div class="budget-progress-bar">
                  <el-progress
                    :percentage="budgetExecutionRate"
                    :stroke-width="20"
                    :color="getBudgetProgressColor()"
                    :show-text="false"
                  />
                  <div class="progress-labels">
                    <span class="progress-start">0%</span>
                    <span class="progress-target">目标: 95%</span>
                    <span class="progress-end">100%</span>
                  </div>
                </div>

                <div class="budget-breakdown">
                  <div class="breakdown-title">分类预算执行情况</div>
                  <div class="breakdown-items">
                    <div class="breakdown-item" v-for="item in budgetBreakdown" :key="item.category">
                      <div class="item-header">
                        <span class="item-name">{{ item.category }}</span>
                        <span class="item-rate">{{ item.executionRate }}%</span>
                      </div>
                      <el-progress
                        :percentage="item.executionRate"
                        :stroke-width="6"
                        :color="getProgressColor(item.executionRate)"
                        :show-text="false"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="budget-chart" ref="budgetChartRef"></div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 费用趋势与对比分析 -->
    <el-row :gutter="20" class="trend-analysis-section">
      <!-- 费用趋势图 -->
      <!-- 这个图表就像是股票走势图，显示费用随时间的变化趋势 -->
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:trend-charts" class="chart-icon" />
              <span class="chart-title">费用趋势分析</span>
              <div class="chart-controls">
                <el-checkbox-group v-model="selectedCostTypes" @change="updateTrendChart">
                  <el-checkbox value="total">总费用</el-checkbox>
                  <el-checkbox value="baseDrug">基药费用</el-checkbox>
                  <el-checkbox value="nonBaseDrug">非基药费用</el-checkbox>
                </el-checkbox-group>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef"></div>

          <!-- 趋势分析洞察 -->
          <div class="trend-insights">
            <div class="insight-item" v-for="insight in trendInsights" :key="insight.type">
              <Icon :icon="insight.icon" :class="insight.level" />
              <span class="insight-text">{{ insight.message }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 同比分析 -->
      <!-- 同比分析帮助了解费用的年度变化趋势 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:sort" class="chart-icon" />
              <span class="chart-title">同比变化分析</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="yoyChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 费用结构分析 -->
    <el-row :gutter="20" class="structure-analysis">
      <!-- 费用构成分析 -->
      <!-- 饼图清晰显示不同类别费用的占比结构 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:pie-chart" class="chart-icon" />
              <span class="chart-title">费用结构分析</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="structureChartRef"></div>
        </el-card>
      </el-col>

      <!-- 科室费用排行 -->
      <!-- 横向柱状图显示各科室的费用排名 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:office-building" class="chart-icon" />
              <span class="chart-title">科室费用排行</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="departmentCostChartRef"></div>
        </el-card>
      </el-col>

      <!-- 成本效益分析 -->
      <!-- 散点图显示成本与效益的关系 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:data-analysis" class="chart-icon" />
              <span class="chart-title">成本效益分析</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="costEfficiencyChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 成本控制与优化建议 -->
    <!-- 这个部分提供基于数据分析的管理建议，就像是财务顾问的专业意见 -->
    <div class="cost-optimization">
      <el-card class="optimization-card">
        <template #header>
          <div class="optimization-header">
            <Icon icon="ep:opportunity" class="optimization-icon" />
            <span class="optimization-title">成本优化建议</span>
            <div class="optimization-summary">
              <el-tag type="success" size="small">
                预计节约：¥{{ formatAmount(optimizationPotential) }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="optimization-content">
          <el-row :gutter="20">
            <el-col :span="8" v-for="(suggestion, index) in optimizationSuggestions" :key="index">
              <div class="suggestion-card" :class="suggestion.priority">
                <div class="suggestion-header">
                  <Icon :icon="suggestion.icon" class="suggestion-icon" />
                  <div class="suggestion-title">{{ suggestion.title }}</div>
                  <div class="suggestion-priority">{{ suggestion.priorityText }}</div>
                </div>
                <div class="suggestion-content">
                  <div class="suggestion-description">{{ suggestion.description }}</div>
                  <div class="suggestion-metrics">
                    <div class="metric">
                      <span class="metric-label">预计节约</span>
                      <span class="metric-value">¥{{ formatAmount(suggestion.expectedSavings) }}</span>
                    </div>
                    <div class="metric">
                      <span class="metric-label">实施难度</span>
                      <el-rate
                        v-model="suggestion.difficulty"
                        :max="5"
                        disabled
                        size="small"
                      />
                    </div>
                  </div>
                  <div class="suggestion-actions">
                    <el-button :type="suggestion.priority" size="small" @click="implementSuggestion(suggestion)">
                      {{ suggestion.actionText }}
                    </el-button>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 详细费用数据表格 -->
    <!-- 这个表格提供详细的费用明细，支持多维度钻取分析 -->
    <div class="cost-details-section">
      <el-card class="details-card">
        <template #header>
          <div class="details-header">
            <Icon icon="ep:data-board" class="header-icon" />
            <span class="header-title">费用明细数据</span>
            <div class="details-controls">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索科室或药品"
                prefix-icon="ep:search"
                clearable
                class="search-input"
              />
              <el-button type="primary" @click="exportDetailedData">
                <Icon icon="ep:download" />
                导出明细
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredCostData"
          v-loading="tableLoading"
          @sort-change="handleTableSort"
          height="400"
          show-summary
          :summary-method="getSummaryData"
        >
          <el-table-column label="时间" prop="period" width="100" align="center" />
          <el-table-column label="科室" prop="departmentName" width="120" />
          <el-table-column
            label="总费用"
            prop="totalCost"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span class="cost-cell total">¥{{ formatAmount(scope.row.totalCost) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="基药费用"
            prop="baseDrugCost"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span class="cost-cell base">¥{{ formatAmount(scope.row.baseDrugCost) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="非基药费用"
            prop="nonBaseDrugCost"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span class="cost-cell non-base">¥{{ formatAmount(scope.row.nonBaseDrugCost) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="基药占比"
            prop="baseDrugRatio"
            width="100"
            align="center"
          >
            <template #default="scope">
              <el-progress
                :percentage="scope.row.baseDrugRatio"
                :stroke-width="6"
                :color="getBaseDrugRatioColor(scope.row.baseDrugRatio)"
                :show-text="false"
              />
              <span class="ratio-text">{{ scope.row.baseDrugRatio }}%</span>
            </template>
          </el-table-column>
          <el-table-column
            label="环比变化"
            prop="monthlyChange"
            width="100"
            align="center"
          >
            <template #default="scope">
              <span :class="scope.row.monthlyChange >= 0 ? 'positive-change' : 'negative-change'">
                {{ scope.row.monthlyChange >= 0 ? '+' : '' }}{{ scope.row.monthlyChange }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column
            label="同比变化"
            prop="yearlyChange"
            width="100"
            align="center"
          >
            <template #default="scope">
              <span :class="scope.row.yearlyChange >= 0 ? 'positive-change' : 'negative-change'">
                {{ scope.row.yearlyChange >= 0 ? '+' : '' }}{{ scope.row.yearlyChange }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column
            label="预算执行率"
            prop="budgetExecution"
            width="120"
            align="center"
          >
            <template #default="scope">
              <el-tag :type="getBudgetExecutionTagType(scope.row.budgetExecution)" size="small">
                {{ scope.row.budgetExecution }}%
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="viewCostDetails(scope.row)">
                <Icon icon="ep:view" />
                详情
              </el-button>
              <el-button type="warning" link size="small" @click="analyzeCostTrend(scope.row)">
                <Icon icon="ep:trend-charts" />
                分析
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-pagination">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentPageChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { formatAmount } from '@/utils/analysis'
import * as echarts from 'echarts'
import * as AnalysisApi from '@/api/dataqc/analysis'

defineOptions({ name: 'CostAnalysisChart' })

// ========== Props 和 Emits 定义 ==========

interface Props {
  data: AnalysisApi.CostAnalysisData
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({} as AnalysisApi.CostAnalysisData)
})

const emit = defineEmits<{
  'export': [type: string]
}>()

// ========== 响应式数据定义 ==========

const loading = ref(false)
const tableLoading = ref(false)
const searchKeyword = ref('')
const selectedCostTypes = ref(['total', 'baseDrug', 'nonBaseDrug'])

// 分析参数
const analysisParams = ref({
  year: new Date().getFullYear().toString(),
  compareType: 'yoy',
  granularity: 'monthly'
})

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 图表DOM引用
const budgetChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()
const yoyChartRef = ref<HTMLElement>()
const structureChartRef = ref<HTMLElement>()
const departmentCostChartRef = ref<HTMLElement>()
const costEfficiencyChartRef = ref<HTMLElement>()

// 图表实例
let budgetChart: echarts.ECharts | null = null
let trendChart: echarts.ECharts | null = null
let yoyChart: echarts.ECharts | null = null
let structureChart: echarts.ECharts | null = null
let departmentCostChart: echarts.ECharts | null = null
let costEfficiencyChart: echarts.ECharts | null = null

// ========== 计算属性 ==========

/**
 * 可选年份列表
 */
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => currentYear - i)
})

/**
 * 财务核心指标计算
 * 这些指标就像是企业的财务体检报告，反映经营的健康状况
 */
const financialIndicators = computed(() => {
  const costData = props.data.costStructure || {}
  const yoyData = props.data.yearOverYear || {}

  return [
    {
      label: '年度总费用',
      value: `¥${formatAmount(yoyData.currentYearTotal || 0)}`,
      subtitle: '本年度累计用药费用',
      icon: 'ep:money',
      color: '#409EFF',
      changeRate: yoyData.growthRate,
      trend: yoyData.growthRate >= 0 ? 'positive' : 'negative'
    },
    {
      label: '基药费用占比',
      value: `${costData.baseDrugPercentage || 0}%`,
      subtitle: '基药费用在总费用中的占比',
      icon: 'ep:pie-chart',
      color: '#67C23A',
      changeRate: 2.5,
      trend: 'positive'
    },
    {
      label: '月均费用',
      value: `¥${formatAmount((yoyData.currentYearTotal || 0) / 12)}`,
      subtitle: '月度平均用药费用',
      icon: 'ep:calendar',
      color: '#E6A23C',
      changeRate: -1.8,
      trend: 'negative'
    },
    {
      label: '费用增长率',
      value: `${yoyData.growthRate || 0}%`,
      subtitle: '相比去年同期的增长率',
      icon: 'ep:trend-charts',
      color: yoyData.growthRate >= 0 ? '#F56C6C' : '#67C23A',
      changeRate: undefined,
      trend: 'neutral'
    }
  ]
})

/**
 * 预算数据计算
 * 这些数据用于监控预算执行情况
 */
const budgetData = computed(() => {
  // 模拟预算数据，实际应该从API获取
  return {
    totalBudget: 5000000,    // 总预算500万
    executedAmount: 3400000, // 已执行340万
    remainingAmount: 1600000 // 剩余160万
  }
})

/**
 * 预算执行率计算
 */
const budgetExecutionRate = computed(() => {
  const data = budgetData.value
  if (data.totalBudget === 0) return 0
  return Math.round((data.executedAmount / data.totalBudget) * 100)
})

/**
 * 预算执行等级评定
 */
const budgetExecutionLevel = computed(() => {
  const rate = budgetExecutionRate.value
  if (rate >= 95) return 'warning'  // 接近或超预算
  if (rate >= 80) return 'success'  // 执行良好
  if (rate >= 60) return 'primary'  // 执行正常
  return 'info'                     // 执行偏低
})

/**
 * 预算分类执行情况
 */
const budgetBreakdown = computed(() => {
  return [
    { category: '基本药物', executionRate: 85 },
    { category: '非基本药物', executionRate: 72 },
    { category: '急诊用药', executionRate: 90 },
    { category: '住院用药', executionRate: 78 },
    { category: '门诊用药', executionRate: 82 }
  ]
})

/**
 * 趋势分析洞察
 * 基于数据自动生成的分析洞察
 */
const trendInsights = computed(() => {
  return [
    {
      type: 'trend',
      level: 'info',
      icon: 'ep:trend-charts',
      message: '总费用呈现稳定增长趋势，增长率控制在合理范围内'
    },
    {
      type: 'structure',
      level: 'success',
      icon: 'ep:pie-chart',
      message: '基药费用占比持续提升，符合国家政策导向'
    },
    {
      type: 'efficiency',
      level: 'warning',
      icon: 'ep:warning',
      message: '第三季度费用增长较快，建议加强成本控制'
    }
  ]
})

/**
 * 优化建议计算
 * 基于数据分析生成的成本优化建议
 */
const optimizationSuggestions = computed(() => {
  return [
    {
      title: '药品采购优化',
      description: '通过集中采购和供应商谈判，降低药品采购成本',
      expectedSavings: 280000,
      difficulty: 2,
      priority: 'success',
      priorityText: '高优先级',
      icon: 'ep:shopping-cart',
      actionText: '制定方案'
    },
    {
      title: '库存管理改进',
      description: '优化库存结构，减少过期损失和资金占用',
      expectedSavings: 150000,
      difficulty: 3,
      priority: 'warning',
      priorityText: '中优先级',
      icon: 'ep:box',
      actionText: '评估可行性'
    },
    {
      title: '用药结构调整',
      description: '提高基药使用比例，降低整体用药成本',
      expectedSavings: 320000,
      difficulty: 4,
      priority: 'primary',
      priorityText: '需长期推进',
      icon: 'ep:edit-pen',
      actionText: '制定政策'
    }
  ]
})

/**
 * 总优化潜力
 */
const optimizationPotential = computed(() => {
  return optimizationSuggestions.value.reduce((sum, suggestion) =>
    sum + suggestion.expectedSavings, 0
  )
})

/**
 * 过滤后的费用数据
 */
const filteredCostData = computed(() => {
  // 生成模拟费用数据
  let data = generateMockCostData()

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(item =>
      item.departmentName?.toLowerCase().includes(keyword)
    )
  }

  return data
})

// ========== 生命周期管理 ==========

onMounted(() => {
  initializeCharts()
  loadInitialData()
})

onUnmounted(() => {
  disposeAllCharts()
})

// ========== 监听器 ==========

watch(() => props.data, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    updateAllCharts()
  }
}, { deep: true })

// ========== 图表初始化方法 ==========

/**
 * 初始化所有图表
 */
const initializeCharts = () => {
  nextTick(() => {
    initBudgetChart()
    initTrendChart()
    initYoyChart()
    initStructureChart()
    initDepartmentCostChart()
    initCostEfficiencyChart()

    window.addEventListener('resize', handleChartResize)
  })
}

/**
 * 初始化预算图表
 * 使用环形图表显示预算执行情况
 */
const initBudgetChart = () => {
  if (!budgetChartRef.value) return

  budgetChart = echarts.init(budgetChartRef.value)

  const data = budgetData.value
  const executed = data.executedAmount
  const remaining = data.remainingAmount

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    series: [{
      name: '预算执行',
      type: 'pie',
      radius: ['50%', '80%'],
      center: ['50%', '50%'],
      data: [
        {
          value: executed,
          name: '已执行',
          itemStyle: { color: '#67C23A' }
        },
        {
          value: remaining,
          name: '剩余预算',
          itemStyle: { color: '#E4E7ED' }
        }
      ],
      label: {
        formatter: '{b}\n{d}%'
      },
      labelLine: {
        show: false
      }
    }]
  }

  budgetChart.setOption(option)
}

/**
 * 初始化费用趋势图表
 * 多折线图显示不同类型费用的趋势变化
 */
const initTrendChart = () => {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()
}

/**
 * 初始化同比分析图表
 * 柱状图对比今年与去年的费用情况
 */
const initYoyChart = () => {
  if (!yoyChartRef.value) return

  yoyChart = echarts.init(yoyChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['今年', '去年']
    },
    xAxis: {
      type: 'category',
      data: ['Q1', 'Q2', 'Q3', 'Q4']
    },
    yAxis: {
      type: 'value',
      name: '费用(万元)'
    },
    series: [
      {
        name: '今年',
        type: 'bar',
        data: [85, 92, 98, 105],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '去年',
        type: 'bar',
        data: [78, 88, 95, 102],
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }

  yoyChart.setOption(option)
}

/**
 * 初始化费用结构图表
 * 饼图显示不同类别费用的占比
 */
const initStructureChart = () => {
  if (!structureChartRef.value) return

  structureChart = echarts.init(structureChartRef.value)

  const costStructure = props.data.costStructure || {}

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}% ({d}%)'
    },
    series: [{
      name: '费用结构',
      type: 'pie',
      radius: '60%',
      data: [
        {
          value: costStructure.baseDrugPercentage || 68,
          name: '基药费用',
          itemStyle: { color: '#67C23A' }
        },
        {
          value: costStructure.nonBaseDrugPercentage || 32,
          name: '非基药费用',
          itemStyle: { color: '#E6A23C' }
        }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  structureChart.setOption(option)
}

/**
 * 初始化科室费用图表
 * 横向柱状图显示各科室费用排名
 */
const initDepartmentCostChart = () => {
  if (!departmentCostChartRef.value) return

  departmentCostChart = echarts.init(departmentCostChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '10%',
      bottom: '10%'
    },
    xAxis: {
      type: 'value',
      name: '费用(万元)'
    },
    yAxis: {
      type: 'category',
      data: ['内科', '外科', '儿科', '急诊科', '妇科']
    },
    series: [{
      type: 'bar',
      data: [85, 72, 68, 45, 38],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#66B1FF' }
        ])
      }
    }]
  }

  departmentCostChart.setOption(option)
}

/**
 * 初始化成本效益分析图表
 * 散点图显示成本与效益的关系
 */
const initCostEfficiencyChart = () => {
  if (!costEfficiencyChartRef.value) return

  costEfficiencyChart = echarts.init(costEfficiencyChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.data.name}<br/>成本: ${params.data.value[0]}万元<br/>效益: ${params.data.value[1]}%`
      }
    },
    xAxis: {
      type: 'value',
      name: '成本(万元)',
      splitLine: { show: true }
    },
    yAxis: {
      type: 'value',
      name: '效益指数',
      splitLine: { show: true }
    },
    series: [{
      type: 'scatter',
      data: [
        { name: '内科', value: [85, 92] },
        { name: '外科', value: [72, 88] },
        { name: '儿科', value: [68, 95] },
        { name: '急诊科', value: [45, 85] },
        { name: '妇科', value: [38, 90] }
      ],
      symbolSize: 20,
      itemStyle: {
        color: '#67C23A'
      }
    }]
  }

  costEfficiencyChart.setOption(option)
}

// ========== 图表更新方法 ==========

/**
 * 更新所有图表
 */
const updateAllCharts = () => {
  updateTrendChart()
  // 其他图表根据需要更新
}

/**
 * 更新趋势图表
 * 根据选择的费用类型显示相应的趋势线
 */
const updateTrendChart = () => {
  if (!trendChart) return

  const monthlyTrend = props.data.monthlyTrend || []
  const categories = monthlyTrend.map(item => item.month) ||
    ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  const series = []

  if (selectedCostTypes.value.includes('total')) {
    series.push({
      name: '总费用',
      type: 'line',
      data: monthlyTrend.map(item => item.totalCost) ||
        [320, 280, 350, 420, 380, 450, 480, 520, 490, 580, 620, 650],
      smooth: true,
      itemStyle: { color: '#409EFF' }
    })
  }

  if (selectedCostTypes.value.includes('baseDrug')) {
    series.push({
      name: '基药费用',
      type: 'line',
      data: monthlyTrend.map(item => item.baseDrugCost) ||
        [220, 190, 240, 290, 260, 310, 330, 360, 340, 400, 430, 450],
      smooth: true,
      itemStyle: { color: '#67C23A' }
    })
  }

  if (selectedCostTypes.value.includes('nonBaseDrug')) {
    series.push({
      name: '非基药费用',
      type: 'line',
      data: monthlyTrend.map(item => item.nonBaseDrugCost) ||
        [100, 90, 110, 130, 120, 140, 150, 160, 150, 180, 190, 200],
      smooth: true,
      itemStyle: { color: '#E6A23C' }
    })
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: selectedCostTypes.value.map(type => {
        const nameMap = {
          'total': '总费用',
          'baseDrug': '基药费用',
          'nonBaseDrug': '非基药费用'
        }
        return nameMap[type]
      })
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories
    },
    yAxis: {
      type: 'value',
      name: '费用(万元)'
    },
    series: series
  }

  trendChart.setOption(option)
}

// ========== 事件处理方法 ==========

const handleYearChange = (year: string) => {
  analysisParams.value.year = year
  refreshAnalysis()
}

const handleCompareTypeChange = (type: string) => {
  analysisParams.value.compareType = type
  refreshAnalysis()
}

const handleGranularityChange = (granularity: string) => {
  analysisParams.value.granularity = granularity
  refreshAnalysis()
}

const refreshAnalysis = async () => {
  loading.value = true
  try {
    // 这里应该调用API重新获取数据
    ElMessage.success('费用分析数据已更新')
  } catch (error) {
    ElMessage.error('数据更新失败')
  } finally {
    loading.value = false
  }
}

const handleExportReport = () => {
  emit('export', 'cost-analysis')
}

// ========== 辅助方法 ==========

/**
 * 加载初始数据
 */
const loadInitialData = () => {
  // 设置默认选中的费用类型
  selectedCostTypes.value = ['total', 'baseDrug', 'nonBaseDrug']
}

/**
 * 获取预算进度颜色
 */
const getBudgetProgressColor = () => {
  const rate = budgetExecutionRate.value
  if (rate >= 95) return '#F56C6C'
  if (rate >= 80) return '#67C23A'
  if (rate >= 60) return '#409EFF'
  return '#E6A23C'
}

/**
 * 获取进度条颜色
 */
const getProgressColor = (rate: number): string => {
  if (rate >= 90) return '#F56C6C'
  if (rate >= 75) return '#67C23A'
  if (rate >= 50) return '#409EFF'
  return '#E6A23C'
}

/**
 * 获取基药占比颜色
 */
const getBaseDrugRatioColor = (ratio: number): string => {
  if (ratio >= 70) return '#67C23A'
  if (ratio >= 60) return '#409EFF'
  if (ratio >= 40) return '#E6A23C'
  return '#F56C6C'
}

/**
 * 获取预算执行标签类型
 */
const getBudgetExecutionTagType = (rate: number): string => {
  if (rate >= 95) return 'danger'
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'primary'
  return 'info'
}

/**
 * 图表窗口调整
 */
const handleChartResize = () => {
  const charts = [
    budgetChart, trendChart, yoyChart,
    structureChart, departmentCostChart, costEfficiencyChart
  ]
  charts.forEach(chart => {
    if (chart) chart.resize()
  })
}

/**
 * 销毁所有图表
 */
const disposeAllCharts = () => {
  const charts = [
    budgetChart, trendChart, yoyChart,
    structureChart, departmentCostChart, costEfficiencyChart
  ]
  charts.forEach(chart => {
    if (chart) chart.dispose()
  })
  window.removeEventListener('resize', handleChartResize)
}

/**
 * 生成模拟费用数据
 */
const generateMockCostData = () => {
  const departments = ['内科', '外科', '儿科', '急诊科', '妇科', '骨科', '眼科', '耳鼻喉科']
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']

  const data = []
  for (const month of months) {
    for (const dept of departments) {
      const totalCost = Math.random() * 100000 + 50000
      const baseDrugCost = totalCost * (0.6 + Math.random() * 0.2)
      const nonBaseDrugCost = totalCost - baseDrugCost
      const baseDrugRatio = Math.round((baseDrugCost / totalCost) * 100)

      data.push({
        period: month,
        departmentName: dept,
        totalCost,
        baseDrugCost,
        nonBaseDrugCost,
        baseDrugRatio,
        monthlyChange: Math.round((Math.random() - 0.5) * 20 * 100) / 100,
        yearlyChange: Math.round((Math.random() - 0.3) * 30 * 100) / 100,
        budgetExecution: Math.round((70 + Math.random() * 25))
      })
    }
  }
  return data
}

/**
 * 表格汇总数据
 */
const getSummaryData = (param: any) => {
  const { columns, data } = param
  const sums: any[] = []

  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }

    const values = data.map((item: any) => Number(item[column.property]))
    if (!values.every((value: any) => isNaN(value))) {
      const sum = values.reduce((prev: any, curr: any) => {
        const value = Number(curr)
        if (!isNaN(value)) {
          return prev + curr
        } else {
          return prev
        }
      }, 0)

      if (column.property.includes('Cost')) {
        sums[index] = `¥${formatAmount(sum)}`
      } else if (column.property.includes('Ratio') || column.property.includes('Change') || column.property.includes('Execution')) {
        sums[index] = `${(sum / data.length).toFixed(1)}%`
      } else {
        sums[index] = sum.toFixed(2)
      }
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// 其他方法的空实现
const implementSuggestion = (suggestion: any) => {
  ElMessage.success(`开始实施：${suggestion.title}`)
}

const exportDetailedData = () => {
  ElMessage.info('导出功能开发中')
}

const handleTableSort = () => {}
const handlePageSizeChange = () => {}
const handleCurrentPageChange = () => {}
const viewCostDetails = () => ElMessage.info('费用详情功能开发中')
const analyzeCostTrend = () => ElMessage.info('趋势分析功能开发中')
</script>

<style scoped>
.cost-analysis-container {
  padding: 20px;
  background: #f8f9fa;
}

/* 控制面板样式 */
.analysis-header {
  margin-bottom: 20px;
}

.control-panel {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  margin-right: 8px;
  color: #67c23a;
}

.control-form {
  margin: 0;
}

/* 财务仪表板样式 */
.financial-dashboard {
  margin-bottom: 20px;
}

.financial-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.financial-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.financial-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.financial-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
}

.financial-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-bottom: 8px;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.financial-details {
  flex: 1;
}

.financial-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.financial-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 2px;
}

.financial-subtitle {
  font-size: 12px;
  color: #909399;
}

/* 预算监控样式 */
.budget-monitor {
  margin-bottom: 20px;
}

.budget-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.budget-icon {
  margin-right: 8px;
  color: #409eff;
}

.execution-tag {
  font-weight: 600;
}

.budget-content {
  padding: 0;
}

.budget-progress-section {
  padding: 20px;
}

.budget-metrics {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.budget-metric {
  text-align: center;
}

.metric-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
}

.metric-value.budget {
  color: #409eff;
}

.metric-value.executed {
  color: #67c23a;
}

.metric-value.remaining {
  color: #e6a23c;
}

.budget-progress-bar {
  margin-bottom: 20px;
}

.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.budget-breakdown {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.breakdown-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.breakdown-items {
  display: grid;
  gap: 8px;
}

.breakdown-item {
  padding: 8px 0;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-name {
  font-size: 13px;
  color: #606266;
}

.item-rate {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.budget-chart {
  height: 300px;
}

/* 趋势分析样式 */
.trend-analysis-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.chart-icon {
  margin-right: 8px;
  color: #409eff;
}

.chart-title {
  display: flex;
  align-items: center;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.small-chart {
  height: 200px;
}

.trend-insights {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.insight-item.info {
  color: #409eff;
}

.insight-item.success {
  color: #67c23a;
}

.insight-item.warning {
  color: #e6a23c;
}

/* 结构分析样式 */
.structure-analysis {
  margin-bottom: 20px;
}

/* 优化建议样式 */
.cost-optimization {
  margin-bottom: 20px;
}

.optimization-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.optimization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.optimization-icon {
  margin-right: 8px;
  color: #67c23a;
}

.optimization-content {
  padding: 0;
}

.suggestion-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  background: #fafafa;
}

.suggestion-card.success {
  border-color: #67c23a;
  background: #f0f9ff;
}

.suggestion-card.warning {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.suggestion-card.primary {
  border-color: #409eff;
  background: #ecf5ff;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.suggestion-icon {
  color: #409eff;
  margin-right: 8px;
}

.suggestion-title {
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.suggestion-priority {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;
}

.suggestion-content {
  flex: 1;
}

.suggestion-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.suggestion-metrics {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.metric {
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
}

.suggestion-actions {
  text-align: center;
}

/* 费用明细样式 */
.cost-details-section {
  margin-top: 20px;
}

.details-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.details-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 300px;
}

.cost-cell {
  font-weight: 600;
}

.cost-cell.total {
  color: #409eff;
}

.cost-cell.base {
  color: #67c23a;
}

.cost-cell.non-base {
  color: #e6a23c;
}

.ratio-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.positive-change {
  color: #f56c6c;
  font-weight: 600;
}

.negative-change {
  color: #67c23a;
  font-weight: 600;
}

.table-pagination {
  margin-top: 16px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .structure-analysis .el-col {
    margin-bottom: 20px;
  }

  .budget-content .el-row {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .control-form {
    flex-direction: column;
  }

  .budget-metrics {
    flex-direction: column;
    gap: 16px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .details-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .cost-analysis-container {
    padding: 12px;
  }
}
</style>
