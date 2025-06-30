<!-- src/views/drug/governance/history/components/FixHistoryDetailModal.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="修复历史详情"
    width="900px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="history-detail-content">
      <!-- 修复概览 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">修复概览</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="批次号" :value="detailData.batchNo || '-'" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="修复类型">
              <template #default>
                <el-tag :type="detailData.fixType === 'auto' ? 'success' : 'warning'">
                  {{ detailData.fixType === 'auto' ? '自动修复' : '手动修复' }}
                </el-tag>
              </template>
            </el-statistic>
          </el-col>
          <el-col :span="8">
            <el-statistic title="执行状态">
              <template #default>
                <el-tag :type="detailData.status === 'success' ? 'success' : 'danger'">
                  {{ detailData.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-statistic>
          </el-col>
        </el-row>
      </el-card>

      <!-- 基本信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">基本信息</span>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务编号">
            {{ detailData.taskNo || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="数据表">
            <el-tag size="small">
              {{ getDictLabel(DICT_TYPE.DRUG_TABLE_TYPE, detailData.tableType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="修复策略">
            <el-tag v-if="detailData.fixCode" type="success" size="small">
              {{ detailData.fixCode }}
            </el-tag>
            <span v-if="detailData.fixStrategy" class="strategy-name">
              {{ detailData.fixStrategy }}
            </span>
            <span v-else class="text-muted">手动修复</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ detailData.operator || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="修复时间">
            {{ formatDate(detailData.fixTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="执行耗时">
            {{ formatExecutionTime(detailData.executionTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 数据变更 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">数据变更</span>
            <el-tag size="small" type="info">
              变更 {{ detailData.changedFields?.length || 0 }} 个字段
            </el-tag>
          </div>
        </template>

        <div class="data-change-section">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="change-panel">
                <h4 class="panel-title">修复前</h4>
                <pre class="data-content before">{{ formatJsonData(detailData.beforeData) }}</pre>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="change-panel">
                <h4 class="panel-title">修复后</h4>
                <pre class="data-content after">{{ formatJsonData(detailData.afterData) }}</pre>
              </div>
            </el-col>
          </el-row>

          <!-- 变更字段高亮 -->
          <div v-if="detailData.changedFields?.length > 0" class="changed-fields">
            <span class="field-label">变更字段：</span>
            <el-tag
              v-for="field in detailData.changedFields"
              :key="field"
              size="small"
              type="warning"
              style="margin-right: 8px"
            >
              {{ field }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 执行详情 -->
      <el-card v-if="detailData.fixType === 'manual'" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">手动修复详情</span>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="修复原因">
            <div class="fix-reason">{{ detailData.remark || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item v-if="detailData.errorMessage" label="错误信息">
            <el-alert :title="detailData.errorMessage" type="error" :closable="false" />
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 性能指标 -->
      <el-card v-if="performanceMetrics" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">性能指标</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-label">数据加载</div>
              <div class="metric-value">{{ performanceMetrics.dataLoadTime }}ms</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-label">规则执行</div>
              <div class="metric-value">{{ performanceMetrics.ruleExecutionTime }}ms</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-label">数据写入</div>
              <div class="metric-value">{{ performanceMetrics.dataWriteTime }}ms</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-item">
              <div class="metric-label">总耗时</div>
              <div class="metric-value">{{ detailData.executionTime }}ms</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button v-if="detailData.status === 'failed'" type="primary" @click="handleRetry">
          <el-icon><RefreshRight /></el-icon>
          重新修复
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { RefreshRight } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { DataGovernanceApi, type FixHistoryVO } from '@/api/drug/governance'

defineOptions({ name: 'FixHistoryDetailModal' })

// ========================= 类型定义 =========================

interface PerformanceMetrics {
  dataLoadTime: number
  ruleExecutionTime: number
  dataWriteTime: number
}

// ========================= 属性定义 =========================

interface Props {
  modelValue: boolean
  historyId?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// ========================= 响应式数据 =========================

const router = useRouter()
const visible = ref(false)
const loading = ref(false)
const detailData = ref<FixHistoryVO>({} as FixHistoryVO)

// ========================= 计算属性 =========================

const performanceMetrics = computed<PerformanceMetrics | null>(() => {
  if (!detailData.value.executionTime) return null

  // 模拟性能指标分解
  const total = detailData.value.executionTime
  return {
    dataLoadTime: Math.round(total * 0.2),
    ruleExecutionTime: Math.round(total * 0.5),
    dataWriteTime: Math.round(total * 0.3)
  }
})

// ========================= 监听器 =========================

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal && props.historyId) {
      loadDetail()
    }
  }
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// ========================= 方法 =========================

const loadDetail = async () => {
  if (!props.historyId) return

  loading.value = true
  try {
    detailData.value = await DataGovernanceApi.getFixHistoryDetail(props.historyId)
  } catch (error) {
    console.error('加载修复历史详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  detailData.value = {} as FixHistoryVO
}

const handleRetry = () => {
  visible.value = false
  // 根据修复类型跳转到相应页面
  if (detailData.value.fixType === 'auto') {
    router.push({
      name: 'DataGovernanceAutoFix',
      query: { anomalyId: detailData.value.anomalyId }
    })
  } else {
    router.push({
      name: 'DataGovernanceManualFix',
      query: { anomalyId: detailData.value.anomalyId }
    })
  }
}

// ========================= 工具方法 =========================

const formatExecutionTime = (ms: number) => {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}

const formatJsonData = (jsonStr: string) => {
  if (!jsonStr) return '无数据'
  try {
    const data = JSON.parse(jsonStr)
    return JSON.stringify(data, null, 2)
  } catch (error) {
    return jsonStr
  }
}
</script>

<style scoped>
.history-detail-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 10px;
}

.info-card {
  margin-bottom: 16px;
  border-radius: 8px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strategy-name {
  margin-left: 8px;
  color: #606266;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.data-change-section {
  position: relative;
}

.change-panel {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #606266;
}

.data-content {
  margin: 0;
  padding: 12px;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #303133;
  overflow-x: auto;
  max-height: 300px;
}

.data-content.before {
  border-left: 3px solid #f56c6c;
}

.data-content.after {
  border-left: 3px solid #67c23a;
}

.changed-fields {
  margin-top: 16px;
  padding: 12px;
  background-color: #fef0f0;
  border-radius: 4px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.fix-reason {
  line-height: 1.6;
  color: #606266;
  white-space: pre-wrap;
}

.metric-item {
  text-align: center;
  padding: 16px 0;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 统计数字样式 */
:deep(.el-statistic__content) {
  font-size: 16px;
}

:deep(.el-statistic__head) {
  font-size: 13px;
  margin-bottom: 8px;
}

/* 滚动条样式 */
.history-detail-content::-webkit-scrollbar {
  width: 6px;
}

.history-detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.history-detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.history-detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
