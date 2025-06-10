<template>
  <div class="qc-rule-container">
    <!-- 页面头部 -->
    <PageHeader
      title="质控规则管理"
      content="管理前置质控和后置质控规则，确保药品数据质量符合国家标准要求"
    >
      <template #extra>
        <el-button type="primary" @click="openForm('create')">
          <el-icon><Plus /></el-icon>
          新增规则
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入规则
        </el-button>
        <el-button @click="handleExport" :loading="exportLoading">
          <el-icon><Download /></el-icon>
          导出规则
        </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="前置质控规则"
            :value="statistics.preQcRules"
            icon="Shield"
            color="#409eff"
            :description="`启用: ${statistics.preQcEnabled}条`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="后置质控规则"
            :value="statistics.postQcRules"
            icon="CircleCheck"
            color="#67c23a"
            :description="`启用: ${statistics.postQcEnabled}条`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日执行次数"
            :value="statistics.todayExecutions"
            icon="Clock"
            color="#e6a23c"
            :description="`成功: ${statistics.successExecutions}次`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="规则通过率"
            :value="statistics.passRate"
            suffix="%"
            icon="TrendCharts"
            color="#909399"
            :trend="statistics.passRateTrend"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="80px"
        class="search-form"
      >
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input
            v-model="queryParams.ruleCode"
            placeholder="请输入规则编码"
            clearable
            @keyup.enter="handleQuery"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="规则名称" prop="ruleName">
          <el-input
            v-model="queryParams.ruleName"
            placeholder="请输入规则名称"
            clearable
            @keyup.enter="handleQuery"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="规则类型" prop="ruleType">
          <el-select
            v-model="queryParams.ruleType"
            placeholder="请选择类型"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_QC_RULE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="适用表" prop="tableType">
          <el-select
            v-model="queryParams.tableType"
            placeholder="请选择适用表"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option
              v-for="dict in getIntDictOptions(DICT_TYPE.DRUG_QC_TABLE_TYPE)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="启用状态" prop="enabled">
          <el-select
            v-model="queryParams.enabled"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="全部" value="" />
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
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
          <el-button type="success" @click="handleExport" :loading="exportLoading">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 规则列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">规则列表</span>
          <div class="table-actions">
            <el-button type="primary" size="small" @click="openForm('create')">
              <el-icon><Plus /></el-icon>
              新增规则
            </el-button>
            <el-button size="small" @click="handleRefresh" :loading="refreshing">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="ruleList"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="ruleCode"
          label="规则编码"
          width="140"
          fixed="left"
          show-overflow-tooltip
        />

        <el-table-column prop="ruleName" label="规则名称" min-width="180" show-overflow-tooltip />

        <el-table-column prop="ruleType" label="规则类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.ruleType === 1 ? 'primary' : 'success'" size="small" effect="dark">
              {{ getDictLabel(DICT_TYPE.DRUG_QC_RULE_TYPE, row.ruleType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="ruleCategory" label="规则分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">
              {{ getDictLabel(DICT_TYPE.DRUG_QC_RULE_CATEGORY, row.ruleCategory) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="tableType" label="适用表" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.tableType">
              {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, row.tableType) }}
            </span>
            <span v-else class="text-muted">全部表</span>
          </template>
        </el-table-column>

        <el-table-column prop="fieldName" label="检查字段" width="120" show-overflow-tooltip />

        <el-table-column prop="errorLevel" label="错误级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.errorLevel === 1 ? 'danger' : 'warning'" size="small">
              {{ getDictLabel(DICT_TYPE.DRUG_QC_ERROR_LEVEL, row.errorLevel) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="80" align="center" />

        <el-table-column prop="enabled" label="启用状态" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="handleStatusChange(row)"
              :loading="row.statusLoading"
            />
          </template>
        </el-table-column>

        <el-table-column
          prop="createTime"
          label="创建时间"
          width="150"
          align="center"
          sortable="custom"
          :formatter="dateFormatter"
        />

        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" link size="small" @click="handleView(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>

              <el-button type="primary" link size="small" @click="openForm('update', row.id)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>

              <el-button type="warning" link size="small" @click="handleTest(row)">
                <el-icon><Connection /></el-icon>
                测试
              </el-button>

              <el-dropdown trigger="click" @command="(command) => handleMoreAction(command, row)">
                <el-button link size="small">
                  <el-icon><MoreFilled /></el-icon>
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">
                      <el-icon><CopyDocument /></el-icon>
                      复制规则
                    </el-dropdown-item>
                    <el-dropdown-item command="history">
                      <el-icon><Clock /></el-icon>
                      执行历史
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除规则
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 质控规则表单对话框 -->
    <QcRuleForm ref="formRef" @success="handleSuccess" />

    <!-- 规则详情对话框 -->
    <RuleDetailModal v-model="detailVisible" :rule-id="selectedRuleId" />

    <!-- 规则测试对话框 -->
    <RuleTestModal v-model="testVisible" :rule="selectedRule" />

    <!-- 执行历史对话框 -->
    <ExecutionHistoryModal v-model="historyVisible" :rule-id="selectedRuleId" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  Search,
  Refresh,
  View,
  Edit,
  Connection,
  MoreFilled,
  CopyDocument,
  Clock,
  Delete
} from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import {
  QcRuleApi,
  type QcRuleRespVO,
  type QcRulePageReqVO,
  type QcRuleStatisticsVO
} from '@/api/drug/qc/rule'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import QcRuleForm from './QcRuleForm.vue'
import RuleDetailModal from './components/RuleDetailModal.vue'
import RuleTestModal from './components/RuleTestModal.vue'
import ExecutionHistoryModal from './components/ExecutionHistoryModal.vue'

/** 页面组件名称 */
defineOptions({ name: 'DrugQcRuleIndex' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const refreshing = ref(false)
const exportLoading = ref(false)
const router = useRouter()
const queryFormRef = ref<FormInstance>()

/** 查询参数 */
const queryParams = reactive<QcRulePageReqVO>({
  pageNo: 1,
  pageSize: 20,
  ruleCode: undefined,
  ruleName: undefined,
  ruleType: undefined,
  ruleCategory: undefined,
  tableType: undefined,
  enabled: undefined
})

/** 规则列表数据 */
const ruleList = ref<QcRuleRespVO[]>([])
const total = ref(0)
const multipleSelection = ref<QcRuleRespVO[]>([])

/** 统计数据 */
const statistics = reactive<QcRuleStatisticsVO>({
  totalRules: 0,
  preQcRules: 0,
  postQcRules: 0,
  preQcEnabled: 0,
  postQcEnabled: 0,
  todayExecutions: 0,
  successExecutions: 0,
  passRate: 0,
  passRateTrend: 0
})

/** 模态框控制 */
const detailVisible = ref(false)
const testVisible = ref(false)
const historyVisible = ref(false)

/** 选中的规则 */
const selectedRuleId = ref<number>()
const selectedRule = ref<QcRuleRespVO>()

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 核心方法 =========================

/** 初始化页面 */
const initPage = async () => {
  await Promise.all([loadRuleList(), loadStatistics()])
}

/** 加载规则列表 */
const loadRuleList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await QcRuleApi.getQcRulePage(queryParams)
    ruleList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载规则列表失败')
    console.error('加载规则列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  try {
    const data = await QcRuleApi.getQcRuleStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

/** 搜索查询 */
const handleQuery = () => {
  queryParams.pageNo = 1
  loadRuleList()
}

/** 重置查询 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    ruleCode: undefined,
    ruleName: undefined,
    ruleType: undefined,
    ruleCategory: undefined,
    tableType: undefined,
    enabled: undefined
  })
  loadRuleList()
}

/** 刷新页面 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([loadRuleList(), loadStatistics()])
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/** 排序变化处理 */
const handleSortChange = ({ column, prop, order }) => {
  console.log('排序变化:', { column, prop, order })
  // 实现排序逻辑
}

/** 多选变化处理 */
const handleSelectionChange = (selection: QcRuleRespVO[]) => {
  multipleSelection.value = selection
}

/** 导出数据 */
const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确认导出当前查询条件下的规则数据？', '确认导出', {
      type: 'warning'
    })

    exportLoading.value = true
    await QcRuleApi.exportQcRuleList(queryParams)
    ElMessage.success('导出成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('导出失败')
    }
  } finally {
    exportLoading.value = false
  }
}

// ========================= 业务操作方法 =========================

/** 打开表单对话框 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 表单成功处理 */
const handleSuccess = () => {
  loadRuleList()
  loadStatistics()
}

/** 查看规则详情 */
const handleView = (row: QcRuleRespVO) => {
  selectedRuleId.value = row.id
  detailVisible.value = true
}

/** 测试规则 */
const handleTest = (row: QcRuleRespVO) => {
  selectedRule.value = row
  testVisible.value = true
}

/** 状态变化处理 */
const handleStatusChange = async (row: QcRuleRespVO) => {
  row.statusLoading = true
  try {
    const action = row.enabled ? '启用' : '禁用'
    await QcRuleApi.updateQcRuleStatus(row.id, row.enabled)
    ElMessage.success(`${action}规则成功`)
    loadStatistics() // 刷新统计数据
  } catch (error) {
    // 恢复状态
    row.enabled = !row.enabled
    ElMessage.error('状态修改失败')
  } finally {
    row.statusLoading = false
  }
}

/** 更多操作处理 */
const handleMoreAction = async (command: string, row: QcRuleRespVO) => {
  selectedRuleId.value = row.id
  selectedRule.value = row

  switch (command) {
    case 'copy':
      await handleCopyRule(row)
      break
    case 'history':
      historyVisible.value = true
      break
    case 'delete':
      await handleDeleteRule(row)
      break
  }
}

/** 复制规则 */
const handleCopyRule = async (row: QcRuleRespVO) => {
  try {
    const copyData = { ...row }
    copyData.ruleCode = '' // 清空编码，让用户重新输入
    copyData.ruleName = `${row.ruleName} - 副本`
    formRef.value.open('create', undefined, copyData)
  } catch (error) {
    ElMessage.error('复制规则失败')
  }
}

/** 删除规则 */
const handleDeleteRule = async (row: QcRuleRespVO) => {
  try {
    await ElMessageBox.confirm(`确认删除规则"${row.ruleName}"？删除后将无法恢复。`, '确认删除', {
      type: 'error',
      confirmButtonText: '确认删除',
      confirmButtonClass: 'el-button--danger'
    })

    await QcRuleApi.deleteQcRule(row.id)
    ElMessage.success('规则已删除')
    loadRuleList()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除规则失败')
    }
  }
}

/** 导入规则 */
const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}
</script>

<style scoped>
.qc-rule-container {
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

.search-form {
  margin-bottom: 0;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: end;
  margin-top: 20px;
  padding: 20px;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .qc-rule-container {
    padding: 10px;
  }

  .search-form :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 卡片样式 */
:deep(.el-card) {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}
</style>
