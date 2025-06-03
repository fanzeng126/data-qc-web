<template>
  <div class="drug-import-container">
    <!-- 页面头部 -->
    <PageHeader title="药品数据导入管理" content="支持批量导入药品相关数据，提供完整的进度监控和任务管理功能">
      <template #extra>
        <el-button type="primary" @click="openBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button @click="downloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
      </template>
    </PageHeader>
    <!-- 统计概览卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="今日任务"
            :value="statistics.todayTasks"
            icon="Calendar"
            color="#409eff"
            :trend="statistics.taskGrowthRate"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="进行中"
            :value="statistics.runningTasks"
            icon="Loading"
            color="#e6a23c"
            status="processing"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="成功率"
            :value="statistics.successRate"
            suffix="%"
            icon="CircleCheck"
            color="#67c23a"
          />
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <StatCard
            title="平均耗时"
            :value="Math.round(statistics.averageProcessingTime / 60)"
            suffix="分钟"
            icon="Clock"
            color="#909399"
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
        <el-form-item label="任务编号" prop="taskNo">
          <el-input
            v-model="queryParams.taskNo"
            placeholder="请输入任务编号"
            clearable
            @keyup.enter="handleQuery"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="queryParams.taskName"
            placeholder="请输入任务名称"
            clearable
            @keyup.enter="handleQuery"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="任务状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="全部" :value="undefined" />
            <el-option
              v-for="(text, value) in TASK_STATUS_TEXT"
              :key="value"
              :label="text"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="创建时间" prop="createTime">
          <el-date-picker
            v-model="queryParams.createTime"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
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
          <el-button type="success" @click="handleExport" :loading="exportLoading">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">任务列表</span>
          <div class="table-actions">
            <el-button
              type="primary"
              size="small"
              @click="openBatchImport"
            >
              <el-icon><Plus /></el-icon>
              新建任务
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="downloadTemplate"
            >
              <el-icon><Download /></el-icon>
              下载模板
            </el-button>
            <el-button
              size="small"
              @click="handleRefresh"
              :loading="refreshing"
            >
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="taskList"
        stripe
        border
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <TaskExpandContent :task="row" />
          </template>
        </el-table-column>

        <el-table-column
          prop="taskNo"
          label="任务编号"
          width="160"
          fixed="left"
          show-overflow-tooltip
        />

        <el-table-column
          prop="taskName"
          label="任务名称"
          min-width="150"
          show-overflow-tooltip
        />

        <el-table-column
          prop="fileName"
          label="文件名称"
          min-width="180"
          show-overflow-tooltip
        />

        <el-table-column
          prop="status"
          label="状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row.status)"
              size="small"
              effect="dark"
            >
              {{ row.statusDisplay }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="progressPercent"
          label="进度"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-progress
              :percentage="row.progressPercent"
              :stroke-width="8"
              :show-text="false"
              :status="getProgressStatus(row.status)"
            />
            <div class="progress-text">{{ row.progressPercent }}%</div>
          </template>
        </el-table-column>

        <el-table-column
          label="处理统计"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <div class="stats-column">
              <div class="stat-row">
                <span class="stat-label">文件:</span>
                <span class="stat-value">{{ row.successFiles }}/{{ row.totalFiles }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">记录:</span>
                <span class="stat-value">{{ formatNumber(row.successRecords) }}/{{ formatNumber(row.totalRecords) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="duration"
          label="耗时"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <span v-if="row.duration">{{ formatDuration(row.duration) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="creator"
          label="创建人"
          width="100"
          align="center"
          show-overflow-tooltip
        />

        <el-table-column
          prop="createTime"
          label="创建时间"
          width="150"
          align="center"
          sortable="custom"
          :formatter="dateFormatter"
        />

        <el-table-column
          label="操作"
          width="200"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button
                type="primary"
                link
                size="small"
                @click="openProgressMonitor(row.id)"
              >
                <el-icon><View /></el-icon>
                查看进度
              </el-button>

              <el-button
                v-if="row.canRetry"
                type="warning"
                link
                size="small"
                @click="handleRetry(row)"
              >
                <el-icon><RefreshRight /></el-icon>
                重试
              </el-button>

              <el-button
                v-if="row.canCancel"
                type="danger"
                link
                size="small"
                @click="handleCancel(row)"
              >
                <el-icon><Close /></el-icon>
                取消
              </el-button>

              <el-dropdown
                trigger="click"
                @command="(command) => handleMoreAction(command, row)"
              >
                <el-button link size="small">
                  <el-icon><MoreFilled /></el-icon>
                  更多
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">
                      <el-icon><InfoFilled /></el-icon>
                      查看详情
                    </el-dropdown-item>
                    <el-dropdown-item command="download" v-if="row.status === 4">
                      <el-icon><Download /></el-icon>
                      下载报告
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      删除任务
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

    <!-- 批量导入模态框 -->
    <BatchImportModal
      v-model="batchImportVisible"
      @success="handleImportSuccess"
    />

    <!-- 进度监控模态框 -->
    <ProgressMonitorModal
      v-model="progressMonitorVisible"
      :task-id="selectedTaskId"
      @retry="handleRetryFromMonitor"
    />

    <!-- 任务详情模态框 -->
    <TaskDetailModal
      v-model="taskDetailVisible"
      :task-id="selectedTaskId"
    />

    <!-- 重试确认对话框 -->
    <RetryConfirmDialog
      v-model="retryDialogVisible"
      :task="selectedTask"
      @confirm="handleRetryConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Upload,
  Download,
  Search,
  Refresh,
  Plus,
  View,
  RefreshRight,
  Close,
  MoreFilled,
  InfoFilled,
  Delete
} from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import { dateFormatter } from '@/utils/formatTime'
import {
  DrugBatchImportApi,
  type ImportTaskRespVO,
  type ImportTaskPageReqVO,
  type ImportStatisticsVO,
  TASK_STATUS,
  TASK_STATUS_TEXT
} from '@/api/drug/task'

// 导入组件
import PageHeader from '@/components/PageHeader/index.vue'
import StatCard from './components/StatCard.vue'
import BatchImportModal from './components/BatchImportModal.vue'
import ProgressMonitorModal from './components/ProgressMonitorModal.vue'
import TaskDetailModal from './components/TaskDetailModal.vue'
import RetryConfirmDialog from './components/RetryConfirmDialog.vue'
import TaskExpandContent from './components/TaskExpandContent.vue'

/** 页面组件名称 */
defineOptions({ name: 'DrugImportIndex' })

// ========================= 响应式数据 =========================

const loading = ref(false)
const refreshing = ref(false)
const exportLoading = ref(false)

const queryFormRef = ref<FormInstance>()

/** 查询参数 */
const queryParams = reactive<ImportTaskPageReqVO>({
  pageNo: 1,
  pageSize: 20,
  taskNo: undefined,
  taskName: undefined,
  status: undefined,
  fileName: undefined,
  creator: undefined,
  createTime: undefined
})

/** 任务列表数据 */
const taskList = ref<ImportTaskRespVO[]>([])
const total = ref(0)

/** 统计数据 */
const statistics = reactive<ImportStatisticsVO>({
  totalTasks: 0,
  successTasks: 0,
  failedTasks: 0,
  partialSuccessTasks: 0,
  runningTasks: 0,
  successRate: 0,
  averageProcessingTime: 0,
  totalRecordsProcessed: 0,
  todayTasks: 0,
  yesterdayTasks: 0,
  taskGrowthRate: 0
})

/** 模态框控制 */
const batchImportVisible = ref(false)
const progressMonitorVisible = ref(false)
const taskDetailVisible = ref(false)
const retryDialogVisible = ref(false)

/** 选中的任务 */
const selectedTaskId = ref<number>()
const selectedTask = ref<ImportTaskRespVO>()

// ========================= 生命周期 =========================

onMounted(() => {
  initPage()
})

// ========================= 核心方法 =========================

/** 初始化页面 */
const initPage = async () => {
  await Promise.all([
    loadTaskList(),
    loadStatistics()
  ])
}

/** 加载任务列表 */
const loadTaskList = async () => {
  loading.value = true
  try {
    const { list, total: totalCount } = await DrugBatchImportApi.getTaskPage(queryParams)
    taskList.value = list || []
    total.value = totalCount || 0
  } catch (error) {
    ElMessage.error('加载任务列表失败')
    console.error('加载任务列表失败:', error)
  } finally {
    loading.value = false
  }
}

/** 加载统计数据 */
const loadStatistics = async () => {
  try {
    const data = await DrugBatchImportApi.getImportStatistics()
    Object.assign(statistics, data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

/** 搜索查询 */
const handleQuery = () => {
  queryParams.pageNo = 1
  loadTaskList()
}

/** 重置查询 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  Object.assign(queryParams, {
    pageNo: 1,
    pageSize: 20,
    taskNo: undefined,
    taskName: undefined,
    status: undefined,
    fileName: undefined,
    creator: undefined,
    createTime: undefined
  })
  loadTaskList()
}

/** 刷新页面 */
const handleRefresh = async () => {
  refreshing.value = true
  try {
    await Promise.all([
      loadTaskList(),
      loadStatistics()
    ])
    ElMessage.success('刷新成功')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

/** 排序变化处理 */
const handleSortChange = ({ column, prop, order }) => {
  // 实现排序逻辑
  console.log('排序变化:', { column, prop, order })
}

/** 导出数据 */
const handleExport = async () => {
  try {
    await ElMessageBox.confirm('确认导出当前查询条件下的任务数据？', '确认导出', {
      type: 'warning'
    })

    exportLoading.value = true
    await DrugBatchImportApi.exportTaskList(queryParams)
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

/** 打开批量导入 */
const openBatchImport = () => {
  batchImportVisible.value = true
}

/** 导入成功处理 */
const handleImportSuccess = (taskId: number, taskNo: string) => {
  ElNotification({
    type: 'success',
    title: '导入任务创建成功',
    message: `任务编号：${taskNo}，您可以在进度监控中查看处理状态`,
    duration: 5000
  })

  // 刷新列表并自动打开进度监控
  loadTaskList()
  selectedTaskId.value = taskId
  progressMonitorVisible.value = true
}

/** 打开进度监控 */
const openProgressMonitor = (taskId: number) => {
  selectedTaskId.value = taskId
  progressMonitorVisible.value = true
}

/** 处理任务重试 */
const handleRetry = (task: ImportTaskRespVO) => {
  selectedTask.value = task
  retryDialogVisible.value = true
}

/** 从监控页面重试 */
const handleRetryFromMonitor = (taskId: number) => {
  const task = taskList.value.find(t => t.id === taskId)
  if (task) {
    handleRetry(task)
  }
}

/** 重试确认 */
const handleRetryConfirm = async (params: any) => {
  try {
    const result = await DrugBatchImportApi.retryImportTask(params)

    ElNotification({
      type: 'success',
      title: '重试任务已启动',
      message: `批次编号：${result.retryBatchNo}`,
      duration: 3000
    })

    // 刷新列表
    loadTaskList()

    // 自动打开进度监控
    selectedTaskId.value = params.taskId
    progressMonitorVisible.value = true

  } catch (error) {
    ElMessage.error('重试任务失败')
  }
}

/** 取消任务 */
const handleCancel = async (task: ImportTaskRespVO) => {
  try {
    await ElMessageBox.confirm(
      `确认取消任务"${task.taskName}"？取消后将无法恢复。`,
      '确认取消',
      { type: 'warning' }
    )

    await DrugBatchImportApi.cancelTask(task.id)
    ElMessage.success('任务已取消')
    loadTaskList()

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('取消任务失败')
    }
  }
}

/** 更多操作处理 */
const handleMoreAction = async (command: string, task: ImportTaskRespVO) => {
  switch (command) {
    case 'detail':
      selectedTaskId.value = task.id
      taskDetailVisible.value = true
      break

    case 'download':
      try {
        // 实现下载报告逻辑
        ElMessage.success('报告下载已开始')
      } catch (error) {
        ElMessage.error('下载报告失败')
      }
      break

    case 'delete':
      await handleDeleteTask(task)
      break
  }
}

/** 删除任务 */
const handleDeleteTask = async (task: ImportTaskRespVO) => {
  try {
    await ElMessageBox.confirm(
      `确认删除任务"${task.taskName}"？删除后将无法恢复。`,
      '确认删除',
      {
        type: 'error',
        confirmButtonText: '确认删除',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // 这里需要实现删除API
    // await DrugBatchImportApi.deleteTask(task.id)

    ElMessage.success('任务已删除')
    loadTaskList()

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除任务失败')
    }
  }
}

/** 下载模板 */
const downloadTemplate = async () => {
  try {
    await DrugBatchImportApi.downloadTemplate('STANDARD')
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败')
  }
}

// ========================= 工具方法 =========================

/** 获取状态标签类型 */
const getStatusTagType = (status: number) => {
  const typeMap = {
    [TASK_STATUS.PENDING]: 'info',
    [TASK_STATUS.EXTRACTING]: 'warning',
    [TASK_STATUS.IMPORTING]: 'warning',
    [TASK_STATUS.QC_CHECKING]: 'warning',
    [TASK_STATUS.COMPLETED]: 'success',
    [TASK_STATUS.FAILED]: 'danger',
    [TASK_STATUS.PARTIAL_SUCCESS]: 'primary',
    [TASK_STATUS.CANCELLED]: 'info'
  }
  return typeMap[status] || 'info'
}

/** 获取进度条状态 */
const getProgressStatus = (status: number) => {
  if (status === TASK_STATUS.COMPLETED) return 'success'
  if (status === TASK_STATUS.FAILED) return 'exception'
  return undefined
}

/** 格式化数字 */
const formatNumber = (num: number) => {
  if (!num) return '0'
  return num.toLocaleString()
}

/** 格式化持续时间 */
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  return `${Math.floor(seconds / 3600)}h`
}
</script>

<style scoped>
.drug-import-container {
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

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .drug-import-container {
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

:deep(.el-table .el-table__expand-icon) {
  color: #409eff;
}

:deep(.el-table .el-table__expanded-cell) {
  background-color: #f8f9fa;
  padding: 20px;
}

/* 进度条样式 */
:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
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
