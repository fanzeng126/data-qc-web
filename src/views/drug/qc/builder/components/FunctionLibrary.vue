<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="函数名" prop="functionName">
        <el-input
          v-model="queryParams.functionName"
          placeholder="请输入函数名"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="函数分类" prop="functionCategory">
        <el-select
          v-model="queryParams.functionCategory"
          placeholder="请选择函数分类"
          clearable
          class="!w-150px"
        >
          <el-option label="统计函数" value="STATISTICS" />
          <el-option label="字符串函数" value="STRING" />
          <el-option label="数值函数" value="NUMERIC" />
          <el-option label="日期函数" value="TIME" />
          <el-option label="空值检查" value="NULL_CHECK" />
          <el-option label="分析函数" value="ANALYSIS" />
          <el-option label="自定义函数" value="CUSTOM" />
        </el-select>
      </el-form-item>
      <el-form-item label="中文名称" prop="chineseName">
        <el-input
          v-model="queryParams.chineseName"
          placeholder="请输入中文名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-150px"
        />
      </el-form-item>
      <el-form-item label="函数级别" prop="functionLevel">
        <el-select
          v-model="queryParams.functionLevel"
          placeholder="请选择函数级别"
          clearable
          class="!w-120px"
        >
          <el-option label="记录维度" value="RECORD_LEVEL" />
          <el-option label="聚合维度" value="AGGREGATE_LEVEL" />
          <el-option label="混合维度" value="MIXED_LEVEL" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否系统函数" prop="isSystem">
        <el-select v-model="queryParams.isSystem" placeholder="请选择" clearable class="!w-120px">
          <el-option label="系统函数" :value="1" />
          <el-option label="自定义函数" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="是否启用" prop="isActive">
        <el-select
          v-model="queryParams.isActive"
          placeholder="请选择启用状态"
          clearable
          class="!w-120px"
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
          <Icon icon="ep:plus" class="mr-5px" /> 新增函数
        </el-button>
        <el-button type="success" @click="handleExport" :loading="exportLoading">
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="函数ID" align="center" prop="id" width="80" />
      <el-table-column label="函数名" align="center" prop="functionName" width="150" />
      <el-table-column label="函数分类" align="center" prop="functionCategory" width="100">
        <template #default="scope">
          <el-tag :type="getCategoryColor(scope.row.functionCategory)" size="small">
            {{ getCategoryName(scope.row.functionCategory) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="中文名称" align="center" prop="chineseName" width="120" />
      <el-table-column
        label="描述"
        align="center"
        prop="description"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column label="实现类型" align="center" prop="implementationType" width="100">
        <template #default="scope">
          <el-tag :type="getImplementationTypeColor(scope.row.implementationType)" size="small">
            {{ getImplementationTypeName(scope.row.implementationType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="函数级别" align="center" prop="functionLevel" width="100">
        <template #default="scope">
          <el-tag :type="getLevelColor(scope.row.functionLevel)" size="small">
            {{ getLevelName(scope.row.functionLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="使用示例"
        align="center"
        prop="usageExample"
        width="200"
        show-overflow-tooltip
      />
      <el-table-column label="是否系统函数" align="center" prop="isSystem" width="120">
        <template #default="scope">
          <el-tag :type="scope.row.isSystem === 1 ? 'danger' : 'success'" size="small">
            {{ scope.row.isSystem === 1 ? '系统函数' : '自定义函数' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否启用" align="center" prop="isActive" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.isActive === 1 ? 'success' : 'danger'" size="small">
            {{ scope.row.isActive === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" align="center" prop="sortOrder" width="70" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="160px"
      />
      <el-table-column label="操作" align="center" min-width="180px" fixed="right">
        <template #default="scope">
          <el-button link type="info" @click="viewFunction(scope.row)"> 查看 </el-button>
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            :disabled="scope.row.isSystem === 1"
          >
            删除
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

  <!-- 表单弹窗：添加/修改 -->
  <FunctionForm ref="formRef" @success="getList" />

  <!-- 函数详情查看弹窗 -->
  <FunctionDetailDialog ref="detailDialogRef" @edit="handleEditFromDetail" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcFunctionConfigApi, QcFunctionConfigVO } from '@/api/drug/qc/builder'
import FunctionForm from './FunctionForm.vue'
import FunctionDetailDialog from './FunctionDetailDialog.vue'

defineOptions({ name: 'FunctionLibrary' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<QcFunctionConfigVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  functionName: undefined,
  functionCategory: undefined,
  chineseName: undefined,
  functionLevel: undefined,
  isSystem: undefined,
  isActive: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 获取分类名称
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    STATISTICS: '统计',
    STRING: '字符串',
    NUMERIC: '数值',
    TIME: '时间',
    NULL_CHECK: '空值检查',
    ANALYSIS: '分析',
    CUSTOM: '自定义'
  }
  return categoryMap[category] || category
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    STATISTICS: 'primary',
    STRING: 'success',
    NUMERIC: 'warning',
    TIME: 'info',
    NULL_CHECK: 'danger',
    ANALYSIS: 'info',
    CUSTOM: 'success'
  }
  return colorMap[category] || 'info'
}

// 获取实现类型名称
const getImplementationTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '内置函数',
    2: '自定义函数',
    3: 'SQL函数'
  }
  return typeMap[type] || '未知'
}

// 获取实现类型颜色
const getImplementationTypeColor = (type: number) => {
  const colorMap: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning'
  }
  return colorMap[type] || ''
}

// 获取级别名称
const getLevelName = (level: string) => {
  const levelMap: Record<string, string> = {
    'RECORD_LEVEL': '记录维度',
    'AGGREGATE_LEVEL': '聚合维度',
    'MIXED_LEVEL': '混合维度'
  }
  return levelMap[level] || '未知'
}

// 获取级别颜色
const getLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    'RECORD_LEVEL': 'primary',
    'AGGREGATE_LEVEL': 'warning',
    'MIXED_LEVEL': 'danger'
  }
  return colorMap[level] || 'info'
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcFunctionConfigApi.getQcFunctionConfigPage(queryParams)
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
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 查看函数详情 */
const detailDialogRef = ref()
const viewFunction = (row: QcFunctionConfigVO) => {
  detailDialogRef.value.open(row)
}

/** 从详情弹窗编辑函数 */
const handleEditFromDetail = (functionId: number) => {
  formRef.value.open('update', functionId)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await QcFunctionConfigApi.deleteQcFunctionConfig(id)
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
    const data = await QcFunctionConfigApi.exportQcFunctionConfig(queryParams)
    download.excel(data, '函数库配置.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
