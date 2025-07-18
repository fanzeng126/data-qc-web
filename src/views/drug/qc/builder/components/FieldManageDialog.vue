<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible" width="1200px" :close-on-click-modal="false">
    <div class="field-manage-container">
      <!-- 表信息展示 -->
      <div class="table-info mb-4">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="表名">{{ currentTable?.tableName }}</el-descriptions-item>
          <el-descriptions-item label="中文名称">{{
            currentTable?.chineseName
          }}</el-descriptions-item>
          <el-descriptions-item label="同步来源">
            <el-tag :type="currentTable?.syncSource === 1 ? 'success' : 'info'" size="small">
              {{ currentTable?.syncSource === 1 ? '导入模板' : '数据库表' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="字段数量">
            <el-badge :value="fieldList.length" type="primary" />
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 搜索和操作栏 -->
      <div class="field-toolbar mb-4">
        <el-form :model="queryParams" :inline="true">
          <el-form-item label="字段名" prop="fieldName">
            <el-input
              v-model="queryParams.fieldName"
              placeholder="请输入字段名"
              clearable
              @keyup.enter="handleQuery"
              class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="中文名称" prop="chineseName">
            <el-input
              v-model="queryParams.chineseName"
              placeholder="请输入中文名称"
              clearable
              @keyup.enter="handleQuery"
              class="!w-200px"
            />
          </el-form-item>
          <el-form-item label="数据类型" prop="dataType">
            <el-select
              v-model="queryParams.dataType"
              placeholder="请选择数据类型"
              clearable
              class="!w-150px"
            >
              <el-option label="VARCHAR" value="VARCHAR" />
              <el-option label="INT" value="INT" />
              <el-option label="BIGINT" value="BIGINT" />
              <el-option label="DECIMAL" value="DECIMAL" />
              <el-option label="DATE" value="DATE" />
              <el-option label="DATETIME" value="DATETIME" />
              <el-option label="TEXT" value="TEXT" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否必填" prop="isRequired">
            <el-select
              v-model="queryParams.isRequired"
              placeholder="请选择"
              clearable
              class="!w-120px"
            >
              <el-option label="必填" :value="1" />
              <el-option label="非必填" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button @click="handleQuery">
              <Icon icon="ep:search" class="mr-5px" /> 搜索
            </el-button>
            <el-button @click="resetQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 重置
            </el-button>
            <el-button type="primary" @click="openFieldForm('create')">
              <Icon icon="ep:plus" class="mr-5px" /> 新增字段
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 字段列表 -->
      <div class="field-list">
        <el-table
          v-loading="loading"
          :data="fieldList"
          :stripe="true"
          :show-overflow-tooltip="true"
          height="400"
        >
          <el-table-column label="字段ID" align="center" prop="id" width="80" />
          <el-table-column label="字段名" align="center" prop="fieldName" width="150" />
          <el-table-column label="中文名称" align="center" prop="chineseName" width="150" />
          <el-table-column label="数据类型" align="center" prop="dataType" width="100">
            <template #default="scope">
              <el-tag size="small" :type="getDataTypeColor(scope.row.dataType)">
                {{ scope.row.dataType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最大长度" align="center" prop="maxLength" width="90" />
          <el-table-column label="是否可空" align="center" prop="isNullable" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.isNullable === 1 ? 'info' : 'warning'" size="small">
                {{ scope.row.isNullable === 1 ? '可空' : '不可空' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="是否主键" align="center" prop="isPrimaryKey" width="90">
            <template #default="scope">
              <el-tag v-if="scope.row.isPrimaryKey === 1" type="danger" size="small">主键</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="是否必填" align="center" prop="isRequired" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.isRequired === 1 ? 'danger' : 'info'" size="small">
                {{ scope.row.isRequired === 1 ? '必填' : '非必填' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="默认值"
            align="center"
            prop="defaultValue"
            width="100"
            show-overflow-tooltip
          />
          <el-table-column
            label="字段说明"
            align="center"
            prop="fieldComment"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column
            label="业务含义"
            align="center"
            prop="businessMeaning"
            min-width="150"
            show-overflow-tooltip
          />
          <el-table-column label="排序" align="center" prop="sortOrder" width="70" />
          <el-table-column label="是否启用" align="center" prop="isActive" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.isActive === 1 ? 'success' : 'danger'" size="small">
                {{ scope.row.isActive === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            label="创建时间"
            align="center"
            prop="createTime"
            :formatter="dateFormatter"
            width="160px"
          />
          <el-table-column label="操作" align="center" width="150" fixed="right">
            <template #default="scope">
              <el-button link type="primary" @click="openFieldForm('update', scope.row.id)">
                编辑
              </el-button>
              <el-button link type="danger" @click="handleDeleteField(scope.row.id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页组件 -->
        <div class="pagination-container mt-4">
          <Pagination
            v-model:limit="queryParams.pageSize"
            v-model:page="queryParams.pageNo"
            :total="total"
            @pagination="loadFieldList"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="handleRefresh">
        <Icon icon="ep:refresh" class="mr-1" />
        刷新字段列表
      </el-button>
    </template>
  </Dialog>

  <!-- 字段表单弹窗 -->
  <FieldForm ref="fieldFormRef" @success="loadFieldList" :tableId="currentTable?.id" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import {
  QcBuilderFieldMetadataApi,
  QcBuilderFieldMetadataVO,
  QcBuilderTableMetadataVO
} from '@/api/drug/qc/builder'
import FieldForm from './FieldForm.vue'

defineOptions({ name: 'FieldManageDialog' })

const message = useMessage()
const { t } = useI18n()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const loading = ref(false)
const currentTable = ref<QcBuilderTableMetadataVO | null>(null)
const fieldList = ref<QcBuilderFieldMetadataVO[]>([])
const total = ref(0)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  fieldName: '',
  chineseName: '',
  dataType: '',
  isRequired: undefined,
  tableId: undefined
})

// 移除前端过滤的计算属性，改为后端分页查询

// 获取数据类型颜色
const getDataTypeColor = (dataType: string) => {
  const colorMap: Record<string, string> = {
    VARCHAR: 'primary',
    TEXT: 'primary',
    INT: 'success',
    BIGINT: 'success',
    DECIMAL: 'warning',
    DATE: 'info',
    DATETIME: 'info'
  }
  return colorMap[dataType] || ''
}

// 加载字段列表
const loadFieldList = async () => {
  if (!currentTable.value?.id) return

  loading.value = true
  try {
    queryParams.tableId = currentTable.value.id
    const data = await QcBuilderFieldMetadataApi.getQcBuilderFieldMetadataPage(queryParams)
    fieldList.value = data.list || []
    total.value = data.total || 0
  } catch (error) {
    message.error('加载字段列表失败')
    console.error('加载字段列表失败：', error)
  } finally {
    loading.value = false
  }
}

// 搜索按钮操作
const handleQuery = () => {
  queryParams.pageNo = 1 // 重置为第一页
  loadFieldList()
}

// 重置按钮操作
const resetQuery = () => {
  queryParams.pageNo = 1
  queryParams.fieldName = ''
  queryParams.chineseName = ''
  queryParams.dataType = ''
  queryParams.isRequired = undefined
  loadFieldList()
}

// 刷新操作
const handleRefresh = () => {
  loadFieldList()
}

// 打开字段表单
const fieldFormRef = ref()
const openFieldForm = (type: string, id?: number) => {
  fieldFormRef.value.open(type, id)
}

// 删除字段
const handleDeleteField = async (id: number) => {
  try {
    await message.delConfirm()
    await QcBuilderFieldMetadataApi.deleteQcBuilderFieldMetadata(id)
    message.success('删除成功')
    await loadFieldList()
  } catch {}
}

// 打开对话框
const open = (table: QcBuilderTableMetadataVO) => {
  currentTable.value = table
  dialogTitle.value = `字段管理 - ${table.chineseName} (${table.tableName})`
  dialogVisible.value = true
  
  // 重置查询参数
  queryParams.pageNo = 1
  queryParams.pageSize = 20
  queryParams.fieldName = ''
  queryParams.chineseName = ''
  queryParams.dataType = ''
  queryParams.isRequired = undefined
  queryParams.tableId = table.id
  
  loadFieldList()
}

defineExpose({ open })
</script>

<style scoped>
.field-manage-container {
  min-height: 600px;
}

.table-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
}

.field-toolbar {
  background: #ffffff;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.field-list {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
}
</style>
