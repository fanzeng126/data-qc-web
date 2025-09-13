<template>
  <div class="qc-result-detail-page">
    <!-- 页面头部 -->
    <PageHeader
      :title="pageTitle"
      :content="pageDescription"
      :tag="statusTag"
      :tag-type="statusTagType"
      :meta="metaInfo"
      show-back-button
      back-button-text="返回列表"
      :tabs="tabList"
      :default-tab="activeTab"
      @back-click="handleBackClick"
      @tab-change="handleTabChange"
    />

    <!-- 主要内容区域 -->
    <div class="detail-content" v-loading="loading">
      <!-- 概览面板 -->
      <div v-show="activeTab === 'overview'" class="tab-content">
        <div v-if="taskDetail">
          <!-- 基本信息 -->
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <el-icon><InfoFilled /></el-icon>
                <span>基本信息</span>
              </div>
            </template>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="任务编号">{{ taskDetail.taskNo }}</el-descriptions-item>
              <el-descriptions-item label="任务名称">{{ taskDetail.taskName }}</el-descriptions-item>
              <el-descriptions-item label="文件名称">{{ taskDetail.fileName }}</el-descriptions-item>
              <el-descriptions-item label="文件大小">{{ formatFileSize(taskDetail.fileSize) }}</el-descriptions-item>
              <el-descriptions-item label="执行模式">
                <el-tag :type="getExecuteModeType(taskDetail.executeMode)">
                  {{ getExecuteModeText(taskDetail.executeMode) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <el-tag :type="getStatusType(taskDetail.status)">
                  {{ getStatusText(taskDetail.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">{{ formatTime(taskDetail.startTime) }}</el-descriptions-item>
              <el-descriptions-item label="结束时间">{{ formatTime(taskDetail.endTime) }}</el-descriptions-item>
              <el-descriptions-item label="总耗时">{{ formatDuration(taskDetail.durationMs) }}</el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 质控统计 -->
          <el-card class="detail-card mt-20px">
            <template #header>
              <div class="card-header">
                <el-icon><DataAnalysis /></el-icon>
                <span>质控统计</span>
              </div>
            </template>
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="stat-item-card">
                  <div class="stat-title">总记录数</div>
                  <div class="stat-value">{{ formatNumber(taskDetail.totalRecords) }}</div>
                  <div class="stat-desc">处理的总数据量</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item-card success">
                  <div class="stat-title">通过记录</div>
                  <div class="stat-value">{{ formatNumber(taskDetail.successRecords) }}</div>
                  <div class="stat-desc">通过率: {{ getPassRate(taskDetail) }}%</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item-card danger">
                  <div class="stat-title">失败记录</div>
                  <div class="stat-value">{{ formatNumber(taskDetail.failedRecords) }}</div>
                  <div class="stat-desc">失败率: {{ getFailRate(taskDetail) }}%</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item-card warning">
                  <div class="stat-title">异常记录</div>
                  <div class="stat-value">{{ formatNumber(taskDetail.anomalyRecords) }}</div>
                  <div class="stat-desc">三倍标准差检测</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20" class="mt-20px">
              <el-col :span="8">
                <div class="stat-item-card">
                  <div class="stat-title">执行规则数</div>
                  <div class="stat-value">{{ taskDetail.executedRules }}/{{ taskDetail.totalRules }}</div>
                  <div class="stat-desc">已执行/总规则数</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-item-card info">
                  <div class="stat-title">质量评分</div>
                  <div class="stat-value">{{ taskDetail.qualityScore || '-' }}</div>
                  <div class="stat-desc">数据质量综合评分</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-item-card">
                  <div class="stat-title">平均处理时间</div>
                  <div class="stat-value">{{ taskDetail.avgRecordTime || 0 }}ms</div>
                  <div class="stat-desc">单条记录平均耗时</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </div>
      </div>

      <!-- 分表维度面板 -->
      <div v-show="activeTab === 'tables'" class="tab-content">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <el-icon><Grid /></el-icon>
              <span>分表质控结果</span>
            </div>
          </template>

          <el-table
            :data="tableResults"
            v-loading="tableLoading"
            stripe
            style="width: 100%"
          >
            <el-table-column prop="tableName" label="表名称" width="150" />
            <el-table-column prop="tableType" label="表类型" width="120">
              <template #default="{ row }">
                {{ getTableTypeName(row.tableType) }}
              </template>
            </el-table-column>
            <el-table-column label="检查记录数" align="center" width="120">
              <template #default="{ row }">
                {{ formatNumber(row.checkedRecords) }}
              </template>
            </el-table-column>
            <el-table-column label="错误记录数" align="center" width="120">
              <template #default="{ row }">
                <span class="text-danger">{{ formatNumber(row.errorRecords) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="警告记录数" align="center" width="120">
              <template #default="{ row }">
                <span class="text-warning">{{ formatNumber(row.warningRecords) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="通过率" align="center" width="100">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.passRate"
                  :stroke-width="6"
                  :status="row.passRate >= 95 ? 'success' : row.passRate >= 80 ? '' : 'exception'"
                />
              </template>
            </el-table-column>
            <el-table-column label="执行规则" align="center" width="100">
              <template #default="{ row }">
                {{ row.executedRules }}/{{ row.totalRules }}
              </template>
            </el-table-column>
            <el-table-column label="失败规则" align="center" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.failedRules > 0" type="danger" size="small">
                  {{ row.failedRules }}
                </el-tag>
                <span v-else>0</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewTableDetail(row)">
                  查看明细
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 规则执行明细面板 -->
      <div v-show="activeTab === 'rules'" class="tab-content">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>规则执行明细</span>
              <div class="header-actions">
                <el-radio-group v-model="ruleFilter" size="small">
                  <el-radio-button label="all">全部</el-radio-button>
                  <el-radio-button label="failed">失败</el-radio-button>
                  <el-radio-button label="warning">警告</el-radio-button>
                  <el-radio-button label="passed">通过</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>

          <el-table
            :data="filteredRuleDetails"
            v-loading="detailLoading"
            stripe
            row-key="id"
            :default-expand-all="false"
          >
            <el-table-column type="expand">
              <template #default="{ row }">
                <div class="rule-expand-content">
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="条件组">
                      {{ row.conditionGroupName || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="执行动作">
                      <el-tag size="small">{{ row.executeAction }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="错误信息" :span="2">
                      <span class="text-danger">{{ row.errorMessage || '-' }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="影响表">
                      {{ row.affectedTables || '全部' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="执行耗时">
                      {{ row.executionTimeMs }} ms
                    </el-descriptions-item>
                    <el-descriptions-item label="修复建议" :span="2">
                      {{ row.fixSuggestion || '无' }}
                    </el-descriptions-item>
                  </el-descriptions>

                  <!-- 错误样本 -->
                  <div v-if="row.errorSamples && row.errorSamples.length > 0" class="mt-10px">
                    <div class="subtitle">错误样本：</div>
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
                <span>{{ formatNumber(row.checkedCount) }}/</span>
                <span class="text-danger">{{ formatNumber(row.errorCount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="三倍标准差" prop="isThreeSigma" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.isThreeSigma" type="warning" size="small">是</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <el-pagination
            v-model:current-page="rulePage"
            v-model:page-size="rulePageSize"
            :total="filteredRuleDetails.length"
            layout="total, prev, pager, next, sizes"
            :page-sizes="[10, 20, 50, 100]"
            class="mt-20px"
          />
        </el-card>
      </div>

      <!-- 执行日志面板 -->
      <div v-show="activeTab === 'logs'" class="tab-content">
        <TaskLogViewer
          v-if="taskDetail && taskDetail.id"
          :task-id="taskDetail.id"
          :auto-refresh-enabled="false"
        />
      </div>

      <!-- 质量报告面板 -->
      <div v-show="activeTab === 'report'" class="tab-content">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>质量分析报告</span>
              <div class="header-actions">
                <el-button type="primary" size="small" @click="generateReport">
                  <el-icon><Download /></el-icon>
                  导出报告
                </el-button>
              </div>
            </div>
          </template>

          <!-- 质量评分 -->
          <div class="quality-score-section">
            <div class="score-circle">
              <el-progress
                type="circle"
                :percentage="taskDetail?.qualityScore || 0"
                :width="150"
                :stroke-width="10"
                :status="getQualityStatus(taskDetail?.qualityScore)"
              >
                <template #default="{ percentage }">
                  <div class="score-display">
                    <div class="score-value">{{ percentage }}</div>
                    <div class="score-label">质量评分</div>
                  </div>
                </template>
              </el-progress>
            </div>
            <div class="score-detail">
              <h4>评分明细</h4>
              <div v-if="taskDetail?.scoreDetail">
                <div v-for="(score, key) in taskDetail.scoreDetail" :key="key" class="score-item">
                  <span class="score-dimension">{{ getDimensionName(key) }}：</span>
                  <el-progress
                    :percentage="score"
                    :stroke-width="6"
                    :status="score >= 90 ? 'success' : score >= 70 ? '' : 'exception'"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 问题汇总 -->
          <div class="issue-summary mt-20px">
            <h4>问题汇总</h4>
            <el-table :data="issueSummary" stripe>
              <el-table-column prop="issueType" label="问题类型" width="150" />
              <el-table-column prop="count" label="数量" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.severity" size="small">{{ row.count }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="问题描述" />
              <el-table-column prop="suggestion" label="建议措施" />
            </el-table>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 表详情对话框 -->
    <el-dialog
      v-model="tableDetailVisible"
      :title="`${currentTable?.tableName} - 质控详情`"
      width="80%"
      destroy-on-close
    >
      <el-table :data="currentTableRules" stripe max-height="500">
        <el-table-column prop="ruleName" label="规则名称" min-width="200" />
        <el-table-column prop="checkStatus" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getCheckStatusType(row.checkStatus)" size="small">
              {{ getCheckStatusText(row.checkStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="checkedCount" label="检查数" width="100" align="center" />
        <el-table-column prop="errorCount" label="错误数" width="100" align="center">
          <template #default="{ row }">
            <span class="text-danger">{{ row.errorCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" min-width="300" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  InfoFilled,
  DataAnalysis,
  Grid,
  List,
  Document,
  Download
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader/index.vue'
import TaskLogViewer from '../../import/detail/components/TaskLogViewer.vue'
import download from '@/utils/download'
import { 
  QcResultApi, 
  type QcResultDetailVO, 
  type QcTableResultVO, 
  type QcRuleDetailVO,
  type QcIssueSummaryVO,
  EXECUTE_MODE, 
  QC_STATUS, 
  RULE_CHECK_STATUS 
} from '@/api/drug/qc/result/index'

defineOptions({ name: 'QcResultDetail' })

// ==================== 数据定义 ====================
const route = useRoute()
const router = useRouter()
const loading = ref(false)
const detailLoading = ref(false)
const tableLoading = ref(false)
const activeTab = ref('overview')
const ruleFilter = ref('all')
const rulePage = ref(1)
const rulePageSize = ref(20)

// 任务详情
const taskDetail = ref<QcResultDetailVO | null>(null)
// 分表结果
const tableResults = ref<QcTableResultVO[]>([])
// 规则执行明细
const ruleDetails = ref<QcRuleDetailVO[]>([])
// 表详情对话框
const tableDetailVisible = ref(false)
const currentTable = ref<QcTableResultVO | null>(null)
const currentTableRules = ref<QcRuleDetailVO[]>([])
// 问题汇总
const issueSummary = ref<QcIssueSummaryVO[]>([])

// ==================== 计算属性 ====================
const pageTitle = computed(() => taskDetail.value?.taskName || '质控结果详情')
const pageDescription = computed(() => `任务编号: ${taskDetail.value?.taskNo || '-'}`)
const statusTag = computed(() => getStatusText(taskDetail.value?.status))
const statusTagType = computed(() => getStatusType(taskDetail.value?.status))

const metaInfo = computed(() => [
  { label: '创建人', value: taskDetail.value?.creator || '-', icon: 'User' },
  { label: '创建时间', value: formatTime(taskDetail.value?.createTime) || '-', icon: 'Clock' },
  { label: '文件大小', value: formatFileSize(taskDetail.value?.fileSize) || '-', icon: 'Document' }
])

const tabList = computed(() => [
  { key: 'overview', label: '概览', icon: 'DataBoard' },
  { key: 'tables', label: '分表维度', icon: 'Grid' },
  { key: 'rules', label: '规则明细', icon: 'List' },
  { key: 'logs', label: '执行日志', icon: 'Document' },
  { key: 'report', label: '质量报告', icon: 'Medal' }
])

const filteredRuleDetails = computed(() => {
  let filtered = [...ruleDetails.value]

  if (ruleFilter.value === 'failed') {
    filtered = filtered.filter(r => r.checkStatus === 1)
  } else if (ruleFilter.value === 'warning') {
    filtered = filtered.filter(r => r.checkStatus === 2)
  } else if (ruleFilter.value === 'passed') {
    filtered = filtered.filter(r => r.checkStatus === 0)
  }

  const start = (rulePage.value - 1) * rulePageSize.value
  const end = start + rulePageSize.value
  return filtered.slice(start, end)
})

// ==================== 生命周期 ====================
onMounted(() => {
  loadTaskDetail()
})

// ==================== 方法定义 ====================

// 加载任务详情
const loadTaskDetail = async () => {
  loading.value = true
  try {
    const taskId = route.params.id as string
    const id = parseInt(taskId)
    
    // 加载任务基本信息 - 使用ImportTask接口
    taskDetail.value = await QcResultApi.getQcResultDetail(id)
    
    // 如果scoreDetail是JSON字符串，需要解析
    if (taskDetail.value.scoreDetail && typeof taskDetail.value.scoreDetail === 'string') {
      try {
        taskDetail.value.scoreDetail = JSON.parse(taskDetail.value.scoreDetail)
      } catch (e) {
        console.warn('无法解析scoreDetail:', e)
      }
    }
    
    // 并行加载其他数据
    await Promise.all([
      loadTableResults(),
      loadRuleDetails(),
      loadIssueSummary()
    ])
  } catch (error) {
    console.error(error)
    ElMessage.error('加载任务详情失败')
  } finally {
    loading.value = false
  }
}

// 加载分表结果
const loadTableResults = async () => {
  if (!taskDetail.value) return
  
  tableLoading.value = true
  try {
    // 使用任务ID获取分表结果
    tableResults.value = await QcResultApi.getTableResults(taskDetail.value.id)
  } catch (error) {
    console.error(error)
    ElMessage.error('加载分表结果失败')
  } finally {
    tableLoading.value = false
  }
}

// 加载规则明细
const loadRuleDetails = async () => {
  if (!taskDetail.value) return
  
  detailLoading.value = true
  try {
    // 使用任务ID获取规则执行明细
    ruleDetails.value = await QcResultApi.getRuleDetails(taskDetail.value.id)
  } catch (error) {
    console.error(error)
    ElMessage.error('加载规则明细失败')
  } finally {
    detailLoading.value = false
  }
}

// 加载问题沇总
const loadIssueSummary = async () => {
  if (!taskDetail.value) return
  
  try {
    // 使用任务ID获取问题氇总
    issueSummary.value = await QcResultApi.getIssueSummary(taskDetail.value.id)
  } catch (error) {
    console.error('加载问题汇总失败:', error)
    // 如果接口不存在，使用空数组
    issueSummary.value = []
  }
}

// 查看表详情
const viewTableDetail = async (table: QcTableResultVO) => {
  currentTable.value = table
  // 加载该表的规则明细
  currentTableRules.value = ruleDetails.value.filter(r =>
    r.checkDimension === table.tableType.toString()
  )
  tableDetailVisible.value = true
}

// 生成报告
const generateReport = async () => {
  if (!taskDetail.value) return
  
  try {
    ElMessage.info('正在生成质控报告...')
    await QcResultApi.generateReport(taskDetail.value.id)
    ElMessage.success('质控报告生成成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('生成报告失败')
  }
}

// 返回列表
const handleBackClick = () => {
  router.push('/monitoring/drug-qc/result')
}

// 切换标签
const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

// ==================== 工具方法 ====================

const getPassRate = (task: QcResultDetailVO | null) => {
  if (!task?.totalRecords) return 0
  return ((task.successRecords / task.totalRecords) * 100).toFixed(1)
}

const getFailRate = (task: QcResultDetailVO | null) => {
  if (!task?.totalRecords) return 0
  return ((task.failedRecords / task.totalRecords) * 100).toFixed(1)
}

const getExecuteModeText = (mode) => {
  const map = { 1: '仅前置', 2: '仅后置', 3: '全部执行' }
  return map[mode] || '-'
}

const getExecuteModeType = (mode) => {
  const map = { 1: 'warning', 2: 'success', 3: 'primary' }
  return map[mode] || 'info'
}

const getStatusText = (status) => {
  const map = {
    0: '待处理',
    1: '解析中',
    2: '前置质控中',
    3: '数据导入中',
    4: '后置质控中',
    5: '完成',
    6: '失败',
    7: '部分成功',
    8: '已取消'
  }
  return map[status] || '-'
}

const getStatusType = (status) => {
  const map = {
    0: 'info',
    1: 'primary',
    2: 'primary',
    3: 'primary',
    4: 'primary',
    5: 'success',
    6: 'danger',
    7: 'warning',
    8: 'info'
  }
  return map[status] || 'info'
}

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

const getTableTypeName = (type: number | string) => {
  const map: Record<string | number, string> = {
    1: '机构信息',
    2: '药品目录',
    3: '入库情况',
    4: '出库情况',
    5: '使用情况'
  }
  return map[type] || '-'
}

const getDimensionName = (key: string) => {
  const map: Record<string, string> = {
    completeness: '完整性',
    accuracy: '准确性',
    consistency: '一致性'
  }
  return map[key] || key
}

const getQualityStatus = (score: number | undefined) => {
  if (!score) return 'exception'
  if (score >= 90) return 'success'
  if (score >= 70) return ''
  return 'exception'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

const formatDuration = (ms) => {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`
}
</script>

<style lang="scss" scoped>
.qc-result-detail-page {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 50px);
}

.detail-content {
  margin-top: 20px;
}

.tab-content {
  animation: fadeIn 0.3s;
}

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

.detail-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .el-icon {
    margin-right: 8px;
    color: #409eff;
  }

  span {
    font-size: 16px;
    font-weight: 600;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item-card {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  text-align: center;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
  }

  .stat-desc {
    font-size: 12px;
    color: #909399;
  }

  &.success .stat-value {
    color: #67c23a;
  }

  &.danger .stat-value {
    color: #f56c6c;
  }

  &.warning .stat-value {
    color: #e6a23c;
  }

  &.info .stat-value {
    color: #409eff;
  }
}

.rule-expand-content {
  padding: 20px;
  background: #fafafa;

  .subtitle {
    font-weight: 600;
    margin-bottom: 10px;
    color: #303133;
  }
}

.quality-score-section {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 20px;

  .score-circle {
    flex-shrink: 0;
  }

  .score-display {
    text-align: center;

    .score-value {
      font-size: 32px;
      font-weight: 600;
      color: #303133;
    }

    .score-label {
      font-size: 14px;
      color: #909399;
      margin-top: 4px;
    }
  }

  .score-detail {
    flex: 1;

    h4 {
      margin: 0 0 16px 0;
      color: #303133;
    }

    .score-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      .score-dimension {
        width: 80px;
        color: #606266;
      }

      :deep(.el-progress) {
        flex: 1;
      }
    }
  }
}

.issue-summary {
  h4 {
    margin: 0 0 16px 0;
    color: #303133;
  }
}

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}

.text-success {
  color: #67c23a;
}

.mt-10px {
  margin-top: 10px;
}

.mt-20px {
  margin-top: 20px;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>
