<template>
  <div class="batch-match-container">
    <!-- 页面头部 -->
    <PageHeader title="YPID批量匹配" content="自动匹配未编码的药品数据，提高药品编码标准化效率">
      <template #extra>
        <el-button @click="handleRefresh" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>
    </PageHeader>

    <!-- 匹配任务选择 -->
    <el-card class="task-card" shadow="never">
      <template #header>
        <span class="card-title">选择匹配任务</span>
      </template>

      <el-form :model="taskForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="任务选择">
              <el-select
                v-model="taskForm.taskId"
                placeholder="请选择任务"
                @change="handleTaskChange"
                style="width: 100%"
              >
                <el-option
                  v-for="task in taskList"
                  :key="task.id"
                  :label="`${task.taskNo} - ${task.hospitalName}`"
                  :value="task.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="匹配策略">
              <el-select
                v-model="taskForm.matchStrategy"
                placeholder="请选择策略"
                style="width: 100%"
              >
                <el-option label="精确匹配" value="exact" />
                <el-option label="模糊匹配" value="fuzzy" />
                <el-option label="智能匹配（推荐）" value="smart" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="置信度阈值">
              <el-slider
                v-model="taskForm.minConfidence"
                :min="0"
                :max="100"
                :marks="{ 0: '0%', 50: '50%', 80: '80%', 100: '100%' }"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="taskInfo" class="task-info">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="医院名称">
            {{ taskInfo.hospitalName }}
          </el-descriptions-item>
          <el-descriptions-item label="待匹配数">
            <span class="highlight">{{ taskInfo.unmatchedCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="已匹配数">
            {{ taskInfo.matchedCount }}
          </el-descriptions-item>
          <el-descriptions-item label="匹配率">
            <el-progress
              :percentage="taskInfo.matchRate"
              :stroke-width="10"
              :text-inside="true"
              style="width: 100px"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- 待匹配列表 -->
    <el-card class="unmatched-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">待匹配药品列表</span>
          <div class="header-actions">
            <el-checkbox v-model="selectAll" @change="handleSelectAll"> 全选 </el-checkbox>
            <el-button
              type="primary"
              size="small"
              :disabled="selectedDrugs.length === 0"
              @click="handleStartMatch"
            >
              <el-icon><MagicStick /></el-icon>
              开始匹配 ({{ selectedDrugs.length }})
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="unmatchedList"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="hospitalDrugId" label="院内编码" width="120" />

        <el-table-column
          prop="hospitalDrugName"
          label="院内药品名称"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column prop="specification" label="规格" width="120" show-overflow-tooltip />

        <el-table-column prop="dosageForm" label="剂型" width="100" />

        <el-table-column
          prop="manufacturer"
          label="生产企业"
          min-width="180"
          show-overflow-tooltip
        />

        <el-table-column prop="approvalNumber" label="批准文号" width="150" show-overflow-tooltip />

        <el-table-column prop="sourceTable" label="来源表" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTableLabel(row.sourceTable) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="matchStatus" label="匹配状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getMatchStatusTag(row.matchStatus)" size="small">
              {{ getMatchStatusLabel(row.matchStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handlePreviewMatch(row)">
              <el-icon><View /></el-icon>
              预览匹配
            </el-button>
            <el-button type="warning" link size="small" @click="handleManualMatch(row)">
              <el-icon><Edit /></el-icon>
              手动匹配
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="loadUnmatchedList"
      />
    </el-card>

    <!-- 匹配进度对话框 -->
    <el-dialog
      v-model="progressVisible"
      title="批量匹配进度"
      width="700px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="match-progress">
        <el-progress
          :percentage="progressInfo.percentage"
          :status="progressInfo.status"
          :stroke-width="20"
        />

        <div class="progress-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">总数</div>
                <div class="stat-value">{{ progressInfo.totalCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">成功</div>
                <div class="stat-value success">{{ progressInfo.successCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">失败</div>
                <div class="stat-value danger">{{ progressInfo.failureCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-label">待确认</div>
                <div class="stat-value warning">{{ progressInfo.pendingCount }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div v-if="progressInfo.currentItem" class="current-processing">
          正在处理：{{ progressInfo.currentItem }}
        </div>
      </div>

      <template #footer>
        <el-button v-if="!progressInfo.completed" @click="handleCancelMatch"> 取消 </el-button>
        <el-button v-else type="primary" @click="handleViewResult"> 查看结果 </el-button>
      </template>
    </el-dialog>

    <!-- 匹配预览对话框 -->
    <MatchPreviewModal
      v-model="previewVisible"
      :unmatched-drug="selectedDrug"
      @confirm="handleConfirmMatch"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, MagicStick, View, Edit } from '@element-plus/icons-vue'
import { YpidApi, type UnmatchedDrugVO, type BatchMatchRequestVO } from '@/api/drug/ypid'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import MatchPreviewModal from './components/MatchPreviewModal.vue'

defineOptions({ name: 'YpidBatchMatchIndex' })

// ========================= 响应式数据 =========================

const router = useRouter()
const loading = ref(false)
const refreshing = ref(false)
const progressVisible = ref(false)
const previewVisible = ref(false)

const taskForm = reactive({
  taskId: undefined as number | undefined,
  matchStrategy: 'smart',
  minConfidence: 80
})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  taskId: undefined as number | undefined
})

const taskList = ref<any[]>([])
const taskInfo = ref<any>()
const unmatchedList = ref<UnmatchedDrugVO[]>([])
const total = ref(0)
const selectAll = ref(false)
const selectedDrugs = ref<UnmatchedDrugVO[]>([])
const selectedDrug = ref<UnmatchedDrugVO>()

const progressInfo = reactive({
  percentage: 0,
  status: '',
  totalCount: 0,
  successCount: 0,
  failureCount: 0,
  pendingCount: 0,
  currentItem: '',
  completed: false,
  batchNo: ''
})

// ========================= 生命周期 =========================

onMounted(() => {
  loadTaskList()
})

// ========================= 方法 =========================

const loadTaskList = async () => {
  // 模拟加载任务列表
  taskList.value = [
    { id: 1, taskNo: 'DRUG_20240529_000001', hospitalName: '北京协和医院' },
    { id: 2, taskNo: 'DRUG_20240529_000002', hospitalName: '上海瑞金医院' }
  ]
}

const handleTaskChange = async (taskId: number) => {
  queryParams.taskId = taskId

  // 加载任务信息
  taskInfo.value = {
    hospitalName: taskList.value.find((t) => t.id === taskId)?.hospitalName,
    unmatchedCount: 156,
    matchedCount: 844,
    matchRate: 84
  }

  await loadUnmatchedList()
}

const loadUnmatchedList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await YpidApi.getUnmatchedList(queryParams)
    unmatchedList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    console.error('加载待匹配列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await loadUnmatchedList()
    ElMessage.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedDrugs.value = [...unmatchedList.value]
  } else {
    selectedDrugs.value = []
  }
}

const handleSelectionChange = (selection: UnmatchedDrugVO[]) => {
  selectedDrugs.value = selection
  selectAll.value = selection.length === unmatchedList.value.length
}

const handleStartMatch = async () => {
  if (!taskForm.taskId) {
    ElMessage.warning('请先选择任务')
    return
  }

  progressVisible.value = true

  // 重置进度信息
  Object.assign(progressInfo, {
    percentage: 0,
    status: '',
    totalCount: selectedDrugs.value.length,
    successCount: 0,
    failureCount: 0,
    pendingCount: 0,
    currentItem: '',
    completed: false,
    batchNo: ''
  })

  try {
    const params: BatchMatchRequestVO = {
      taskId: taskForm.taskId,
      unmatchedIds: selectedDrugs.value.map((d) => d.id),
      matchStrategy: taskForm.matchStrategy,
      options: {
        minConfidence: taskForm.minConfidence,
        autoApprove: taskForm.minConfidence >= 90
      }
    }

    const result = await YpidApi.executeBatchMatch(params)

    // 更新进度信息
    progressInfo.batchNo = result.batchNo
    progressInfo.successCount = result.successCount
    progressInfo.failureCount = result.failureCount
    progressInfo.pendingCount = result.pendingCount
    progressInfo.percentage = 100
    progressInfo.status = result.failureCount > 0 ? 'warning' : 'success'
    progressInfo.completed = true

    ElMessage.success(`匹配完成：成功 ${result.successCount} 条`)

    // 刷新列表
    await loadUnmatchedList()
  } catch (error) {
    progressInfo.status = 'exception'
    ElMessage.error('批量匹配失败')
  }
}

const handleCancelMatch = () => {
  progressVisible.value = false
}

const handleViewResult = () => {
  progressVisible.value = false
  router.push({
    name: 'YpidReport',
    query: { batchNo: progressInfo.batchNo }
  })
}

const handlePreviewMatch = async (row: UnmatchedDrugVO) => {
  selectedDrug.value = row
  previewVisible.value = true
}

const handleManualMatch = (row: UnmatchedDrugVO) => {
  router.push({
    name: 'YpidManualMatch',
    query: { unmatchedId: row.id }
  })
}

const handleConfirmMatch = async (ypid: string) => {
  // 确认匹配
  await YpidApi.submitManualMatch({
    unmatchedId: selectedDrug.value!.id,
    ypid,
    matchReason: '预览确认匹配'
  })

  ElMessage.success('匹配成功')
  previewVisible.value = false
  await loadUnmatchedList()
}

// ========================= 工具方法 =========================

const getTableLabel = (table: string) => {
  const tableMap = {
    catalog: '药品目录',
    inbound: '入库情况',
    outbound: '出库情况',
    usage: '使用情况'
  }
  return tableMap[table] || table
}

const getMatchStatusLabel = (status: number) => {
  const statusMap = {
    0: '未匹配',
    1: '已匹配',
    2: '匹配失败'
  }
  return statusMap[status] || '未知'
}

const getMatchStatusTag = (status: number) => {
  const tagMap = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return tagMap[status] || 'info'
}
</script>

<style scoped>
.batch-match-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.task-card,
.unmatched-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-info {
  margin-top: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.highlight {
  color: #f56c6c;
  font-weight: 600;
  font-size: 16px;
}

.match-progress {
  padding: 20px 0;
}

.progress-stats {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
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

.current-processing {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #606266;
}
</style>
