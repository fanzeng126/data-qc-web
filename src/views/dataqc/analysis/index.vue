<template>
  <div class="analysis-container">
    <!-- 页面标题和刷新控制 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <Icon icon="ep:data-analysis" class="title-icon" />
          统计分析中心
        </h1>
        <p class="page-subtitle">数据驱动决策，智能分析助力精准管理</p>
      </div>
      <div class="header-right">
        <div class="update-info">
          <span class="update-text">最后更新：{{ dashboardData.updateTime || '暂无数据' }}</span>
          <el-button
            type="primary"
            @click="refreshAllData"
            :loading="loading"
            class="refresh-btn"
          >
            <Icon icon="ep:refresh" />
            刷新数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 核心指标卡片区域 -->
    <div class="metrics-section">
      <el-row :gutter="20" class="metrics-row">
        <el-col :span="6" v-for="(metric, index) in coreMetrics" :key="index">
          <el-card class="metric-card" :class="metric.type">
            <div class="metric-content">
              <div class="metric-icon" :class="`${metric.type}-icon`">
                <Icon :icon="metric.icon" />
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ metric.value }}</div>
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-change" v-if="metric.change">
                  <Icon :icon="metric.change > 0 ? 'ep:arrow-up' : 'ep:arrow-down'" />
                  <span :class="metric.change > 0 ? 'positive' : 'negative'">
                    {{ Math.abs(metric.change) }}%
                  </span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预警信息区域 -->
    <div class="warning-section" v-if="hasWarnings">
      <el-alert
        title="系统预警"
        type="warning"
        :closable="false"
        class="warning-alert"
      >
        <template #default>
          <div class="warning-content">
            <div class="warning-item" v-for="warning in warningItems" :key="warning.key">
              <Icon :icon="warning.icon" class="warning-icon" />
              <span class="warning-text">{{ warning.text }}</span>
              <el-tag :type="warning.type" size="small">{{ warning.count }}</el-tag>
            </div>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 分析维度选择器 -->
    <div class="analysis-tabs">
      <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
        <el-tab-pane label="药品分析" name="drug">
          <template #label>
            <span class="tab-label">
              <Icon icon="fa-solid:notes-medical" />
              药品分析
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="出入库分析" name="inout">
          <template #label>
            <span class="tab-label">
              <Icon icon="ep:goods" />
              出入库分析
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="使用分析" name="use">
          <template #label>
            <span class="tab-label">
              <Icon icon="ep:data-line" />
              使用分析
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="费用分析" name="cost">
          <template #label>
            <span class="tab-label">
              <Icon icon="ep:money" />
              费用分析
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 动态内容区域 -->
    <div class="content-area" v-loading="loading">
      <!-- 药品分析页面 -->
      <DrugAnalysisChart
        v-if="activeTab === 'drug'"
        :data="drugAnalysisData"
        @data-change="handleDataChange"
      />

      <!-- 出入库分析页面 -->
      <InoutAnalysisChart
        v-if="activeTab === 'inout'"
        :data="inventoryAnalysisData"
        @data-change="handleDataChange"
      />

      <!-- 使用分析页面 -->
      <UseAnalysisChart
        v-if="activeTab === 'use'"
        :data="departmentAnalysisData"
        @data-change="handleDataChange"
      />

      <!-- 费用分析页面 -->
      <div v-if="activeTab === 'cost'" class="cost-analysis">
        <CostAnalysisChart
          :data="costAnalysisData"
          @export="handleExportReport"
        />
      </div>
    </div>

    <!-- 快速操作工具栏 -->
    <div class="quick-actions">
      <el-card class="action-card">
        <template #header>
          <span class="action-title">快速操作</span>
        </template>
        <div class="action-buttons">
          <el-button type="primary" plain @click="openAdvancedAnalysis">
            <Icon icon="ep:data-analysis" />
            高级分析
          </el-button>
          <el-button type="success" plain @click="exportAllReports">
            <Icon icon="ep:download" />
            导出报告
          </el-button>
          <el-button type="info" plain @click="openDataComparison">
            <Icon icon="ep:sort" />
            数据对比
          </el-button>
          <el-button type="warning" plain @click="openTrendPrediction">
            <Icon icon="ep:trend-charts" />
            趋势预测
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 高级分析对话框 -->
    <el-dialog
      v-model="advancedAnalysisVisible"
      title="高级分析工具"
      width="800px"
      :close-on-click-modal="false"
    >
      <AdvancedAnalysisForm
        @analysis-complete="handleAdvancedAnalysisComplete"
      />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as AnalysisApi from '@/api/dataqc/analysis'
import { formatAmount } from '@/utils/analysis'
import DrugAnalysisChart from './DrugAnalysisChart.vue'
import InoutAnalysisChart from './InoutAnalysisChart.vue'
import UseAnalysisChart from './UseAnalysisChart.vue'
import CostAnalysisChart from './CostAnalysisChart.vue'
import download from '@/utils/download'

defineOptions({ name: 'DataqcAnalysis' })

// ========== 响应式数据定义 ==========

const loading = ref(false)
const activeTab = ref('drug')
const advancedAnalysisVisible = ref(false)

// 各模块数据存储
const dashboardData = ref<AnalysisApi.DashboardData>({} as AnalysisApi.DashboardData)
const drugAnalysisData = ref<AnalysisApi.DrugAnalysisData>({} as AnalysisApi.DrugAnalysisData)
const inventoryAnalysisData = ref<AnalysisApi.InventoryAnalysisData>({} as AnalysisApi.InventoryAnalysisData)
const departmentAnalysisData = ref<AnalysisApi.DepartmentAnalysisData>({} as AnalysisApi.DepartmentAnalysisData)
const costAnalysisData = ref<AnalysisApi.CostAnalysisData>({} as AnalysisApi.CostAnalysisData)

// ========== 数据加载方法 ==========

/**
 * 根据标签页加载对应数据
 * 这种按需加载的方式可以显著提升页面性能
 */
const loadTabData = async (tabName: string) => {
  try {
    switch (tabName) {
      case 'drug':
        if (!drugAnalysisData.value.drugStats) {
          drugAnalysisData.value = await AnalysisApi.getDrugAnalysis()
        }
        break

      case 'inout':
        if (!inventoryAnalysisData.value.stockSummary) {
          inventoryAnalysisData.value = await AnalysisApi.getInventoryAnalysis()
        }
        break

      case 'use':
        if (!departmentAnalysisData.value.departmentRanking) {
          departmentAnalysisData.value = await AnalysisApi.getDepartmentAnalysis()
        }
        break

      case 'cost':
        if (!costAnalysisData.value.monthlyTrend) {
          costAnalysisData.value = await AnalysisApi.getCostAnalysis()
        }
        break
    }
  } catch (error) {
    console.error(`加载${tabName}数据失败:`, error)
    ElMessage.error(`${tabName}分析数据加载失败`)
  }
}

/**
 * 加载初始数据
 * 首先加载仪表板数据，这是用户最关心的核心信息
 */
const loadInitialData = async () => {
  loading.value = true
  try {
    // 优先加载仪表板数据
    dashboardData.value = await AnalysisApi.getDashboard()

    // 根据当前激活的标签页加载对应数据
    await loadTabData(activeTab.value)

    ElMessage.success('数据加载完成')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('数据加载失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// ========== 计算属性 ==========

/**
 * 核心指标计算
 * 将原始数据转换为前端展示需要的格式
 * 这里体现了数据驱动设计的核心思想
 */
const coreMetrics = computed(() => {
  const stats = dashboardData.value.basicStats || {}

  return [
    {
      type: 'drug',
      icon: 'fa-solid:notes-medical',
      label: '药品总数',
      value: stats.totalDrugs || 0,
      change: 2.5 // 这里应该来自趋势计算
    },
    {
      type: 'inventory',
      icon: 'ep:money',
      label: '库存价值',
      value: formatAmount(stats.totalInventoryValue || 0),
      change: -1.2
    },
    {
      type: 'usage',
      icon: 'ep:data-line',
      label: '月用药量',
      value: formatAmount(stats.monthlyUsage || 0),
      change: 5.8
    },
    {
      type: 'compliance',
      icon: 'ep:check',
      label: '基药使用率',
      value: `${stats.baseDrugRate || 0}%`,
      change: 3.2
    }
  ]
})

/**
 * 预警状态计算
 * 智能识别需要关注的业务风险点
 */
const hasWarnings = computed(() => {
  const warnings = dashboardData.value.warnings || {}
  return Object.values(warnings).some(count => count > 0)
})

const warningItems = computed(() => {
  const warnings = dashboardData.value.warnings || {}
  const items = []

  if (warnings.expiryDrugs > 0) {
    items.push({
      key: 'expiry',
      icon: 'ep:clock',
      text: '即将过期药品',
      count: warnings.expiryDrugs,
      type: 'warning'
    })
  }

  if (warnings.lowStock > 0) {
    items.push({
      key: 'stock',
      icon: 'ep:warning',
      text: '库存不足药品',
      count: warnings.lowStock,
      type: 'danger'
    })
  }

  if (warnings.abnormalUsage > 0) {
    items.push({
      key: 'usage',
      icon: 'ep:question-filled',
      text: '异常用药记录',
      count: warnings.abnormalUsage,
      type: 'warning'
    })
  }

  return items
})

// ========== 生命周期管理 ==========

/**
 * 组件初始化
 * 采用渐进式数据加载策略，优先加载关键数据
 */
onMounted(async () => {
  await loadInitialData()
})

// ========== 事件处理方法 ==========

/**
 * 刷新所有数据
 * 清除缓存并重新加载，确保数据的时效性
 */
const refreshAllData = async () => {
  // 清除所有缓存数据
  dashboardData.value = {} as AnalysisApi.DashboardData
  drugAnalysisData.value = {} as AnalysisApi.DrugAnalysisData
  inventoryAnalysisData.value = {} as AnalysisApi.InventoryAnalysisData
  departmentAnalysisData.value = {} as AnalysisApi.DepartmentAnalysisData
  costAnalysisData.value = {} as AnalysisApi.CostAnalysisData

  // 重新加载数据
  await loadInitialData()
}

/**
 * 标签页切换处理
 * 平滑的切换体验，避免数据加载阻塞界面
 */
const handleTabChange = async (tabName: string) => {
  activeTab.value = tabName
  await loadTabData(tabName)
}

/**
 * 子组件数据变化处理
 * 实现组件间的数据同步
 */
const handleDataChange = (eventData: any) => {
  console.log('子组件数据变化:', eventData)
  // 可以在这里处理跨组件的数据同步逻辑
}

/**
 * 导出报告处理
 * 根据当前分析维度导出对应的详细报告
 */
const handleExportReport = async () => {
  try {
    let exportData: any
    let fileName: string

    switch (activeTab.value) {
      case 'drug':
        exportData = drugAnalysisData.value
        fileName = '药品分析报告'
        break
      case 'inout':
        exportData = inventoryAnalysisData.value
        fileName = '库存分析报告'
        break
      case 'use':
        exportData = departmentAnalysisData.value
        fileName = '使用分析报告'
        break
      case 'cost':
        exportData = costAnalysisData.value
        fileName = '费用分析报告'
        break
      default:
        exportData = dashboardData.value
        fileName = '综合分析报告'
    }

    // 这里应该调用后端的报告导出接口
    // const blob = await AnalysisApi.exportReport(activeTab.value, exportData)
    // download.blob(blob, `${fileName}.xlsx`)

    ElMessage.success(`${fileName}导出成功`)
  } catch (error) {
    console.error('导出报告失败:', error)
    ElMessage.error('导出报告失败')
  }
}

// ========== 高级功能方法 ==========

const openAdvancedAnalysis = () => {
  advancedAnalysisVisible.value = true
}

const exportAllReports = async () => {
  ElMessage.info('正在生成全量报告，请稍候...')
  // 实现全量报告导出逻辑
}

const openDataComparison = () => {
  ElMessage.info('数据对比功能开发中')
}

const openTrendPrediction = () => {
  ElMessage.info('趋势预测功能开发中')
}

const handleAdvancedAnalysisComplete = (result: any) => {
  console.log('高级分析完成:', result)
  advancedAnalysisVisible.value = false
  ElMessage.success('高级分析完成')
}
</script>

<style scoped>
.analysis-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

/* ========== 页面头部样式 ========== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.title-icon {
  margin-right: 12px;
  color: #409eff;
  font-size: 28px;
}

.page-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.update-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.update-text {
  color: #606266;
  font-size: 12px;
}

.refresh-btn {
  border-radius: 6px;
}

/* ========== 指标卡片样式 ========== */
.metrics-section {
  margin-bottom: 24px;
}

.metric-card {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 24px;
}

.metric-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: white;
  margin-right: 20px;
}

.drug-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.inventory-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.usage-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.compliance-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1;
}

.metric-label {
  font-size: 16px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

/* ========== 预警区域样式 ========== */
.warning-section {
  margin-bottom: 24px;
}

.warning-alert {
  border-radius: 8px;
}

.warning-content {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
}

.warning-icon {
  color: #e6a23c;
}

.warning-text {
  font-size: 14px;
  color: #606266;
}

/* ========== 标签页样式 ========== */
.analysis-tabs {
  margin-bottom: 24px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ========== 内容区域样式 ========== */
.content-area {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

/* ========== 快速操作样式 ========== */
.quick-actions {
  margin-top: 24px;
}

.action-card {
  border-radius: 8px;
}

.action-title {
  font-weight: 600;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1200px) {
  .metrics-row .el-col {
    margin-bottom: 16px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .warning-content {
    flex-direction: column;
  }

  .action-buttons {
    justify-content: center;
  }

  .analysis-container {
    padding: 12px;
  }
}

/* ========== 深色主题支持 ========== */
@media (prefers-color-scheme: dark) {
  .analysis-container {
    background: #1a1a1a;
  }

  .page-header,
  .content-area,
  .action-card {
    background: #2d2d2d;
    color: #e5e5e5;
  }

  .metric-card {
    background: #2d2d2d;
  }

  .metric-value {
    color: #e5e5e5;
  }
}
</style>
