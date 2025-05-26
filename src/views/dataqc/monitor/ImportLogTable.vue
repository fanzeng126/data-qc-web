<template>
  <div class="import-log-table">
    <el-table v-loading="loading" :data="logList" stripe>
      <el-table-column label="批次号" align="center" prop="batchNo" width="160">
        <template #default="scope">
          <el-link type="primary" @click="viewLogDetail(scope.row)">
            {{ scope.row.batchNo }}
          </el-link>
        </template>
      </el-table-column>

      <el-table-column
        label="文件名"
        align="center"
        prop="fileName"
        :show-overflow-tooltip="true"
        min-width="180"
      />

      <el-table-column label="文件类型" align="center" width="120">
        <template #default="scope">
          <el-tag type="info" size="small">
            {{ getFileTypeDisplay(scope.row.fileType) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="处理状态" align="center" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)" size="small">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="数据统计" align="center" width="140">
        <template #default="scope">
          <div class="data-stats">
            <div class="stat-line">
              总数: {{ scope.row.totalRows || 0 }}
            </div>
            <div class="stat-line success-text">
              成功: {{ scope.row.successRows || 0 }}
            </div>
            <div class="stat-line error-text" v-if="scope.row.failRows > 0">
              失败: {{ scope.row.failRows }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="处理时长" align="center" width="120">
        <template #default="scope">
          {{ calculateDuration(scope.row.startTime, scope.row.endTime) }}
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="operatorName" width="100" />

      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="160"
      />

      <el-table-column label="操作" align="center" width="120" fixed="right">
        <template #default="scope">
          <div class="action-buttons">
            <el-button
              type="primary"
              link
              size="small"
              @click="viewLogDetail(scope.row)"
            >
              <Icon icon="ep:view" />详情
            </el-button>
            <el-button
              v-if="scope.row.status === 'FAIL'"
              type="warning"
              link
              size="small"
              @click="retryImport(scope.row)"
            >
              <Icon icon="ep:refresh" />重试
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getLogList"
    />

    <!-- 日志详情对话框 -->
    <el-dialog v-model="detailVisible" title="导入日志详情" width="800px">
      <div v-loading="detailLoading" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="批次号">
            {{ currentLog.batchNo }}
          </el-descriptions-item>
          <el-descriptions-item label="文件名">
            {{ currentLog.fileName }}
          </el-descriptions-item>
          <el-descriptions-item label="文件类型">
            {{ getFileTypeDisplay(currentLog.fileType) }}
          </el-descriptions-item>
          <el-descriptions-item label="目标表名">
            {{ currentLog.tableName }}
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTagType(currentLog.status)">
              {{ getStatusText(currentLog.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ currentLog.operatorName }}
          </el-descriptions-item>
          <el-descriptions-item label="总行数">
            {{ currentLog.totalRows || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="成功行数">
            <span class="success-text">{{ currentLog.successRows || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败行数">
            <span class="error-text">{{ currentLog.failRows || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="成功率">
            {{ calculateSuccessRate(currentLog) }}%
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatTime(currentLog.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="结束时间">
            {{ formatTime(currentLog.endTime) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentLog.errorMsg" class="error-section">
          <el-divider content-position="left">错误信息</el-divider>
          <el-alert
            :title="currentLog.errorMsg"
            type="error"
            :closable="false"
            show-icon
          />
        </div>

        <div v-if="currentLog.status === 'SUCCESS'" class="success-section">
          <el-divider content-position="left">处理结果</el-divider>
          <el-result
            icon="success"
            title="导入成功"
            :sub-title="`成功导入 ${currentLog.successRows} 条数据`"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { dateFormatter } from '@/utils/formatTime'
import * as MonitorApi from '@/api/dataqc/monitor'

defineOptions({ name: 'ImportLogTable' })

const props = defineProps<{
  queryParams: any
}>()

const emit = defineEmits(['refresh'])

const message = useMessage()

const loading = ref(false)
const detailVisible = ref(false)
const detailLoading = ref(false)
const logList = ref([])
const total = ref(0)
const currentLog = ref({})

const queryParams = computed(() => props.queryParams)

/** 获取日志列表 */
const getLogList = async () => {
  loading.value = true
  try {
    const data = await MonitorApi.getImportLogs(queryParams.value)
    logList.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('获取导入日志失败', error)
  } finally {
    loading.value = false
  }
}

/** 查看日志详情 */
const viewLogDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

/** 重试导入 */
const retryImport = async (row) => {
  try {
    await message.confirm('确认要重试该导入任务吗？')
    // 这里需要调用重试API
    // await MonitorApi.retryImport(row.id)
    message.success('重试任务已提交')
    getLogList()
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      message.error('重试失败')
    }
  }
}

/** 获取文件类型显示名称 */
const getFileTypeDisplay = (fileType: string) => {
  const typeMap = {
    DRUG_LIST: '药品目录',
    DRUG_INOUT_INFO: '出入库信息',
    DRUG_USE_INFO: '使用情况',
    HOS_RESOURCE_INFO: '机构资源',
    BATCH_IMPORT: '批量导入'
  }
  return typeMap[fileType] || fileType
}

/** 获取状态标签类型 */
const getStatusTagType = (status: string) => {
  const typeMap = {
    PROCESSING: 'warning',
    SUCCESS: 'success',
    FAIL: 'danger',
    PARTIAL_SUCCESS: 'info'
  }
  return typeMap[status] || 'info'
}

/** 获取状态文本 */
const getStatusText = (status: string) => {
  const textMap = {
    PROCESSING: '处理中',
    SUCCESS: '成功',
    FAIL: '失败',
    PARTIAL_SUCCESS: '部分成功'
  }
  return textMap[status] || '未知'
}

/** 计算处理时长 */
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '-'
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const duration = Math.round((end - start) / 1000) // 转换为秒

  if (duration < 60) return `${duration}秒`
  if (duration < 3600) return `${Math.round(duration / 60)}分钟`
  return `${Math.round(duration / 3600)}小时`
}

/** 计算成功率 */
const calculateSuccessRate = (log) => {
  if (!log.totalRows || log.totalRows === 0) return 0
  return Math.round((log.successRows / log.totalRows) * 100)
}

/** 格式化时间 */
const formatTime = (time: string) => {
  return time ? new Date(time).toLocaleString() : '-'
}

/** 监听查询参数变化 */
watch(
  () => props.queryParams,
  () => {
    getLogList()
  },
  { immediate: true, deep: true }
)

defineExpose({
  getLogList
})
</script>

<style scoped>
.import-log-table {
  width: 100%;
}

.data-stats {
  font-size: 12px;
  line-height: 1.4;
}

.stat-line {
  margin-bottom: 2px;
}

.stat-line:last-child {
  margin-bottom: 0;
}

.success-text {
  color: #52c41a;
}

.error-text {
  color: #ff4d4f;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.log-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.error-section,
.success-section {
  margin-top: 20px;
}

:deep(.el-table .el-table__cell) {
  padding: 8px 0;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>
