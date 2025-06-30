<!-- src/views/drug/governance/analyze/index.vue -->
<template>
  <div class="anomaly-analyze-container">
    <!-- 页面头部 -->
    <PageHeader title="异常数据分析" content="识别和分类药品数据中的异常情况，为数据修复提供依据">
      <template #extra>
        <el-button @click="handleRefresh" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="success" @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出异常数据
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="异常数据总数"
            :value="statistics.totalAnomalies"
            icon="Warning"
            color="#f56c6c"
            :description="`今日新增: ${statistics.todayFixed || 0}`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="YPID相关错误"
            :value="statistics.ypidErrors"
            icon="Key"
            color="#e6a23c"
            :rate="calculateRate(statistics.ypidErrors, statistics.totalAnomalies)"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="数值异常"
            :value="statistics.valueErrors"
            icon="DataLine"
            color="#409eff"
            :rate="calculateRate(statistics.valueErrors, statistics.totalAnomalies)"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="逻辑错误"
            :value="statistics.logicErrors"
            icon="Connection"
            color="#909399"
            :rate="calculateRate(statistics.logicErrors, statistics.totalAnomalies)"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索条件 -->
    <el-card class="search-card" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="任务编号" prop="taskNo">
          <el-input
            v-model="queryParams.taskNo"
            placeholder="请输入任务编号"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="表类型" prop="tableType">
          <el-select
            v-model="queryParams.tableType"
            placeholder="请选择表类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_TABLE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="异常类型" prop="anomalyType">
          <el-select
            v-model="queryParams.anomalyType"
            placeholder="请选择异常类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="YPID未比对" value="YPID_EMPTY" />
            <el-option label="YPID比对错误" value="YPID_ERROR" />
            <el-option label="金额异常" value="AMOUNT_ERROR" />
            <el-option label="数量异常" value="QUANTITY_ERROR" />
            <el-option label="逻辑错误" value="LOGIC_ERROR" />
            <el-option label="格式错误" value="FORMAT_ERROR" />
          </el-select>
        </el-form-item>

        <el-form-item label="处理状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="待处理" :value="0" />
            <el-option label="修复中" :value="1" />
            <el-option label="已修复" :value="2" />
            <el-option label="已忽略" :value="3" />
            <el-option label="修复失败" :value="4" />
          </el-select>
        </el-form-item>

        <el-form-item label="医院名称" prop="hospitalName">
          <el-input
            v-model="queryParams.hospitalName"
            placeholder="请输入医院名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 异常数据列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">异常数据明细</span>
          <div class="table-actions">
            <el-button
              type="primary"
              size="small"
              :disabled="multipleSelection.length === 0"
              @click="handleBatchAutoFix"
            >
              <el-icon><Tools /></el-icon>
              批量自动修复
            </el-button>
            <el-button
              type="warning"
              size="small"
              :disabled="multipleSelection.length === 0"
              @click="handleBatchManualFix"
            >
              <el-icon><Edit /></el-icon>
              批量手动修复
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="anomalyList"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="taskNo" label="任务编号" width="150" fixed="left" />

        <el-table-column prop="tableName" label="数据表" width="120">
          <template #default="{ row }">
            <el-tag size="small">
              {{ getDictLabel(DICT_TYPE.DRUG_TABLE_TYPE, row.tableType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="anomalyType" label="异常类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getAnomalyTypeTag(row.anomalyType)" size="small">
              {{ getAnomalyTypeLabel(row.anomalyType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="hospitalName"
          label="医院名称"
          min-width="180"
          show-overflow-tooltip
        />

        <el-table-column prop="drugName" label="药品名称" min-width="150" show-overflow-tooltip />

        <el-table-column prop="fieldName" label="异常字段" width="120" />

        <el-table-column prop="originalValue" label="原始值" width="120" show-overflow-tooltip />

        <el-table-column prop="expectedValue" label="期望值" width="120" show-overflow-tooltip />

        <el-table-column
          prop="errorMessage"
          label="错误描述"
          min-width="200"
          show-overflow-tooltip
        />

        <el-table-column prop="fixStrategy" label="建议策略" width="140">
          <template #default="{ row }">
            <div v-if="row.fixCode" class="fix-strategy">
              <el-tag size="small" type="success">{{ row.fixCode }}</el-tag>
              <span class="confidence"> 置信度: {{ row.confidence || 0 }}% </span>
            </div>
            <span v-else class="text-muted">需人工处理</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="createTime"
          label="发现时间"
          width="150"
          :formatter="dateFormatter"
        />

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleView(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button
                v-if="row.status === 0 && row.fixCode"
                type="success"
                link
                size="small"
                @click="handleAutoFix(row)"
              >
                <el-icon><Tools /></el-icon>
                自动修复
              </el-button>
              <el-button
                v-if="row.status === 0"
                type="warning"
                link
                size="small"
                @click="handleManualFix(row)"
              >
                <el-icon><Edit /></el-icon>
                手动修复
              </el-button>
              <el-button
                v-if="row.status === 0"
                type="info"
                link
                size="small"
                @click="handleIgnore(row)"
              >
                <el-icon><Close /></el-icon>
                忽略
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="loadAnomalyList"
      />
    </el-card>

    <!-- 异常详情对话框 -->
    <AnomalyDetailModal v-model="detailVisible" :anomaly-id="selectedAnomalyId" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Refresh, Download, Search, Tools, Edit, View, Close } from '@element-plus/icons-vue'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import {
  DataGovernanceApi,
  type AnomalyDataVO,
  type AnomalyQueryVO,
  type AnomalyStatisticsVO
} from '@/api/drug/governance'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import AnomalyDetailModal from './components/AnomalyDetailModal.vue'

defineOptions({ name: 'AnomalyAnalyzeIndex' })

// ========================= 响应式数据 =========================

const router = useRouter()
const loading = ref(false)
const refreshing = ref(false)
const exportLoading = ref(false)

const queryParams = reactive<AnomalyQueryVO>({
  pageNo: 1,
  pageSize: 20,
  taskNo: undefined,
  tableType: undefined,
  anomalyType: undefined,
  status: undefined,
  hospitalName: undefined
})

const anomalyList = ref<AnomalyDataVO[]>([])
const total = ref(0)
const multipleSelection = ref<AnomalyDataVO[]>([])

const statistics = reactive<AnomalyStatisticsVO>({
  totalAnomalies: 0,
  ypidErrors: 0,
  valueErrors: 0,
  logicErrors: 0,
  formatErrors: 0,
  pendingAutoFix: 0,
  pendingManualFix: 0,
  todayFixed: 0,
  fixRate: 0,
  fixRateTrend: 0
})

const detailVisible = ref(false)
const selectedAnomalyId = ref<number>()

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 方法 =========================

const initPage = async () => {
  await Promise.all([loadAnomalyList(), loadStatistics()])
}

const loadAnomalyList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await DataGovernanceApi.getAnomalyPage(queryParams)
    anomalyList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    console.error('加载异常数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const data = await DataGovernanceApi.getAnomalyStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  loadAnomalyList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    taskNo: undefined,
    tableType: undefined,
    anomalyType: undefined,
    status: undefined,
    hospitalName: undefined
  })
  handleQuery()
}

const handleRefresh = async () => {
  refreshing.value = true
  try {
    await initPage()
    ElMessage.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确认导出当前查询条件下的异常数据？', '确认导出')
    exportLoading.value = true
    await DataGovernanceApi.exportAnomalyData(queryParams)
    ElMessage.success('导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}

const handleSelectionChange = (selection: AnomalyDataVO[]) => {
  multipleSelection.value = selection
}

const handleView = (row: AnomalyDataVO) => {
  selectedAnomalyId.value = row.id
  detailVisible.value = true
}

const handleAutoFix = (row: AnomalyDataVO) => {
  router.push({
    name: 'DataGovernanceAutoFix',
    query: { anomalyId: row.id }
  })
}

const handleManualFix = (row: AnomalyDataVO) => {
  router.push({
    name: 'DataGovernanceManualFix',
    query: { anomalyId: row.id }
  })
}

const handleBatchAutoFix = () => {
  const ids = multipleSelection.value.map((item) => item.id)
  router.push({
    name: 'DataGovernanceAutoFix',
    query: { anomalyIds: ids.join(',') }
  })
}

const handleBatchManualFix = () => {
  const ids = multipleSelection.value.map((item) => item.id)
  router.push({
    name: 'DataGovernanceManualFix',
    query: { anomalyIds: ids.join(',') }
  })
}

const handleIgnore = async (row: AnomalyDataVO) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入忽略原因', '忽略异常', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入忽略原因'
    })

    await DataGovernanceApi.ignoreAnomaly(row.id, reason)
    ElMessage.success('已忽略该异常')
    loadAnomalyList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// ========================= 工具方法 =========================

const calculateRate = (value: number, total: number) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
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
</script>

<style scoped>
.anomaly-analyze-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.fix-strategy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.confidence {
  font-size: 12px;
  color: #909399;
}

.text-muted {
  color: #909399;
  font-style: italic;
}
</style>
