<!-- src/views/drug/governance/history/index.vue -->
<template>
  <div class="fix-history-container">
    <!-- 页面头部 -->
    <PageHeader title="修复历史" content="查看数据修复的历史记录，分析修复效果和质量改进趋势">
      <template #extra>
        <el-button type="success" @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出历史
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="总修复次数"
            :value="statistics.totalFixes"
            icon="DocumentChecked"
            color="#409eff"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="自动修复"
            :value="statistics.autoFixes"
            icon="MagicStick"
            color="#67c23a"
            :rate="calculateRate(statistics.autoFixes, statistics.totalFixes)"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="手动修复"
            :value="statistics.manualFixes"
            icon="EditPen"
            color="#e6a23c"
            :rate="calculateRate(statistics.manualFixes, statistics.totalFixes)"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6">
          <StatCard
            title="修复成功率"
            :value="statistics.successRate"
            suffix="%"
            icon="SuccessFilled"
            color="#909399"
            :trend="statistics.successRateTrend"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索条件 -->
    <el-card class="search-card" shadow="never">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="批次号" prop="batchNo">
          <el-input
            v-model="queryParams.batchNo"
            placeholder="请输入批次号"
            clearable
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="任务ID" prop="taskId">
          <el-input
            v-model="queryParams.taskId"
            placeholder="请输入任务ID"
            clearable
            style="width: 150px"
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

        <el-form-item label="修复类型" prop="fixType">
          <el-select
            v-model="queryParams.fixType"
            placeholder="请选择类型"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="自动修复" value="auto" />
            <el-option label="手动修复" value="manual" />
          </el-select>
        </el-form-item>

        <el-form-item label="操作人" prop="operator">
          <el-input
            v-model="queryParams.operator"
            placeholder="请输入操作人"
            clearable
            style="width: 150px"
          />
        </el-form-item>

        <el-form-item label="修复时间" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
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

    <!-- 历史记录列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="historyList" stripe border>
        <el-table-column prop="batchNo" label="批次号" width="180" fixed="left" />

        <el-table-column prop="taskNo" label="任务编号" width="150" />

        <el-table-column prop="tableType" label="数据表" width="120">
          <template #default="{ row }">
            <el-tag size="small">
              {{ getDictLabel(DICT_TYPE.DRUG_TABLE_TYPE, row.tableType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fixType" label="修复类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.fixType === 'auto' ? 'success' : 'warning'" size="small">
              {{ row.fixType === 'auto' ? '自动' : '手动' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="fixStrategy" label="修复策略" width="120" show-overflow-tooltip />

        <el-table-column prop="changedFields" label="变更字段" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="field in row.changedFields"
              :key="field"
              size="small"
              style="margin-right: 4px"
            >
              {{ field }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="operator" label="操作人" width="100" />

        <el-table-column prop="fixTime" label="修复时间" width="150" :formatter="dateFormatter" />

        <el-table-column prop="executionTime" label="耗时" width="80">
          <template #default="{ row }">
            {{ formatExecutionTime(row.executionTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="loadHistoryList"
      />
    </el-card>

    <!-- 详情对话框 -->
    <FixHistoryDetailModal v-model="detailVisible" :history-id="selectedHistoryId" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Search, Refresh, View } from '@element-plus/icons-vue'
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'
import { DataGovernanceApi, type FixHistoryVO, type FixHistoryQueryVO } from '@/api/drug/governance'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import FixHistoryDetailModal from './components/FixHistoryDetailModal.vue'

defineOptions({ name: 'FixHistoryIndex' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const exportLoading = ref(false)

const queryParams = reactive<FixHistoryQueryVO>({
  pageNo: 1,
  pageSize: 20,
  batchNo: undefined,
  taskId: undefined,
  tableType: undefined,
  fixType: undefined,
  operator: undefined,
  fixTimeStart: undefined,
  fixTimeEnd: undefined
})

const dateRange = ref<[string, string]>()
const historyList = ref<FixHistoryVO[]>([])
const total = ref(0)

const statistics = reactive({
  totalFixes: 0,
  autoFixes: 0,
  manualFixes: 0,
  successRate: 0,
  successRateTrend: 0
})

const detailVisible = ref(false)
const selectedHistoryId = ref<number>()

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 方法 =========================

const initPage = async () => {
  await Promise.all([loadHistoryList(), loadStatistics()])
}

const loadHistoryList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await DataGovernanceApi.getFixHistoryPage(queryParams)
    historyList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    console.error('加载修复历史失败:', error)
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const data = await DataGovernanceApi.getFixAnalytics({
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    })
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  loadHistoryList()
}

const resetQuery = () => {
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    batchNo: undefined,
    taskId: undefined,
    tableType: undefined,
    fixType: undefined,
    operator: undefined,
    fixTimeStart: undefined,
    fixTimeEnd: undefined
  })
  dateRange.value = undefined
  handleQuery()
}

const handleDateChange = (value: [string, string] | null) => {
  if (value) {
    queryParams.fixTimeStart = value[0]
    queryParams.fixTimeEnd = value[1]
  } else {
    queryParams.fixTimeStart = undefined
    queryParams.fixTimeEnd = undefined
  }
}

const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确认导出当前查询条件下的修复历史？', '确认导出')
    exportLoading.value = true
    await DataGovernanceApi.exportFixHistory(queryParams)
    ElMessage.success('导出成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}

const handleView = (row: FixHistoryVO) => {
  selectedHistoryId.value = row.id
  detailVisible.value = true
}

// ========================= 工具方法 =========================

const calculateRate = (value: number, total: number) => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

const formatExecutionTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}min`
}
</script>

<style scoped>
.fix-history-container {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.stats-overview {
  margin-bottom: 20px;
}

.search-card,
.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}
</style>
