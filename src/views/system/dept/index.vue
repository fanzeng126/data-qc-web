<template>
  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="机构名称" prop="name">
        <el-input
          v-model="queryParams.name"
          placeholder="请输入机构名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="机构状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择机构状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['system:dept:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button type="danger" plain @click="toggleExpandAll">
          <Icon icon="ep:sort" class="mr-5px" /> 展开/折叠
        </el-button>
        <el-button
          type="success"
          plain
          @click="openSyncModal"
        >
          <Icon icon="ep:download" class="mr-5px" /> 从标准库同步
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      row-key="id"
      :default-expand-all="isExpandAll"
      v-if="refreshTable"
    >
      <el-table-column prop="name" label="机构名称" />
      <el-table-column prop="area" label="区域"/>
      <el-table-column prop="deptType" label="机构层级" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.deptType" :type="getDeptTypeTagType(scope.row.deptType)">
            {{ getDeptTypeLabel(scope.row.deptType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="institutionCategory" label="机构类别" width="100">
        <template #default="scope">
<!--          {{ getDictLabel(DICT_TYPE.INSTITUTION_CATEGORY, scope.row.institutionCategory.substring(0, 1))}}-->
          <span v-if="scope.row.institutionCategory.startsWith('A')">医院</span>
          <span v-if="scope.row.institutionCategory.startsWith('B1')">社区卫生服务中心</span>
          <span v-if="scope.row.institutionCategory.startsWith('C')">乡镇卫生院</span>
        </template>
      </el-table-column>
<!--      <el-table-column prop="leader" label="负责人">-->
<!--        <template #default="scope">-->
<!--          {{ userList.find((user) => user.id === scope.row.leaderUserId)?.nickname }}-->
<!--        </template>-->
<!--      </el-table-column>-->
      <el-table-column prop="sort" label="排序" />
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        width="180"
        :formatter="dateFormatter"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['system:dept:update']"
          >
            修改
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['system:dept:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <DeptForm ref="formRef" @success="getList" />
  
  <!-- 同步弹窗：从标准库同步 -->
  <InstitutionSyncModal ref="syncModalRef" @success="getList" />
</template>
<script lang="ts" setup>
import { DICT_TYPE, getIntDictOptions ,getDictLabel} from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { handleTree } from '@/utils/tree'
import * as DeptApi from '@/api/system/dept'
import * as DeptExtApi from '@/api/system/dept/deptext'
import DeptForm from './DeptForm.vue'
import InstitutionSyncModal from './InstitutionSyncModal.vue'
import * as UserApi from '@/api/system/user'

defineOptions({ name: 'SystemDept' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref() // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 100,
  name: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索的表单
const isExpandAll = ref(true) // 是否展开，默认全部展开
const refreshTable = ref(true) // 重新渲染表格状态
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

/** 查询部门列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeptApi.getDeptPage(queryParams)
    const deptTree = handleTree(data)
    
    // 为每个部门获取扩展信息
    await loadDeptExtensions(deptTree)
    
    list.value = deptTree
  } finally {
    loading.value = false
  }
}

/** 递归加载部门扩展信息 */
const loadDeptExtensions = async (depts: any[]) => {
  for (const dept of depts) {
    try {
      const extData = await DeptExtApi.getDeptExtByDeptId(dept.id)
      dept.deptExt = extData || null
    } catch (error) {
      dept.deptExt = null
    }
    
    // 递归处理子部门
    if (dept.children && dept.children.length > 0) {
      await loadDeptExtensions(dept.children)
    }
  }
}

/** 获取部门类型标签类型 */
const getDeptTypeTagType = (deptType: string) => {
  const typeMap: Record<string, string> = {
    'NORMAL': 'info',
    'PROVINCE': 'success',
    'CITY': 'warning',
    'DISTRICT': 'primary',
    'HOSPITAL': 'danger'
  }
  return typeMap[deptType] || 'info'
}

/** 获取部门类型标签文本 */
const getDeptTypeLabel = (deptType: string) => {
  const typeMap: Record<string, string> = {
    'NORMAL': '普通',
    'PROVINCE': '省级',
    'CITY': '市级',
    'DISTRICT': '区县',
    'HOSPITAL': '医院'
  }
  return typeMap[deptType] || deptType
}

/** 展开/折叠操作 */
const toggleExpandAll = () => {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => {
    refreshTable.value = true
  })
}

/** 搜索按钮操作 */
const handleQuery = () => {
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.pageNo = 1
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 打开同步弹窗 */
const syncModalRef = ref()
const openSyncModal = () => {
  syncModalRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await DeptApi.deleteDept(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  // 获取用户列表
  userList.value = await UserApi.getSimpleUserList()
  await getList()

})
</script>
