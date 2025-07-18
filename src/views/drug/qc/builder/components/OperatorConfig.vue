<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="操作符符号" prop="operatorSymbol">
        <el-input
          v-model="queryParams.operatorSymbol"
          placeholder="请输入操作符符号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-150px"
        />
      </el-form-item>
      <el-form-item label="操作符名称" prop="operatorName">
        <el-input
          v-model="queryParams.operatorName"
          placeholder="请输入操作符名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-150px"
        />
      </el-form-item>
      <el-form-item label="操作符分类" prop="operatorCategory">
        <el-select
          v-model="queryParams.operatorCategory"
          placeholder="请选择操作符分类"
          clearable
          class="!w-150px"
        >
          <el-option label="比较操作符" value="COMPARISON" />
          <el-option label="逻辑操作符" value="LOGICAL" />
          <el-option label="算术操作符" value="ARITHMETIC" />
          <el-option label="集合操作符" value="SET" />
          <el-option label="模糊匹配" value="PATTERN" />
          <el-option label="范围操作符" value="RANGE" />
          <el-option label="空值检查" value="NULL_CHECK" />
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
          <Icon icon="ep:plus" class="mr-5px" /> 新增操作符
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
      <el-table-column label="操作符ID" align="center" prop="id" width="100" />
      <el-table-column label="操作符符号" align="center" prop="operatorSymbol" width="120">
        <template #default="scope">
          <el-tag type="primary" size="large" class="operator-symbol">
            {{ scope.row.operatorSymbol }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作符名称" align="center" prop="operatorName" width="150" />
      <el-table-column label="操作符分类" align="center" prop="operatorCategory" width="120">
        <template #default="scope">
          <el-tag :type="getCategoryColor(scope.row.operatorCategory)" size="small">
            {{ getCategoryName(scope.row.operatorCategory) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="中文名称" align="center" prop="chineseName" width="120" />
      <el-table-column
        label="描述"
        align="center"
        prop="description"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column label="优先级" align="center" prop="precedence" width="80">
        <template #default="scope">
          <el-badge :value="scope.row.precedence" :type="getPrecedenceType(scope.row.precedence)" />
        </template>
      </el-table-column>
      <el-table-column label="结合性" align="center" prop="associativity" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.associativity === 'LEFT' ? 'success' : 'warning'" size="small">
            {{ scope.row.associativity === 'LEFT' ? '左结合' : '右结合' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作数数量" align="center" prop="operandCount" width="100">
        <template #default="scope">
          <el-badge :value="scope.row.operandCount" type="primary" />
        </template>
      </el-table-column>
      <el-table-column label="支持的数据类型" align="center" prop="supportedTypes" width="200">
        <template #default="scope">
          <div class="supported-types">
            <el-tag
              v-for="type in parseSupportedTypes(scope.row.supportedTypes)"
              :key="type"
              size="small"
              class="mr-1 mb-1"
              :type="getTypeColor(type)"
            >
              {{ getTypeName(type) }}
            </el-tag>
          </div>
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
      <el-table-column label="操作" align="center" min-width="150px" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openForm('update', scope.row.id)">
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
  <OperatorForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { QcOperatorConfigApi, QcOperatorConfigVO } from '@/api/drug/qc/builder'
import OperatorForm from './OperatorForm.vue'

defineOptions({ name: 'OperatorConfig' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<QcOperatorConfigVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  operatorSymbol: undefined,
  operatorName: undefined,
  operatorCategory: undefined,
  chineseName: undefined,
  isActive: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

// 获取分类名称
const getCategoryName = (category: string) => {
  const categoryMap: Record<string, string> = {
    COMPARISON: '比较',
    LOGICAL: '逻辑',
    ARITHMETIC: '算术',
    SET: '集合',
    PATTERN: '模糊匹配',
    RANGE: '范围',
    NULL_CHECK: '空值检查'
  }
  return categoryMap[category] || category
}

// 获取分类颜色
const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    COMPARISON: 'primary',
    LOGICAL: 'success',
    ARITHMETIC: 'warning',
    SET: 'info',
    PATTERN: 'danger',
    RANGE: 'info',
    NULL_CHECK: 'danger'
  }
  return colorMap[category] || 'info'
}

// 获取优先级类型
const getPrecedenceType = (precedence: number) => {
  if (precedence >= 6) return 'danger' // 高优先级
  if (precedence >= 4) return 'warning' // 中优先级
  return 'primary' // 低优先级
}

// 解析支持的数据类型
const parseSupportedTypes = (typesStr: string) => {
  try {
    const types = JSON.parse(typesStr)
    return Array.isArray(types) ? types : []
  } catch (error) {
    return []
  }
}

// 获取类型名称
const getTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    STRING: '字符串',
    INTEGER: '整数',
    DECIMAL: '小数',
    DATE: '日期',
    BOOLEAN: '布尔值',
    ALL: '所有类型'
  }
  return typeMap[type] || type
}

// 获取类型颜色
const getTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    STRING: 'primary',
    INTEGER: 'success',
    DECIMAL: 'warning',
    DATE: 'info',
    BOOLEAN: 'danger',
    ALL: 'info'
  }
  return colorMap[type] || 'info'
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await QcOperatorConfigApi.getQcOperatorConfigPage(queryParams)
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

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await QcOperatorConfigApi.deleteQcOperatorConfig(id)
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
    const data = await QcOperatorConfigApi.exportQcOperatorConfig(queryParams)
    download.excel(data, '操作符配置.xls')
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

<style scoped>
.operator-symbol {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-weight: bold;
  font-size: 14px;
}

.supported-types {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.supported-types .el-tag {
  margin: 1px;
}
</style>
