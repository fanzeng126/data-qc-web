<template>
  <!-- 系统指标卡片 -->
  <ContentWrap>
    <SystemMetricsCard :metrics="systemMetrics" :loading="metricsLoading" />
  </ContentWrap>

  <!-- 性能趋势图表 -->
  <ContentWrap>
    <el-card class="performance-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <Icon icon="ep:data-line" class="header-icon" />
            <span class="header-title">系统性能趋势</span>
          </div>
          <div class="header-right">
            <el-button
              type="primary"
              size="small"
              @click="refreshPerformanceData"
              :loading="performanceLoading"
            >
              <Icon icon="ep:refresh" />刷新
            </el-button>
          </div>
        </div>
      </template>
      <PerformanceChart :data="performanceData" :loading="performanceLoading" />
    </el-card>
  </ContentWrap>

  <el-row :gutter="20">
    <el-col :xs="24" :sm="24" :md="14" :lg="16">
      <!-- 导入日志列表 -->
      <ContentWrap>
        <el-card class="log-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <Icon icon="ep:document" class="header-icon" />
                <span class="header-title">导入日志监控</span>
              </div>
              <div class="header-right">
                <el-button
                  size="small"
                  @click="openLogQuery"
                >
                  <Icon icon="ep:search" />高级查询
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="handleExportLogs"
                  :loading="exportLoading"
                >
                  <Icon icon="ep:download" />导出日志
                </el-button>
              </div>
            </div>
          </template>
          <ImportLogTable
            :query-params="logQueryParams"
            @refresh="handleLogRefresh"
          />
        </el-card>
      </ContentWrap>
    </el-col>

    <el-col :xs="24" :sm="24" :md="10" :lg="8">
      <!-- 实时告警信息 -->
      <ContentWrap>
        <el-card class="alert-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <Icon icon="ep:warning" class="header-icon warning-icon" />
                <span class="header-title">实时告警</span>
              </div>
              <div class="header-right">
                <el-badge :value="alertCount" :max="99" type="danger">
                  <Icon icon="ep:bell" />
                </el-badge>
              </div>
            </div>
          </template>
          <div class="alert-list" v-loading="alertLoading">
            <div
              v-for="alert in alertList"
              :key="alert.id"
              class="alert-item"
              :class="getAlertClass(alert.level)"
            >
              <div class="alert-content">
                <div class="alert-message">{{ alert.message }}</div>
                <div class="alert-time">{{ alert.time }}</div>
              </div>
              <div class="alert-level">
                <el-tag :type="getAlertTagType(alert.level)" size="small">
                  {{ getAlertLevelText(alert.level) }}
                </el-tag>
              </div>
            </div>
            <div v-if="alertList.length === 0" class="no-alerts">
              <Icon icon="ep:check" class="no-alert-icon" />
              <span>暂无告警信息</span>
            </div>
          </div>
        </el-card>
      </ContentWrap>

      <!-- 任务执行统计 -->
      <ContentWrap>
        <el-card class="task-stats-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <Icon icon="ep:data-analysis" class="header-icon" />
                <span class="header-title">任务执行统计</span>
              </div>
            </div>
          </template>
          <div class="task-stats" v-loading="taskStatsLoading">
            <div class="stats-grid">
              <div class="stat-item total-stat">
                <div class="stat-value">{{ taskStats.totalTasks || 0 }}</div>
                <div class="stat-label">总任务数</div>
              </div>
              <div class="stat-item success-stat">
                <div class="stat-value">{{ taskStats.successTasks || 0 }}</div>
                <div class="stat-label">成功任务</div>
              </div>
              <div class="stat-item failed-stat">
                <div class="stat-value">{{ taskStats.failedTasks || 0 }}</div>
                <div class="stat-label">失败任务</div>
              </div>
              <div class="stat-item processing-stat">
                <div class="stat-value">{{ taskStats.processingTasks || 0 }}</div>
                <div class="stat-label">处理中</div>
              </div>
            </div>
            <div class="success-rate">
              <div class="rate-label">总体成功率</div>
              <div class="rate-value">{{ taskStats.successRate || 0 }}%</div>
              <el-progress
                :percentage="taskStats.successRate || 0"
                :stroke-width="8"
                :show-text="false"
                class="rate-progress"
              />
            </div>
          </div>
        </el-card>
      </ContentWrap>
    </el-col>
  </el-row>

  <!-- 高级查询对话框 -->
  <el-dialog v-model="logQueryVisible" title="日志高级查询" width="600px">
    <el-form :model="advancedQuery" ref="queryFormRef" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="批次号" prop="batchNo">
            <el-input v-model="advancedQuery.batchNo" placeholder="请输入批次号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="文件类型" prop="fileType">
            <el-select v-model="advancedQuery.fileType" placeholder="选择文件类型" clearable>
              <el-option label="药品目录" value="DRUG_LIST" />
              <el-option label="出入库信息" value="DRUG_INOUT_INFO" />
              <el-option label="使用情况" value="DRUG_USE_INFO" />
              <el-option label="机构资源" value="HOS_RESOURCE_INFO" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="advancedQuery.status" placeholder="选择状态" clearable>
              <el-option label="处理中" value="PROCESSING" />
              <el-option label="成功" value="SUCCESS" />
              <el-option label="失败" value="FAIL" />
              <el-option label="部分成功" value="PARTIAL_SUCCESS" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="操作人" prop="operatorName">
            <el-input v-model="advancedQuery.operatorName" placeholder="请输入操作人姓名" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="advancedQuery.createTime"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="logQueryVisible = false">取消</el-button>
        <el-button @click="resetAdvancedQuery">重置</el-button>
        <el-button type="primary" @click="handleAdvancedQuery">查询</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import * as MonitorApi from '@/api/dataqc/monitor'
import SystemMetricsCard from './SystemMetricsCard.vue'
import PerformanceChart from './PerformanceChart.vue'
import ImportLogTable from './ImportLogTable.vue'

defineOptions({ name: 'SystemMonitor' })

const message = useMessage()

// 响应式数据
const metricsLoading = ref(false)
const performanceLoading = ref(false)
const alertLoading = ref(false)
const taskStatsLoading = ref(false)
const exportLoading = ref(false)
const logQueryVisible = ref(false)

const systemMetrics = ref({})
const performanceData = ref([])
const alertList = ref([])
const alertCount = ref(0)
const taskStats = ref({})

const logQueryParams = ref({
  pageNo: 1,
  pageSize: 10
})

const advancedQuery = ref({
  batchNo: '',
  fileType: '',
  status: '',
  operatorName: '',
  createTime: []
})

const queryFormRef = ref()

// 自动刷新定时器
let metricsTimer: NodeJS.Timeout
let alertTimer: NodeJS.Timeout

/** 获取系统监控仪表板数据 */
const getDashboardData = async () => {
  try {
    metricsLoading.value = true
    const data = await MonitorApi.getMonitorDashboard()

    // 确保数据结构正确
    systemMetrics.value = data.systemMetrics || {}

    // 确保性能数据是数组格式
    if (Array.isArray(data.performanceTrend)) {
      performanceData.value = data.performanceTrend
    } else {
      // 如果后端返回的是系统指标对象，让子组件处理转换
      performanceData.value = data.systemMetrics || {}
    }

    alertList.value = data.alerts || []
    alertCount.value = data.alerts?.length || 0
    taskStats.value = data.taskStatistics || {}

  } catch (error) {
    console.error('获取监控数据失败', error)
    // 设置默认值避免组件报错
    performanceData.value = []
  } finally {
    metricsLoading.value = false
  }
}

/** 刷新性能数据 */
const refreshPerformanceData = async () => {
  try {
    performanceLoading.value = true
    const data = await MonitorApi.getRealTimeMetrics()

    // 数据适配：优先使用数组格式，否则传递系统指标
    if (Array.isArray(data.performanceData)) {
      performanceData.value = data.performanceData
    } else if (data.systemMetrics) {
      performanceData.value = data.systemMetrics
    } else {
      performanceData.value = []
    }

    systemMetrics.value = { ...systemMetrics.value, ...data.systemMetrics }
  } catch (error) {
    message.error('刷新性能数据失败')
    performanceData.value = [] // 避免组件报错
  } finally {
    performanceLoading.value = false
  }
}

/** 获取实时告警 */
const getRealtimeAlerts = async () => {
  try {
    alertLoading.value = true
    const data = await MonitorApi.getRealTimeMetrics()
    alertList.value = data.latestAlerts || []
    alertCount.value = data.latestAlerts?.length || 0
  } catch (error) {
    console.error('获取告警信息失败', error)
  } finally {
    alertLoading.value = false
  }
}

/** 打开日志查询对话框 */
const openLogQuery = () => {
  logQueryVisible.value = true
}

/** 重置高级查询条件 */
const resetAdvancedQuery = () => {
  advancedQuery.value = {
    batchNo: '',
    fileType: '',
    status: '',
    operatorName: '',
    createTime: []
  }
  queryFormRef.value?.resetFields()
}

/** 执行高级查询 */
const handleAdvancedQuery = () => {
  logQueryParams.value = {
    ...logQueryParams.value,
    ...advancedQuery.value,
    pageNo: 1
  }
  logQueryVisible.value = false
}

/** 导出日志 */
const handleExportLogs = async () => {
  try {
    exportLoading.value = true
    await MonitorApi.exportImportLogs(logQueryParams.value)
    message.success('导出成功')
  } catch (error) {
    message.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

/** 日志刷新处理 */
const handleLogRefresh = () => {
  // 由子组件触发刷新
}

/** 获取告警样式类 */
const getAlertClass = (level: string) => {
  return {
    'alert-error': level === 'error',
    'alert-warning': level === 'warning',
    'alert-info': level === 'info',
    'alert-success': level === 'success'
  }
}

/** 获取告警标签类型 */
const getAlertTagType = (level: string) => {
  const typeMap = {
    error: 'danger',
    warning: 'warning',
    info: 'info',
    success: 'success'
  }
  return typeMap[level] || 'info'
}

/** 获取告警级别文本 */
const getAlertLevelText = (level: string) => {
  const textMap = {
    error: '错误',
    warning: '警告',
    info: '信息',
    success: '成功'
  }
  return textMap[level] || '未知'
}

/** 启动自动刷新 */
const startAutoRefresh = () => {
  // 每30秒刷新一次系统指标
  metricsTimer = setInterval(() => {
    refreshPerformanceData()
  }, 30000)

  // 每10秒刷新一次告警信息
  alertTimer = setInterval(() => {
    getRealtimeAlerts()
  }, 10000)
}

/** 停止自动刷新 */
const stopAutoRefresh = () => {
  if (metricsTimer) {
    clearInterval(metricsTimer)
  }
  if (alertTimer) {
    clearInterval(alertTimer)
  }
}

/** 初始化 */
onMounted(() => {
  getDashboardData()
  startAutoRefresh()
})

/** 组件卸载时清理定时器 */
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.performance-card,
.log-card,
.alert-card,
.task-stats-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #1890ff;
}

.warning-icon {
  color: #faad14;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 8px;
}

.alert-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #e8e8e8;
  background: #fafafa;
  transition: all 0.3s ease;
}

.alert-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.alert-item:last-child {
  margin-bottom: 0;
}

.alert-error {
  border-left-color: #ff4d4f;
  background: #fff2f0;
}

.alert-warning {
  border-left-color: #faad14;
  background: #fffbe6;
}

.alert-info {
  border-left-color: #1890ff;
  background: #f0f9ff;
}

.alert-success {
  border-left-color: #52c41a;
  background: #f6ffed;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.alert-time {
  font-size: 12px;
  color: #909399;
}

.alert-level {
  margin-left: 12px;
}

.no-alerts {
  text-align: center;
  padding: 32px;
  color: #909399;
}

.no-alert-icon {
  font-size: 32px;
  color: #52c41a;
  margin-bottom: 8px;
}

.task-stats {
  padding: 10px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  border-radius: 6px;
  background: #fafafa;
}

.total-stat {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.success-stat {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}

.failed-stat {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}

.processing-stat {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.success-rate {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.rate-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.rate-value {
  font-size: 24px;
  font-weight: bold;
  color: #52c41a;
  margin-bottom: 12px;
}

.rate-progress {
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
