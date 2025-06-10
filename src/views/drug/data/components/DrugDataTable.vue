<template>
  <div class="drug-data-table">
    <!-- 搜索栏 -->
    <el-card class="search-card" shadow="never">
      <el-form
        ref="queryFormRef"
        :model="queryParams"
        :inline="true"
        label-width="100px"
      >
        <slot name="search-items">
          <!-- 默认搜索项 -->
          <el-form-item label="任务编号" prop="taskNo">
            <el-input
              v-model="queryParams.taskNo"
              placeholder="请输入任务编号"
              clearable
              style="width: 200px"
            />
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
        </slot>

        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-header">
          <span class="table-title">{{ tableTitle }}</span>
          <div class="table-actions">
            <slot name="table-actions">
              <el-button size="small" @click="handleRefresh">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </slot>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <!-- 动态列 -->
        <el-table-column
          v-for="column in columns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :formatter="column.formatter"
          :show-overflow-tooltip="true"
        >
          <template v-if="column.slot" #default="scope">
            <slot :name="column.slot" :row="scope.row" :column="column" ></slot>
          </template>
        </el-table-column>

        <!-- 质控状态列 -->
        <el-table-column
          prop="qcStatus"
          label="质控状态"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="getQcStatusType(row.qcStatus)"
              size="small"
            >
              {{ getQcStatusText(row.qcStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column
          label="操作"
          width="150"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="showQc"
              type="warning"
              link
              size="small"
              @click="handleQc(row)"
            >
              质控
            </el-button>
            <slot name="actions" :row="row" ></slot>
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="detailTitle"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item
          v-for="field in detailFields"
          :key="field.prop"
          :label="field.label"
          :span="field.span || 1"
        >
          <template v-if="field.slot">
            <slot :name="`detail-${field.slot}`" :value="detailData[field.prop]" ></slot>
          </template>
          <template v-else>
            {{ formatValue(detailData[field.prop], field) }}
          </template>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'

/** 组件属性 */
interface Props {
  tableTitle: string
  columns: TableColumn[]
  detailFields?: DetailField[]
  apiModule: string
  showQc?: boolean
}

interface TableColumn {
  prop: string
  label: string
  width?: number
  minWidth?: number
  formatter?: Function
  slot?: string
}

interface DetailField {
  prop: string
  label: string
  span?: number
  formatter?: Function
  slot?: string
}

const props = withDefaults(defineProps<Props>(), {
  showQc: true,
  detailFields: () => []
})

const emit = defineEmits<{
  query: [params: any]
  view: [row: any]
  qc: [row: any]
  export: [params: any]
}>()

// 响应式数据
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const detailVisible = ref(false)
const detailData = ref({})

const queryFormRef = ref()
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  taskNo: undefined,
  createTime: undefined
})

// 计算属性
const detailTitle = computed(() => `${props.tableTitle}详情`)

// 方法
const handleQuery = () => {
  queryParams.pageNo = 1
  loadData()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

const loadData = async () => {
  loading.value = true
  try {
    emit('query', queryParams)
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadData()
}

const handleExport = () => {
  emit('export', queryParams)
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const handleView = (row: any) => {
  detailData.value = row
  detailVisible.value = true
  emit('view', row)
}

const handleQc = (row: any) => {
  emit('qc', row)
}

// 质控状态
const getQcStatusType = (status: number) => {
  const types = ['info', 'success', 'danger']
  return types[status] || 'info'
}

const getQcStatusText = (status: number) => {
  const texts = ['未质控', '质控通过', '质控失败']
  return texts[status] || '未知'
}

// 格式化值
const formatValue = (value: any, field: DetailField) => {
  if (field.formatter) {
    return field.formatter(value)
  }
  return value ?? '-'
}

// 暴露方法
defineExpose({
  loadData,
  selectedRows
})
</script>

<style scoped>
.drug-data-table {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-card {
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 20px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 600;
}
</style>
