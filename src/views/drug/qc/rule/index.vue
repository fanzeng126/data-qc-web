<template>
  <div class="qc-rule-container">
    <!-- 页面头部 -->
    <PageHeader
      title="质控规则管理"
      content="管理前置质控和后置质控规则，确保药品数据质量符合国家标准要求"
    >
      <template #extra>
        <el-button type="primary" @click="openForm('create')"> 新增规则 </el-button>
        <el-button @click="handleImport"> 导入规则 </el-button>
        <el-button @click="handleExport" :loading="exportLoading"> 导出规则 </el-button>
      </template>
    </PageHeader>

    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="前置质控规则"
            :value="statistics.preQcRules || 0"
            icon="Shield"
            color="#409eff"
            :description="`启用: ${statistics.preQcEnabled || 0}条`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="后置质控规则"
            :value="statistics.postQcRules || 0"
            icon="CircleCheck"
            color="#67c23a"
            :description="`启用: ${statistics.postQcEnabled || 0}条`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日执行次数"
            :value="statistics.todayExecutions || 0"
            icon="Clock"
            color="#e6a23c"
            :description="`成功: ${statistics.successExecutions || 0}次`"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="规则通过率"
            :value="statistics.passRate || 0"
            suffix="%"
            icon="TrendCharts"
            color="#909399"
            :trend="statistics.passRateTrend || 0"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 搜索区域 -->
    <ContentWrap class="-mb-15px">
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="规则编码" prop="ruleCode">
          <el-input
            v-model="queryParams.ruleCode"
            class="!w-240px"
            placeholder="请输入规则编码"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="规则名称" prop="ruleName">
          <el-input
            v-model="queryParams.ruleName"
            class="!w-240px"
            placeholder="请输入规则名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="规则类型" prop="ruleType">
          <el-select
            v-model="queryParams.ruleType"
            class="!w-240px"
            placeholder="请选择类型"
            clearable
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
            class="!w-240px"
            placeholder="请选择适用表"
            clearable
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

        <el-form-item label="字段名称" prop="fieldName">
          <el-input
            v-model="queryParams.fieldName"
            class="!w-240px"
            clearable
            placeholder="请输入字段名称"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="启用状态" prop="enabled">
          <el-select
            v-model="queryParams.enabled"
            class="!w-240px"
            placeholder="请选择状态"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery"> 搜索 </el-button>
          <el-button @click="resetQuery"> 重置 </el-button>
          <el-button type="success" @click="handleExport" :loading="exportLoading">
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 规则列表 -->
    <ContentWrap>
      <el-table
        v-loading="loading"
        :data="ruleList"
        stripe
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

        <el-table-column align="center" label="适用表" prop="tableType" width="150">
          <template #default="{ row }">
            <div v-if="row.tableType !== null && row.tableType !== undefined">
              <!-- 检查是否为"全部表"的情况 -->
              <div v-if="row.tableType === 0 || row.tableType === '0'" class="table-all">
                <el-tag size="small" type="info">全部表</el-tag>
              </div>
              <div v-else>
                <div v-if="parseTableTypes(row.tableType).length <= 2" class="table-tags">
                  <el-tag
                    v-for="tableType in parseTableTypes(row.tableType)"
                    :key="tableType"
                    class="table-tag"
                    size="small"
                  >
                    {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, tableType) }}
                  </el-tag>
                </div>
                <el-popover v-else placement="top" trigger="hover" width="200">
                  <template #default>
                    <div class="table-types-popover">
                      <el-tag
                        v-for="tableType in parseTableTypes(row.tableType)"
                        :key="tableType"
                        class="table-tag-popup"
                        size="small"
                      >
                        {{ getDictLabel(DICT_TYPE.DRUG_QC_TABLE_TYPE, tableType) }}
                      </el-tag>
                    </div>
                  </template>
                  <template #reference>
                    <el-tag size="small" type="primary">
                      {{ parseTableTypes(row.tableType).length }}个表
                    </el-tag>
                  </template>
                </el-popover>
              </div>
            </div>
            <span v-else class="text-muted">未配置</span>
          </template>
        </el-table-column>

        <el-table-column align="center" label="检查字段" prop="fieldName" width="150">
          <template #default="{ row }">
            <div v-if="row.fieldName">
              <!-- 解析逗号分隔的字段名字符串 -->
              <div v-if="parseFieldNames(row.fieldName).length === 1" class="field-single">
                <el-tag size="small" type="success">
                  {{ parseFieldNames(row.fieldName)[0] }}
                </el-tag>
              </div>
              <div v-else-if="parseFieldNames(row.fieldName).length <= 2" class="field-tags">
                <el-tag
                  v-for="fieldName in parseFieldNames(row.fieldName)"
                  :key="fieldName"
                  class="field-tag"
                  size="small"
                  type="success"
                >
                  {{ fieldName }}
                </el-tag>
              </div>
              <el-popover v-else placement="top" trigger="hover" width="250">
                <template #default>
                  <div class="field-names-popover">
                    <div class="popover-title">检查字段列表：</div>
                    <el-tag
                      v-for="fieldName in parseFieldNames(row.fieldName)"
                      :key="fieldName"
                      class="field-tag-popup"
                      size="small"
                      type="success"
                    >
                      {{ fieldName }}
                    </el-tag>
                  </div>
                </template>
                <template #reference>
                  <el-tag size="small" type="warning">
                    {{ parseFieldNames(row.fieldName).length }}个字段
                  </el-tag>
                </template>
              </el-popover>
            </div>
            <span v-else class="text-muted">无字段</span>
          </template>
        </el-table-column>

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
      <div class="flex justify-end mt-4">
        <Pagination
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="loadRuleList"
        />
      </div>
    </ContentWrap>

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
import { onMounted, reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Clock,
  Connection,
  CopyDocument,
  Delete,
  Download,
  Edit,
  MoreFilled,
  Plus,
  Refresh,
  Search,
  Upload,
  View
} from '@element-plus/icons-vue'
import { dateFormatter } from '@/utils/formatTime'
import {
  QcRuleApi,
  type QcRulePageReqVO,
  type QcRuleRespVO,
  type QcRuleStatisticsVO
} from '@/api/drug/qc/rule'
import { DICT_TYPE, getDictLabel, getIntDictOptions } from '@/utils/dict'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'
import { ContentWrap } from '@/components/ContentWrap'
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
  pageSize: 10,
  ruleCode: undefined,
  ruleName: undefined,
  ruleType: undefined,
  ruleCategory: undefined,
  tableType: undefined,
  fieldName: undefined, // 添加字段名搜索
  enabled: undefined
})

/** 规则列表数据 */
const ruleList = ref<QcRuleRespVO[]>([])
const total = ref(0)
const multipleSelection = ref<QcRuleRespVO[]>([])

/** 统计数据 - 修复初始化为0而不是null */
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
    // 转换后端Integer类型的enabled字段为boolean
    ruleList.value = (list || []).map((item) => ({
      ...item,
      enabled: Boolean(item.enabled), // 将0/1转换为false/true
      statusLoading: false // 初始化状态加载状态
    }))
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载规则列表失败')
    console.error('加载规则列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 - 添加防空值处理 */
const loadStatistics = async () => {
  try {
    const data = await QcRuleApi.getQcRuleStatistics()
    // 确保所有值都不为null
    Object.keys(statistics).forEach((key) => {
      statistics[key] = data[key] ?? 0
    })
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
  handleQuery()
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
  if (type === 'create') {
    // 新增规则跳转到构建器页面
    router.push('/drug-qc/rule/builder')
  } else {
    // 编辑规则也跳转到构建器页面，传递id
    router.push(`/drug-qc/rule/builder/${id}`)
  }
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

// ========================= 工具方法 =========================

/** 解析表类型为数组 */
const parseTableTypes = (tableType: string | number | null | undefined): number[] => {
  if (!tableType) {
    return []
  }

  // 如果是数字类型，直接返回数组
  if (typeof tableType === 'number') {
    return tableType === 0 ? [] : [tableType]
  }

  // 如果是字符串类型，按逗号分隔解析
  if (typeof tableType === 'string') {
    if (tableType === '0' || !tableType.trim()) {
      return []
    }
    return tableType
      .split(',')
      .map((t) => parseInt(t.trim()))
      .filter((t) => !isNaN(t))
  }

  return []
}

/** 解析字段名字符串为数组 */
const parseFieldNames = (fieldNameStr: string): string[] => {
  if (!fieldNameStr) {
    return []
  }
  return fieldNameStr
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
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

.text-muted {
  color: #909399;
  font-style: italic;
}

/* 表类型标签样式 */
.table-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.table-tag {
  margin-bottom: 2px;
}

.table-types-popover {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.table-tag-popup {
  margin: 2px;
}

/* 字段标签样式 */
.field-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.field-tag {
  margin-bottom: 2px;
}

.field-names-popover {
  max-height: 200px;
  overflow-y: auto;
}

.popover-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
  font-size: 13px;
}

.field-tag-popup {
  margin: 2px;
  display: inline-block;
}

.field-single {
  display: flex;
  justify-content: center;
}
</style>
