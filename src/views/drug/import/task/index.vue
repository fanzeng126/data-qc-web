<template>
  <div class="drug-import-progress">
    <!-- 总体进度卡片 -->
    <el-card class="progress-overview">
      <template #header>
        <div class="progress-header">
          <span class="progress-title">
            <el-icon><DataLine /></el-icon>
            {{ progressData.taskName || '数据导入任务' }}
          </span>
          <el-tag :type="getStatusTagType(progressData.overallStatus)">
            {{ getStatusText(progressData.overallStatus) }}
          </el-tag>
        </div>
      </template>

      <!-- 整体进度条 -->
      <div class="overall-progress">
        <div class="progress-info">
          <span class="progress-label">总体进度</span>
          <span class="progress-percentage">{{ progressData.overallProgress || 0 }}%</span>
        </div>
        <el-progress
          :percentage="progressData.overallProgress || 0"
          :stroke-width="12"
          :show-text="false"
          :status="getProgressStatus(progressData.overallStatus)"
        />
        <div class="progress-stage">
          当前阶段：{{ progressData.currentStage || '准备中' }}
        </div>
      </div>

      <!-- 统计信息网格 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ progressData.totalFiles || 0 }}</div>
          <div class="stat-label">文件总数</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value">{{ progressData.successFiles || 0 }}</div>
          <div class="stat-label">成功文件</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">{{ progressData.failedFiles || 0 }}</div>
          <div class="stat-label">失败文件</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ formatNumber(progressData.totalRecords) }}</div>
          <div class="stat-label">总记录数</div>
        </div>
      </div>
    </el-card>

    <!-- 分表进度详情 -->
    <el-card class="table-progress-detail">
      <template #header>
        <div class="detail-header">
          <span class="detail-title">
            <el-icon><List /></el-icon>
            分表处理进度
          </span>
          <el-button
            type="primary"
            size="small"
            @click="refreshProgress"
            :loading="refreshing"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 表进度列表 -->
      <div class="table-progress-list">
        <div
          v-for="table in progressData.tableProgress || []"
          :key="table.tableType"
          class="table-progress-item"
        >
          <!-- 表头信息 -->
          <div class="table-header">
            <div class="table-info">
              <el-icon class="table-icon" :color="getTableIconColor(table.status)">
                <Document />
              </el-icon>
              <div class="table-details">
                <div class="table-name">{{ table.tableName }}</div>
                <div class="file-name">{{ table.fileName }}</div>
              </div>
            </div>
            <div class="table-status">
              <el-tag :type="getStatusTagType(table.status)" size="small">
                {{ table.statusDisplay }}
              </el-tag>
              <div class="table-stage">{{ table.currentStage }}</div>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="table-progress-bar">
            <el-progress
              :percentage="table.progress || 0"
              :stroke-width="8"
              :status="getProgressStatus(table.status)"
            />
          </div>

          <!-- 详细统计 -->
          <div class="table-stats">
            <div class="stat-row">
              <span class="stat-item">
                总行数: <strong>{{ formatNumber(table.totalRows) }}</strong>
              </span>
              <span class="stat-item success">
                成功: <strong>{{ formatNumber(table.successRows) }}</strong>
              </span>
              <span class="stat-item danger">
                失败: <strong>{{ formatNumber(table.failedRows) }}</strong>
              </span>
            </div>
            <div class="stat-row" v-if="table.qcPassedRows || table.qcFailedRows">
              <span class="stat-item">
                质控通过: <strong>{{ formatNumber(table.qcPassedRows) }}</strong>
              </span>
              <span class="stat-item warning">
                质控失败: <strong>{{ formatNumber(table.qcFailedRows) }}</strong>
              </span>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="table.errorMessage" class="table-error">
            <el-alert
              :title="table.errorMessage"
              type="error"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 时间线信息 -->
    <el-card class="timeline-info">
      <template #header>
        <span class="timeline-title">
          <el-icon><Clock /></el-icon>
          处理时间线
        </span>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="event in timelineEvents"
          :key="event.time"
          :timestamp="event.time"
          :type="event.type"
        >
          {{ event.content }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine, List, Refresh, Document, Clock } from '@element-plus/icons-vue'
// import * as DrugImportApi from '@/api/drug/import'
import * as DrugImportApi from '@/api/dataqc/batchImport'

// 组件属性
const props = defineProps({
  taskId: {
    type: [String, Number],
    required: true
  },
  autoRefresh: {
    type: Boolean,
    default: true
  },
  refreshInterval: {
    type: Number,
    default: 3000 // 3秒刷新一次
  }
})

// 响应式数据
const progressData = ref({})
const refreshing = ref(false)
const refreshTimer = ref(null)

// 计算属性
const timelineEvents = computed(() => {
  const events = []
  const data = progressData.value

  if (data.startTime) {
    events.push({
      time: formatTime(data.startTime),
      type: 'primary',
      content: '任务开始执行'
    })
  }

  // 根据表进度生成时间线事件
  if (data.tableProgress) {
    data.tableProgress.forEach(table => {
      if (table.startTime) {
        events.push({
          time: formatTime(table.startTime),
          type: 'info',
          content: `开始处理 ${table.tableName}`
        })
      }
    })
  }

  return events.sort((a, b) => new Date(b.time) - new Date(a.time))
})

// 生命周期
onMounted(() => {
  loadProgress()
  if (props.autoRefresh) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 方法
const loadProgress = async () => {
  try {
    const data = await DrugImportApi.getImportProgress(props.taskId)
    progressData.value = data || {}

    // 如果任务已完成，停止自动刷新
    if (data.overallStatus >= 4) { // 4及以上表示任务结束
      stopAutoRefresh()
    }
  } catch (error) {
    ElMessage.error('获取进度信息失败')
    console.error('加载进度失败:', error)
  }
}

const refreshProgress = async () => {
  refreshing.value = true
  try {
    await loadProgress()
    ElMessage.success('进度已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const startAutoRefresh = () => {
  refreshTimer.value = setInterval(() => {
    loadProgress()
  }, props.refreshInterval)
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// 工具方法
const getStatusTagType = (status) => {
  const typeMap = {
    0: 'info',     // 待处理
    1: 'warning',  // 解压中
    2: 'warning',  // 导入中
    3: 'warning',  // 质控中
    4: 'success',  // 完成
    5: 'danger',   // 失败
    6: 'primary'   // 部分成功
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    0: '待处理',
    1: '解压中',
    2: '导入中',
    3: '质控中',
    4: '已完成',
    5: '失败',
    6: '部分成功'
  }
  return textMap[status] || '未知'
}

const getProgressStatus = (status) => {
  if (status === 4) return 'success'
  if (status === 5) return 'exception'
  return undefined
}

const getTableIconColor = (status) => {
  const colorMap = {
    0: '#909399', // 待处理-灰色
    1: '#E6A23C', // 处理中-橙色
    2: '#E6A23C', // 导入中-橙色
    3: '#E6A23C', // 质控中-橙色
    4: '#67C23A', // 成功-绿色
    5: '#F56C6C', // 失败-红色
    6: '#409EFF'  // 部分成功-蓝色
  }
  return colorMap[status] || '#909399'
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}
</script>
<style scoped>
.drug-import-progress {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 80vh;
  overflow-y: auto;
}

.progress-overview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.progress-overview :deep(.el-card__header) {
  background: rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.overall-progress {
  margin: 20px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  opacity: 0.9;
}

.progress-percentage {
  font-size: 18px;
  font-weight: 600;
}

.progress-stage {
  margin-top: 8px;
  font-size: 13px;
  opacity: 0.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.stat-card.success .stat-value {
  color: #67C23A;
}

.stat-card.danger .stat-value {
  color: #F56C6C;
}

.table-progress-detail {
  flex: 1;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.table-progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-progress-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-icon {
  font-size: 20px;
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.table-name {
  font-weight: 600;
  font-size: 14px;
}

.file-name {
  font-size: 12px;
  color: #909399;
}

.table-status {
  text-align: right;
}

.table-stage {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.table-progress-bar {
  margin: 12px 0;
}

.table-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}

.stat-row {
  display: flex;
  gap: 16px;
}

.stat-item {
  color: #606266;
}

.stat-item.success {
  color: #67C23A;
}

.stat-item.danger {
  color: #F56C6C;
}

.stat-item.warning {
  color: #E6A23C;
}

.table-error {
  margin-top: 12px;
}

.timeline-info {
  max-height: 300px;
  overflow-y: auto;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
</style>
