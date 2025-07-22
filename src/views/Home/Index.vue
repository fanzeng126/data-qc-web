<template>
  <div class="dashboard-container">
    <!-- Page Header -->
    <PageHeader
      title="药品使用监测质量控制平台"
      content="实时监控药品数据导入、质控状态和数据质量，确保医疗机构药品使用数据的准确性和完整性"
    >
      <template #extra>
        <el-button type="primary" @click="handleQuickImport">
          <el-icon>
            <Upload />
          </el-icon>
          快速导入
        </el-button>
        <el-button @click="handleViewReports">
          <el-icon>
            <Document />
          </el-icon>
          查看报告
        </el-button>
      </template>
    </PageHeader>

    <!-- 概览 统计 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日导入任务"
            :value="statistics.todayTasks"
            icon="FolderAdd"
            color="#409EFF"
            :trend="statistics.taskTrend"
            :description="`成功: ${statistics.todaySuccessTasks}个`"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="处理数据量"
            :value="statistics.totalRecords"
            suffix="条"
            icon="DataLine"
            color="#67C23A"
            :trend="statistics.recordTrend"
            :description="`今日新增: ${statistics.todayRecords}条`"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="质控通过率"
            :value="statistics.qcPassRate"
            suffix="%"
            icon="CircleCheck"
            color="#E6A23C"
            :trend="statistics.qcTrend"
            :footerText="getQcStatusText()"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <StatCard
            title="数据完整性"
            :value="statistics.dataIntegrity"
            suffix="%"
            icon="Compass"
            color="#909399"
            :description="`异常数据: ${statistics.abnormalCount}条`"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20" class="content-section">
      <!-- 左列：Recent Tasks 和 Activities -->
      <el-col :xs="24" :lg="16">
        <!-- 最近的导入任务 -->
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon>
                  <Clock />
                </el-icon>
                <span>最近导入任务</span>
              </div>
              <el-button link type="primary" @click="handleViewAllTasks">
                查看全部
                <el-icon>
                  <ArrowRight />
                </el-icon>
              </el-button>
            </div>
          </template>

          <el-table
            :data="recentTasks"
            v-loading="tasksLoading"
            :stripe="true"
            style="width: 100%"
            class="tasks-table"
          >
            <template #empty>
              <el-empty description="暂无导入任务" :image-size="80">
                <el-button type="primary" @click="handleQuickImport">开始导入</el-button>
              </el-empty>
            </template>
            <el-table-column prop="taskNo" label="任务编号" width="180" show-overflow-tooltip />
            <el-table-column
              prop="taskName"
              label="任务名称"
              min-width="100"
              show-overflow-tooltip
            />
            <el-table-column prop="fileName" label="文件名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getTaskStatusType(row.status)" size="small">
                  {{ getTaskStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="progress" label="进度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.progressPercent" :stroke-width="6" />
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="耗时" width="100" align="center">
              <template #default="{ row }">
                <span v-if="row.duration">{{ formatDuration(row.duration) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="creator" label="创建人" width="100" show-overflow-tooltip />
            <el-table-column
              prop="createTime"
              label="创建时间"
              width="160"
              :formatter="dateFormatter"
            />
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewTask(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 数据质量监控 -->
        <el-card class="content-card chart-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon>
                  <TrendCharts />
                </el-icon>
                <span>数据质量监控</span>
              </div>
              <el-radio-group v-model="chartPeriod" size="small" @change="handleChartPeriodChange">
                <el-radio-button label="day">今日</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>

          <div class="chart-container" v-loading="chartLoading">
            <div ref="qualityChartRef" style="width: 100%; height: 300px"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 右列：快速作和警报 -->
      <el-col :xs="24" :lg="8">
        <!-- 快速作 -->
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon>
                  <Lightning />
                </el-icon>
                <span>快捷操作</span>
              </div>
            </div>
          </template>

          <div class="quick-actions">
            <div
              v-for="action in quickActions"
              :key="action.key"
              class="action-item"
              @click="handleQuickAction(action)"
            >
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <el-icon :size="24">
                  <component :is="action.icon" />
                </el-icon>
              </div>
              <div class="action-content">
                <div class="action-title">{{ action.title }}</div>
                <div class="action-desc">{{ action.description }}</div>
              </div>
              <el-icon class="action-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </el-card>

        <!-- 系统警报 -->
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon>
                  <Bell />
                </el-icon>
                <span>系统提醒</span>
                <el-badge :value="unreadAlerts" :hidden="unreadAlerts === 0" class="alert-badge" />
              </div>
              <el-button link type="primary" size="small" @click="handleViewAllAlerts">
                全部
              </el-button>
            </div>
          </template>

          <div class="alerts-container" v-loading="alertsLoading">
            <el-empty v-if="alerts.length === 0" description="暂无提醒" :image-size="80" />
            <div v-else class="alert-list">
              <div
                v-for="alert in alerts"
                :key="alert.id"
                class="alert-item"
                :class="{ unread: !alert.read }"
                @click="handleViewAlert(alert)"
              >
                <el-icon class="alert-icon" :style="{ color: getAlertColor(alert.type) }">
                  <component :is="getAlertIcon(alert.type)" />
                </el-icon>
                <div class="alert-content">
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-time">{{ formatPast(alert.createTime) }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- Data Statistics Summary -->
        <el-card class="content-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon>
                  <PieChart />
                </el-icon>
                <span>数据分布</span>
              </div>
            </div>
          </template>

          <div class="data-distribution">
            <div v-for="item in dataDistribution" :key="item.key" class="distribution-item">
              <div class="distribution-header">
                <span class="distribution-label">{{ item.label }}</span>
                <span class="distribution-value">{{ item.value }}条</span>
              </div>
              <el-progress
                :percentage="item.percentage"
                :stroke-width="8"
                :color="item.color"
                :show-text="false"
              />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import {
  Upload,
  Document,
  FolderAdd,
  DataLine,
  CircleCheck,
  Compass,
  Clock,
  ArrowRight,
  TrendCharts,
  Lightning,
  Bell,
  PieChart,
  Warning,
  SuccessFilled,
  CircleClose,
  InfoFilled,
  Setting
} from '@element-plus/icons-vue'
import { dateFormatter, formatPast } from '@/utils/formatTime'
import { DashboardApi } from '@/api/drug/dashboard'
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

defineOptions({ name: 'DrugMonitorDashboard' })

const router = useRouter()

// ==================== Reactive Data ====================

const statistics = reactive({
  todayTasks: 0,
  todaySuccessTasks: 0,
  taskTrend: 0,
  totalRecords: 0,
  todayRecords: 0,
  recordTrend: 0,
  qcPassRate: 0,
  qcTrend: 0,
  dataIntegrity: 0,
  abnormalCount: 0
})

const recentTasks = ref([])
const tasksLoading = ref(false)

const chartPeriod = ref('day')
const chartLoading = ref(false)
const qualityChartRef = ref()
let qualityChart = null

const alerts = ref([])
const unreadAlerts = ref(0)
const alertsLoading = ref(false)

const quickActions = [
  {
    key: 'import',
    title: '批量导入',
    description: '上传压缩包批量导入数据',
    icon: Upload, // 直接使用组件引用，而不是字符串
    color: '#409EFF',
    path: '/drug-import/batch'
  },
  {
    key: 'qc',
    title: '质控检查',
    description: '执行数据质控规则检查',
    icon: Compass,
    color: '#67C23A',
    path: '/drug-qc/execution'
  },
  {
    key: 'rule',
    title: '规则管理',
    description: '配置质控规则',
    icon: Setting,
    color: '#E6A23C',
    path: '/drug-qc/rule'
  },
  {
    key: 'report',
    title: '质控报告',
    description: '查看质控分析报告',
    icon: Document,
    color: '#909399',
    path: '/drug-qc/result'
  }
]

const dataDistribution = ref([
  { key: 'hospital', label: '医疗机构', value: 0, percentage: 0, color: '#409EFF' },
  { key: 'catalog', label: '药品目录', value: 0, percentage: 0, color: '#67C23A' },
  { key: 'inbound', label: '入库记录', value: 0, percentage: 0, color: '#E6A23C' },
  { key: 'outbound', label: '出库记录', value: 0, percentage: 0, color: '#F56C6C' },
  { key: 'usage', label: '使用记录', value: 0, percentage: 0, color: '#909399' }
])

// ==================== Lifecycle ====================

onMounted(() => {
  initDashboard()
  initChart()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
  if (qualityChart) {
    qualityChart.dispose()
  }
})

// ==================== 方法 ====================

const initDashboard = async () => {
  await Promise.all([loadStatistics(), loadRecentTasks(), loadAlerts(), loadDataDistribution()])
}

const loadStatistics = async () => {
  try {
    const data = await DashboardApi.getStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

const loadRecentTasks = async () => {
  tasksLoading.value = true
  try {
    const response = await DashboardApi.getRecentTasks(10)

    // 正确解析返回的数据结构
    recentTasks.value = response.data?.list || response.list || response || []
  } catch (error) {
    console.error('Failed to load recent tasks:', error)
  } finally {
    tasksLoading.value = false
  }
}

const loadAlerts = async () => {
  alertsLoading.value = true
  try {
    const response = await DashboardApi.getSystemAlerts(5)

    // 正确解析返回的数据结构
    alerts.value = response.data?.list || response.list || response || []
    unreadAlerts.value = response.data?.unreadCount || response.unreadCount || 0
  } catch (error) {
    console.error('Failed to load alerts:', error)
  } finally {
    alertsLoading.value = false
  }
}

const loadDataDistribution = async () => {
  try {
    const data = await DashboardApi.getDataDistribution()

    const total = Object.values(data).reduce((sum, val) => sum + val, 0)

    dataDistribution.value = [
      {
        key: 'hospital',
        label: '医疗机构',
        value: data.hospitalCount || 0,
        percentage: total > 0 ? Math.round((data.hospitalCount / total) * 100) : 0,
        color: '#409EFF'
      },
      {
        key: 'catalog',
        label: '药品目录',
        value: data.catalogCount || 0,
        percentage: total > 0 ? Math.round((data.catalogCount / total) * 100) : 0,
        color: '#67C23A'
      },
      {
        key: 'inbound',
        label: '入库记录',
        value: data.inboundCount || 0,
        percentage: total > 0 ? Math.round((data.inboundCount / total) * 100) : 0,
        color: '#E6A23C'
      },
      {
        key: 'outbound',
        label: '出库记录',
        value: data.outboundCount || 0,
        percentage: total > 0 ? Math.round((data.outboundCount / total) * 100) : 0,
        color: '#F56C6C'
      },
      {
        key: 'usage',
        label: '使用记录',
        value: data.usageCount || 0,
        percentage: total > 0 ? Math.round((data.usageCount / total) * 100) : 0,
        color: '#909399'
      }
    ]
  } catch (error) {
    console.error('Failed to load data distribution:', error)
  }
}

const initChart = () => {
  qualityChart = echarts.init(qualityChartRef.value)
  loadChartData()
}

const loadChartData = async () => {
  chartLoading.value = true
  try {
    const data = await DashboardApi.getQualityTrend(chartPeriod.value)

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['导入量', '质控通过率'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.dates
      },
      yAxis: [
        {
          type: 'value',
          name: '导入量',
          position: 'left'
        },
        {
          type: 'value',
          name: '通过率(%)',
          position: 'right',
          max: 100,
          min: 0
        }
      ],
      series: [
        {
          name: '导入量',
          type: 'line',
          data: data.importCounts,
          smooth: true,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
              ]
            }
          }
        },
        {
          name: '质控通过率',
          type: 'line',
          yAxisIndex: 1,
          data: data.passRates,
          smooth: true,
          itemStyle: {
            color: '#67C23A'
          }
        }
      ]
    }

    qualityChart.setOption(option)
  } catch (error) {
    console.error('Failed to load chart data:', error)
  } finally {
    chartLoading.value = false
  }
}

// Auto refresh
let refreshTimer = null

const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    loadStatistics()
    loadRecentTasks()
  }, 60000) // Refresh every minute
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 事件处理程序
const handleQuickImport = () => {
  router.push('/drug-import/batch')
}

const handleViewReports = () => {
  router.push('/drug-qc/result')
}

const handleViewAllTasks = () => {
  router.push('/drug-import/task')
}

const handleViewTask = (task) => {
  router.push(`/drug-import/detail/${task.id}`)
}

const handleChartPeriodChange = () => {
  loadChartData()
}

const handleQuickAction = (action) => {
  router.push(action.path)
}

const handleViewAllAlerts = () => {
  router.push('/user/notify-message')
}

const handleViewAlert = async (alert) => {
  if (!alert.read) {
    await DashboardApi.markAlertAsRead(alert.id)
    alert.read = true
    unreadAlerts.value--
  }

  // Navigate based on alert type
  if (alert.link) {
    router.push(alert.link)
  }
}

// Utility methods
const getQcStatusText = () => {
  const rate = statistics.qcPassRate
  if (rate >= 95) return '优秀'
  if (rate >= 90) return '良好'
  if (rate >= 80) return '合格'
  return '待改进'
}

const getTaskStatusType = (status) => {
  const statusMap = {
    0: 'info',
    1: 'warning',
    2: 'warning',
    3: 'warning',
    4: 'success',
    5: 'danger',
    6: 'warning'
  }
  return statusMap[status] || 'info'
}

const getTaskStatusLabel = (status) => {
  const statusMap = {
    0: '待处理',
    1: '解压中',
    2: '导入中',
    3: '质控中',
    4: '完成',
    5: '失败',
    6: '部分成功'
  }
  return statusMap[status] || '未知'
}

const formatDuration = (duration) => {
  if (!duration) return '-'

  const hours = Math.floor(duration / 3600)
  const minutes = Math.floor((duration % 3600) / 60)
  const seconds = duration % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

const getAlertIcon = (type) => {
  const iconMap = {
    error: 'CircleClose',
    warning: 'Warning',
    success: 'SuccessFilled',
    info: 'InfoFilled'
  }
  return iconMap[type] || 'InfoFilled'
}

const getAlertColor = (type) => {
  const colorMap = {
    error: '#F56C6C',
    warning: '#E6A23C',
    success: '#67C23A',
    info: '#409EFF'
  }
  return colorMap[type] || '#409EFF'
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-section {
  margin-bottom: 20px;
}

.content-section {
  margin-top: 20px;
}

.content-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.content-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

/* Chart styles */
.chart-card {
  margin-top: 20px;
}

.chart-container {
  padding: 20px 0;
}

/* Quick actions */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:hover {
  background-color: #e9ecef;
  transform: translateX(4px);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #909399;
}

.action-arrow {
  font-size: 16px;
  color: #c0c4cc;
}

/* Alerts */
.alert-badge {
  margin-left: 8px;
}

.alerts-container {
  max-height: 300px;
  overflow-y: auto;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alert-item:hover {
  background-color: #e9ecef;
}

.alert-item.unread {
  background-color: #ecf5ff;
}

.alert-item.unread:hover {
  background-color: #d9ecff;
}

.alert-icon {
  font-size: 20px;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.4;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

/* Data distribution */
.data-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.distribution-label {
  color: #606266;
}

.distribution-value {
  font-weight: 600;
  color: #303133;
}

/* Table styles */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-progress) {
  line-height: 1;
}

:deep(.el-progress__text) {
  font-size: 12px !important;
}

/* Responsive design */
@media (max-width: 1200px) {
  .content-section {
    margin-top: 0;
  }

  .content-section .el-col-lg-16,
  .content-section .el-col-lg-8 {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 10px;
  }

  .stats-section .el-col {
    margin-bottom: 12px;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-item {
    padding: 12px;
  }

  .action-icon {
    width: 40px;
    height: 40px;
  }
}

/* Loading states */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

/* Empty state */
:deep(.el-empty) {
  padding: 20px 0;
}

:deep(.el-empty__description) {
  margin-top: 8px;
}
</style>
