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
      </template>
    </PageHeader>

    <!-- 全局质控结果统计概览 -->
    <div class="stats-overview mb-20px">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="总任务数"
            :value="globalStats.totalTasks"
            icon="Document"
            color="#409eff"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="质控通过"
            :value="globalStats.completedTasks"
            icon="CircleCheck"
            color="#67c23a"
            :description="`通过率: ${globalStats.passRate}%`"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="质控失败"
            :value="globalStats.failedTasks"
            icon="Warning"
            color="#f56c6c"
            :description="`失败率: ${globalStats.failureRate}%`"
            :loading="statsLoading"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="平均质量分"
            :value="globalStats.avgQualityScore"
            icon="Medal"
            color="#e6a23c"
            suffix="分"
            :loading="statsLoading"
          />
        </el-col>
      </el-row>
    </div>

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
        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="queryParams.taskName"
            placeholder="请输入任务名称"
            clearable
            class="!w-200px"
          />
        </el-form-item>
        <el-form-item label="执行模式" prop="executeMode">
          <el-select
            v-model="queryParams.executeMode"
            placeholder="全部"
            clearable
            class="!w-150px"
          >
            <el-option label="仅前置" :value="1" />
            <el-option label="仅后置" :value="2" />
            <el-option label="全部执行" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="全部" clearable class="!w-150px">
            <el-option label="待处理" :value="0" />
            <el-option label="解析中" :value="1" />
            <el-option label="前置质控中" :value="2" />
            <el-option label="数据导入中" :value="3" />
            <el-option label="后置质控中" :value="4" />
            <el-option label="完成" :value="5" />
            <el-option label="失败" :value="6" />
            <el-option label="部分成功" :value="7" />
            <el-option label="已取消" :value="8" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.createTime"
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
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" />
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 结果列表 -->
    <ContentWrap>
      <el-table
        v-loading="loading"
        :data="resultList"
        :stripe="true"
        :show-overflow-tooltip="true"
        @row-click="handleRowClick"
      >
        <el-table-column label="任务编号" prop="taskNo" width="180">
          <template #default="{ row }">
            <el-link type="primary" @click.stop="viewDetail(row)">
              {{ row.taskNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="任务名称" prop="taskName" min-width="200" show-overflow-tooltip />
        <el-table-column label="文件名" prop="fileName" min-width="200" show-overflow-tooltip />
        <el-table-column label="执行模式" prop="executeMode" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getExecuteModeType(row.executeMode)">
              {{ getExecuteModeText(row.executeMode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="row.progressPercent || 0"
              :stroke-width="6"
              :status="getProgressStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="处理统计" align="center">
          <template #default="{ row }">
            <div class="stats-column">
              <div class="stat-row">
                <span class="stat-label">文件:</span>
                <span class="stat-value">{{ row.successFiles }}/{{ row.totalFiles }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">记录:</span>
                <span class="stat-value"
                  >{{ formatNumber(row.successRecords) }}/{{ formatNumber(row.totalRecords) }}</span
                >
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="质量评分" width="100" align="center">
          <template #default="{ row }">
            <span :class="getScoreClass(row.qualityScore)">
              {{ row.qualityScore || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="100" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createTime"
          width="160"
          :formatter="dateFormatter"
        />
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="viewDetail(row)"> 查看详情 </el-button>
            <el-button
              type="success"
              link
              @click.stop="generateReport(row)"
              v-if="row.status === 5"
            >
              生成报告
            </el-button>
            <el-button type="warning" link @click.stop="exportErrors(row)" v-if="row.hasErrorFile">
              导出错误
            </el-button>
            <el-button type="success" link @click.stop="exportResult(row)" v-if="row.status === 5 || row.status === 6">
              导出报告
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <Pagination
        :total="total"
        v-model:page="queryParams.pageNo"
        v-model:limit="queryParams.pageSize"
        @pagination="getList"
      />
    </ContentWrap>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import {
  QcResultApi,
  type QcResultPageReqVO,
  type QcResultRespVO,
  type QcGlobalStatsVO,
  EXECUTE_MODE,
  QC_STATUS
} from '@/api/drug/qc/result/index'
import { TASK_STATUS } from '@/api/drug/task'

// 组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from '@/components/StatCard/index.vue'

defineOptions({ name: 'QcResultManagement' })

// ==================== 数据定义 ====================
const router = useRouter()
const loading = ref(false)
const refreshing = ref(false)
const statsLoading = ref(false)
const queryFormRef = ref()

// 查询参数
const queryParams = reactive<QcResultPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  taskNo: '',
  taskName: '',
  executeMode: undefined,
  status: undefined,
  creator: '',
  createTime: []
})

// 列表数据
const resultList = ref<QcResultRespVO[]>([])
const total = ref(0)

// 全局统计数据
const globalStats = ref<QcGlobalStatsVO>({
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  partialSuccessTasks: 0,
  avgQualityScore: 0,
  passRate: 0,
  failureRate: 0
})

// ==================== 生命周期 ====================
onMounted(async () => {
  await Promise.all([getList(), loadGlobalStats()])
})

// ==================== 方法定义 ====================

// 获取列表
const getList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await QcResultApi.getQcResultPage(queryParams)
    resultList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    console.error(error)
    ElMessage.error('获取质控结果列表失败')
  } finally {
    loading.value = false
  }
}

// 加载全局统计数据
const loadGlobalStats = async () => {
  statsLoading.value = true
  try {
    const stats = await QcResultApi.getGlobalStats()
    globalStats.value = stats
  } catch (error) {
    console.error('加载全局统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
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
    ElMessage.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

// 行点击 - 跳转到详情页
const handleRowClick = (row) => {
  viewDetail(row)
}

// 查看详情
const viewDetail = (row) => {
  router.push({
    name: 'QcResultDetail',
    params: { id: row.id }
  })
}

// 生成质控报告
const generateReport = async (row: QcResultRespVO) => {
  try {
    ElMessage.info('正在生成质控报告...')
    // 使用 exportResult 接口，因为后端 generateReport 接口可能未实现
    const data = await QcResultApi.exportResult(row.id)
    download.zip(data, `质控报告_${row.taskNo}_${new Date().toISOString().slice(0, 10)}.zip`)
    ElMessage.success('报告生成成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('生成报告失败')
  }
}

// 导出错误数据
const exportErrors = async (row: QcResultRespVO) => {
  try {
    ElMessage.info('正在生成错误数据文件...')
    const data = await QcResultApi.exportErrors(row.id)
    download.zip(data, `错误数据_${row.taskNo}_${new Date().toISOString().slice(0, 10)}.zip`)
    ElMessage.success('错误数据导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

// 导出质控结果
const exportResult = async (row: QcResultRespVO) => {
  try {
    ElMessage.info('正在生成质控结果文件...')
    const data = await QcResultApi.exportResult(row.id)
    download.zip(data, `质控结果_${row.taskNo}_${new Date().toISOString().slice(0, 10)}.zip`)
    ElMessage.success('质控结果导出成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出失败')
  }
}

// ==================== 工具方法 ====================

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

// 获取状态文本
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

// 获取状态类型
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

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  if (status === TASK_STATUS.CANCELLED) return 'warning'
  return undefined
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

// 格式化数字
const formatNumber = (num) => {
  if (!num) return '0'
  return num.toLocaleString()
}
</script>

<style lang="scss" scoped>
.qc-result-container {
  padding: 20px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  color: #303133;
  font-weight: 500;
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
</style>
