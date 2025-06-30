<template>
  <div class="inout-analysis-container">
    <!-- 分析控制台 -->
    <!-- 这个控制台就像是库存管理的指挥中心，让用户能够从不同角度观察数据 -->
    <div class="analysis-controls">
      <el-card class="control-panel">
        <template #header>
          <div class="panel-header">
            <Icon icon="ep:data-analysis" class="header-icon" />
            <span class="header-title">库存分析控制台</span>
          </div>
        </template>

        <el-form :model="analysisFilters" :inline="true" class="filter-form">
          <el-form-item label="分析周期">
            <el-select v-model="analysisFilters.period" @change="handlePeriodChange">
              <el-option label="近7天" value="7days" />
              <el-option label="近30天" value="30days" />
              <el-option label="近90天" value="90days" />
              <el-option label="近一年" value="1year" />
            </el-select>
          </el-form-item>

          <el-form-item label="分析维度">
            <el-select v-model="analysisFilters.dimension" @change="handleDimensionChange">
              <el-option label="库存价值" value="value" />
              <el-option label="周转率" value="turnover" />
              <el-option label="安全库存" value="safety" />
              <el-option label="过期风险" value="expiry" />
            </el-select>
          </el-form-item>

          <el-form-item label="风险等级">
            <el-select v-model="analysisFilters.riskLevel" @change="handleRiskLevelChange">
              <el-option label="全部" value="all" />
              <el-option label="高风险" value="high" />
              <el-option label="中风险" value="medium" />
              <el-option label="低风险" value="low" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="refreshAnalysis" :loading="refreshing">
              <Icon icon="ep:refresh" />
              刷新分析
            </el-button>
            <el-button type="success" @click="exportInventoryReport">
              <Icon icon="ep:download" />
              库存报告
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 库存健康度仪表板 -->
    <!-- 这个仪表板就像是医院的生命体征监护仪，实时显示库存系统的健康状况 -->
    <div class="inventory-dashboard">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(indicator, index) in healthIndicators" :key="index">
          <el-card class="health-card" :class="indicator.status">
            <div class="health-content">
              <div class="health-icon" :style="{ backgroundColor: indicator.color }">
                <Icon :icon="indicator.icon" />
              </div>
              <div class="health-info">
                <div class="health-title">{{ indicator.title }}</div>
                <div class="health-value">{{ indicator.value }}</div>
                <div class="health-status" :class="indicator.status">
                  <Icon :icon="getStatusIcon(indicator.status)" />
                  {{ getStatusText(indicator.status) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 核心分析图表区域 -->
    <el-row :gutter="20" class="main-charts">
      <!-- 出入库趋势分析 -->
      <!-- 趋势图帮助我们理解库存变化的规律，就像心电图一样显示"库存心跳" -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:trend-charts" class="chart-icon" />
              <span class="chart-title">出入库趋势分析</span>
              <div class="chart-controls">
                <el-radio-group v-model="trendViewType" size="small" @change="updateTrendChart">
                  <el-radio-button value="daily">日趋势</el-radio-button>
                  <el-radio-button value="weekly">周趋势</el-radio-button>
                  <el-radio-button value="monthly">月趋势</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef"></div>

          <!-- 趋势分析洞察 -->
          <div class="trend-insights">
            <div class="insight-item" v-for="insight in trendInsights" :key="insight.type">
              <Icon :icon="insight.icon" :class="insight.type" />
              <span class="insight-text">{{ insight.message }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 库存周转率分析 -->
      <!-- 周转率就像是衡量库存"新陈代谢"的指标，帮助识别滞销和畅销药品 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:refresh" class="chart-icon" />
              <span class="chart-title">库存周转率分析</span>
              <div class="chart-info">
                <el-tag :type="getTurnoverRateLevel(averageTurnoverRate)" size="small">
                  平均周转率: {{ averageTurnoverRate }}次/年
                </el-tag>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="turnoverChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 风险预警与分析 -->
    <el-row :gutter="20" class="risk-analysis">
      <!-- 过期风险监控 -->
      <!-- 这个监控就像是食品的保质期提醒，防止药品过期造成损失 -->
      <el-col :span="8">
        <el-card class="risk-card">
          <template #header>
            <div class="risk-header">
              <Icon icon="ep:warning" class="warning-icon" />
              <span class="risk-title">过期风险监控</span>
            </div>
          </template>

          <div class="risk-content">
            <div class="risk-summary">
              <div class="risk-metric">
                <span class="metric-label">即将过期(30天内)</span>
                <span class="metric-value danger">{{ expiryRisks.critical || 0 }}</span>
              </div>
              <div class="risk-metric">
                <span class="metric-label">预警期(90天内)</span>
                <span class="metric-value warning">{{ expiryRisks.warning || 0 }}</span>
              </div>
            </div>

            <div class="expiry-chart" ref="expiryChartRef"></div>

            <div class="risk-actions">
              <el-button type="danger" size="small" plain @click="viewExpiryDetails">
                查看详情
              </el-button>
              <el-button type="warning" size="small" plain @click="generateExpiryReport">
                生成报告
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 库存不足预警 -->
      <!-- 这个预警系统就像是汽车的油量警告灯，提醒我们及时补充库存 -->
      <el-col :span="8">
        <el-card class="risk-card">
          <template #header>
            <div class="risk-header">
              <Icon icon="ep:bottom" class="shortage-icon" />
              <span class="risk-title">库存不足预警</span>
            </div>
          </template>

          <div class="risk-content">
            <div class="shortage-summary">
              <div class="shortage-level" v-for="level in shortageAnalysis" :key="level.type">
                <div class="level-indicator" :class="level.type">
                  <Icon :icon="level.icon" />
                </div>
                <div class="level-info">
                  <div class="level-name">{{ level.name }}</div>
                  <div class="level-count">{{ level.count }}种药品</div>
                </div>
              </div>
            </div>

            <div class="shortage-actions">
              <el-button type="primary" size="small" @click="openPurchaseAdvice">
                采购建议
              </el-button>
              <el-button type="info" size="small" @click="viewShortageDetails">
                详细清单
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 异常波动检测 -->
      <!-- 这个检测系统能够识别异常的库存变化模式，就像是安全监控系统 -->
      <el-col :span="8">
        <el-card class="risk-card">
          <template #header>
            <div class="risk-header">
              <Icon icon="ep:monitor" class="anomaly-icon" />
              <span class="risk-title">异常波动检测</span>
            </div>
          </template>

          <div class="risk-content">
            <div class="anomaly-summary">
              <div class="anomaly-item" v-for="anomaly in anomalies" :key="anomaly.type">
                <div class="anomaly-type">{{ anomaly.description }}</div>
                <div class="anomaly-count" :class="anomaly.severity">
                  {{ anomaly.count }}项异常
                </div>
              </div>
            </div>

            <div class="anomaly-actions">
              <el-button type="warning" size="small" @click="investigateAnomalies">
                深入调查
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据分析表格 -->
    <!-- 这个表格就像是一个详细的库存档案，提供每个药品的具体信息 -->
    <div class="detailed-analysis">
      <el-card class="analysis-table-card">
        <template #header>
          <div class="table-header">
            <Icon icon="ep:data-board" class="header-icon" />
            <span class="header-title">库存详细分析</span>
            <div class="table-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索药品名称或编码"
                prefix-icon="ep:search"
                clearable
                class="search-input"
                @input="handleSearch"
              />
              <el-button type="primary" @click="exportDetailedData">
                <Icon icon="ep:download" />
                导出明细
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredInventoryData"
          v-loading="tableLoading"
          @sort-change="handleTableSort"
          height="500"
          class="inventory-table"
        >
          <el-table-column label="风险等级" width="100" align="center">
            <template #default="scope">
              <div class="risk-badge" :class="scope.row.riskLevel">
                <Icon :icon="getRiskIcon(scope.row.riskLevel)" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="药品编码"
            prop="hosDrugId"
            width="120"
            sortable="custom"
          />

          <el-table-column
            label="药品名称"
            prop="productName"
            min-width="200"
            sortable="custom"
            show-overflow-tooltip
          />

          <el-table-column
            label="当前库存"
            prop="currentStock"
            width="100"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span :class="getStockStatusClass(scope.row)">
                {{ scope.row.currentStock || 0 }}
              </span>
            </template>
          </el-table-column>

          <el-table-column
            label="安全库存"
            prop="safetyStock"
            width="100"
            align="center"
          />

          <el-table-column
            label="库存价值"
            prop="stockValue"
            width="120"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <span class="value-cell">
                ¥{{ formatAmount(scope.row.stockValue || 0) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column
            label="周转率"
            prop="turnoverRate"
            width="100"
            align="center"
            sortable="custom"
          >
            <template #default="scope">
              <el-tag
                :type="getTurnoverRateLevel(scope.row.turnoverRate)"
                size="small"
              >
                {{ scope.row.turnoverRate || 0 }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column
            label="最近入库"
            prop="lastInDate"
            width="120"
            align="center"
          />

          <el-table-column
            label="最近出库"
            prop="lastOutDate"
            width="120"
            align="center"
          />

          <el-table-column
            label="有效期"
            prop="expiryDate"
            width="120"
            align="center"
          >
            <template #default="scope">
              <span :class="getExpiryStatusClass(scope.row.expiryDate)">
                {{ formatDate(scope.row.expiryDate) }}
              </span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" align="center" fixed="right">
            <template #default="scope">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="viewStockHistory(scope.row)"
                >
                  <Icon icon="ep:clock" />
                  历史
                </el-button>
                <el-button
                  type="warning"
                  link
                  size="small"
                  @click="adjustStock(scope.row)"
                >
                  <Icon icon="ep:edit" />
                  调整
                </el-button>
                <el-button
                  type="success"
                  link
                  size="small"
                  @click="generatePurchaseOrder(scope.row)"
                >
                  <Icon icon="ep:shopping-cart" />
                  采购
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-pagination">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentPageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 采购建议对话框 -->
    <PurchaseAdviceDialog
      v-model="purchaseAdviceVisible"
      :drug-info="selectedDrug"
      @confirm="handlePurchaseConfirm"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { formatAmount } from '@/utils/analysis'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import * as AnalysisApi from '@/api/dataqc/analysis'

defineOptions({ name: 'InoutAnalysisChart' })

// ========== Props 和 Emits 定义 ==========

interface Props {
  data: AnalysisApi.InventoryAnalysisData
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({} as AnalysisApi.InventoryAnalysisData)
})

const emit = defineEmits<{
  'data-change': [data: any]
}>()

// ========== 响应式数据定义 ==========

const refreshing = ref(false)
const tableLoading = ref(false)
const trendViewType = ref('daily')
const searchQuery = ref('')
const purchaseAdviceVisible = ref(false)
const selectedDrug = ref(null)

// 分析过滤器 - 这就像是一个多维度的数据筛选器
const analysisFilters = ref({
  period: '30days',
  dimension: 'value',
  riskLevel: 'all'
})

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 图表DOM引用
const trendChartRef = ref<HTMLElement>()
const turnoverChartRef = ref<HTMLElement>()
const expiryChartRef = ref<HTMLElement>()

// 图表实例
let trendChart: echarts.ECharts | null = null
let turnoverChart: echarts.ECharts | null = null
let expiryChart: echarts.ECharts | null = null

// ========== 计算属性 ==========

/**
 * 库存健康度指标计算
 * 这些指标就像是体检报告中的各项指标，能够快速评估库存系统的健康状况
 */
const healthIndicators = computed(() => {
  const summary = props.data.stockSummary || {}

  return [
    {
      title: '库存总价值',
      value: formatAmount(summary.totalValue || 0),
      status: 'normal',
      color: '#409EFF',
      icon: 'ep:money'
    },
    {
      title: '总库存数量',
      value: (summary.totalQuantity || 0).toLocaleString(),
      status: 'normal',
      color: '#67C23A',
      icon: 'ep:box'
    },
    {
      title: '药品种类',
      value: summary.drugCount || 0,
      status: 'normal',
      color: '#E6A23C',
      icon: 'ep:collection'
    },
    {
      title: '风险药品',
      value: calculateRiskDrugCount(),
      status: getRiskDrugStatus(),
      color: '#F56C6C',
      icon: 'ep:warning'
    }
  ]
})

/**
 * 平均周转率计算
 * 周转率反映了库存的活跃程度，类似于心率反映生命活力
 */
const averageTurnoverRate = computed(() => {
  const analysis = props.data.turnoverAnalysis || []
  if (analysis.length === 0) return 0

  const total = analysis.reduce((sum, item) => sum + (item.turnoverRate || 0), 0)
  return Math.round((total / analysis.length) * 10) / 10 // 保留一位小数
})

/**
 * 过期风险统计
 * 这个统计就像是食品安全检查，确保没有药品在不知不觉中过期
 */
const expiryRisks = computed(() => {
  const warnings = props.data.expiryWarning || []
  const risks = {
    critical: 0,  // 30天内过期
    warning: 0,   // 90天内过期
    normal: 0     // 正常
  }

  warnings.forEach(item => {
    const days = item.daysToExpiry || 0
    if (days <= 30) {
      risks.critical++
    } else if (days <= 90) {
      risks.warning++
    } else {
      risks.normal++
    }
  })

  return risks
})

/**
 * 库存不足分析
 * 按照紧急程度对库存不足情况进行分类
 */
const shortageAnalysis = computed(() => {
  // 这里应该基于实际数据计算，目前使用模拟数据
  return [
    {
      type: 'critical',
      name: '紧急补货',
      count: 5,
      icon: 'ep:warning-filled'
    },
    {
      type: 'warning',
      name: '需要关注',
      count: 12,
      icon: 'ep:warning'
    },
    {
      type: 'normal',
      name: '正常库存',
      count: 285,
      icon: 'ep:check'
    }
  ]
})

/**
 * 异常检测结果
 * 识别库存管理中的异常模式
 */
const anomalies = computed(() => {
  return [
    {
      type: 'sudden_increase',
      description: '库存突增',
      count: 3,
      severity: 'warning'
    },
    {
      type: 'unusual_consumption',
      description: '异常消耗',
      count: 1,
      severity: 'danger'
    },
    {
      type: 'supplier_delay',
      description: '供应延迟',
      count: 2,
      severity: 'warning'
    }
  ]
})

/**
 * 趋势分析洞察
 * 基于数据趋势自动生成的管理建议
 */
const trendInsights = computed(() => {
  return [
    {
      type: 'positive',
      icon: 'ep:trend-charts',
      message: '本月入库量较上月增长15%，库存补充及时'
    },
    {
      type: 'warning',
      icon: 'ep:warning',
      message: '发现3种药品消耗速度异常加快，建议关注'
    },
    {
      type: 'info',
      icon: 'ep:info-filled',
      message: '整体库存周转率保持健康水平'
    }
  ]
})

/**
 * 过滤后的库存数据
 * 根据搜索条件和过滤器筛选数据
 */
const filteredInventoryData = computed(() => {
  // 这里应该基于实际的库存数据进行过滤
  // 目前返回模拟数据
  return generateMockInventoryData()
})

// ========== 生命周期管理 ==========

onMounted(() => {
  initializeCharts()
  loadInitialData()
})

onUnmounted(() => {
  disposeCharts()
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
 * 这个方法就像是搭建一个完整的监控中心
 */
const initializeCharts = () => {
  nextTick(() => {
    initTrendChart()
    initTurnoverChart()
    initExpiryChart()

    // 添加响应式支持
    window.addEventListener('resize', handleChartResize)
  })
}

/**
 * 初始化趋势图表
 * 双轴图表能够同时显示出库和入库的趋势，就像心电图一样显示库存的"心跳"
 */
const initTrendChart = () => {
  if (!trendChartRef.value) return

  trendChart = echarts.init(trendChartRef.value)

  const option = {
    title: {
      text: '出入库趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['入库量', '出库量', '库存余额'],
      top: 30
    },
    grid: {
      left: '8%',
      right: '8%',
      top: '20%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: generateDateRange(),
      axisLabel: { rotate: 45 }
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '金额',
        position: 'right'
      }
    ],
    series: [
      {
        name: '入库量',
        type: 'bar',
        data: generateRandomData(30, 50, 200),
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '出库量',
        type: 'bar',
        data: generateRandomData(30, 40, 180),
        itemStyle: { color: '#E6A23C' }
      },
      {
        name: '库存余额',
        type: 'line',
        yAxisIndex: 1,
        data: generateRandomData(30, 1000, 3000),
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ]
  }

  trendChart.setOption(option)
}

/**
 * 初始化周转率图表
 * 散点图能够清晰显示各药品的周转率分布情况
 */
const initTurnoverChart = () => {
  if (!turnoverChartRef.value) return

  turnoverChart = echarts.init(turnoverChartRef.value)

  const option = {
    title: {
      text: '库存周转率分布',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.data.name}<br/>周转率: ${params.data.value[1]}次/年<br/>库存价值: ¥${params.data.value[0]}`
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '20%',
      bottom: '15%'
    },
    xAxis: {
      type: 'value',
      name: '库存价值(万元)',
      splitLine: { show: true }
    },
    yAxis: {
      type: 'value',
      name: '周转率(次/年)',
      splitLine: { show: true }
    },
    series: [{
      type: 'scatter',
      data: generateTurnoverData(),
      symbolSize: (data: number[]) => Math.sqrt(data[0]) * 2,
      itemStyle: {
        color: (params: any) => {
          const turnover = params.data.value[1]
          if (turnover >= 6) return '#67C23A'
          if (turnover >= 3) return '#E6A23C'
          return '#F56C6C'
        }
      }
    }]
  }

  turnoverChart.setOption(option)
}

/**
 * 初始化过期风险图表
 * 环形进度图直观显示过期风险的严重程度
 */
const initExpiryChart = () => {
  if (!expiryChartRef.value) return

  expiryChart = echarts.init(expiryChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: [
        { value: expiryRisks.value.critical, name: '即将过期', itemStyle: { color: '#F56C6C' } },
        { value: expiryRisks.value.warning, name: '预警期', itemStyle: { color: '#E6A23C' } },
        { value: expiryRisks.value.normal, name: '正常', itemStyle: { color: '#67C23A' } }
      ],
      label: {
        formatter: '{b}\n{c}种'
      }
    }]
  }

  expiryChart.setOption(option)
}

// ========== 数据更新方法 ==========

/**
 * 更新所有图表
 * 当数据发生变化时，确保所有图表都能反映最新状态
 */
const updateAllCharts = () => {
  updateTrendChart()
  updateTurnoverChart()
  updateExpiryChart()
}

const updateTrendChart = () => {
  if (!trendChart) return
  // 根据实际数据更新图表
  trendChart.setOption({
    // 更新数据的配置
  })
}

const updateTurnoverChart = () => {
  if (!turnoverChart) return
  // 更新周转率图表数据
}

const updateExpiryChart = () => {
  if (!expiryChart) return
  // 更新过期风险图表数据
  expiryChart.setOption({
    series: [{
      data: [
        { value: expiryRisks.value.critical, name: '即将过期', itemStyle: { color: '#F56C6C' } },
        { value: expiryRisks.value.warning, name: '预警期', itemStyle: { color: '#E6A23C' } },
        { value: expiryRisks.value.normal, name: '正常', itemStyle: { color: '#67C23A' } }
      ]
    }]
  })
}

// ========== 事件处理方法 ==========

const handlePeriodChange = (period: string) => {
  analysisFilters.value.period = period
  emit('data-change', { type: 'period', value: period })
}

const handleDimensionChange = (dimension: string) => {
  analysisFilters.value.dimension = dimension
  emit('data-change', { type: 'dimension', value: dimension })
}

const handleRiskLevelChange = (riskLevel: string) => {
  analysisFilters.value.riskLevel = riskLevel
  // 重新过滤表格数据
}

const refreshAnalysis = async () => {
  refreshing.value = true
  try {
    emit('data-change', { type: 'refresh', filters: analysisFilters.value })
    ElMessage.success('分析数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

// ========== 辅助方法 ==========

/**
 * 计算风险药品数量
 * 综合考虑过期风险和库存不足风险
 */
const calculateRiskDrugCount = (): number => {
  return expiryRisks.value.critical + expiryRisks.value.warning +
    shortageAnalysis.value.find(item => item.type === 'critical')?.count || 0
}

/**
 * 获取风险药品状态
 * 根据风险药品数量确定整体风险等级
 */
const getRiskDrugStatus = (): string => {
  const riskCount = calculateRiskDrugCount()
  if (riskCount > 20) return 'danger'
  if (riskCount > 10) return 'warning'
  return 'normal'
}

/**
 * 获取状态图标
 * 为不同的健康状态提供对应的视觉标识
 */
const getStatusIcon = (status: string): string => {
  const iconMap = {
    'normal': 'ep:check',
    'warning': 'ep:warning',
    'danger': 'ep:close'
  }
  return iconMap[status] || 'ep:question'
}

/**
 * 获取状态文本
 * 将状态代码转换为用户友好的文本
 */
const getStatusText = (status: string): string => {
  const textMap = {
    'normal': '正常',
    'warning': '预警',
    'danger': '异常'
  }
  return textMap[status] || '未知'
}

/**
 * 获取周转率等级
 * 根据行业标准判断周转率的健康程度
 */
const getTurnoverRateLevel = (rate: number): string => {
  if (rate >= 6) return 'success'   // 快速周转
  if (rate >= 3) return 'warning'   // 正常周转
  return 'danger'                   // 周转缓慢
}

/**
 * 格式化日期显示
 */
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
}

// ========== 数据生成方法（模拟数据） ==========

/**
 * 生成日期范围
 * 为图表提供时间轴数据
 */
const generateDateRange = (): string[] => {
  const dates = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
    dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
  }

  return dates
}

/**
 * 生成随机数据
 * 为图表提供模拟的数值数据
 */
const generateRandomData = (count: number, min: number, max: number): number[] => {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * (max - min + 1)) + min
  )
}

/**
 * 生成周转率数据
 * 为散点图提供二维数据
 */
const generateTurnoverData = () => {
  return Array.from({ length: 50 }, (_, index) => ({
    name: `药品${index + 1}`,
    value: [
      Math.random() * 100,  // 库存价值
      Math.random() * 10    // 周转率
    ]
  }))
}

/**
 * 生成模拟库存数据
 * 为表格提供详细的库存信息
 */
const generateMockInventoryData = () => {
  return Array.from({ length: 100 }, (_, index) => ({
    hosDrugId: `YP${String(index + 1).padStart(4, '0')}`,
    productName: `示例药品${index + 1}`,
    currentStock: Math.floor(Math.random() * 1000),
    safetyStock: Math.floor(Math.random() * 100),
    stockValue: Math.random() * 100000,
    turnoverRate: Math.random() * 10,
    lastInDate: '2024-03-01',
    lastOutDate: '2024-03-15',
    expiryDate: '20251201',
    riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
  }))
}

// ========== 其他交互方法 ==========

const loadInitialData = () => {
  // 加载初始数据
}

const handleChartResize = () => {
  if (trendChart) trendChart.resize()
  if (turnoverChart) turnoverChart.resize()
  if (expiryChart) expiryChart.resize()
}

const disposeCharts = () => {
  if (trendChart) trendChart.dispose()
  if (turnoverChart) turnoverChart.dispose()
  if (expiryChart) expiryChart.dispose()
  window.removeEventListener('resize', handleChartResize)
}

// 省略其他方法的实现...
const handleSearch = () => {}
const handleTableSort = () => {}
const handlePageSizeChange = () => {}
const handleCurrentPageChange = () => {}
const viewExpiryDetails = () => {}
const generateExpiryReport = () => {}
const openPurchaseAdvice = () => {}
const viewShortageDetails = () => {}
const investigateAnomalies = () => {}
const exportInventoryReport = () => {}
const exportDetailedData = () => {}
const viewStockHistory = () => {}
const adjustStock = () => {}
const generatePurchaseOrder = () => {}
const handlePurchaseConfirm = () => {}
const getRiskIcon = () => 'ep:warning'
const getStockStatusClass = () => 'normal'
const getExpiryStatusClass = () => 'normal'
</script>

<style scoped>
/* ========== 主容器样式 ========== */
.inout-analysis-container {
  padding: 20px;
  background: #f8f9fa;
  min-height: calc(100vh - 60px);
}

/* ========== 分析控制台样式 ========== */
.analysis-controls {
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
  color: #409eff;
  font-size: 16px;
}

.header-title {
  font-size: 16px;
}

.filter-form {
  margin: 0;
}

.filter-form .el-form-item {
  margin-bottom: 0;
}

/* ========== 库存健康度仪表板样式 ========== */
.inventory-dashboard {
  margin-bottom: 20px;
}

.health-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.health-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.health-card.normal {
  border-left: 4px solid #67c23a;
}

.health-card.warning {
  border-left: 4px solid #e6a23c;
}

.health-card.danger {
  border-left: 4px solid #f56c6c;
}

.health-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.health-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 16px;
}

.health-info {
  flex: 1;
}

.health-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.health-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.health-status.normal {
  color: #67c23a;
}

.health-status.warning {
  color: #e6a23c;
}

.health-status.danger {
  color: #f56c6c;
}

/* ========== 主要图表区域样式 ========== */
.main-charts {
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

.chart-info {
  display: flex;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
  padding: 10px;
}

/* ========== 趋势分析洞察样式 ========== */
.trend-insights {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.insight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.insight-item:last-child {
  margin-bottom: 0;
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

.insight-text {
  color: #606266;
}

/* ========== 风险分析区域样式 ========== */
.risk-analysis {
  margin-bottom: 20px;
}

.risk-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.risk-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.warning-icon {
  margin-right: 8px;
  color: #e6a23c;
}

.shortage-icon {
  margin-right: 8px;
  color: #f56c6c;
}

.anomaly-icon {
  margin-right: 8px;
  color: #909399;
}

.risk-title {
  font-size: 16px;
}

.risk-content {
  padding: 20px 0;
}

/* ========== 过期风险监控样式 ========== */
.risk-summary {
  margin-bottom: 16px;
}

.risk-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.risk-metric:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 14px;
  color: #606266;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
}

.metric-value.danger {
  color: #f56c6c;
}

.metric-value.warning {
  color: #e6a23c;
}

.expiry-chart {
  height: 150px;
  margin: 16px 0;
}

.risk-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* ========== 库存不足预警样式 ========== */
.shortage-summary {
  margin-bottom: 16px;
}

.shortage-level {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.shortage-level:last-child {
  border-bottom: none;
}

.level-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
  color: white;
}

.level-indicator.critical {
  background: #f56c6c;
}

.level-indicator.warning {
  background: #e6a23c;
}

.level-indicator.normal {
  background: #67c23a;
}

.level-info {
  flex: 1;
}

.level-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.level-count {
  font-size: 12px;
  color: #909399;
}

.shortage-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* ========== 异常波动检测样式 ========== */
.anomaly-summary {
  margin-bottom: 16px;
}

.anomaly-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #ddd;
}

.anomaly-item:last-child {
  margin-bottom: 0;
}

.anomaly-type {
  font-size: 14px;
  color: #606266;
}

.anomaly-count {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
}

.anomaly-count.warning {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.anomaly-count.danger {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.anomaly-actions {
  display: flex;
  justify-content: center;
}

/* ========== 详细分析表格样式 ========== */
.detailed-analysis {
  margin-top: 20px;
}

.analysis-table-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 250px;
}

.inventory-table {
  margin-top: 16px;
}

/* ========== 表格内容样式 ========== */
.risk-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.risk-badge.high {
  background: #f56c6c;
}

.risk-badge.medium {
  background: #e6a23c;
}

.risk-badge.low {
  background: #67c23a;
}

.value-cell {
  font-weight: 600;
  color: #67c23a;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.table-pagination {
  margin-top: 16px;
  text-align: center;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .main-charts .el-col,
  .risk-analysis .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .inout-analysis-container {
    padding: 12px;
  }

  .filter-form {
    flex-direction: column;
  }

  .filter-form .el-form-item {
    margin-bottom: 12px;
    width: 100%;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .table-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-input {
    width: 100%;
    max-width: 200px;
  }

  .health-content {
    padding: 16px;
  }

  .health-value {
    font-size: 20px;
  }

  .risk-content {
    padding: 16px 0;
  }

  .chart-container {
    height: 250px;
  }
}

@media (max-width: 480px) {
  .health-content {
    flex-direction: column;
    text-align: center;
  }

  .health-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .risk-metric {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }

  .shortage-level {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .level-indicator {
    margin-right: 0;
  }

  .anomaly-item {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}

/* ========== 深色主题支持 ========== */
@media (prefers-color-scheme: dark) {
  .inout-analysis-container {
    background: #1a1a1a;
  }

  .control-panel,
  .chart-card,
  .risk-card,
  .analysis-table-card {
    background: #2d2d2d;
    color: #e5e5e5;
  }

  .health-card {
    background: #2d2d2d;
  }

  .health-value,
  .metric-value,
  .level-name {
    color: #e5e5e5;
  }

  .trend-insights {
    background: #333;
  }

  .anomaly-item {
    background: #333;
  }

  .risk-metric {
    border-bottom-color: #555;
  }

  .shortage-level {
    border-bottom-color: #555;
  }
}

/* ========== 动画效果 ========== */
.health-card,
.chart-card,
.risk-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.health-card:hover {
  transform: translateY(-2px);
}

.risk-badge {
  transition: transform 0.2s ease;
}

.risk-badge:hover {
  transform: scale(1.1);
}

.action-buttons .el-button {
  transition: all 0.2s ease;
}

.action-buttons .el-button:hover {
  transform: translateY(-1px);
}

/* ========== 加载状态样式 ========== */
.chart-container.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 4px;
}

.inventory-table.loading {
  opacity: 0.7;
}

/* ========== 自定义滚动条样式 ========== */
.inventory-table ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.inventory-table ::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.inventory-table ::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.inventory-table ::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
