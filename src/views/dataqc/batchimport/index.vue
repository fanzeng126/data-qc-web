<template>
  <ContentWrap>
    <!-- 搜索区域 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="任务编号" prop="taskNo">
        <el-input
          v-model="queryParams.taskNo"
          placeholder="请输入任务编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="任务名称" prop="taskName">
        <el-input
          v-model="queryParams.taskName"
          placeholder="请输入任务名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="文件名" prop="fileName">
        <el-input
          v-model="queryParams.fileName"
          placeholder="请输入文件名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择任务状态"
          clearable
          class="!w-240px"
        >
          <el-option label="待处理" :value="0" />
          <el-option label="处理中" :value="1" />
          <el-option label="成功" :value="2" />
          <el-option label="失败" :value="3" />
          <el-option label="部分成功" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="datetimerange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" />搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" />重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openUploadForm"
          v-hasPermi="['dataqc:batch-import:upload']"
        >
          <Icon icon="ep:upload" /> 批量导入
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['dataqc:batch-import:export']"
        >
          <Icon icon="ep:download" />导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="任务编号" align="center" prop="taskNo" width="160" />
      <el-table-column
        label="任务名称"
        align="center"
        prop="taskName"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="文件名"
        align="center"
        prop="fileName"
        :show-overflow-tooltip="true"
      />
      <el-table-column label="状态" align="center" width="100">
        <template #default="scope">
          <el-tag
            :type="getStatusTagType(scope.row.status)"
            disable-transitions
          >
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="文件统计" align="center" width="120">
        <template #default="scope">
          <div class="flex flex-col text-xs">
            <span>总数: {{ scope.row.totalFiles || 0 }}</span>
            <span class="text-green-600">成功: {{ scope.row.successFiles || 0 }}</span>
            <span class="text-red-600">失败: {{ scope.row.failFiles || 0 }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="进度" align="center" width="100">
        <template #default="scope">
          <el-progress
            :percentage="calculateProgress(scope.row)"
            :stroke-width="6"
            :show-text="false"
          />
          <div class="text-xs text-gray-500 mt-1">
            {{ calculateProgress(scope.row) }}%
          </div>
        </template>
      </el-table-column>
      <el-table-column label="耗时" align="center" width="100">
        <template #default="scope">
          <span v-if="scope.row.startTime && scope.row.endTime">
            {{ calculateDuration(scope.row.startTime, scope.row.endTime) }}
          </span>
          <span v-else-if="scope.row.startTime && scope.row.status === 1" class="text-blue-600">
            进行中...
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="200" fixed="right">
        <template #default="scope">
          <div class="flex items-center justify-center gap-2">
            <el-button
              type="primary"
              link
              @click="openDetailDialog(scope.row)"
              v-hasPermi="['dataqc:batch-import:query']"
            >
              <Icon icon="ep:view" />详情
            </el-button>
            <el-button
              type="info"
              link
              @click="openProgressDialog(scope.row)"
              v-if="scope.row.status === 1"
              v-hasPermi="['dataqc:batch-import:query']"
            >
              <Icon icon="ep:data-line" />进度
            </el-button>
            <el-dropdown
              @command="(command) => handleCommand(command, scope.row)"
              v-hasPermi="['dataqc:batch-import:retry', 'dataqc:batch-import:cancel', 'dataqc:batch-import:delete']"
            >
              <el-button type="primary" link>
                <Icon icon="ep:d-arrow-right" /> 更多
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="handleRetry"
                    v-if="scope.row.status === 3 || scope.row.status === 4"
                    :disabled="!checkPermi(['dataqc:batch-import:retry'])"
                  >
                    <Icon icon="ep:refresh" />重试失败文件
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="handleCancel"
                    v-if="scope.row.status === 1"
                    :disabled="!checkPermi(['dataqc:batch-import:cancel'])"
                  >
                    <Icon icon="ep:close" />取消任务
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="handleDelete"
                    v-if="scope.row.status >= 2"
                    :disabled="!checkPermi(['dataqc:batch-import:delete'])"
                  >
                    <Icon icon="ep:delete" />删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 上传文件对话框 -->
  <BatchImportUploadForm ref="uploadFormRef" @success="getList" />

  <!-- 任务详情对话框 -->
  <BatchImportDetailDialog ref="detailDialogRef" />

  <!-- 进度查看对话框 -->
  <BatchImportProgressDialog ref="progressDialogRef" />
</template>

<script lang="ts" setup>
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as BatchImportApi from '@/api/dataqc/batchImport'
import BatchImportUploadForm from './BatchImportUploadForm.vue'
import BatchImportDetailDialog from './BatchImportDetailAndProgress.vue'
import BatchImportProgressDialog from './BatchImportDetailAndProgress.vue'

defineOptions({ name: 'DataqcBatchImport' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskNo: undefined,
  taskName: undefined,
  fileName: undefined,
  status: undefined,
  createTime: []
})
const queryFormRef = ref()
const exportLoading = ref(false)

// 组件引用
const uploadFormRef = ref()
const detailDialogRef = ref()
const progressDialogRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await BatchImportApi.getBatchImportTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 打开上传表单 */
const openUploadForm = () => {
  uploadFormRef.value.open()
}

/** 打开详情对话框 */
const openDetailDialog = (row) => {
  detailDialogRef.value.open(row)
}

/** 打开进度对话框 */
const openProgressDialog = (row) => {
  progressDialogRef.value.open(row.id)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await BatchImportApi.exportBatchImportTask(queryParams)
    download.excel(data, '批量导入任务数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 操作分发 */
const handleCommand = (command: string, row) => {
  switch (command) {
    case 'handleRetry':
      handleRetry(row)
      break
    case 'handleCancel':
      handleCancel(row)
      break
    case 'handleDelete':
      handleDelete(row.id)
      break
  }
}

/** 重试失败文件 */
const handleRetry = async (row) => {
  try {
    await message.confirm('确认要重试导入失败的文件吗？')
    await BatchImportApi.retryBatchImport(row.id)
    message.success('重试任务已提交，请稍后查看结果')
    await getList()
  } catch {}
}

/** 取消任务 */
const handleCancel = async (row) => {
  try {
    await message.confirm('确认要取消该导入任务吗？')
    await BatchImportApi.cancelBatchImport(row.id)
    message.success('任务已取消')
    await getList()
  } catch {}
}

/** 删除任务 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await BatchImportApi.deleteBatchImportTask(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 获取状态标签类型 */
const getStatusTagType = (status: number) => {
  const typeMap = {
    0: 'info',    // 待处理
    1: 'warning', // 处理中
    2: 'success', // 成功
    3: 'danger',  // 失败
    4: 'primary'  // 部分成功
  }
  return typeMap[status] || 'info'
}

/** 获取状态文本 */
const getStatusText = (status: number) => {
  const textMap = {
    0: '待处理',
    1: '处理中',
    2: '成功',
    3: '失败',
    4: '部分成功'
  }
  return textMap[status] || '未知'
}

/** 计算进度百分比 */
const calculateProgress = (row) => {
  if (!row.totalFiles || row.totalFiles === 0) return 0
  const processed = (row.successFiles || 0) + (row.failFiles || 0)
  return Math.round((processed / row.totalFiles) * 100)
}

/** 计算耗时 */
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-'
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const duration = Math.round((end - start) / 1000) // 转换为秒

  if (duration < 60) return `${duration}秒`
  if (duration < 3600) return `${Math.round(duration / 60)}分钟`
  return `${Math.round(duration / 3600)}小时`
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style scoped>
:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}
</style>
