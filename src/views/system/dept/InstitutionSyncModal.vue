<template>
  <Dialog v-model="dialogVisible" title="从机构标准库同步" width="1200px">
    <div class="sync-modal">
      <!-- 搜索栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="100px"
      >
        <el-form-item label="机构名称" prop="institutionName">
          <el-input
            v-model="queryParams.institutionName"
            placeholder="请输入机构名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="机构类别" prop="institutionCategory">
          <el-select
            v-model="queryParams.institutionCategory"
            placeholder="请选择机构类别"
            clearable
            class="!w-240px"
          >
            <el-option
              v-for="dict in getDictOptions(DICT_TYPE.INSTITUTION_CATEGORY)"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" /> 搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" /> 重置
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="info" @click="handleSelectAllData" :disabled="total === 0">
            <Icon icon="ep:select" class="mr-5px" /> 全选
          </el-button>
          <el-button type="warning" @click="handleClearSelection" :disabled="!hasSelectedData">
            <Icon icon="ep:circle-close" class="mr-5px" /> 清空
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 同步选项配置 -->
      <div class="sync-options-panel">
        <div class="options-row">
          <div class="sync-type-section">
            <span class="label">同步类型：</span>
            <el-radio-group v-model="syncOptions.syncType" size="small">
              <el-radio-button value="institution">仅机构</el-radio-button>
              <el-radio-button value="user">仅用户</el-radio-button>
              <el-radio-button value="both">机构+用户</el-radio-button>
            </el-radio-group>
          </div>
          <div v-if="syncOptions.syncType !== 'institution'" class="user-options-section">
            <span class="label">用户选项：</span>
            <el-checkbox v-model="syncOptions.includeDirector" size="small">包含负责人</el-checkbox>
            <el-checkbox v-model="syncOptions.includeContact" size="small">包含联系人</el-checkbox>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="list"
        border
        @selection-change="handleSelectionChange"
        @select-all="handleSelectCurrentPage"
        ref="tableRef"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="institutionName" label="机构名称" min-width="200" />
        <el-table-column prop="orgId" label="机构唯一编码" width="140" />
        <el-table-column prop="institutionCategoryName" label="机构类别" width="120">
          <template #default="scope">
            {{ getDictLabel(DICT_TYPE.INSTITUTION_CATEGORY, scope.row.institutionCategoryName) || scope.row.institutionCategoryName }}
          </template>
        </el-table-column>
        <el-table-column prop="adminDivisionName" label="行政区划" width="120" />
        <el-table-column prop="director" label="负责人" width="100" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系方式" width="120" />
        <el-table-column prop="socialCreditCode" label="统一社会信用代码" min-width="150" />
        <el-table-column prop="institutionLevel" label="医院等级" width="100">
          <template #default="scope">
            {{ getDictLabel(DICT_TYPE.INSTITUTION_LEVEL, scope.row.hospitalLevelClass) || scope.row.hospitalLevelClass }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status === 1 ? 0 : 1" />
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
    </div>
    
    <template #footer>
      <div class="flex justify-between items-center w-full">
        <div class="selection-info">
          <span>已选择 {{ getSelectedCountText() }} 条记录</span>
          <span v-if="allDataSelectedByButton" class="text-primary ml-2">(已选择全部数据)</span>
        </div>
        <div class="action-buttons">
          <el-button 
            type="primary" 
            @click="handleSyncAction" 
            :disabled="!hasSelectedData">
            {{ getSyncButtonText() }}
          </el-button>
          <el-button @click="dialogVisible = false">取消</el-button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { DICT_TYPE, getDictLabel } from '@/utils/dict'
import { useDictStoreWithOut } from '@/store/modules/dict'
import * as InstitutionStandardApi from '@/api/drug/standardlibrary/institution'
import { DeptExtApi } from '@/api/system/dept/deptext'

defineOptions({ name: 'InstitutionSyncModal' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据
const total = ref(0) // 列表的总页数
const selectedRows = ref([]) // 选中的行
const tableRef = ref() // 表格引用
const allDataSelected = ref(false) // 是否已全选所有数据
const allDataSelectedByButton = ref(false) // 是否通过全选按钮选择了全部数据
const syncOptions = ref({
  syncType: 'institution', // 'institution' | 'user' | 'both'
  includeDirector: true,
  includeContact: true
})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  institutionName: undefined,
  institutionCategory: undefined,
  status: 1 // 只查询启用状态的机构
})
const queryFormRef = ref() // 搜索的表单

/** 查询机构标准库列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await InstitutionStandardApi.InstitutionStandardApi.getInstitutionStandardPage(queryParams)
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
  queryParams.pageNo = 1
  queryParams.institutionName = undefined
  queryParams.institutionCategory = undefined
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 多选框选中数据 */
const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
  // 如果取消了选择，重置全选状态
  if (selection.length === 0) {
    allDataSelected.value = false
    allDataSelectedByButton.value = false
  }
}

/** 全选当前页（表格头部选择框） */
const handleSelectCurrentPage = (selection: any[]) => {
  selectedRows.value = selection
  // 当前页全选不算全数据选择
  allDataSelectedByButton.value = false
}

/** 全选所有数据（按钮） - 优化版本，只做前端标识 */
const handleSelectAllData = () => {
  // 标识已选择全部数据，但不实际加载
  allDataSelectedByButton.value = true
  allDataSelected.value = true
  // 保持当前页选中状态
  if (tableRef.value) {
    tableRef.value.toggleAllSelection()
  }
  message.success(`已选择全部 ${total.value} 条数据`)
}

/** 清空选择 */
const handleClearSelection = () => {
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
  selectedRows.value = []
  allDataSelected.value = false
  allDataSelectedByButton.value = false
}

/** 获取字典选项 */
const getDictOptions = (dictType: string) => {
  return dictStore.getDictByType(dictType) || []
}

const dictStore = useDictStoreWithOut()

/** 计算属性：是否有选择的数据 */
const hasSelectedData = computed(() => {
  return selectedRows.value.length > 0 || allDataSelectedByButton.value
})

/** 计算属性：获取选择数量显示文本 */
const getSelectedCountText = () => {
  if (allDataSelectedByButton.value) {
    return total.value
  }
  return selectedRows.value.length
}

/** 计算属性：获取同步按钮文本 */
const getSyncButtonText = () => {
  const typeMap = {
    institution: '同步机构',
    user: '同步用户',
    both: '同步机构+用户'
  }
  return typeMap[syncOptions.value.syncType]
}

/** 统一的同步操作 */
const handleSyncAction = async () => {
  if (!hasSelectedData.value) {
    message.warning('请选择要同步的数据')
    return
  }

  const syncType = syncOptions.value.syncType
  let confirmText = ''
  
  if (allDataSelectedByButton.value) {
    confirmText = `确认${getSyncButtonText()}全部 ${total.value} 条数据？`
  } else {
    confirmText = `确认${getSyncButtonText()}选中的 ${selectedRows.value.length} 条数据？`
  }

  try {
    await message.confirm(confirmText)
    
    if (syncType === 'institution') {
      await handleSyncInstitutions()
    } else if (syncType === 'user') {
      await handleSyncUsers()
    } else if (syncType === 'both') {
      await handleSyncBoth()
    }
  } catch (error) {
    console.error('同步操作失败:', error)
    message.error('同步操作失败')
  }
}

/** 同步机构 */
const handleSyncInstitutions = async () => {
  let syncData
  
  if (allDataSelectedByButton.value) {
    // 全选情况下，传递查询条件让后端处理
    syncData = {
      selectAll: true,
      queryParams: {
        institutionName: queryParams.institutionName,
        institutionCategory: queryParams.institutionCategory,
        status: queryParams.status
      }
    }
  } else {
    // 部分选择，传递具体数据
    syncData = {
      selectAll: false,
      institutions: selectedRows.value.map(row => ({
        orgId: row.orgId,
        institutionName: row.institutionName,
        institutionCategory: row.institutionCategory,
        adminDivisionCode: row.adminDivisionCode,
        socialCreditCode: row.socialCreditCode,
        institutionLevel: row.institutionLevel
      }))
    }
  }
  
  const result = await DeptExtApi.syncInstitutions(syncData)
  message.success(`成功同步 ${result.syncCount} 条机构记录`)
  
  dialogVisible.value = false
  emit('success')
}

/** 同步用户 */
const handleSyncUsers = async () => {
  let syncData
  
  if (allDataSelectedByButton.value) {
    // 全选情况下，传递查询条件让后端处理
    syncData = {
      selectAll: true,
      queryParams: {
        institutionName: queryParams.institutionName,
        institutionCategory: queryParams.institutionCategory,
        status: queryParams.status
      },
      options: {
        includeDirector: syncOptions.value.includeDirector,
        includeContact: syncOptions.value.includeContact
      }
    }
  } else {
    // 部分选择，传递具体数据
    syncData = {
      selectAll: false,
      institutions: selectedRows.value.map(row => ({
        orgId: row.orgId,
        institutionName: row.institutionName,
        director: row.director,
        contactPerson: row.contactPerson,
        contactPhone: row.contactPhone
      })),
      options: {
        includeDirector: syncOptions.value.includeDirector,
        includeContact: syncOptions.value.includeContact
      }
    }
  }
  
  const result = await DeptExtApi.syncUsers(syncData)
  message.success(`成功同步 ${result.userCount} 个用户`)
  
  dialogVisible.value = false
  emit('success')
}

/** 同步机构+用户 */
const handleSyncBoth = async () => {
  let syncData
  
  if (allDataSelectedByButton.value) {
    // 全选情况下，传递查询条件让后端处理
    syncData = {
      selectAll: true,
      queryParams: {
        institutionName: queryParams.institutionName,
        institutionCategory: queryParams.institutionCategory,
        status: queryParams.status
      },
      options: {
        includeDirector: syncOptions.value.includeDirector,
        includeContact: syncOptions.value.includeContact
      }
    }
  } else {
    // 部分选择，传递具体数据
    syncData = {
      selectAll: false,
      institutions: selectedRows.value.map(row => ({
        orgId: row.orgId,
        institutionName: row.institutionName,
        institutionCategory: row.institutionCategory,
        adminDivisionCode: row.adminDivisionCode,
        socialCreditCode: row.socialCreditCode,
        institutionLevel: row.institutionLevel,
        director: row.director,
        contactPerson: row.contactPerson,
        contactPhone: row.contactPhone
      })),
      options: {
        includeDirector: syncOptions.value.includeDirector,
        includeContact: syncOptions.value.includeContact
      }
    }
  }
  
  const result = await DeptExtApi.syncInstitutionsAndUsers(syncData)
  message.success(`成功同步 ${result.institutionCount} 条机构记录和 ${result.userCount} 个用户`)
  
  dialogVisible.value = false
  emit('success')
}

/** 打开弹窗 */
const open = () => {
  dialogVisible.value = true
  selectedRows.value = []
  allDataSelected.value = false
  allDataSelectedByButton.value = false
  syncOptions.value = {
    syncType: 'institution',
    includeDirector: true,
    includeContact: true
  }
  resetQuery()
}

defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 定义事件 */
const emit = defineEmits(['success'])
</script>

<style scoped>
.sync-modal {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.sync-modal .el-table {
  flex: 1;
  margin: 16px 0;
}

.sync-options-panel {
  margin: 12px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.options-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.sync-type-section,
.user-options-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.selection-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .options-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .sync-type-section,
  .user-options-section {
    width: 100%;
  }
}
</style>
