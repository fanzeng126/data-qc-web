<template>
  <div class="qc-result-container">
    <!-- 页面头部 -->
    <PageHeader
      title="质控结果管理"
      content="查看质控执行结果，分析数据质量问题，导出错误数据进行修复"
    >
      <template #extra>
        <el-button @click="handleRefresh" :loading="refreshing">
          <Icon icon="ep:refresh" class="mr-5px" />
          刷新
        </el-button>
        <el-button type="primary" @click="handleExportErrors" :disabled="!currentResult">
          <Icon icon="ep:download" class="mr-5px" />
          导出错误数据
        </el-button>
        <el-button type="success" @click="handleGenerateReport" :disabled="!currentResult">
          <Icon icon="ep:document" class="mr-5px" />
          生成质控报告
        </el-button>
      </template>
    </PageHeader>
    <!-- 全局质控结果统计概览 -->
    <div class="stats-overview mb-20px">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="总检测记录"
            :value="globalStats.totalRecords"
            icon="Document"
            color="#409eff"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="通过记录"
            :value="globalStats.passedRecords"
            icon="CircleCheck"
            color="#67c23a"
            :description="`占比: ${globalStats.passRate}%`"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="异常记录"
            :value="globalStats.failedRecords"
            icon="Warning"
            color="#f56c6c"
            :description="`占比: ${globalStats.failureRate}%`"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="已修复记录"
            :value="globalStats.fixedRecords"
            icon="Tools"
            color="#e6a23c"
            :description="`修复率: ${globalStats.fixRate}%`"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 异常分布图表 -->
    <el-row :gutter="20" class="chart-section mb-20px">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>规则异常分布</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="loadRuleChart">
                <el-radio-button label="today">今天</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="ruleChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>表类型异常分布</span>
          </template>
          <div ref="globalTableChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
    <!-- 搜索和过滤 -->
    <ContentWrap>
      <el-form
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="80px"
        class="-mb-15px"
      >
        <el-form-item label="任务编号" prop="taskNo">
          <el-input
            v-model="queryParams.taskNo"
            placeholder="请输入任务编号"
            clearable
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input
            v-model="queryParams.batchNo"
            placeholder="请输入批次号"
            clearable
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="执行模式" prop="executeMode">
          <el-select v-model="queryParams.executeMode" placeholder="全部" clearable class="!w-150px">
            <el-option label="仅前置" :value="1" />
            <el-option label="仅后置" :value="2" />
            <el-option label="全部执行" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable class="!w-150px">
            <el-option label="执行中" :value="0" />
            <el-option label="全部成功" :value="1" />
            <el-option label="部分成功" :value="2" />
            <el-option label="失败" :value="3" />
            <el-option label="中断" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围" prop="timeRange">
          <el-date-picker
            v-model="queryParams.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="!w-320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
          <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>
    <!-- 结果列表 -->
    <ContentWrap class="mb-20px">
      <el-table
        v-loading="loading"
        :data="resultList"
        :stripe="true"
        :show-overflow-tooltip="true"
        @row-click="handleRowClick"
        :row-class-name="getRowClassName"
        class="mt-20px"
      >
        <el-table-column label="批次号" prop="batchNo" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="selectResult(row)">
              {{ row.batchNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="文件名" prop="fileName" min-width="200" show-overflow-tooltip />
        <el-table-column label="执行模式" prop="executeMode" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getExecuteModeType(row.executeMode)">
              {{ getExecuteModeText(row.executeMode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前阶段" prop="qcStage" width="120" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getStageType(row.qcStage)">
              {{ getStageText(row.qcStage) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progressPercent"
              :stroke-width="6"
              :status="getProgressStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="文件处理" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'text-success': row.successFiles === row.totalFiles }">
              {{ row.successFiles }}/{{ row.totalFiles }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="记录处理" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip :content="`通过:${row.passedRecords} 失败:${row.failedRecords} 警告:${row.warningRecords}`">
              <span>{{ row.passedRecords }}/{{ row.totalRecords }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="质量评分" width="100" align="center">
          <template #default="{ row }">
            <span :class="getScoreClass(row.qualityScore)">
              {{ row.qualityScore || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="100" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="160" :formatter="dateFormatter" />
      </el-table>

      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>

    <!-- 选中结果的详细信息 -->
    <div v-if="currentResult" class="result-detail">
      <!-- 选中结果统计卡片 -->
      <el-row :gutter="20" class="mb-20px">
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="总记录数"
            :value="currentResult.totalRecords"
            icon="Document"
            color="#409eff"
            :loading="detailLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="通过记录"
            :value="currentResult.passedRecords"
            icon="CircleCheck"
            color="#67c23a"
            :rate="getPassRate(currentResult)"
            :loading="detailLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="失败记录"
            :value="currentResult.failedRecords"
            icon="CircleClose"
            color="#f56c6c"
            :rate="getFailRate(currentResult)"
            :loading="detailLoading"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatCard
            title="异常记录"
            :value="currentResult.anomalyRecords"
            icon="Warning"
            color="#e6a23c"
            description="三倍标准差"
            :loading="detailLoading"
          />
        </el-col>
      </el-row>

      <!-- 执行进度时间线 -->
      <el-card class="mb-20px">
        <template #header>
          <div class="card-header">
            <span>执行进度</span>
            <el-tag v-if="currentResult.isInterrupted" type="danger" size="small">
              已中断: {{ currentResult.interruptRuleCode }}
            </el-tag>
          </div>
        </template>
        <el-steps :active="getActiveStep(currentResult)" finish-status="success">
          <el-step title="文件解压" :description="getStageDuration(currentResult, 1)" />
          <el-step title="基础验证" :description="getStageDuration(currentResult, 2)" />
          <el-step title="前置质控" :description="getStageDuration(currentResult, 3)" />
          <el-step title="数据导入" :description="getStageDuration(currentResult, 4)" />
          <el-step title="后置质控" :description="getStageDuration(currentResult, 5)" />
          <el-step title="结果生成" :description="getStageDuration(currentResult, 6)" />
        </el-steps>
      </el-card>

      <!-- 分表统计 & 性能指标 -->
      <el-row :gutter="20" class="mb-20px">
        <!-- 分表统计 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>分表统计</span>
            </template>
            <div ref="tableChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>

        <!-- 性能指标 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>性能指标</span>
            </template>
            <el-descriptions :column="1">
              <el-descriptions-item label="总耗时">
                {{ formatDuration(currentResult.durationMs) }}
              </el-descriptions-item>
              <el-descriptions-item label="平均处理时间">
                {{ currentResult.avgRecordTime || 0 }} ms/条
              </el-descriptions-item>
              <el-descriptions-item label="执行规则数">
                {{ currentResult.executedRules }}/{{ currentResult.totalRules }}
              </el-descriptions-item>
              <el-descriptions-item label="通过规则数">
                <el-tag type="success" size="small">{{ currentResult.passedRules }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="失败规则数">
                <el-tag type="danger" size="small">{{ currentResult.failedRules }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <!-- 规则执行明细 -->
      <ContentWrap>
        <div class="mb-15px">
          <span class="text-lg font-bold">规则执行明细</span>
          <el-button
            type="primary"
            size="small"
            class="float-right"
            @click="viewExecutionLog"
            v-if="currentResult"
          >
            查看执行日志
          </el-button>
        </div>

        <el-table
          v-loading="detailLoading"
          :data="detailList"
          :stripe="true"
          :show-overflow-tooltip="true"
          row-key="id"
          default-expand-all
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="px-20px py-10px">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="条件组">
                    {{ row.conditionGroupName || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="执行动作">
                    <el-tag size="small">{{ row.executeAction }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="错误信息" :span="2">
                    {{ row.errorMessage || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="影响表">
                    {{ row.affectedTables || '全部' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="执行耗时">
                    {{ row.executionTimeMs }} ms
                  </el-descriptions-item>
                  <el-descriptions-item label="错误分布" :span="2">
                    <template v-if="row.errorDistribution">
                      <el-tag
                        v-for="(count, tableType) in row.errorDistribution"
                        :key="tableType"
                        size="small"
                        class="mr-5px"
                      >
                        表{{ tableType }}: {{ count }}条
                      </el-tag>
                    </template>
                    <span v-else>-</span>
                  </el-descriptions-item>
                </el-descriptions>

                <!-- 错误样本 -->
                <div v-if="row.errorSamples && row.errorSamples.length > 0" class="mt-10px">
                  <div class="text-sm text-gray-600 mb-5px">错误样本：</div>
                  <el-table :data="row.errorSamples" size="small" border>
                    <el-table-column prop="tableType" label="表类型" width="80" />
                    <el-table-column prop="recordId" label="记录ID" width="100" />
                    <el-table-column prop="errorField" label="错误字段" />
                    <el-table-column prop="fieldValue" label="字段值" />
                    <el-table-column prop="expectedValue" label="期望值" />
                  </el-table>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="规则编码" prop="ruleCode" width="120" />
          <el-table-column label="规则名称" prop="ruleName" min-width="200" />
          <el-table-column label="规则类型" prop="ruleType" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.ruleType === 1 ? 'primary' : 'success'">
                {{ row.ruleType === 1 ? '前置' : '后置' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="检查维度" prop="checkDimension" width="100" align="center" />
          <el-table-column label="检查状态" prop="checkStatus" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getCheckStatusType(row.checkStatus)" size="small">
                {{ getCheckStatusText(row.checkStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="检查/错误" width="120" align="center">
            <template #default="{ row }">
              <span>{{ row.checkedCount }}/</span>
              <span class="text-danger">{{ row.errorCount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="三倍标准差" prop="isThreeSigma" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isThreeSigma" type="warning" size="small">是</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
      </ContentWrap>
    </div>

    <!-- 执行日志弹窗 -->
    <el-dialog
      v-model="logDialogVisible"
      title="执行日志"
      width="80%"
      append-to-body
      destroy-on-close
    >
      <div class="log-container" v-loading="logLoading">
        <div
          v-for="log in executionLogs"
          :key="log.id"
          class="log-item"
          :class="`log-${log.level.toLowerCase()}`"
        >
          <span class="log-time">{{ log.createTime }}</span>
          <el-tag :type="getLogLevelType(log.level)" size="small">{{ log.level }}</el-tag>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'

// 组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

defineOptions({ name: 'QcResultManagement' })

// ==================== 数据定义 ====================
const loading = ref(false)
const refreshing = ref(false)
const detailLoading = ref(false)
const logLoading = ref(false)
const statsLoading = ref(false)
const chartPeriod = ref('today')
const queryFormRef = ref()

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskNo: '',
  batchNo: '',
  executeMode: undefined,
  status: undefined,
  timeRange: []
})

// 列表数据
const resultList = ref([])
const total = ref(0)
const currentResult = ref(null)
const detailList = ref([])

// 全局统计数据
const globalStats = ref({
  totalRecords: 0,
  passedRecords: 0,
  failedRecords: 0,
  warningRecords: 0,
  fixedRecords: 0,
  passRate: 0,
  failureRate: 0,
  fixRate: 0
})

// 日志相关
const logDialogVisible = ref(false)
const executionLogs = ref([])

// 图表
const tableChartRef = ref()
const ruleChartRef = ref()
const globalTableChartRef = ref()
let tableChart = null
let ruleChart = null
let globalTableChart = null

// ==================== 生命周期 ====================
onMounted(async () => {
  await Promise.all([getList(), loadGlobalStats()])
  await nextTick()
  initGlobalCharts()
})

// ==================== 方法定义 ====================

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    // 模拟数据
    const mockData = {
      list: [
        {
          id: 1,
          taskId: 100,
          taskNo: 'DRUG_20250116_000001',
          batchNo: 'QC_20250116_001',
          fileName: 'drug_data_20250116.zip',
          fileSize: 5242880,
          executeMode: 3,
          qcStage: 6,
          status: 1,
          progressPercent: 100,
          totalFiles: 5,
          successFiles: 5,
          warningFiles: 0,
          failedFiles: 0,
          totalRecords: 15680,
          passedRecords: 15234,
          failedRecords: 256,
          warningRecords: 190,
          anomalyRecords: 45,
          totalRules: 33,
          executedRules: 33,
          passedRules: 28,
          failedRules: 5,
          durationMs: 45230,
          avgRecordTime: 2.88,
          qualityScore: 92.5,
          isInterrupted: 0,
          hasErrorFile: 1,
          createTime: '2025-01-16 10:30:00'
        },
        {
          id: 2,
          taskId: 101,
          taskNo: 'DRUG_20250116_000002',
          batchNo: 'QC_20250116_002',
          fileName: 'drug_data_20250116_2.zip',
          fileSize: 3145728,
          executeMode: 1,
          qcStage: 4,
          status: 4,
          progressPercent: 45,
          totalFiles: 5,
          successFiles: 2,
          warningFiles: 0,
          failedFiles: 1,
          totalRecords: 8920,
          passedRecords: 3560,
          failedRecords: 0,
          warningRecords: 0,
          anomalyRecords: 0,
          totalRules: 25,
          executedRules: 12,
          passedRules: 11,
          failedRules: 1,
          durationMs: 12500,
          avgRecordTime: 3.51,
          qualityScore: null,
          isInterrupted: 1,
          interruptRuleCode: 'RULE_PRE_003',
          interruptMessage: '必填字段缺失率超过阈值',
          hasErrorFile: 0,
          createTime: '2025-01-16 11:15:00'
        }
      ],
      total: 2
    }

    resultList.value = mockData.list
    total.value = mockData.total
  } catch (error) {
    console.error(error)
    ElMessage.error('获取质控结果列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

// 重置
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

// 刷新
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([getList(), loadGlobalStats()])
    if (currentResult.value) {
      await selectResult(currentResult.value)
    }
    await loadRuleChart()
    await loadGlobalTableChart()
    ElMessage.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

// 选择结果查看详情
const selectResult = async (row) => {
  currentResult.value = row
  await loadResultDetail(row.id)
  await nextTick()
  initTableChart()
}

// 加载结果详情
const loadResultDetail = async (resultId) => {
  detailLoading.value = true
  try {
    // 模拟详细数据
    const mockDetail = [
      {
        id: 1,
        resultId: resultId,
        ruleId: 1,
        ruleCode: 'RULE_PRE_001',
        ruleName: '机构信息必填字段检查',
        ruleType: 1,
        checkDimension: 'RECORD',
        tableType: 1,
        conditionGroupId: 1,
        conditionGroupName: '必填字段组',
        executeAction: 'RECORD_ERROR',
        checkStatus: 1,
        checkedCount: 1000,
        errorCount: 12,
        warningCount: 0,
        errorTemplate: '机构${orgName}的${fieldName}字段不能为空',
        errorMessage: '机构"北京协和医院"的"统一社会信用代码"字段不能为空',
        executionTimeMs: 235,
        errorDistribution: { 1: 12 },
        errorSamples: [
          {
            tableType: 1,
            recordId: 101,
            errorField: 'creditCode',
            fieldValue: null,
            expectedValue: '不为空'
          }
        ]
      },
      {
        id: 2,
        resultId: resultId,
        ruleId: 2,
        ruleCode: 'RULE_POST_008',
        ruleName: '药品价格三倍标准差检测',
        ruleType: 2,
        checkDimension: 'PROVINCE',
        conditionGroupId: null,
        conditionGroupName: null,
        executeAction: 'MARK_ANOMALY',
        checkStatus: 2,
        checkedCount: 5680,
        errorCount: 0,
        warningCount: 45,
        isThreeSigma: 1,
        sigmaResult: {
          mean: 125.6,
          std: 23.4,
          threshold: 3,
          anomalies: 45
        },
        executionTimeMs: 1520
      }
    ]

    detailList.value = mockDetail
  } catch (error) {
    console.error(error)
    ElMessage.error('获取质控详情失败')
  } finally {
    detailLoading.value = false
  }
}

// 行点击
const handleRowClick = (row) => {
  selectResult(row)
}

// 导出错误数据
const handleExportErrors = async () => {
  if (!currentResult.value) return

  try {
    ElMessage.info('正在生成错误数据文件...')
    // 调用导出API
    await download.zip(
      `/drug/qc-result/export-errors/${currentResult.value.id}`,
      `错误数据_${currentResult.value.batchNo}.zip`
    )
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

// 生成质控报告
const handleGenerateReport = async () => {
  if (!currentResult.value) return

  try {
    ElMessage.info('正在生成质控报告...')
    // 调用生成报告API
    await download.pdf(
      `/drug/qc-result/generate-report/${currentResult.value.id}`,
      `质控报告_${currentResult.value.batchNo}.pdf`
    )
  } catch (error) {
    console.error(error)
    ElMessage.error('生成报告失败')
  }
}

// 查看执行日志
const viewExecutionLog = async () => {
  logDialogVisible.value = true
  logLoading.value = true
  try {
    // 模拟日志数据
    executionLogs.value = [
      {
        id: 1,
        level: 'INFO',
        message: '开始执行质控任务',
        createTime: '2025-01-16 10:30:00'
      },
      {
        id: 2,
        level: 'INFO',
        message: '文件解压完成，发现5个数据文件',
        createTime: '2025-01-16 10:30:05'
      },
      {
        id: 3,
        level: 'WARN',
        message: '机构信息表发现12条必填字段缺失',
        createTime: '2025-01-16 10:30:15'
      },
      {
        id: 4,
        level: 'ERROR',
        message: '规则RULE_PRE_003执行失败：必填字段缺失率超过阈值',
        createTime: '2025-01-16 10:30:20'
      }
    ]
  } catch (error) {
    console.error(error)
    ElMessage.error('获取执行日志失败')
  } finally {
    logLoading.value = false
  }
}

// 初始化分表统计图表
const initTableChart = () => {
  if (!tableChartRef.value || !currentResult.value) return

  tableChart = echarts.init(tableChartRef.value)

  const tableNames = ['机构信息', '药品目录', '入库情况', '出库情况', '使用情况']
  const tableStats = currentResult.value.tableStatistics || {
    1: { total: 100, passed: 88, failed: 12 },
    2: { total: 5000, passed: 4950, failed: 50 },
    3: { total: 3000, passed: 2980, failed: 20 },
    4: { total: 4000, passed: 3960, failed: 40 },
    5: { total: 3580, passed: 3356, failed: 224 }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['通过', '失败', '警告', '异常']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: tableNames
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '通过',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#67c23a' },
        data: Object.values(tableStats).map(s => s.passed || 0)
      },
      {
        name: '失败',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#f56c6c' },
        data: Object.values(tableStats).map(s => s.failed || 0)
      },
      {
        name: '警告',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#e6a23c' },
        data: Object.values(tableStats).map(s => s.warning || 0)
      },
      {
        name: '异常',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#909399' },
        data: Object.values(tableStats).map(s => s.anomaly || 0)
      }
    ]
  }

  tableChart.setOption(option)
}

// 加载全局统计数据
const loadGlobalStats = async () => {
  statsLoading.value = true
  try {
    // 模拟全局统计数据
    const mockGlobalStats = {
      totalRecords: 125800,
      passedRecords: 102340,
      failedRecords: 18560,
      warningRecords: 4900,
      fixedRecords: 12450,
      passRate: 81.3,
      failureRate: 14.8,
      fixRate: 67.1
    }
    globalStats.value = mockGlobalStats
  } catch (error) {
    console.error('加载全局统计数据失败:', error)
    ElMessage.error('加载全局统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

// 初始化全局图表
const initGlobalCharts = () => {
  if (ruleChartRef.value) {
    ruleChart = echarts.init(ruleChartRef.value)
    loadRuleChart()
  }

  if (globalTableChartRef.value) {
    globalTableChart = echarts.init(globalTableChartRef.value)
    loadGlobalTableChart()
  }
}

// 加载规则分布图表
const loadRuleChart = async () => {
  if (!ruleChart) return

  try {
    // 模拟规则异常分布数据
    const data = [
      { ruleCode: 'RULE_PRE_001', ruleName: '必填字段检查', count: 45 },
      { ruleCode: 'RULE_PRE_002', ruleName: '格式验证', count: 32 },
      { ruleCode: 'RULE_POST_008', ruleName: '三倍标准差', count: 28 },
      { ruleCode: 'RULE_PRE_005', ruleName: '唯一性检查', count: 22 },
      { ruleCode: 'RULE_POST_012', ruleName: '关联性检查', count: 18 },
      { ruleCode: 'RULE_PRE_009', ruleName: '范围验证', count: 15 },
      { ruleCode: 'RULE_POST_003', ruleName: '完整性检查', count: 12 }
    ]

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const item = params[0]
          const ruleData = data[item.dataIndex]
          return `${ruleData.ruleName}<br/>${ruleData.ruleCode}: ${item.value}个异常`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.ruleCode),
        axisLabel: {
          rotate: 45,
          fontSize: 11
        }
      },
      yAxis: {
        type: 'value',
        name: '异常数量',
        nameTextStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '异常数量',
          type: 'bar',
          data: data.map(item => item.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ff6b6b' },
              { offset: 1, color: '#f56c6c' }
            ])
          },
          barWidth: '60%'
        }
      ]
    }

    ruleChart.setOption(option)
  } catch (error) {
    console.error('加载规则分布图表失败:', error)
  }
}

// 加载全局表类型分布图表
const loadGlobalTableChart = async () => {
  if (!globalTableChart) return

  try {
    // 模拟表类型异常分布数据
    const data = [
      { tableTypeName: '机构信息', count: 125 },
      { tableTypeName: '药品目录', count: 685 },
      { tableTypeName: '入库情况', count: 467 },
      { tableTypeName: '出库情况', count: 523 },
      { tableTypeName: '使用情况', count: 756 },
      { tableTypeName: '库存信息', count: 234 }
    ]

    const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center',
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '表类型异常分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '50%'],
          data: data.map((item, index) => ({
            name: item.tableTypeName,
            value: item.count,
            itemStyle: {
              color: colors[index % colors.length]
            }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              scale: true,
              scaleSize: 5
            }
          },
          label: {
            show: true,
            formatter: '{d}%',
            fontSize: 11
          },
          labelLine: {
            show: true
          }
        }
      ]
    }

    globalTableChart.setOption(option)
  } catch (error) {
    console.error('加载表类型分布图表失败:', error)
  }
}

// ==================== 工具方法 ====================

// 获取行样式
const getRowClassName = ({ row }) => {
  if (row === currentResult.value) {
    return 'current-row'
  }
  return ''
}

// 获取执行模式文本
const getExecuteModeText = (mode) => {
  const map = { 1: '仅前置', 2: '仅后置', 3: '全部执行' }
  return map[mode] || '-'
}

// 获取执行模式类型
const getExecuteModeType = (mode) => {
  const map = { 1: 'warning', 2: 'success', 3: 'primary' }
  return map[mode] || 'info'
}

// 获取阶段文本
const getStageText = (stage) => {
  const map = {
    0: '待开始',
    1: '文件解压',
    2: '基础验证',
    3: '前置质控',
    4: '数据导入',
    5: '后置质控',
    6: '结果生成'
  }
  return map[stage] || '-'
}

// 获取阶段类型
const getStageType = (stage) => {
  if (stage === 0) return 'info'
  if (stage === 6) return 'success'
  return 'primary'
}

// 获取进度状态
const getProgressStatus = (row) => {
  if (row.status === 4) return 'exception'
  if (row.status === 1) return 'success'
  return ''
}

// 获取状态文本
const getStatusText = (status) => {
  const map = {
    0: '执行中',
    1: '全部成功',
    2: '部分成功',
    3: '失败',
    4: '中断'
  }
  return map[status] || '-'
}

// 获取状态类型
const getStatusType = (status) => {
  const map = {
    0: 'primary',
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'danger'
  }
  return map[status] || 'info'
}

// 获取分数样式类
const getScoreClass = (score) => {
  if (!score) return ''
  if (score >= 90) return 'text-success'
  if (score >= 70) return 'text-warning'
  return 'text-danger'
}

// 格式化时长
const formatDuration = (ms) => {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`
}

// 获取通过率
const getPassRate = (result) => {
  if (!result.totalRecords) return 0
  return ((result.passedRecords / result.totalRecords) * 100).toFixed(1)
}

// 获取失败率
const getFailRate = (result) => {
  if (!result.totalRecords) return 0
  return ((result.failedRecords / result.totalRecords) * 100).toFixed(1)
}

// 获取当前步骤
const getActiveStep = (result) => {
  if (result.status === 4) {
    // 中断状态，返回中断时的阶段
    return result.qcStage - 1
  }
  return result.qcStage
}

// 获取阶段耗时
const getStageDuration = (result, stage) => {
  if (!result.stageDurations) return ''
  const duration = result.stageDurations[stage]
  return duration ? formatDuration(duration) : ''
}

// 获取检查状态类型
const getCheckStatusType = (status) => {
  const map = {
    0: 'success',
    1: 'danger',
    2: 'warning',
    3: 'info',
    4: 'danger'
  }
  return map[status] || 'info'
}

// 获取检查状态文本
const getCheckStatusText = (status) => {
  const map = {
    0: '通过',
    1: '失败',
    2: '警告',
    3: '跳过',
    4: '中断'
  }
  return map[status] || '-'
}

// 获取日志级别类型
const getLogLevelType = (level) => {
  const map = {
    'DEBUG': 'info',
    'INFO': 'primary',
    'WARN': 'warning',
    'ERROR': 'danger'
  }
  return map[level] || 'info'
}
</script>

<style lang="scss" scoped>


@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.qc-result-container {
  padding: 20px;
}

.stats-overview {
  margin-bottom: 20px;
}

.chart-section {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 8%);
}

.result-detail {
  animation: fadeIn 0.3s;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.current-row) {
  background-color: #ecf5ff !important;
}

.text-success {
  font-weight: bold;
  color: #67c23a;
}

.text-warning {
  font-weight: bold;
  color: #e6a23c;
}

.text-danger {
  font-weight: bold;
  color: #f56c6c;
}

// 日志样式
.log-container {
  max-height: 500px;
  padding: 10px;
  overflow-y: auto;
  background: #f5f5f5;
  border-radius: 4px;
}

.log-item {
  display: flex;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: white;
  border-left: 3px solid transparent;
  border-radius: 4px;
  align-items: center;
  gap: 10px;

  &.log-debug {
    border-left-color: #909399;
  }

  &.log-info {
    border-left-color: #409eff;
  }

  &.log-warn {
    border-left-color: #e6a23c;
  }

  &.log-error {
    background: #fef0f0;
    border-left-color: #f56c6c;
  }
}

.log-time {
  min-width: 140px;
  font-size: 12px;
  color: #909399;
}

.log-message {
  flex: 1;
  color: #303133;
}
</style>
