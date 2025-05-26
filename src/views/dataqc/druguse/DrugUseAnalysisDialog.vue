<template>
  <Dialog
    v-model="dialogVisible"
    title="药品使用统计分析"
    width="1400px"
    :close-on-click-modal="false"
    class="analysis-dialog"
  >
    <!-- 分析条件 -->
    <el-card class="mb-4">
      <template #header>
        <span>分析条件</span>
      </template>
      <el-form
        :model="queryParams"
        :inline="true"
        label-width="100px"
        class="analysis-form"
      >
        <el-form-item label="分析时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYYMMDD"
            class="w-250px"
          />
        </el-form-item>
        <el-form-item label="科室筛选">
          <el-select
            v-model="queryParams.departmentCode"
            placeholder="请选择科室"
            clearable
            class="w-200px"
          >
            <el-option
              v-for="dept in departmentList"
              :key="dept.code"
              :label="dept.name"
              :value="dept.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="患者类型">
          <el-select
            v-model="queryParams.patientType"
            placeholder="请选择患者类型"
            clearable
            class="w-150px"
          >
            <el-option label="门诊" value="1" />
            <el-option label="急诊" value="2" />
            <el-option label="住院" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAnalyze" :loading="analyzing">
            <Icon icon="ep:data-analysis" />开始分析
          </el-button>
          <el-button @click="resetAnalysis">
            <Icon icon="ep:refresh" />重置
          </el-button>
          <el-button type="success" @click="handleExportReport" :loading="exporting">
            <Icon icon="ep:download" />导出报告
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 核心指标概览 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon total-icon">
              <Icon icon="ep:document" />
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ coreMetrics.totalPrescriptions || 0 }}</div>
              <div class="metric-label">总处方数</div>
              <div class="metric-trend">
                <Icon :icon="coreMetrics.prescriptionTrend > 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                {{ Math.abs(coreMetrics.prescriptionTrend || 0) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon revenue-icon">
              <Icon icon="ep:money" />
            </div>
            <div class="metric-info">
              <div class="metric-value">¥{{ formatAmount(coreMetrics.totalRevenue || 0) }}</div>
              <div class="metric-label">总收入</div>
              <div class="metric-trend">
                <Icon :icon="coreMetrics.revenueTrend > 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                {{ Math.abs(coreMetrics.revenueTrend || 0) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon patient-icon">
              <Icon icon="ep:user" />
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ coreMetrics.totalPatients || 0 }}</div>
              <div class="metric-label">患者数量</div>
              <div class="metric-trend">
                <Icon :icon="coreMetrics.patientTrend > 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                {{ Math.abs(coreMetrics.patientTrend || 0) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon avg-icon">
              <Icon icon="ep:data-line" />
            </div>
            <div class="metric-info">
              <div class="metric-value">¥{{ (coreMetrics.avgPrescriptionValue || 0).toFixed(2) }}</div>
              <div class="metric-label">平均处方金额</div>
              <div class="metric-trend">
                <Icon :icon="coreMetrics.avgValueTrend > 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                {{ Math.abs(coreMetrics.avgValueTrend || 0) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表分析区域 -->
    <el-row :gutter="20" class="mb-4">
      <!-- 使用趋势图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>用药趋势分析</span>
              <el-radio-group v-model="trendType" size="small">
                <el-radio-button value="daily">按日</el-radio-button>
                <el-radio-button value="weekly">按周</el-radio-button>
                <el-radio-button value="monthly">按月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container" ref="trendChartRef"></div>
        </el-card>
      </el-col>

      <!-- 科室分布图 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>科室用药分布</span>
              <el-select v-model="deptMetric" size="small" class="w-120px">
                <el-option label="处方数量" value="count" />
                <el-option label="用药金额" value="amount" />
              </el-select>
            </div>
          </template>
          <div class="chart-container" ref="deptChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-4">
      <!-- 药品排行榜 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>药品使用排行</span>
              <el-select v-model="rankingType" size="small" class="w-120px">
                <el-option label="使用数量" value="quantity" />
                <el-option label="销售金额" value="revenue" />
                <el-option label="处方频次" value="frequency" />
              </el-select>
            </div>
          </template>
          <div class="ranking-list">
            <div
              v-for="(item, index) in drugRanking.slice(0, 10)"
              :key="index"
              class="ranking-item"
            >
              <div class="ranking-number" :class="getRankingClass(index)">
                {{ index + 1 }}
              </div>
              <div class="ranking-info">
                <div class="drug-name">{{ item.productName }}</div>
                <div class="drug-code">编码：{{ item.hosDrugId }}</div>
              </div>
              <div class="ranking-value">
                <div class="value">{{ formatRankingValue(item, rankingType) }}</div>
                <div class="percentage">{{ item.percentage }}%</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 患者类型分析 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>患者类型分析</span>
          </template>
          <div class="chart-container" ref="patientChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 基药分析 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="chart-header">
              <span>基本药物使用分析</span>
              <div class="header-stats">
                <el-tag :type="baseDrugRate >= 60 ? 'success' : baseDrugRate >= 40 ? 'warning' : 'danger'">
                  基药使用率：{{ baseDrugRate }}%
                </el-tag>
                <el-tag type="info" class="ml-2">
                  目标：≥60%
                </el-tag>
              </div>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="base-drug-metric">
                <div class="metric-title">基药处方数</div>
                <div class="metric-number">{{ baseDrugAnalysis.baseDrugCount || 0 }}</div>
                <div class="metric-subtitle">占比 {{ baseDrugAnalysis.baseDrugCountRate || 0 }}%</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="base-drug-metric">
                <div class="metric-title">基药金额</div>
                <div class="metric-number">¥{{ formatAmount(baseDrugAnalysis.baseDrugAmount || 0) }}</div>
                <div class="metric-subtitle">占比 {{ baseDrugAnalysis.baseDrugAmountRate || 0 }}%</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="base-drug-metric">
                <div class="metric-title">非基药金额</div>
                <div class="metric-number">¥{{ formatAmount(baseDrugAnalysis.nonBaseDrugAmount || 0) }}</div>
                <div class="metric-subtitle">占比 {{ baseDrugAnalysis.nonBaseDrugAmountRate || 0 }}%</div>
              </div>
            </el-col>
          </el-row>
          <div class="chart-container mt-4" ref="baseDrugChartRef"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card>
      <template #header>
        <div class="chart-header">
          <span>详细统计数据</span>
          <el-tabs v-model="activeTab" type="card" size="small">
            <el-tab-pane label="科室统计" name="department" />
            <el-tab-pane label="医生统计" name="doctor" />
            <el-tab-pane label="药品统计" name="drug" />
          </el-tabs>
        </div>
      </template>

      <!-- 科室统计表 -->
      <el-table
        v-if="activeTab === 'department'"
        :data="deptStatistics"
        v-loading="loading"
        max-height="400"
      >
        <el-table-column label="科室名称" prop="departmentName" min-width="150" />
        <el-table-column label="处方数量" prop="prescriptionCount" width="100" align="center" />
        <el-table-column label="患者数量" prop="patientCount" width="100" align="center" />
        <el-table-column label="用药金额" prop="totalAmount" width="120" align="center">
          <template #default="scope">
            ¥{{ formatAmount(scope.row.totalAmount || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="平均处方金额" prop="avgAmount" width="130" align="center">
          <template #default="scope">
            ¥{{ (scope.row.avgAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="基药使用率" prop="baseDrugRate" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.baseDrugRate >= 60 ? 'success' : scope.row.baseDrugRate >= 40 ? 'warning' : 'danger'" size="small">
              {{ scope.row.baseDrugRate || 0 }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 医生统计表 -->
      <el-table
        v-if="activeTab === 'doctor'"
        :data="doctorStatistics"
        v-loading="loading"
        max-height="400"
      >
        <el-table-column label="医生姓名" prop="doctorName" width="120" />
        <el-table-column label="科室" prop="departmentName" width="150" />
        <el-table-column label="处方数量" prop="prescriptionCount" width="100" align="center" />
        <el-table-column label="患者数量" prop="patientCount" width="100" align="center" />
        <el-table-column label="用药金额" prop="totalAmount" width="120" align="center">
          <template #default="scope">
            ¥{{ formatAmount(scope.row.totalAmount || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="平均处方金额" prop="avgAmount" width="130" align="center">
          <template #default="scope">
            ¥{{ (scope.row.avgAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="基药使用率" prop="baseDrugRate" width="120" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.baseDrugRate >= 60 ? 'success' : scope.row.baseDrugRate >= 40 ? 'warning' : 'danger'" size="small">
              {{ scope.row.baseDrugRate || 0 }}%
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 药品统计表 -->
      <el-table
        v-if="activeTab === 'drug'"
        :data="drugStatistics"
        v-loading="loading"
        max-height="400"
      >
        <el-table-column label="药品编码" prop="hosDrugId" width="120" />
        <el-table-column label="产品名称" prop="productName" min-width="200" />
        <el-table-column label="使用次数" prop="useCount" width="100" align="center" />
        <el-table-column label="总用量" prop="totalQuantity" width="100" align="center" />
        <el-table-column label="销售金额" prop="totalAmount" width="120" align="center">
          <template #default="scope">
            ¥{{ formatAmount(scope.row.totalAmount || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="平均单价" prop="avgPrice" width="100" align="center">
          <template #default="scope">
            ¥{{ (scope.row.avgPrice || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="是否基药" prop="isBaseDrug" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isBaseDrug ? 'success' : 'info'" size="small">
              {{ scope.row.isBaseDrug ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <template #footer>
      <el-button @click="dialogVisible = false">关 闭</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as echarts from 'echarts'
import { formatAmount } from '@/utils/analysis'
import download from '@/utils/download'
import * as DrugUseApi from '@/api/dataqc/drugUse'

defineOptions({ name: 'DrugUseAnalysisDialog' })

const message = useMessage()

// 响应式数据
const dialogVisible = ref(false)
const analyzing = ref(false)
const loading = ref(false)
const exporting = ref(false)

const activeTab = ref('department')
const trendType = ref('daily')
const deptMetric = ref('count')
const rankingType = ref('quantity')

// 图表引用
const trendChartRef = ref()
const deptChartRef = ref()
const patientChartRef = ref()
const baseDrugChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let deptChart: echarts.ECharts | null = null
let patientChart: echarts.ECharts | null = null
let baseDrugChart: echarts.ECharts | null = null

// 分析参数
const queryParams = reactive({
  dateRange: [] as string[],
  departmentCode: '',
  patientType: ''
})

// 数据
const coreMetrics = ref({})
const baseDrugAnalysis = ref({})
const drugRanking = ref([])
const deptStatistics = ref([])
const doctorStatistics = ref([])
const drugStatistics = ref([])
const departmentList = ref([])

const baseDrugRate = computed(() => {
  const rate = baseDrugAnalysis.value.baseDrugAmountRate || 0
  return Math.round(rate)
})

/** 打开对话框 */
const open = () => {
  dialogVisible.value = true
  initializeParams()
  loadDepartments()
  handleAnalyze()
}

/** 初始化参数 */
const initializeParams = () => {
  const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10).replace(/-/g, '')
  queryParams.dateRange = [startDate, endDate]
  queryParams.departmentCode = ''
  queryParams.patientType = ''
}

/** 加载科室列表 */
const loadDepartments = async () => {
  try {
    const data = await DrugUseApi.getDepartmentList()
    departmentList.value = data
  } catch (error) {
    console.error('加载科室列表失败', error)
  }
}

/** 开始分析 */
const handleAnalyze = async () => {
  analyzing.value = true
  try {
    await Promise.all([
      loadCoreMetrics(),
      loadBaseDrugAnalysis(),
      loadDrugRanking(),
      loadStatistics()
    ])

    // 初始化图表
    nextTick(() => {
      initCharts()
    })

  } catch (error) {
    console.error('分析失败', error)
    message.error('分析失败')
  } finally {
    analyzing.value = false
  }
}

/** 加载核心指标 */
const loadCoreMetrics = async () => {
  const data = await DrugUseApi.getCoreMetrics(queryParams)
  coreMetrics.value = data
}

/** 加载基药分析 */
const loadBaseDrugAnalysis = async () => {
  const data = await DrugUseApi.getBaseDrugAnalysis(queryParams.dateRange[0], queryParams.dateRange[1])
  baseDrugAnalysis.value = data
}

/** 加载药品排行 */
const loadDrugRanking = async () => {
  const data = await DrugUseApi.getDrugRanking(queryParams)
  drugRanking.value = data
}

/** 加载统计数据 */
const loadStatistics = async () => {
  loading.value = true
  try {
    const [deptData, doctorData, drugData] = await Promise.all([
      DrugUseApi.getDepartmentStatistics(queryParams),
      DrugUseApi.getDoctorStatistics(queryParams),
      DrugUseApi.getDrugStatistics(queryParams)
    ])

    deptStatistics.value = deptData
    doctorStatistics.value = doctorData
    drugStatistics.value = drugData
  } finally {
    loading.value = false
  }
}

/** 初始化图表 */
const initCharts = () => {
  initTrendChart()
  initDeptChart()
  initPatientChart()
  initBaseDrugChart()
}

/** 初始化趋势图表 */
const initTrendChart = () => {
  if (trendChart) {
    trendChart.dispose()
  }

  trendChart = echarts.init(trendChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['处方数量', '用药金额']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: [
      {
        type: 'value',
        name: '处方数量'
      },
      {
        type: 'value',
        name: '金额(万元)'
      }
    ],
    series: [
      {
        name: '处方数量',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '用药金额',
        type: 'line',
        yAxisIndex: 1,
        data: [220, 282, 201, 234, 290, 430]
      }
    ]
  }

  trendChart.setOption(option)
}

/** 初始化科室分布图表 */
const initDeptChart = () => {
  if (deptChart) {
    deptChart.dispose()
  }

  deptChart = echarts.init(deptChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '科室分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 1048, name: '内科' },
          { value: 735, name: '外科' },
          { value: 580, name: '儿科' },
          { value: 484, name: '急诊科' },
          { value: 300, name: '其他' }
        ]
      }
    ]
  }

  deptChart.setOption(option)
}

/** 初始化患者类型图表 */
const initPatientChart = () => {
  if (patientChart) {
    patientChart.dispose()
  }

  patientChart = echarts.init(patientChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        name: '患者类型',
        type: 'doughnut',
        radius: ['40%', '70%'],
        data: [
          { value: 2048, name: '门诊' },
          { value: 735, name: '急诊' },
          { value: 580, name: '住院' }
        ]
      }
    ]
  }

  patientChart.setOption(option)
}

/** 初始化基药图表 */
const initBaseDrugChart = () => {
  if (baseDrugChart) {
    baseDrugChart.dispose()
  }

  baseDrugChart = echarts.init(baseDrugChartRef.value)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['基药金额', '非基药金额']
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '金额(万元)'
    },
    series: [
      {
        name: '基药金额',
        type: 'bar',
        stack: '总量',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '非基药金额',
        type: 'bar',
        stack: '总量',
        data: [220, 182, 191, 234, 290, 330]
      }
    ]
  }

  baseDrugChart.setOption(option)
}

/** 重置分析 */
const resetAnalysis = () => {
  initializeParams()
  handleAnalyze()
}

/** 导出报告 */
const handleExportReport = async () => {
  exporting.value = true
  try {
    const data = await DrugUseApi.exportAnalysisReport(queryParams)
    download.excel(data, '药品使用分析报告.xls')
    message.success('报告导出成功')
  } catch (error) {
    console.error('导出报告失败', error)
    message.error('导出报告失败')
  } finally {
    exporting.value = false
  }
}

/** 获取排行榜样式 */
const getRankingClass = (index: number) => {
  if (index === 0) return 'first'
  if (index === 1) return 'second'
  if (index === 2) return 'third'
  return 'normal'
}

/** 格式化排行榜数值 */
const formatRankingValue = (item: any, type: string) => {
  switch (type) {
    case 'quantity':
      return item.totalQuantity || 0
    case 'revenue':
      return `¥${formatAmount(item.totalAmount || 0)}`
    case 'frequency':
      return item.useCount || 0
    default:
      return 0
  }
}

// 监听变化重新渲染图表
watch([trendType, deptMetric], () => {
  if (trendChart && deptChart) {
    // 重新加载图表数据
    initTrendChart()
    initDeptChart()
  }
})

// 清理图表
onUnmounted(() => {
  if (trendChart) trendChart.dispose()
  if (deptChart) deptChart.dispose()
  if (patientChart) patientChart.dispose()
  if (baseDrugChart) baseDrugChart.dispose()
})

// 暴露方法
defineExpose({ open })
</script>

<style scoped>
.analysis-dialog :deep(.el-dialog__body) {
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.analysis-form {
  margin-bottom: 0;
}

.metric-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  margin-right: 20px;
}

.total-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.revenue-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.patient-icon {
  background: linear-gradient(135deg, #e6a23c, #f0a020);
}

.avg-icon {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 16px;
  color: #909399;
  margin-bottom: 4px;
}

.metric-trend {
  font-size: 14px;
  color: #67c23a;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-stats {
  display: flex;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.ranking-list {
  max-height: 350px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  margin-right: 12px;
}

.ranking-number.first {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
}

.ranking-number.second {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #333;
}

.ranking-number.third {
  background: linear-gradient(135deg, #cd7f32, #daa96e);
}

.ranking-number.normal {
  background: #e4e7ed;
  color: #606266;
}

.ranking-info {
  flex: 1;
  margin-right: 12px;
}

.drug-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.drug-code {
  font-size: 12px;
  color: #909399;
}

.ranking-value {
  text-align: right;
}

.value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.percentage {
  font-size: 12px;
  color: #909399;
}

.base-drug-metric {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 0 10px;
}

.metric-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 12px;
  color: #c0c4cc;
}

.w-250px {
  width: 250px;
}

.w-200px {
  width: 200px;
}

.w-150px {
  width: 150px;
}

.w-120px {
  width: 120px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>
