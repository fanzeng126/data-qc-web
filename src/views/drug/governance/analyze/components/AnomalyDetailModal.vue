<!-- src/views/drug/governance/analyze/components/AnomalyDetailModal.vue -->
<template>
  <el-dialog
    v-model="visible"
    title="异常数据详情"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="anomaly-detail-content">
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
          <el-descriptions-item label="医院名称" :span="2">
            {{ detailData.hospitalName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="药品YPID">
            {{ detailData.ypid || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="药品名称">
            {{ detailData.drugName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="发现时间">
            {{ formatDate(detailData.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTag(detailData.status)" size="small">
              {{ getStatusLabel(detailData.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 异常信息 -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <span class="card-title">异常信息</span>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="异常类型">
            <el-tag :type="getAnomalyTypeTag(detailData.anomalyType)" size="small">
              {{ getAnomalyTypeLabel(detailData.anomalyType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常分类">
            {{ detailData.anomalyCategory || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="异常字段">
            <span class="field-name">{{ detailData.fieldName || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="原始值">
            <span class="error-value">{{ detailData.originalValue || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="期望值">
            <span class="expected-value">{{ detailData.expectedValue || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="错误描述">
            <div class="error-message">{{ detailData.errorMessage || '-' }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 修复建议 -->
      <el-card v-if="detailData.fixStrategy" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">修复建议</span>
        </template>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="建议策略">
            <el-tag type="success" size="small">{{ detailData.fixCode }}</el-tag>
            <span class="strategy-name">{{ detailData.fixStrategy }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="置信度">
            <el-progress
              :percentage="detailData.confidence || 0"
              :stroke-width="10"
              :text-inside="true"
              style="width: 200px"
            />
          </el-descriptions-item>
          <el-descriptions-item label="处理优先级">
            <el-tag :type="getPriorityTag(detailData.priority)" size="small">
              {{ getPriorityLabel(detailData.priority) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 相关数据 -->
      <el-card v-if="relatedData.length > 0" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">相关异常数据</span>
        </template>

        <el-table :data="relatedData" stripe size="small" max-height="200">
          <el-table-column prop="fieldName" label="字段" width="120" />
          <el-table-column prop="originalValue" label="原始值" />
          <el-table-column prop="expectedValue" label="期望值" />
          <el-table-column prop="anomalyType" label="异常类型">
            <template #default="{ row }">
              {{ getAnomalyTypeLabel(row.anomalyType) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 处理历史 -->
      <el-card v-if="processHistory.length > 0" class="info-card" shadow="never">
        <template #header>
          <span class="card-title">处理历史</span>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in processHistory"
            :key="index"
            :timestamp="formatDate(item.timestamp)"
            placement="top"
            :type="getHistoryType(item.action)"
          >
            <div class="history-content">
              <div class="history-action">{{ item.action }}</div>
              <div class="history-operator">操作人：{{ item.operator }}</div>
              <div v-if="item.remark" class="history-remark">备注：{{ item.remark }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">关闭</el-button>
        <el-button
          v-if="detailData.status === 0 && detailData.fixCode"
          type="success"
          @click="handleAutoFix"
        >
          <el-icon><Tools /></el-icon>
          自动修复
        </el-button>
        <el-button v-if="detailData.status === 0" type="warning" @click="handleManualFix">
          <el-icon><Edit /></el-icon>
          手动修复
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Tools, Edit } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { DataGovernanceApi, type AnomalyDataVO } from '@/api/drug/governance'

defineOptions({ name: 'AnomalyDetailModal' })

// ========================= 类型定义 =========================

interface ProcessHistory {
  timestamp: string
  action: string
  operator: string
  remark?: string
}

// ========================= 属性定义 =========================

interface Props {
  modelValue: boolean
  anomalyId?: number
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
const detailData = ref<AnomalyDataVO>({} as AnomalyDataVO)
const relatedData = ref<AnomalyDataVO[]>([])
const processHistory = ref<ProcessHistory[]>([])

// ========================= 监听器 =========================

watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal && props.anomalyId) {
      loadDetail()
    }
  }
)

watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// ========================= 方法 =========================

const loadDetail = async () => {
  if (!props.anomalyId) return

  loading.value = true
  try {
    // 加载异常详情
    detailData.value = await DataGovernanceApi.getAnomalyDetail(props.anomalyId)

    // 模拟加载相关数据和处理历史
    relatedData.value = []
    processHistory.value = [
      {
        timestamp: detailData.value.createTime,
        action: '发现异常',
        operator: '系统',
        remark: '质控规则检测到数据异常'
      }
    ]

    if (detailData.value.status === 2) {
      processHistory.value.push({
        timestamp: new Date().toISOString(),
        action: '修复成功',
        operator: detailData.value.creator || '系统',
        remark: '数据已修复'
      })
    }
  } catch (error) {
    console.error('加载异常详情失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClosed = () => {
  detailData.value = {} as AnomalyDataVO
  relatedData.value = []
  processHistory.value = []
}

const handleAutoFix = () => {
  visible.value = false
  router.push({
    name: 'DataGovernanceAutoFix',
    query: { anomalyId: props.anomalyId }
  })
}

const handleManualFix = () => {
  visible.value = false
  router.push({
    name: 'DataGovernanceManualFix',
    query: { anomalyId: props.anomalyId }
  })
}

// ========================= 工具方法 =========================

const getStatusLabel = (status: number) => {
  const statusMap = {
    0: '待处理',
    1: '修复中',
    2: '已修复',
    3: '已忽略',
    4: '修复失败'
  }
  return statusMap[status] || '未知'
}

const getStatusTag = (status: number) => {
  const tagMap = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'info',
    4: 'danger'
  }
  return tagMap[status] || 'info'
}

const getAnomalyTypeLabel = (type: string) => {
  const typeMap = {
    YPID_EMPTY: 'YPID未比对',
    YPID_ERROR: 'YPID比对错误',
    AMOUNT_ERROR: '金额异常',
    QUANTITY_ERROR: '数量异常',
    LOGIC_ERROR: '逻辑错误',
    FORMAT_ERROR: '格式错误'
  }
  return typeMap[type] || type
}

const getAnomalyTypeTag = (type: string) => {
  const tagMap = {
    YPID_EMPTY: 'warning',
    YPID_ERROR: 'danger',
    AMOUNT_ERROR: 'primary',
    QUANTITY_ERROR: 'info',
    LOGIC_ERROR: 'danger',
    FORMAT_ERROR: 'warning'
  }
  return tagMap[type] || 'info'
}

const getPriorityLabel = (priority: number) => {
  const labels = ['低', '中', '高', '紧急']
  return labels[priority - 1] || '未知'
}

const getPriorityTag = (priority: number) => {
  const tags = ['info', 'warning', 'danger', 'danger']
  return tags[priority - 1] || 'info'
}

const getHistoryType = (action: string) => {
  if (action.includes('成功')) return 'success'
  if (action.includes('失败')) return 'danger'
  if (action.includes('忽略')) return 'info'
  return 'primary'
}
</script>

<style scoped>
.anomaly-detail-content {
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

.field-name {
  font-family: monospace;
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.error-value {
  color: #f56c6c;
  font-weight: 500;
}

.expected-value {
  color: #67c23a;
  font-weight: 500;
}

.error-message {
  line-height: 1.5;
  color: #606266;
}

.strategy-name {
  margin-left: 8px;
  color: #606266;
}

.history-content {
  font-size: 13px;
  line-height: 1.6;
}

.history-action {
  font-weight: 500;
  color: #303133;
}

.history-operator,
.history-remark {
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 滚动条样式 */
.anomaly-detail-content::-webkit-scrollbar {
  width: 6px;
}

.anomaly-detail-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.anomaly-detail-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.anomaly-detail-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
