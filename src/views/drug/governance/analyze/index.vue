<template>
  <div class="anomaly-analyze-page">
    <!-- 页面头部 -->
    <PageHeader
      title="异常数据分析"
      content="自动识别和分析数据异常，包括格式错误、逻辑错误、数据缺失等问题"
    >
      <template #extra>
        <el-button type="primary" @click="startAnalysis">
          <el-icon><Search /></el-icon>
          开始分析
        </el-button>
        <el-button @click="exportAnomalies">
          <el-icon><Download /></el-icon>
          导出异常
        </el-button>
      </template>
    </PageHeader>

    <!-- 分析配置 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <span>分析配置</span>
      </template>

      <el-form :inline="true">
        <el-form-item label="选择任务">
          <el-select
            v-model="analysisConfig.taskId"
            placeholder="请选择要分析的任务"
            style="width: 300px"
            filterable
          >
            <el-option
              v-for="task in taskList"
              :key="task.id"
              :label="`${task.taskNo} - ${task.taskName}`"
              :value="task.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分析范围">
          <el-checkbox-group v-model="analysisConfig.tableTypes">
            <el-checkbox :label="1">机构信息</el-checkbox>
            <el-checkbox :label="2">药品目录</el-checkbox>
            <el-checkbox :label="3">入库情况</el-checkbox>
            <el-checkbox :label="4">出库情况</el-checkbox>
            <el-checkbox :label="5">使用情况</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分析结果概览 -->
    <template v-if="analysisResult">
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="异常记录总数" :value="analysisResult.totalAnomalies">
              <template #suffix>
                <span style="font-size: 14px">条</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card danger">
            <el-statistic title="严重异常" :value="analysisResult.criticalCount">
              <template #suffix>
                <span style="font-size: 14px">条</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warning">
            <el-statistic title="一般异常" :value="analysisResult.warningCount">
              <template #suffix>
                <span style="font-size: 14px">条</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card info">
            <el-statistic title="提示信息" :value="analysisResult.infoCount">
              <template #suffix>
                <span style="font-size: 14px">条</span>
              </template>
            </el-statistic>
          </el-card>
        </el-col>
      </el-row>

      <!-- 异常类型分布 -->
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <span>异常类型分布</span>
        </template>
        <div id="anomalyTypeChart" style="height: 300px"></div>
      </el-card>

      <!-- 异常详情列表 -->
      <el-card class="detail-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>异常详情</span>
            <div class="header-actions">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索异常信息"
                style="width: 200px"
                clearable
                @clear="handleSearch"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select
                v-model="filterConfig.severity"
                placeholder="严重程度"
                style="width: 120px"
                clearable
                @change="handleFilter"
              >
                <el-option label="严重" value="critical" />
                <el-option label="警告" value="warning" />
                <el-option label="提示" value="info" />
              </el-select>
              <el-select
                v-model="filterConfig.type"
                placeholder="异常类型"
                style="width: 150px"
                clearable
                @change="handleFilter"
              >
                <el-option label="格式错误" value="format" />
                <el-option label="数据缺失" value="missing" />
                <el-option label="逻辑错误" value="logic" />
                <el-option label="范围异常" value="range" />
                <el-option label="关联错误" value="relation" />
              </el-select>
            </div>
          </div>
        </template>

        <el-table
          v-loading="loading"
          :data="anomalyList"
          stripe
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="序号" width="80" />
          <el-table-column prop="tableName" label="数据表" width="120" />
          <el-table-column prop="recordId" label="记录ID" width="100" />
          <el-table-column prop="fieldName" label="字段名" width="120" />
          <el-table-column prop="fieldValue" label="异常值" width="150" show-overflow-tooltip />
          <el-table-column prop="anomalyType" label="异常类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ getAnomalyTypeName(row.anomalyType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="severity" label="严重程度" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getSeverityType(row.severity)">
                {{ getSeverityName(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="异常描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="suggestion" label="修复建议" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleAutoFix(row)">
                自动修复
              </el-button>
              <el-button type="warning" link size="small" @click="handleManualFix(row)">
                手动修复
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作 -->
        <div class="batch-actions">
          <el-button
            type="primary"
            :disabled="selectedRows.length === 0"
            @click="handleBatchAutoFix"
          >
            批量自动修复
          </el-button>
          <el-button
            type="warning"
            :disabled="selectedRows.length === 0"
            @click="handleBatchManualFix"
          >
            批量手动修复
          </el-button>
          <span class="selection-info">
            已选择 {{ selectedRows.length }} 条记录
          </span>
        </div>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pageConfig.pageNo"
            v-model:page-size="pageConfig.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadAnomalyList"
            @current-change="loadAnomalyList"
          />
        </div>
      </el-card>
    </template>

    <!-- 空状态 -->
    <el-empty v-else description="请选择任务并开始分析" />

    <!-- 手动修复对话框 -->
    <el-dialog
      v-model="fixDialogVisible"
      :title="`手动修复 - ${currentAnomaly?.fieldName}`"
      width="600px"
    >
      <el-form label-width="100px">
        <el-form-item label="数据表">
          {{ currentAnomaly?.tableName }}
        </el-form-item>
        <el-form-item label="记录ID">
          {{ currentAnomaly?.recordId }}
        </el-form-item>
        <el-form-item label="字段名">
          {{ currentAnomaly?.fieldName }}
        </el-form-item>
        <el-form-item label="当前值">
          <el-tag type="danger">{{ currentAnomaly?.fieldValue }}</el-tag>
        </el-form-item>
        <el-form-item label="异常描述">
          {{ currentAnomaly?.description }}
        </el-form-item>
        <el-form-item label="修复建议">
          <el-alert :title="currentAnomaly?.suggestion" type="info" :closable="false" />
        </el-form-item>
        <el-form-item label="修复值" required>
          <el-input
            v-model="fixValue"
            placeholder="请输入修复后的值"
            clearable
          />
        </el-form-item>
        <el-form-item label="修复说明">
          <el-input
            v-model="fixRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入修复说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="fixDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmManualFix">确认修复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import PageHeader from '@/components/PageHeader/index.vue'
import { DrugGovernanceApi } from '@/api/drug/governance'
import { DrugBatchImportApi } from '@/api/drug/task'

/** 页面名称 */
defineOptions({ name: 'AnomalyAnalyze' })

// 响应式数据
const loading = ref(false)
const taskList = ref([])
const analysisResult = ref(null)
const anomalyList = ref([])
const total = ref(0)
const selectedRows = ref([])

const analysisConfig = reactive({
  taskId: undefined,
  tableTypes: [1, 2, 3, 4, 5]
})

const filterConfig = reactive({
  severity: undefined,
  type: undefined
})

const pageConfig = reactive({
  pageNo: 1,
  pageSize: 20
})

const searchKeyword = ref('')
const fixDialogVisible = ref(false)
const currentAnomaly = ref(null)
const fixValue = ref('')
const fixRemark = ref('')

let chartInstance = null

// 生命周期
onMounted(() => {
  loadTaskList()
})

// 方法
const loadTaskList = async () => {
  try {
    const { list } = await DrugBatchImportApi.getTaskPage({
      pageNo: 1,
      pageSize: 100,
      status: 4
    })
    taskList.value = list
  } catch (error) {
    ElMessage.error('加载任务列表失败')
  }
}

const startAnalysis = async () => {
  if (!analysisConfig.taskId) {
    ElMessage.warning('请选择要分析的任务')
    return
  }

  if (analysisConfig.tableTypes.length === 0) {
    ElMessage.warning('请选择分析范围')
    return
  }

  loading.value = true
  try {
    const result = await DrugGovernanceApi.analyzeAnomalies({
      taskId: analysisConfig.taskId,
      tableTypes: analysisConfig.tableTypes
    })

    analysisResult.value = result
    await nextTick()
    renderChart(result.typeDistribution)

    // 加载异常列表
    loadAnomalyList()
  } catch (error) {
    ElMessage.error('分析失败')
  } finally {
    loading.value = false
  }
}

const loadAnomalyList = async () => {
  if (!analysisConfig.taskId) return

  loading.value = true
  try {
    const params = {
      taskId: analysisConfig.taskId,
      ...pageConfig,
      severity: filterConfig.severity,
      type: filterConfig.type,
      keyword: searchKeyword.value
    }

    const { list, total: totalCount } = await DrugGovernanceApi.getAnomalyList(params)
    anomalyList.value = list
    total.value = totalCount
  } catch (error) {
    ElMessage.error('加载异常列表失败')
  } finally {
    loading.value = false
  }
}

const renderChart = (data: any) => {
  const chartDom = document.getElementById('anomalyTypeChart')
  if (!chartDom) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '异常类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleSearch = () => {
  pageConfig.pageNo = 1
  loadAnomalyList()
}

const handleFilter = () => {
  pageConfig.pageNo = 1
  loadAnomalyList()
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleAutoFix = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      '确认自动修复该异常数据？系统将按照建议值进行修复。',
      '确认修复',
      { type: 'warning' }
    )

    await DrugGovernanceApi.autoFix({
      anomalyIds: [row.id],
      strategy: 'default'
    })

    ElMessage.success('修复成功')
    loadAnomalyList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('修复失败')
    }
  }
}

const handleManualFix = (row: any) => {
  currentAnomaly.value = row
  fixValue.value = ''
  fixRemark.value = ''
  fixDialogVisible.value = true
}

const handleBatchAutoFix = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要修复的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认批量自动修复${selectedRows.value.length}条异常数据？`,
      '确认批量修复',
      { type: 'warning' }
    )

    const anomalyIds = selectedRows.value.map(row => row.id)
    await DrugGovernanceApi.autoFix({
      anomalyIds,
      strategy: 'default'
    })

    ElMessage.success('批量修复成功')
    loadAnomalyList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量修复失败')
    }
  }
}

const handleBatchManualFix = () => {
  ElMessage.info('批量手动修复功能开发中')
}

const confirmManualFix = async () => {
  if (!fixValue.value) {
    ElMessage.warning('请输入修复值')
    return
  }

  try {
    await DrugGovernanceApi.manualFix({
      anomalyId: currentAnomaly.value.id,
      fixValue: fixValue.value,
      remark: fixRemark.value
    })

    ElMessage.success('修复成功')
    fixDialogVisible.value = false
    loadAnomalyList()
  } catch (error) {
    ElMessage.error('修复失败')
  }
}

const exportAnomalies = async () => {
  if (!analysisResult.value) {
    ElMessage.warning('暂无分析结果')
    return
  }

  try {
    await DrugGovernanceApi.exportAnomalies({
      taskId: analysisConfig.taskId,
      ...filterConfig
    })
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

// 工具函数
const getAnomalyTypeName = (type: string) => {
  const names = {
    format: '格式错误',
    missing: '数据缺失',
    logic: '逻辑错误',
    range: '范围异常',
    relation: '关联错误'
  }
  return names[type] || '未知'
}

const getSeverityType = (severity: string) => {
  const types = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return types[severity] || 'info'
}

const getSeverityName = (severity: string) => {
  const names = {
    critical: '严重',
    warning: '警告',
    info: '提示'
  }
  return names[severity] || '未知'
}
</script>

<style scoped>
.anomaly-analyze-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.config-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
}

.stat-card.danger :deep(.el-statistic__content) {
  color: #f56c6c;
}

.stat-card.warning :deep(.el-statistic__content) {
  color: #e6a23c;
}

.stat-card.info :deep(.el-statistic__content) {
  color: #909399;
}

.chart-card,
.detail-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.batch-actions {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.selection-info {
  margin-left: auto;
  color: #909399;
  font-size: 14px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
