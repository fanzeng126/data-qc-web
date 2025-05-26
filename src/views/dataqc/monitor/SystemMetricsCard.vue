<template>
  <div class="system-metrics" v-loading="loading">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="metric-card cpu-card">
          <div class="metric-content">
            <div class="metric-header">
              <Icon icon="ep:cpu" class="metric-icon cpu-icon" />
              <span class="metric-title">CPU使用率</span>
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ metrics.cpuUsage || 0 }}%</div>
              <div class="metric-progress">
                <el-progress
                  :percentage="metrics.cpuUsage || 0"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getProgressColor(metrics.cpuUsage || 0)"
                />
              </div>
            </div>
            <div class="metric-footer">
              <span class="metric-status" :class="getStatusClass(metrics.cpuUsage || 0)">
                {{ getStatusText(metrics.cpuUsage || 0) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="metric-card memory-card">
          <div class="metric-content">
            <div class="metric-header">
              <Icon icon="ep:memory-card" class="metric-icon memory-icon" />
              <span class="metric-title">内存使用率</span>
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ metrics.memoryUsage || 0 }}%</div>
              <div class="metric-progress">
                <el-progress
                  :percentage="metrics.memoryUsage || 0"
                  :stroke-width="6"
                  :show-text="false"
                  :color="getProgressColor(metrics.memoryUsage || 0)"
                />
              </div>
            </div>
            <div class="metric-footer">
              <span class="metric-detail">
                已用: {{ formatMemory(metrics.memoryUsed) }} / {{ formatMemory(metrics.memoryTotal) }}
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="metric-card thread-card">
          <div class="metric-content">
            <div class="metric-header">
              <Icon icon="ep:connection" class="metric-icon thread-icon" />
              <span class="metric-title">活跃线程</span>
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ metrics.threadCount || 0 }}</div>
              <div class="metric-trend">
                <Icon icon="ep:trend-charts" class="trend-icon" />
                <span class="trend-text">正常范围</span>
              </div>
            </div>
            <div class="metric-footer">
              <span class="metric-detail">
                系统运行稳定
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="6" :lg="6">
        <el-card class="metric-card uptime-card">
          <div class="metric-content">
            <div class="metric-header">
              <Icon icon="ep:timer" class="metric-icon uptime-icon" />
              <span class="metric-title">运行时间</span>
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ formatUptime(metrics.uptime) }}</div>
              <div class="metric-trend">
                <Icon icon="ep:circle-check" class="trend-icon success-icon" />
                <span class="trend-text success-text">服务正常</span>
              </div>
            </div>
            <div class="metric-footer">
              <span class="metric-detail">
                持续稳定运行
              </span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 系统健康度总览 -->
    <el-row :gutter="20" class="health-overview">
      <el-col :span="24">
        <el-card class="health-card">
          <template #header>
            <div class="health-header">
              <Icon icon="ep:heart" class="health-icon" />
              <span class="health-title">系统健康度评估</span>
              <el-tag :type="getHealthTagType()" size="large" class="health-tag">
                {{ getHealthStatus() }}
              </el-tag>
            </div>
          </template>
          <div class="health-content">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="health-item">
                  <div class="health-score">{{ calculateHealthScore() }}</div>
                  <div class="health-label">综合评分</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="health-item">
                  <div class="health-indicator">
                    <el-progress
                      type="circle"
                      :percentage="calculateHealthScore()"
                      :width="60"
                      :stroke-width="6"
                      :color="getHealthColor()"
                    />
                  </div>
                  <div class="health-label">健康指数</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="health-details">
                  <div class="detail-item">
                    <span class="detail-label">性能状态：</span>
                    <span class="detail-value" :class="getPerformanceClass()">
                      {{ getPerformanceStatus() }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">资源利用：</span>
                    <span class="detail-value" :class="getResourceClass()">
                      {{ getResourceStatus() }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">运行稳定性：</span>
                    <span class="detail-value success-text">优秀</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script lang="ts" setup>
defineOptions({ name: 'SystemMetricsCard' })

const props = defineProps<{
  metrics: any
  loading: boolean
}>()

/** 获取进度条颜色 */
const getProgressColor = (value: number) => {
  if (value >= 80) return '#ff4d4f'
  if (value >= 60) return '#faad14'
  return '#52c41a'
}

/** 获取状态样式类 */
const getStatusClass = (value: number) => {
  if (value >= 80) return 'status-danger'
  if (value >= 60) return 'status-warning'
  return 'status-success'
}

/** 获取状态文本 */
const getStatusText = (value: number) => {
  if (value >= 80) return '高负载'
  if (value >= 60) return '中等负载'
  return '正常'
}

/** 格式化内存大小 */
const formatMemory = (memory: number) => {
  if (!memory) return '0 MB'
  return `${memory.toLocaleString()} MB`
}

/** 格式化运行时间 */
const formatUptime = (uptime: number) => {
  if (!uptime) return '0分钟'

  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}天${hours % 24}小时`
  }

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  }

  return `${minutes}分钟`
}

/** 计算健康度评分 */
const calculateHealthScore = () => {
  const cpuScore = Math.max(0, 100 - (props.metrics.cpuUsage || 0))
  const memoryScore = Math.max(0, 100 - (props.metrics.memoryUsage || 0))
  const overallScore = Math.round((cpuScore + memoryScore) / 2)
  return Math.max(overallScore, 60) // 最低60分
}

/** 获取健康状态标签类型 */
const getHealthTagType = () => {
  const score = calculateHealthScore()
  if (score >= 90) return 'success'
  if (score >= 70) return 'warning'
  return 'danger'
}

/** 获取健康状态文本 */
const getHealthStatus = () => {
  const score = calculateHealthScore()
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  return '需要关注'
}

/** 获取健康度颜色 */
const getHealthColor = () => {
  const score = calculateHealthScore()
  if (score >= 90) return '#52c41a'
  if (score >= 80) return '#faad14'
  return '#ff4d4f'
}

/** 获取性能状态 */
const getPerformanceStatus = () => {
  const cpuUsage = props.metrics.cpuUsage || 0
  if (cpuUsage < 50) return '良好'
  if (cpuUsage < 80) return '一般'
  return '需要优化'
}

/** 获取性能状态样式类 */
const getPerformanceClass = () => {
  const cpuUsage = props.metrics.cpuUsage || 0
  if (cpuUsage < 50) return 'success-text'
  if (cpuUsage < 80) return 'warning-text'
  return 'error-text'
}

/** 获取资源状态 */
const getResourceStatus = () => {
  const memoryUsage = props.metrics.memoryUsage || 0
  if (memoryUsage < 60) return '充足'
  if (memoryUsage < 80) return '一般'
  return '紧张'
}

/** 获取资源状态样式类 */
const getResourceClass = () => {
  const memoryUsage = props.metrics.memoryUsage || 0
  if (memoryUsage < 60) return 'success-text'
  if (memoryUsage < 80) return 'warning-text'
  return 'error-text'
}
</script>

<style scoped>
.system-metrics {
  width: 100%;
}

.metric-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.cpu-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
}

.memory-card {
  background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%);
}

.thread-card {
  background: linear-gradient(135deg, #fff3e0 0%, #ffeaa7 100%);
}

.uptime-card {
  background: linear-gradient(135deg, #f6ffed 0%, #e6fffb 100%);
}

.metric-content {
  padding: 8px;
}

.metric-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.metric-icon {
  font-size: 18px;
  margin-right: 8px;
}

.cpu-icon {
  color: #722ed1;
}

.memory-icon {
  color: #52c41a;
}

.thread-icon {
  color: #faad14;
}

.uptime-icon {
  color: #1890ff;
}

.metric-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.metric-body {
  margin-bottom: 12px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.metric-progress {
  margin-bottom: 8px;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-icon {
  font-size: 14px;
  color: #52c41a;
}

.success-icon {
  color: #52c41a;
}

.trend-text {
  font-size: 12px;
  color: #666;
}

.success-text {
  color: #52c41a;
}

.metric-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  padding-top: 8px;
}

.metric-detail {
  font-size: 12px;
  color: #666;
}

.metric-status {
  font-size: 12px;
  font-weight: 600;
}

.status-success {
  color: #52c41a;
}

.status-warning {
  color: #faad14;
}

.status-danger {
  color: #ff4d4f;
}

.health-overview {
  margin-top: 20px;
}

.health-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.health-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.health-icon {
  font-size: 18px;
  color: #eb2f96;
  margin-right: 8px;
}

.health-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.health-tag {
  font-weight: 600;
}

.health-content {
  padding: 10px 0;
}

.health-item {
  text-align: center;
}

.health-score {
  font-size: 32px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 8px;
}

.health-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 0;
}

.health-indicator {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.health-details {
  padding: 10px 0;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
}

.warning-text {
  color: #faad14;
}

.error-text {
  color: #ff4d4f;
}
</style>
