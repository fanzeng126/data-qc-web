<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="所属分类" prop="categoryId">
        <el-select
          v-model="queryParams.categoryId"
          placeholder="请选择数据源分类"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="category in categoryList"
            :key="category.id"
            :label="category.categoryName"
            :value="category.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="表名" prop="tableName">
        <el-input
          v-model="queryParams.tableName"
          placeholder="请输入表名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="中文名称" prop="chineseName">
        <el-input
          v-model="queryParams.chineseName"
          placeholder="请输入中文名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="同步来源" prop="syncSource">
        <el-select
          v-model="queryParams.syncSource"
          placeholder="请选择同步来源"
          clearable
          class="!w-240px"
        >
          <el-option label="导入模板" :value="1" />
          <el-option label="数据库表" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否启用" prop="isActive">
        <el-select
          v-model="queryParams.isActive"
          placeholder="请选择启用状态"
          clearable
          class="!w-240px"
        >
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"> <Icon icon="ep:search" class="mr-5px" /> 搜索 </el-button>
        <el-button @click="resetQuery"> <Icon icon="ep:refresh" class="mr-5px" /> 重置 </el-button>
        <el-button type="primary" @click="openForm('create')">
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="success" @click="openImportDialog">
          <Icon icon="ep:upload" class="mr-5px" /> 导入表
        </el-button>
        <el-button type="info" @click="handleExport" :loading="exportLoading">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="表ID" align="center" prop="id" width="80" />
      <el-table-column label="所属分类" align="center" prop="categoryName" width="120">
        <template #default="scope">
          <el-tag size="small" type="primary">{{ scope.row.categoryName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="表名"
        align="center"
        prop="tableName"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column
        label="中文名称"
        align="center"
        prop="chineseName"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column label="同步来源" align="center" prop="syncSource" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.syncSource === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.syncSource === 1 ? '导入模板' : '数据库表' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="来源引用"
        align="center"
        prop="sourceReference"
        width="150"
        show-overflow-tooltip
      />
      <el-table-column label="字段数量" align="center" prop="fieldCount" width="80">
        <template #default="scope">
          <el-badge :value="scope.row.fieldCount" class="item" type="primary" />
        </template>
      </el-table-column>
      <el-table-column label="是否启用" align="center" prop="isActive" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.isActive === 1 ? 'success' : 'danger'" size="small">
            {{ scope.row.isActive === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="最后同步时间"
        align="center"
        prop="lastSyncTime"
        :formatter="dateFormatter"
        width="160px"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="160px"
      />
      <el-table-column label="操作" align="center" min-width="200px" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openFieldsDialog(scope.row)"> 字段管理 </el-button>
          <el-button link type="success" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button link type="danger" @click="handleDelete(scope.row.id)"> 删除 </el-button>
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

  <!-- 表单弹窗：添加/修改 -->
  <TableMetadataForm ref="formRef" @success="getList" :categoryList="categoryList" />

  <!-- 导入表弹窗 -->
  <ImportTableDialog ref="importDialogRef" @success="getList" :categoryList="categoryList" />

  <!-- 字段管理弹窗 -->
  <FieldManageDialog ref="fieldDialogRef" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import {
  QcBuilderTableMetadataApi,
  QcBuilderTableMetadataVO,
  QcBuilderDatasourceCategoryApi,
  QcBuilderDatasourceCategoryVO
} from '@/api/drug/qc/builder'
import TableMetadataForm from './TableMetadataForm.vue'
import ImportTableDialog from './ImportTableDialog.vue'
import FieldManageDialog from './FieldManageDialog.vue'

defineOptions({ name: 'TableMetadata' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<QcBuilderTableMetadataVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const categoryList = ref<QcBuilderDatasourceCategoryVO[]>([]) // 分类列表

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  categoryId: undefined,
  tableName: undefined,
  chineseName: undefined,
  syncSource: undefined,
  sourceReference: undefined,
  isActive: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

/** 查询分类列表 */
const getCategoryList = async () => {
  try {
    const data = await QcBuilderDatasourceCategoryApi.getQcBuilderDatasourceCategoryPage({
      pageNo: 1,
      pageSize: 100,
      isActive: 1
    })
    categoryList.value = data.list
  } catch (error) {
    console.error('获取分类列表失败：', error)
  }
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcBuilderTableMetadataApi.getQcBuilderTableMetadataPage(queryParams)
    // 为每个表添加分类名称
    list.value = data.list.map((item) => ({
      ...item,
      categoryName:
        categoryList.value.find((cat) => cat.id === item.categoryId)?.categoryName || '未知分类'
    }))
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
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开导入表对话框 */
const importDialogRef = ref()
const openImportDialog = () => {
  importDialogRef.value.open()
}

/** 打开字段管理对话框 */
const fieldDialogRef = ref()
const openFieldsDialog = (row: QcBuilderTableMetadataVO) => {
  fieldDialogRef.value.open(row)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await QcBuilderTableMetadataApi.deleteQcBuilderTableMetadata(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await QcBuilderTableMetadataApi.exportQcBuilderTableMetadata(queryParams)
    download.excel(data, '表元数据配置.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(async () => {
  await getCategoryList()
  await getList()
})
</script>
