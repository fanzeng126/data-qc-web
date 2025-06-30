<template>
  <div class="use-analysis-container">
    <!-- 分析配置面板 -->
    <!-- 这个面板就像是一个精密的显微镜调节器，让我们能从不同角度观察用药数据 -->
    <div class="analysis-controls">
      <el-card class="control-panel">
        <template #header>
          <div class="panel-header">
            <Icon icon="ep:data-line" class="header-icon" />
            <span class="header-title">用药分析控制中心</span>
          </div>
        </template>

        <el-form :model="analysisConfig" :inline="true" class="config-form">
          <el-form-item label="分析时间段">
            <el-date-picker
              v-model="analysisConfig.dateRange"
              type="daterange"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYYMMDD"
              class="date-range-picker"
              @change="handleDateRangeChange"
            />
          </el-form-item>

          <el-form-item label="分析维度">
            <el-select v-model="analysisConfig.analysisType" @change="handleAnalysisTypeChange">
              <el-option label="科室分析" value="department" />
              <el-option label="医生分析" value="doctor" />
              <el-option label="患者分析" value="patient" />
              <el-option label="基药分析" value="basedrug" />
            </el-select>
          </el-form-item>

          <el-form-item label="患者类型">
            <el-select v-model="analysisConfig.patientType" @change="handlePatientTypeChange">
              <el-option label="全部" value="all" />
              <el-option label="门诊" value="1" />
              <el-option label="急诊" value="2" />
              <el-option label="住院" value="3" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="refreshAnalysis" :loading="loading">
              <Icon icon="ep:refresh" />
              更新分析
            </el-button>
            <el-button type="success" @click="exportUsageReport">
              <Icon icon="ep:download" />
              导出报告
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 核心指标仪表板 -->
    <!-- 这个仪表板就像是飞机驾驶舱的仪表盘，显示最关键的飞行参数 -->
    <div class="metrics-dashboard">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(metric, index) in coreUsageMetrics" :key="index">
          <el-card class="metric-card" :class="metric.trend">
            <div class="metric-content">
              <div class="metric-visual">
                <div class="metric-icon" :style="{ backgroundColor: metric.color }">
                  <Icon :icon="metric.icon" />
                </div>
                <div class="metric-trend-indicator" v-if="metric.changeRate">
                  <Icon :icon="metric.changeRate > 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                  <span :class="metric.changeRate > 0 ? 'increase' : 'decrease'">
                    {{ Math.abs(metric.changeRate) }}%
                  </span>
                </div>
              </div>
              <div class="metric-details">
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-description">{{ metric.description }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 基药使用率合规监控 -->
    <!-- 这是医院最重要的合规指标，就像是体检中的血压测量一样关键 -->
    <div class="compliance-monitor">
      <el-card class="compliance-card">
        <template #header>
          <div class="compliance-header">
            <Icon icon="ep:medal" class="compliance-icon" />
            <span class="compliance-title">基药使用率合规监控</span>
            <div class="compliance-status">
              <el-tag :type="baseDrugComplianceLevel" class="status-tag">
                {{ baseDrugComplianceText }}
              </el-tag>
            </div>
          </div>
        </template>

        <div class="compliance-content">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="compliance-gauge" ref="complianceGaugeRef"></div>
            </el-col>
            <el-col :span="16">
              <div class="compliance-details">
                <div class="compliance-metrics">
                  <div class="compliance-metric">
                    <span class="metric-title">当前使用率</span>
                    <span class="metric-number primary">{{ currentBaseDrugRate }}%</span>
                  </div>
                  <div class="compliance-metric">
                    <span class="metric-title">目标使用率</span>
                    <span class="metric-number target">≥ 60%</span>
                  </div>
                  <div class="compliance-metric">
                    <span class="metric-title">较上月变化</span>
                    <span class="metric-number" :class="baseDrugTrend > 0 ? 'positive' : 'negative'">
                      {{ baseDrugTrend > 0 ? '+' : '' }}{{ baseDrugTrend }}%
                    </span>
                  </div>
                </div>

                <div class="compliance-breakdown">
                  <div class="breakdown-item">
                    <div class="item-header">
                      <span class="item-label">基药处方数</span>
                      <span class="item-value">{{ baseDrugData.prescriptionCount || 0 }}</span>
                    </div>
                    <el-progress :percentage="baseDrugPrescriptionRate" :show-text="false" />
                  </div>
                  <div class="breakdown-item">
                    <div class="item-header">
                      <span class="item-label">基药金额</span>
                      <span class="item-value">¥{{ formatAmount(baseDrugData.amount || 0) }}</span>
                    </div>
                    <el-progress :percentage="currentBaseDrugRate" :show-text="false" color="#67C23A" />
                  </div>
                </div>

                <div class="compliance-suggestions">
                  <div class="suggestion-item" v-for="suggestion in complianceSuggestions" :key="suggestion.type">
                    <Icon :icon="suggestion.icon" :class="suggestion.type" />
                    <span class="suggestion-text">{{ suggestion.message }}</span>
                  </div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 主要分析图表区域 -->
    <el-row :gutter="20" class="main-analysis-charts">
      <!-- 科室用药排行与分析 -->
      <!-- 这个图表就像是学校的成绩排行榜，显示各科室的用药表现 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:office-building" class="chart-icon" />
              <span class="chart-title">科室用药分析</span>
              <div class="chart-controls">
                <el-select v-model="departmentMetric" size="small" @change="updateDepartmentChart">
                  <el-option label="处方数量" value="prescriptions" />
                  <el-option label="用药金额" value="amount" />
                  <el-option label="患者数量" value="patients" />
                  <el-option label="基药使用率" value="baseDrugRate" />
                </el-select>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="departmentChartRef"></div>

          <!-- 科室分析洞察 -->
          <div class="chart-insights">
            <div class="insight-card" v-for="insight in departmentInsights" :key="insight.type">
              <Icon :icon="insight.icon" class="insight-icon" />
              <div class="insight-content">
                <div class="insight-title">{{ insight.title }}</div>
                <div class="insight-description">{{ insight.description }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 患者类型用药分布 -->
      <!-- 饼图能够清晰显示不同患者类型的用药占比 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:user" class="chart-icon" />
              <span class="chart-title">患者类型用药分布</span>
              <div class="chart-info">
                <el-tag type="info" size="small">
                  总处方数: {{ totalPrescriptions }}
                </el-tag>
              </div>
            </div>
          </template>
          <div class="chart-container" ref="patientTypeChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细分析图表 -->
    <el-row :gutter="20" class="detailed-charts">
      <!-- 用药趋势分析 -->
      <!-- 趋势图帮助识别季节性变化和异常波动 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:trend-charts" class="chart-icon" />
              <span class="chart-title">用药趋势</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="usageTrendChartRef"></div>
        </el-card>
      </el-col>

      <!-- 高频药品分析 -->
      <!-- 词云图直观显示使用频率最高的药品 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:star" class="chart-icon" />
              <span class="chart-title">高频药品TOP10</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="topDrugsChartRef"></div>
        </el-card>
      </el-col>

      <!-- 医生处方分析 -->
      <!-- 雷达图显示医生在不同维度的处方特征 -->
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <Icon icon="ep:user-filled" class="chart-icon" />
              <span class="chart-title">医生处方特征</span>
            </div>
          </template>
          <div class="chart-container small-chart" ref="doctorAnalysisChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 异常检测与预警 -->
    <!-- 这个部分就像是医院的异常监控系统，及时发现问题 -->
    <div class="anomaly-detection">
      <el-card class="anomaly-card">
        <template #header>
          <div class="anomaly-header">
            <Icon icon="ep:warning" class="anomaly-icon" />
            <span class="anomaly-title">异常用药检测</span>
            <div class="anomaly-status">
              <el-badge :value="totalAnomalies" :type="anomalyBadgeType">
                <el-button size="small" @click="viewAnomalyDetails">查看详情</el-button>
              </el-badge>
            </div>
          </div>
        </template>

        <div class="anomaly-content">
          <el-row :gutter="16">
            <el-col :span="6" v-for="anomaly in anomalyTypes" :key="anomaly.type">
              <div class="anomaly-item" :class="anomaly.severity">
                <div class="anomaly-item-header">
                  <Icon :icon="anomaly.icon" class="anomaly-item-icon" />
                  <span class="anomaly-item-title">{{ anomaly.title }}</span>
                </div>
                <div class="anomaly-item-count">{{ anomaly.count }}</div>
                <div class="anomaly-item-description">{{ anomaly.description }}</div>
                <div class="anomaly-item-action">
                  <el-button
                    :type="anomaly.severity === 'high' ? 'danger' : 'warning'"
                    size="small"
                    plain
                    @click="handleAnomalyAction(anomaly)"
                  >
                    {{ anomaly.actionText }}
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
    </div>

    <!-- 数据详情表格 -->
    <!-- 表格提供可钻取的详细数据，支持多维度分析 -->
    <div class="data-details-section">
      <el-card class="details-card">
        <template #header>
          <div class="details-header">
            <Icon icon="ep:data-board" class="header-icon" />
            <span class="header-title">用药详情数据</span>
            <div class="details-controls">
              <el-tabs v-model="activeDetailTab" type="card" size="small">
                <el-tab-pane label="科室统计" name="department" />
                <el-tab-pane label="医生统计" name="doctor" />
                <el-tab-pane label="药品统计" name="drug" />
              </el-tabs>
            </div>
          </div>
        </template>

        <!-- 科室统计表 -->
        <div v-if="activeDetailTab === 'department'" class="detail-table">
          <div class="table-controls">
            <el-input
              v-model="departmentSearchKeyword"
              placeholder="搜索科室名称"
              prefix-icon="ep:search"
              clearable
              class="search-input"
            />
            <el-button type="primary" @click="exportDepartmentData">
              <Icon icon="ep:download" />
              导出科室数据
            </el-button>
          </div>

          <el-table
            :data="filteredDepartmentData"
            v-loading="tableLoading"
            @sort-change="handleDepartmentSort"
            height="400"
          >
            <el-table-column label="科室名称" prop="departmentName" min-width="150" />
            <el-table-column label="处方数量" prop="prescriptionCount" width="120" align="center" sortable="custom">
              <template #default="scope">
                <span class="count-cell">{{ scope.row.prescriptionCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="患者数量" prop="patientCount" width="120" align="center" sortable="custom" />
            <el-table-column label="用药金额" prop="totalAmount" width="140" align="center" sortable="custom">
              <template #default="scope">
                <span class="amount-cell">¥{{ formatAmount(scope.row.totalAmount || 0) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="平均处方金额" prop="avgPrescriptionAmount" width="140" align="center">
              <template #default="scope">
                ¥{{ (scope.row.avgPrescriptionAmount || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="基药使用率" prop="baseDrugRate" width="120" align="center" sortable="custom">
              <template #default="scope">
                <el-progress
                  :percentage="scope.row.baseDrugRate || 0"
                  :stroke-width="6"
                  :color="getBaseDrugRateColor(scope.row.baseDrugRate)"
                />
                <span class="rate-text">{{ scope.row.baseDrugRate || 0 }}%</span>
              </template>
            </el-table-column>
            <el-table-column label="合规状态" prop="complianceStatus" width="100" align="center">
              <template #default="scope">
                <el-tag :type="getComplianceTagType(scope.row.baseDrugRate)" size="small">
                  {{ getComplianceText(scope.row.baseDrugRate) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center">
              <template #default="scope">
                <el-button type="primary" link size="small" @click="viewDepartmentDetails(scope.row)">
                  <Icon icon="ep:view" />详情
                </el-button>
                <el-button type="success" link size="small" @click="generateDepartmentReport(scope.row)">
                  <Icon icon="ep:document" />报告
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 医生统计表 -->
        <div v-if="activeDetailTab === 'doctor'" class="detail-table">
          <div class="table-controls">
            <el-input
              v-model="doctorSearchKeyword"
              placeholder="搜索医生姓名"
              prefix-icon="ep:search"
              clearable
              class="search-input"
            />
            <el-select v-model="selectedDepartmentFilter" placeholder="选择科室" clearable class="department-filter">
              <el-option
                v-for="dept in departmentOptions"
                :key="dept.value"
                :label="dept.label"
                :value="dept.value"
              />
            </el-select>
          </div>

          <el-table :data="filteredDoctorData" v-loading="tableLoading" height="400">
            <el-table-column label="医生姓名" prop="doctorName" width="120" />
            <el-table-column label="科室" prop="departmentName" width="120" />
            <el-table-column label="处方数量" prop="prescriptionCount" width="100" align="center" />
            <el-table-column label="患者数量" prop="patientCount" width="100" align="center" />
            <el-table-column label="用药金额" prop="totalAmount" width="120" align="center">
              <template #default="scope">
                ¥{{ formatAmount(scope.row.totalAmount || 0) }}
              </template>
            </el-table-column>
            <el-table-column label="基药使用率" prop="baseDrugRate" width="120" align="center">
              <template #default="scope">
                <el-tag :type="getBaseDrugRateTagType(scope.row.baseDrugRate)" size="small">
                  {{ scope.row.baseDrugRate || 0 }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="处方质量" prop="prescriptionQuality" width="100" align="center">
              <template #default="scope">
                <el-rate
                  v-model="scope.row.prescriptionQuality"
                  :max="5"
                  disabled
                  size="small"
                  show-score
                />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 药品统计表 -->
        <div v-if="activeDetailTab === 'drug'" class="detail-table">
          <el-table :data="drugStatisticsData" v-loading="tableLoading" height="400">
            <el-table-column label="药品编码" prop="hosDrugId" width="120" />
            <el-table-column label="药品名称" prop="productName" min-width="200" show-overflow-tooltip />
            <el-table-column label="使用次数" prop="useCount" width="100" align="center" />
            <el-table-column label="总用量" prop="totalQuantity" width="100" align="center" />
            <el-table-column label="销售金额" prop="totalAmount" width="120" align="center">
              <template #default="scope">
                ¥{{ formatAmount(scope.row.totalAmount || 0) }}
              </template>
            </el-table-column>
            <el-table-column label="基药标识" prop="isBaseDrug" width="100" align="center">
              <template #default="scope">
                <el-tag :type="scope.row.isBaseDrug ? 'success' : 'info'" size="small">
                  {{ scope.row.isBaseDrug ? '基药' : '非基药' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页组件 -->
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

defineOptions({ name: 'UseAnalysisChart' })

// ========== Props 和 Emits 定义 ==========

interface Props {
  data: AnalysisApi.DepartmentAnalysisData
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({} as AnalysisApi.DepartmentAnalysisData)
})

const emit = defineEmits<{
  'data-change': [data: any]
}>()

// ========== 响应式数据定义 ==========

const loading = ref(false)
const tableLoading = ref(false)
const activeDetailTab = ref('department')
const departmentMetric = ref('prescriptions')

// 搜索关键词
const departmentSearchKeyword = ref('')
const doctorSearchKeyword = ref('')
const selectedDepartmentFilter = ref('')

// 分析配置
const analysisConfig = ref({
  dateRange: [] as string[],
  analysisType: 'department',
  patientType: 'all'
})

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 图表DOM引用
const complianceGaugeRef = ref<HTMLElement>()
const departmentChartRef = ref<HTMLElement>()
const patientTypeChartRef = ref<HTMLElement>()
const usageTrendChartRef = ref<HTMLElement>()
const topDrugsChartRef = ref<HTMLElement>()
const doctorAnalysisChartRef = ref<HTMLElement>()

// 图表实例
let complianceGauge: echarts.ECharts | null = null
let departmentChart: echarts.ECharts | null = null
let patientTypeChart: echarts.ECharts | null = null
let usageTrendChart: echarts.ECharts | null = null
let topDrugsChart: echarts.ECharts | null = null
let doctorAnalysisChart: echarts.ECharts | null = null

// ========== 计算属性 ==========

/**
 * 核心用药指标计算
 * 这些指标就像是健康体检的各项指标，反映用药管理的整体状况
 */
const coreUsageMetrics = computed(() => {
  const ranking = props.data.departmentRanking || []
  const totalPrescriptions = ranking.reduce((sum, dept) => sum + (dept.prescriptionCount || 0), 0)
  const totalAmount = ranking.reduce((sum, dept) => sum + (dept.totalAmount || 0), 0)
  const totalPatients = ranking.reduce((sum, dept) => sum + (dept.patientCount || 0), 0)

  return [
    {
      label: '总处方数',
      value: totalPrescriptions.toLocaleString(),
      description: '本期内开具的处方总数',
      icon: 'ep:document',
      color: '#409EFF',
      changeRate: 8.5,
      trend: 'positive'
    },
    {
      label: '用药总金额',
      value: `¥${formatAmount(totalAmount)}`,
      description: '本期内药品消费总金额',
      icon: 'ep:money',
      color: '#67C23A',
      changeRate: 12.3,
      trend: 'positive'
    },
    {
      label: '患者总数',
      value: totalPatients.toLocaleString(),
      description: '本期内接受治疗的患者数',
      icon: 'ep:user',
      color: '#E6A23C',
      changeRate: -2.1,
      trend: 'negative'
    },
    {
      label: '平均处方金额',
      value: `¥${totalPrescriptions > 0 ? (totalAmount / totalPrescriptions).toFixed(2) : '0'}`,
      description: '每张处方的平均金额',
      icon: 'ep:data-analysis',
      color: '#909399',
      changeRate: 5.7,
      trend: 'positive'
    }
  ]
})

/**
 * 当前基药使用率计算
 * 这是医院最重要的合规指标之一
 */
const currentBaseDrugRate = computed(() => {
  // 这里应该从实际数据计算，目前使用模拟数据
  return 68.5
})

/**
 * 基药合规等级评定
 * 根据国家政策要求进行等级评定
 */
const baseDrugComplianceLevel = computed(() => {
  const rate = currentBaseDrugRate.value
  if (rate >= 70) return 'success'
  if (rate >= 60) return 'success'
  if (rate >= 40) return 'warning'
  return 'danger'
})

/**
 * 基药合规文本
 * 提供用户友好的合规状态描述
 */
const baseDrugComplianceText = computed(() => {
  const rate = currentBaseDrugRate.value
  if (rate >= 70) return '优秀'
  if (rate >= 60) return '达标'
  if (rate >= 40) return '预警'
  return '不达标'
})

/**
 * 基药趋势变化
 * 相比上月的变化百分比
 */
const baseDrugTrend = computed(() => {
  // 模拟数据，实际应该从API获取
  return 2.3
})

/**
 * 基药数据详情
 * 包含处方数和金额等详细信息
 */
const baseDrugData = computed(() => {
  return {
    prescriptionCount: 1250,
    amount: 2800000,
    totalPrescriptions: 1825,
    totalAmount: 4100000
  }
})

/**
 * 基药处方比例
 * 基药处方数占总处方数的比例
 */
const baseDrugPrescriptionRate = computed(() => {
  const data = baseDrugData.value
  if (data.totalPrescriptions === 0) return 0
  return Math.round((data.prescriptionCount / data.totalPrescriptions) * 100)
})

/**
 * 合规建议生成
 * 基于当前合规状态生成针对性建议
 */
const complianceSuggestions = computed(() => {
  const suggestions = []
  const rate = currentBaseDrugRate.value

  if (rate < 60) {
    suggestions.push({
      type: 'danger',
      icon: 'ep:warning',
      message: '基药使用率低于国家要求，建议加强医生培训和政策宣导'
    })
  }

  if (rate >= 60 && rate < 70) {
    suggestions.push({
      type: 'warning',
      icon: 'ep:promotion',
      message: '基药使用率已达标，可进一步优化药品结构以提升至优秀水平'
    })
  }

  if (rate >= 70) {
    suggestions.push({
      type: 'success',
      icon: 'ep:check',
      message: '基药使用率表现优秀，请继续保持并加强质量控制'
    })
  }

  return suggestions
})

/**
 * 科室分析洞察
 * 基于数据自动生成的分析洞察
 */
const departmentInsights = computed(() => {
  return [
    {
      type: 'top',
      icon: 'ep:trophy',
      title: '用药量最大科室',
      description: '内科本月处方数量领先，占总处方的28%'
    },
    {
      type: 'growth',
      icon: 'ep:trend-charts',
      title: '增长最快科室',
      description: '儿科用药量环比增长45%，需关注供应保障'
    },
    {
      type: 'compliance',
      icon: 'ep:medal',
      title: '合规表现最佳',
      description: '急诊科基药使用率达85%，为全院最高'
    }
  ]
})

/**
 * 总处方数计算
 */
const totalPrescriptions = computed(() => {
  const ranking = props.data.departmentRanking || []
  return ranking.reduce((sum, dept) => sum + (dept.prescriptionCount || 0), 0)
})

/**
 * 异常类型统计
 * 识别各种类型的用药异常
 */
const anomalyTypes = computed(() => {
  return [
    {
      type: 'high_dose',
      title: '大剂量用药',
      count: 5,
      description: '超出常规剂量范围',
      severity: 'high',
      icon: 'ep:warning-filled',
      actionText: '立即处理'
    },
    {
      type: 'drug_interaction',
      title: '药物相互作用',
      count: 12,
      description: '可能存在不良相互作用',
      severity: 'medium',
      icon: 'ep:connection',
      actionText: '审核处方'
    },
    {
      type: 'frequent_prescription',
      title: '高频处方异常',
      count: 8,
      description: '短期内重复开药',
      severity: 'medium',
      icon: 'ep:refresh',
      actionText: '核实用药'
    },
    {
      type: 'off_label_use',
      title: '超说明书用药',
      count: 3,
      description: '用法用量超出说明书',
      severity: 'low',
      icon: 'ep:document',
      actionText: '记录备案'
    }
  ]
})

/**
 * 异常总数
 */
const totalAnomalies = computed(() => {
  return anomalyTypes.value.reduce((sum, anomaly) => sum + anomaly.count, 0)
})

/**
 * 异常徽章类型
 */
const anomalyBadgeType = computed(() => {
  const total = totalAnomalies.value
  if (total > 20) return 'danger'
  if (total > 10) return 'warning'
  return 'primary'
})

/**
 * 过滤后的科室数据
 */
const filteredDepartmentData = computed(() => {
  let data = props.data.departmentRanking || []

  if (departmentSearchKeyword.value) {
    const keyword = departmentSearchKeyword.value.toLowerCase()
    data = data.filter(item =>
      item.departmentName?.toLowerCase().includes(keyword)
    )
  }

  return data
})

/**
 * 过滤后的医生数据
 */
const filteredDoctorData = computed(() => {
  // 这里应该返回实际的医生数据，目前使用模拟数据
  return generateMockDoctorData()
})

/**
 * 药品统计数据
 */
const drugStatisticsData = computed(() => {
  // 这里应该返回实际的药品统计数据
  return generateMockDrugStatistics()
})

/**
 * 科室选项
 */
const departmentOptions = computed(() => {
  const departments = props.data.departmentRanking || []
  return departments.map(dept => ({
    label: dept.departmentName,
    value: dept.departmentName
  }))
})

// ========== 生命周期管理 ==========

onMounted(() => {
  initializeCharts()
  setDefaultDateRange()
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
    initComplianceGauge()
    initDepartmentChart()
    initPatientTypeChart()
    initUsageTrendChart()
    initTopDrugsChart()
    initDoctorAnalysisChart()

    window.addEventListener('resize', handleChartResize)
  })
}

/**
 * 修复后的合规仪表盘初始化方法
 * 解决ECharts color: 'auto' 弃用警告
 */
const initComplianceGauge = () => {
  if (!complianceGaugeRef.value) return

  complianceGauge = echarts.init(complianceGaugeRef.value)

  const option = {
    series: [{
      type: 'gauge',
      startAngle: 180,
      endAngle: 0,
      center: ['50%', '75%'],
      radius: '90%',
      min: 0,
      max: 100,
      splitNumber: 8,
      axisLine: {
        lineStyle: {
          width: 6,
          color: [
            [0.4, '#F56C6C'],
            [0.6, '#E6A23C'],
            [0.7, '#67C23A'],
            [1, '#409EFF']
          ]
        }
      },
      pointer: {
        icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
        length: '12%',
        width: 20,
        offsetCenter: [0, '-60%'],
        itemStyle: {
          // 修复点：将 'auto' 改为 'inherit'
          color: 'inherit'
        }
      },
      axisTick: {
        length: 12,
        lineStyle: {
          // 修复点：将 'auto' 改为 'inherit'
          color: 'inherit',
          width: 2
        }
      },
      splitLine: {
        length: 20,
        lineStyle: {
          // 修复点：将 'auto' 改为 'inherit'
          color: 'inherit',
          width: 5
        }
      },
      axisLabel: {
        color: '#464646',
        fontSize: 20,
        distance: -60,
        formatter: (value: number) => {
          if (value === 40) return '不达标'
          if (value === 60) return '达标'
          if (value === 70) return '优秀'
          return value + '%'
        }
      },
      title: {
        offsetCenter: [0, '-20%'],
        fontSize: 20
      },
      detail: {
        fontSize: 30,
        offsetCenter: [0, '-35%'],
        valueAnimation: true,
        formatter: (value: number) => value + '%',
        // 修复点：将 'auto' 改为 'inherit'
        color: 'inherit'
      },
      data: [{
        value: currentBaseDrugRate.value,
        name: '基药使用率'
      }]
    }]
  }

  complianceGauge.setOption(option)
}

/**
 * 初始化科室分析图表
 */
const initDepartmentChart = () => {
  if (!departmentChartRef.value) return

  departmentChart = echarts.init(departmentChartRef.value)
  updateDepartmentChart()
}

/**
 * 初始化患者类型图表
 */
const initPatientTypeChart = () => {
  if (!patientTypeChartRef.value) return

  patientTypeChart = echarts.init(patientTypeChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '患者类型',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: '门诊患者', itemStyle: { color: '#409EFF' } },
        { value: 735, name: '急诊患者', itemStyle: { color: '#E6A23C' } },
        { value: 580, name: '住院患者', itemStyle: { color: '#67C23A' } }
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

  patientTypeChart.setOption(option)
}

/**
 * 初始化使用趋势图表
 */
const initUsageTrendChart = () => {
  if (!usageTrendChartRef.value) return

  usageTrendChart = echarts.init(usageTrendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330],
      type: 'line',
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      }
    }]
  }

  usageTrendChart.setOption(option)
}

/**
 * 初始化高频药品图表
 */
const initTopDrugsChart = () => {
  if (!topDrugsChartRef.value) return

  topDrugsChart = echarts.init(topDrugsChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value'
    },
    yAxis: {
      type: 'category',
      data: ['阿司匹林', '头孢克肟', '布洛芬', '氨氯地平', '二甲双胍']
    },
    series: [{
      type: 'bar',
      data: [320, 280, 250, 220, 200],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#67C23A' },
          { offset: 1, color: '#85CE61' }
        ])
      }
    }]
  }

  topDrugsChart.setOption(option)
}

/**
 * 初始化医生分析图表
 */
const initDoctorAnalysisChart = () => {
  if (!doctorAnalysisChartRef.value) return

  doctorAnalysisChart = echarts.init(doctorAnalysisChartRef.value)

  const option = {
    tooltip: {},
    radar: {
      indicator: [
        { name: '处方数量', max: 100 },
        { name: '基药使用率', max: 100 },
        { name: '患者满意度', max: 100 },
        { name: '用药合理性', max: 100 },
        { name: '费用控制', max: 100 }
      ]
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [80, 70, 90, 85, 75],
          name: '医生A'
        },
        {
          value: [75, 85, 80, 80, 85],
          name: '医生B'
        }
      ]
    }]
  }

  doctorAnalysisChart.setOption(option)
}

// ========== 图表更新方法 ==========

/**
 * 更新所有图表
 */
const updateAllCharts = () => {
  updateDepartmentChart()
  // 其他图表根据需要更新
}

/**
 * 更新科室图表
 */
const updateDepartmentChart = () => {
  if (!departmentChart) return

  const departments = props.data.departmentRanking || []
  const names = departments.map(dept => dept.departmentName || '')

  let values: number[] = []
  let yAxisName = ''

  switch (departmentMetric.value) {
    case 'prescriptions':
      values = departments.map(dept => dept.prescriptionCount || 0)
      yAxisName = '处方数量'
      break
    case 'amount':
      values = departments.map(dept => dept.totalAmount || 0)
      yAxisName = '用药金额'
      break
    case 'patients':
      values = departments.map(dept => dept.patientCount || 0)
      yAxisName = '患者数量'
      break
    default:
      values = departments.map(dept => Math.random() * 100) // 模拟基药使用率
      yAxisName = '基药使用率(%)'
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        interval: 0,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: yAxisName
    },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#66B1FF' }
        ])
      }
    }]
  }

  departmentChart.setOption(option)
}

// ========== 事件处理方法 ==========

const handleDateRangeChange = (dateRange: string[]) => {
  analysisConfig.value.dateRange = dateRange
  emit('data-change', { type: 'dateRange', value: dateRange })
}

const handleAnalysisTypeChange = (type: string) => {
  analysisConfig.value.analysisType = type
  emit('data-change', { type: 'analysisType', value: type })
}

const handlePatientTypeChange = (type: string) => {
  analysisConfig.value.patientType = type
  emit('data-change', { type: 'patientType', value: type })
}

const refreshAnalysis = async () => {
  loading.value = true
  try {
    emit('data-change', { type: 'refresh', config: analysisConfig.value })
    ElMessage.success('分析数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
  }
}

// ========== 辅助方法 ==========

/**
 * 设置默认时间范围
 */
const setDefaultDateRange = () => {
  const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10).replace(/-/g, '')

  analysisConfig.value.dateRange = [startDate, endDate]
}

/**
 * 获取基药使用率颜色
 */
const getBaseDrugRateColor = (rate: number): string => {
  if (rate >= 70) return '#67C23A'
  if (rate >= 60) return '#409EFF'
  if (rate >= 40) return '#E6A23C'
  return '#F56C6C'
}

/**
 * 获取合规标签类型
 */
const getComplianceTagType = (rate: number): string => {
  if (rate >= 60) return 'success'
  if (rate >= 40) return 'warning'
  return 'danger'
}

/**
 * 获取合规文本
 */
const getComplianceText = (rate: number): string => {
  if (rate >= 70) return '优秀'
  if (rate >= 60) return '达标'
  if (rate >= 40) return '预警'
  return '不达标'
}

/**
 * 获取基药使用率标签类型
 */
const getBaseDrugRateTagType = (rate: number): string => {
  if (rate >= 70) return 'success'
  if (rate >= 60) return 'primary'
  if (rate >= 40) return 'warning'
  return 'danger'
}

/**
 * 图表窗口调整
 */
const handleChartResize = () => {
  const charts = [
    complianceGauge, departmentChart, patientTypeChart,
    usageTrendChart, topDrugsChart, doctorAnalysisChart
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
    complianceGauge, departmentChart, patientTypeChart,
    usageTrendChart, topDrugsChart, doctorAnalysisChart
  ]
  charts.forEach(chart => {
    if (chart) chart.dispose()
  })
  window.removeEventListener('resize', handleChartResize)
}

/**
 * 生成模拟医生数据
 */
const generateMockDoctorData = () => {
  return Array.from({ length: 50 }, (_, index) => ({
    doctorName: `医生${index + 1}`,
    departmentName: ['内科', '外科', '儿科', '急诊科'][Math.floor(Math.random() * 4)],
    prescriptionCount: Math.floor(Math.random() * 200) + 50,
    patientCount: Math.floor(Math.random() * 150) + 30,
    totalAmount: Math.random() * 100000 + 20000,
    baseDrugRate: Math.floor(Math.random() * 40) + 40,
    prescriptionQuality: Math.floor(Math.random() * 2) + 3 // 3-5星
  }))
}

/**
 * 生成模拟药品统计数据
 */
const generateMockDrugStatistics = () => {
  return Array.from({ length: 30 }, (_, index) => ({
    hosDrugId: `YP${String(index + 1).padStart(4, '0')}`,
    productName: `示例药品${index + 1}`,
    useCount: Math.floor(Math.random() * 500) + 50,
    totalQuantity: Math.floor(Math.random() * 5000) + 500,
    totalAmount: Math.random() * 50000 + 10000,
    isBaseDrug: Math.random() > 0.3 // 70% 概率是基药
  }))
}

// 其他方法的空实现（实际项目中需要完整实现）
const exportUsageReport = () => ElMessage.info('导出功能开发中')
const viewAnomalyDetails = () => ElMessage.info('异常详情功能开发中')
const handleAnomalyAction = () => ElMessage.info('异常处理功能开发中')
const exportDepartmentData = () => ElMessage.info('导出功能开发中')
const handleDepartmentSort = () => {}
const viewDepartmentDetails = () => ElMessage.info('科室详情功能开发中')
const generateDepartmentReport = () => ElMessage.info('报告生成功能开发中')
const handlePageSizeChange = () => {}
const handleCurrentPageChange = () => {}
</script>

<style scoped>
.use-analysis-container {
  padding: 20px;
  background: #f8f9fa;
}

/* 控制面板样式 */
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
}

.config-form {
  margin: 0;
}

.date-range-picker {
  width: 300px;
}

/* 指标仪表板样式 */
.metrics-dashboard {
  margin-bottom: 20px;
}

.metric-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
}

.metric-icon {
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

.metric-trend-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.increase {
  color: #67c23a;
}

.decrease {
  color: #f56c6c;
}

.metric-details {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 2px;
}

.metric-description {
  font-size: 12px;
  color: #909399;
}

/* 合规监控样式 */
.compliance-monitor {
  margin-bottom: 20px;
}

.compliance-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.compliance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.compliance-icon {
  margin-right: 8px;
  color: #67c23a;
}

.status-tag {
  font-weight: 600;
}

.compliance-content {
  padding: 0;
}

.compliance-gauge {
  height: 290px;
}

.compliance-details {
  padding: 20px;
}

.compliance-metrics {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.compliance-metric {
  text-align: center;
}

.metric-title {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-number {
  font-size: 24px;
  font-weight: 600;
}

.metric-number.primary {
  color: #409eff;
}

.metric-number.target {
  color: #67c23a;
}

.metric-number.positive {
  color: #67c23a;
}

.metric-number.negative {
  color: #f56c6c;
}

.compliance-breakdown {
  margin-bottom: 20px;
}

.breakdown-item {
  margin-bottom: 12px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-label {
  font-size: 14px;
  color: #606266;
}

.item-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.compliance-suggestions {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
}

.suggestion-item.success {
  color: #67c23a;
}

.suggestion-item.warning {
  color: #e6a23c;
}

.suggestion-item.danger {
  color: #f56c6c;
}

/* 图表区域样式 */
.main-analysis-charts {
  margin-bottom: 20px;
}

.detailed-charts {
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
  gap: 8px;
}

.chart-info {
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

.chart-insights {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.insight-card {
  flex: 1;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.insight-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.insight-icon {
  color: #409eff;
  margin-top: 2px;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.insight-description {
  font-size: 12px;
  color: #606266;
}

/* 异常检测样式 */
.anomaly-detection {
  margin-bottom: 20px;
}

.anomaly-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.anomaly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.anomaly-icon {
  margin-right: 8px;
  color: #e6a23c;
}

.anomaly-content {
  padding: 0;
}

.anomaly-item {
  padding: 16px;
  border-radius: 6px;
  background: #f8f9fa;
  border-left: 4px solid #e4e7ed;
}

.anomaly-item.high {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.anomaly-item.medium {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.anomaly-item.low {
  border-left-color: #409eff;
  background: #ecf5ff;
}

.anomaly-item-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.anomaly-item-icon {
  margin-right: 8px;
}

.anomaly-item-title {
  font-weight: 600;
  color: #303133;
}

.anomaly-item-count {
  font-size: 24px;
  font-weight: 700;
  color: #f56c6c;
  margin-bottom: 8px;
}

.anomaly-item-description {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.anomaly-item-action {
  text-align: center;
}

/* 数据详情样式 */
.data-details-section {
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
}

.detail-table {
  margin-top: 16px;
}

.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.search-input {
  width: 300px;
}

.department-filter {
  width: 200px;
  margin-left: 12px;
}

.count-cell {
  font-weight: 600;
  color: #409eff;
}

.amount-cell {
  font-weight: 600;
  color: #67c23a;
}

.rate-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.table-pagination {
  margin-top: 16px;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .detailed-charts .el-col {
    margin-bottom: 20px;
  }

  .chart-insights {
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .config-form {
    flex-direction: column;
  }

  .compliance-content .el-row {
    flex-direction: column;
  }

  .compliance-metrics {
    flex-direction: column;
    gap: 16px;
  }

  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .table-controls {
    flex-direction: column;
    gap: 12px;
  }

  .use-analysis-container {
    padding: 12px;
  }
}
</style>
