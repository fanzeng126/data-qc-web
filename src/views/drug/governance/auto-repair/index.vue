<!-- src/views/drug/governance/auto-repair/index.vue -->
<template>
  <div class="auto-repair-container">
    <!-- 页面头部 -->
    <PageHeader
      title="自动修复"
      content="使用预定义的修复策略批量处理异常数据"
      :show-back-button="true"
      @back-click="handleBack"
    >
      <template #extra>
        <el-button @click="handleRefresh" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>
    </PageHeader>

    <!-- 修复概览 -->
    <el-card class="overview-card" shadow="never">
      <template #header>
        <span class="card-title">修复概览</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <div class="overview-item">
            <div class="overview-label">待修复数据</div>
            <div class="overview-value">{{ anomalyIds.length }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-item">
            <div class="overview-label">可用策略</div>
            <div class="overview-value">{{ strategies.length }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-item">
            <div class="overview-label">预计成功率</div>
            <div class="overview-value">{{ estimatedSuccessRate }}%</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-item">
            <div class="overview-label">预计耗时</div>
            <div class="overview-value">{{ estimatedTime }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 修复策略选择 -->
    <el-card class="strategy-card" shadow="never">
      <template #header>
        <span class="card-title">修复策略</span>
      </template>

      <el-table :data="strategies" stripe @selection-change="handleStrategyChange">
        <el-table-column type="selection" width="55" />

        <el-table-column prop="fixCode" label="策略代码" width="120" />

        <el-table-column prop="fixName" label="策略名称" min-width="150" />

        <el-table-column
          prop="description"
          label="策略描述"
          min-width="250"
          show-overflow-tooltip
        />

        <el-table-column prop="successRate" label="历史成功率" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.successRate" :stroke-width="6" :text-inside="true" />
          </template>
        </el-table-column>

        <el-table-column prop="usageCount" label="使用次数" width="100" />

        <el-table-column prop="enabled" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 修复预览 -->
    <el-card v-if="previewData.length > 0" class="preview-card" shadow="never">
      <template #header>
        <div class="preview-header">
          <span class="card-title">修复预览</span>
          <el-button type="text" @click="togglePreviewExpand">
            {{ previewExpanded ? '收起' : '展开' }}
          </el-button>
        </div>
      </template>

      <el-collapse-transition>
        <div v-show="previewExpanded">
          <el-table :data="previewData" stripe max-height="400">
            <el-table-column prop="fieldName" label="字段名" width="150" />
            <el-table-column
              prop="originalValue"
              label="原始值"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column
              prop="fixedValue"
              label="修复后"
              min-width="150"
              show-overflow-tooltip
            />
            <el-table-column prop="changeDescription" label="变更说明" min-width="200" />
            <el-table-column prop="riskLevel" label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getRiskLevelTag(row.riskLevel)" size="small">
                  {{ row.riskLevel }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-collapse-transition>
    </el-card>

    <!-- 执行控制 -->
    <el-card class="control-card" shadow="never">
      <el-form :model="executeOptions" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="强制覆盖">
              <el-switch v-model="executeOptions.forceOverwrite" />
              <div class="form-tip">忽略数据验证，强制执行修复</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="跳过验证">
              <el-switch v-model="executeOptions.skipValidation" />
              <div class="form-tip">跳过修复后的数据验证</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="备注说明">
              <el-input
                v-model="executeOptions.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入修复说明"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="control-actions">
        <el-button @click="handlePreview" :loading="previewLoading">
          <el-icon><View /></el-icon>
          预览修复效果
        </el-button>
        <el-button
          type="primary"
          @click="handleExecute"
          :loading="executing"
          :disabled="selectedStrategies.length === 0"
        >
          <el-icon><CircleCheck /></el-icon>
          执行修复
        </el-button>
      </div>
    </el-card>

    <!-- 执行进度 -->
    <el-dialog
      v-model="progressVisible"
      title="修复进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="progress-content">
        <el-progress
          :percentage="progressInfo.percentage"
          :status="progressInfo.status"
          :stroke-width="20"
        />

        <div class="progress-stats">
          <div class="stat-item">
            <span class="stat-label">总数：</span>
            <span class="stat-value">{{ progressInfo.totalCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">成功：</span>
            <span class="stat-value success">{{ progressInfo.successCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">失败：</span>
            <span class="stat-value danger">{{ progressInfo.failureCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">跳过：</span>
            <span class="stat-value warning">{{ progressInfo.skipCount }}</span>
          </div>
        </div>

        <div v-if="progressInfo.currentItem" class="current-item">
          正在处理：{{ progressInfo.currentItem }}
        </div>
      </div>

      <template #footer>
        <el-button @click="handleViewResult" :disabled="!progressInfo.completed">
          查看结果
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, View, CircleCheck } from '@element-plus/icons-vue'
import {
  DataGovernanceApi,
  type FixStrategyVO,
  type FixPreviewVO,
  type BatchFixRequestVO
} from '@/api/drug/governance'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'

defineOptions({ name: 'AutoRepairIndex' })

// ========================= 响应式数据 =========================

const route = useRoute()
const router = useRouter()

const anomalyIds = ref<number[]>([])
const strategies = ref<FixStrategyVO[]>([])
const selectedStrategies = ref<FixStrategyVO[]>([])
const previewData = ref<FixPreviewVO[]>([])
const previewExpanded = ref(true)

const refreshing = ref(false)
const previewLoading = ref(false)
const executing = ref(false)
const progressVisible = ref(false)

const executeOptions = reactive({
  forceOverwrite: false,
  skipValidation: false,
  remark: ''
})

const progressInfo = reactive({
  percentage: 0,
  status: '',
  totalCount: 0,
  successCount: 0,
  failureCount: 0,
  skipCount: 0,
  currentItem: '',
  completed: false,
  batchNo: ''
})

// ========================= 计算属性 =========================

const estimatedSuccessRate = computed(() => {
  if (selectedStrategies.value.length === 0) return 0
  const total = selectedStrategies.value.reduce((sum, s) => sum + s.successRate, 0)
  return Math.round(total / selectedStrategies.value.length)
})

const estimatedTime = computed(() => {
  const count = anomalyIds.value.length
  if (count < 100) return '< 1分钟'
  if (count < 1000) return '1-5分钟'
  if (count < 10000) return '5-30分钟'
  return '> 30分钟'
})

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 方法 =========================

const initPage = async () => {
  // 从路由参数获取异常ID
  const ids = route.query.anomalyIds as string
  if (ids) {
    anomalyIds.value = ids.split(',').map((id) => parseInt(id))
  } else if (route.query.anomalyId) {
    anomalyIds.value = [parseInt(route.query.anomalyId as string)]
  }

  // 加载修复策略
  await loadStrategies()
}

const loadStrategies = async () => {
  try {
    strategies.value = await DataGovernanceApi.getFixStrategies()
  } catch (error) {
    ElMessage.error('加载修复策略失败')
  }
}

const handleBack = () => {
  router.back()
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await loadStrategies()
    ElMessage.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

const handleStrategyChange = (selection: FixStrategyVO[]) => {
  selectedStrategies.value = selection
}

const togglePreviewExpand = () => {
  previewExpanded.value = !previewExpanded.value
}

const handlePreview = async () => {
  if (selectedStrategies.value.length === 0) {
    ElMessage.warning('请选择修复策略')
    return
  }

  previewLoading.value = true
  try {
    const params: BatchFixRequestVO = {
      anomalyIds: anomalyIds.value,
      fixOptions: {
        preview: true,
        forceOverwrite: executeOptions.forceOverwrite,
        skipValidation: executeOptions.skipValidation
      }
    }

    previewData.value = await DataGovernanceApi.previewFix(params)
    ElMessage.success('预览生成成功')
  } catch (error) {
    ElMessage.error('生成预览失败')
  } finally {
    previewLoading.value = false
  }
}

const handleExecute = async () => {
  if (selectedStrategies.value.length === 0) {
    ElMessage.warning('请选择修复策略')
    return
  }

  executing.value = true
  progressVisible.value = true

  // 重置进度信息
  Object.assign(progressInfo, {
    percentage: 0,
    status: '',
    totalCount: anomalyIds.value.length,
    successCount: 0,
    failureCount: 0,
    skipCount: 0,
    currentItem: '',
    completed: false,
    batchNo: ''
  })

  try {
    const params: BatchFixRequestVO = {
      anomalyIds: anomalyIds.value,
      fixOptions: executeOptions,
      remark: executeOptions.remark
    }

    // 执行修复
    const result = await DataGovernanceApi.executeBatchFix(params)

    // 更新进度信息
    progressInfo.batchNo = result.batchNo
    progressInfo.successCount = result.successCount
    progressInfo.failureCount = result.failureCount
    progressInfo.skipCount = result.skipCount
    progressInfo.percentage = 100
    progressInfo.status = result.failureCount > 0 ? 'warning' : 'success'
    progressInfo.completed = true

    ElMessage.success(`修复完成：成功 ${result.successCount} 条，失败 ${result.failureCount} 条`)
  } catch (error) {
    progressInfo.status = 'exception'
    ElMessage.error('修复执行失败')
  } finally {
    executing.value = false
  }
}

const handleViewResult = () => {
  router.push({
    name: 'DataGovernanceHistory',
    query: { batchNo: progressInfo.batchNo }
  })
}

const getRiskLevelTag = (level: string) => {
  const tagMap = {
    低: 'success',
    中: 'warning',
    高: 'danger'
  }
  return tagMap[level] || 'info'
}
</script>

<style scoped>
.auto-repair-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.overview-card,
.strategy-card,
.preview-card,
.control-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.overview-item {
  text-align: center;
  padding: 20px 0;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.progress-content {
  padding: 20px 0;
}

.progress-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  margin-left: 8px;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-value.warning {
  color: #e6a23c;
}

.current-item {
  text-align: center;
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}
</style>
