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
      <el-form-item label="药品编码" prop="hosDrugId">
        <el-input
          v-model="queryParams.hosDrugId"
          placeholder="请输入院内药品编码"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="药品名称" prop="productName">
        <el-input
          v-model="queryParams.productName"
          placeholder="请输入产品通用名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="生产企业" prop="manufacturer">
        <el-input
          v-model="queryParams.manufacturer"
          placeholder="请输入生产企业"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="基本药物" prop="baseFlag">
        <el-select
          v-model="queryParams.baseFlag"
          placeholder="请选择"
          clearable
          class="!w-240px"
        >
          <el-option label="是" value="1" />
          <el-option label="否" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="集中采购" prop="unityPurchaseFlag">
        <el-select
          v-model="queryParams.unityPurchaseFlag"
          placeholder="请选择"
          clearable
          class="!w-240px"
        >
          <el-option label="是" value="1" />
          <el-option label="否" value="2" />
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
          @click="openForm('create')"
          v-hasPermi="['dataqc:drug-list:create']"
        >
          <Icon icon="ep:plus" /> 新增
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleImport"
          v-hasPermi="['dataqc:drug-list:import']"
        >
          <Icon icon="ep:upload" /> 导入
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['dataqc:drug-list:export']"
        >
          <Icon icon="ep:download" />导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="药品编码" align="center" prop="hosDrugId" width="120" />
      <el-table-column
        label="国家编码"
        align="center"
        prop="ypid"
        width="120"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        label="产品通用名"
        align="center"
        prop="productName"
        :show-overflow-tooltip="true"
        min-width="150"
      />
      <el-table-column
        label="商品名"
        align="center"
        prop="tradeName"
        :show-overflow-tooltip="true"
        width="120"
      />
      <el-table-column
        label="生产企业"
        align="center"
        prop="manufacturer"
        :show-overflow-tooltip="true"
        width="150"
      />
      <el-table-column label="剂型" align="center" prop="drugForm" width="80" />
      <el-table-column label="规格" align="center" prop="drugSpec" width="100" />
      <el-table-column label="包装单位" align="center" prop="packUnit" width="80" />
      <el-table-column label="转换系数" align="center" prop="drugFactor" width="80" />
      <el-table-column label="基本药物" align="center" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.baseFlag === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.baseFlag === '1' ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="集中采购" align="center" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.unityPurchaseFlag === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.unityPurchaseFlag === '1' ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="一致性评价" align="center" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.uniformityFlag === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.uniformityFlag === '1' ? '通过' : '未通过' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180"
      />
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <div class="flex items-center justify-center">
            <el-button
              type="primary"
              link
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['dataqc:drug-list:update']"
            >
              <Icon icon="ep:edit" />修改
            </el-button>
            <el-button
              type="danger"
              link
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['dataqc:drug-list:delete']"
            >
              <Icon icon="ep:delete" />删除
            </el-button>
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

  <!-- 批量操作区域 -->
  <ContentWrap v-if="selectedRows.length > 0">
    <div class="flex items-center justify-between bg-blue-50 px-4 py-3 rounded">
      <span class="text-sm text-blue-700">
        已选择 {{ selectedRows.length }} 条记录
      </span>
      <div class="flex gap-2">
        <el-button
          type="primary"
          size="small"
          @click="handleBatchDelete"
          v-hasPermi="['dataqc:drug-list:delete']"
        >
          <Icon icon="ep:delete" />批量删除
        </el-button>
        <el-button
          size="small"
          @click="clearSelection"
        >
          取消选择
        </el-button>
      </div>
    </div>
  </ContentWrap>

  <!-- 药品表单对话框 -->
  <DrugListForm ref="formRef" @success="getList" />

  <!-- 药品导入对话框 -->
  <DrugListImportForm ref="importFormRef" @success="getList" />
</template>

<script lang="ts" setup>
import { checkPermi } from '@/utils/permission'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import * as DrugListApi from '@/api/dataqc/drugList'
import DrugListForm from './DrugListFormAndImport.vue'
import DrugListImportForm from './DrugListFormAndImport.vue'

defineOptions({ name: 'DataqcDrugList' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const selectedRows = ref([])
const exportLoading = ref(false)

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  hosDrugId: undefined,
  productName: undefined,
  manufacturer: undefined,
  baseFlag: undefined,
  unityPurchaseFlag: undefined,
  createTime: []
})
const queryFormRef = ref()

// 组件引用
const formRef = ref()
const importFormRef = ref()

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DrugListApi.getDrugListPage(queryParams)
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

/** 新增/修改操作 */
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 导入操作 */
const handleImport = () => {
  importFormRef.value.open()
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const data = await DrugListApi.exportDrugList(queryParams)
    download.excel(data, '药品目录数据.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DrugListApi.deleteDrugList(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 批量删除操作 */
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    message.warning('请先选择要删除的记录')
    return
  }

  try {
    await message.delConfirm(`确认删除选中的 ${selectedRows.value.length} 条记录吗？`)
    const ids = selectedRows.value.map(row => row.id)
    await DrugListApi.deleteDrugListBatch(ids)
    message.success('批量删除成功')
    await getList()
    clearSelection()
  } catch {}
}

/** 表格选择变化 */
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

/** 清空选择 */
const clearSelection = () => {
  selectedRows.value = []
  // 清空表格选择状态
  const table = document.querySelector('.el-table')
  if (table) {
    table.__vueParentComponent?.refs?.multipleTable?.clearSelection?.()
  }
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

:deep(.el-table .el-table__row) {
  cursor: pointer;
}

:deep(.el-table .el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
