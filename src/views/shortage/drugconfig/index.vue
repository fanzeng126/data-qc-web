<template>
  <!-- 专区信息头部 -->
  <PageHeader
    :title="zoneInfo?.zoneName || '药品配置管理'"
    content="配置专区内的药品信息，包括药品名称、剂型分类、最小剂量单位等"
    :show-back-button="true"
    back-button-text="返回专区管理"
    :meta="zoneMeta"
    :tabs="headerTabs"
    :default-tab="activeTab"
    @back-click="handleBackToZone"
    @tab-change="handleTabChange"
  />
  <ContentWrap>
    <!-- 药品配置管理 -->
    <div v-show="activeTab === 'drugConfig'">
      <!-- 搜索工作栏 -->
      <el-form
        class="-mb-15px"
        :model="queryParams"
        ref="queryFormRef"
        :inline="true"
        label-width="68px"
      >
        <el-form-item label="药品名称" prop="drugName">
          <el-input
            v-model="queryParams.drugName"
            placeholder="请输入药品名称"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="药品分类" prop="drugCategory">
          <el-input
            v-model="queryParams.drugCategory"
            placeholder="请输入药品分类"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="剂型" prop="dosageForm">
          <el-input
            v-model="queryParams.dosageForm"
            placeholder="请输入剂型"
            clearable
            @keyup.enter="handleQuery"
            class="!w-240px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择状态"
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
          <el-button @click="handleQuery">
            <Icon icon="ep:search" class="mr-5px" />
            搜索
          </el-button>
          <el-button @click="resetQuery">
            <Icon icon="ep:refresh" class="mr-5px" />
            重置
          </el-button>
          <el-button
            type="primary"
            @click="openForm('create')"
            v-hasPermi="['shortage:drug-config:create']"
          >
            <Icon icon="ep:plus" class="mr-5px" />
            新增药品
          </el-button>
          <el-button
            type="success"
            @click="handleBatchImport"
            v-hasPermi="['shortage:drug-config:create']"
          >
            <Icon icon="ep:upload" class="mr-5px" />
            批量导入
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 列表 -->
      <el-table v-loading="loading" :data="list" :show-overflow-tooltip="true">
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column
          label="药品名称"
          align="center"
          prop="drugName"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="scope">
            {{ scope.row.drugName }}
          </template>
        </el-table-column>
        <el-table-column label="药品分类" align="center" prop="drugCategory" width="140">
          <template #default="scope">
            {{ scope.row.drugCategory || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="剂型" align="center" prop="dosageForm" width="120">
          <template #default="scope">
            {{ scope.row.dosageForm }}
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
        <el-table-column
          label="创建时间"
          align="center"
          prop="createTime"
          :formatter="dateFormatter"
          width="180px"
        />
        <el-table-column label="操作" align="center" width="150px">
          <template #default="scope">
            <el-button
              link
              type="primary"
              @click="openForm('update', scope.row.id)"
              v-hasPermi="['shortage:drug-config:update']"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(scope.row.id)"
              v-hasPermi="['shortage:drug-config:delete']"
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
    </div>

    <!-- 药品分类管理 -->
    <div v-show="activeTab === 'drugCategory'">
      <DrugCategoryManagement />
    </div>

    <!-- 剂型分类管理 -->
    <div v-show="activeTab === 'dosageCategory'">
      <DosageCategoryManagement />
    </div>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <DrugConfigForm ref="formRef" @success="getList" :zone-id="currentZoneId" />

  <!-- 批量导入弹窗 -->
  <BatchImportDialog ref="batchImportRef" @success="getList" :zone-id="currentZoneId" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DrugConfigApi, ReportZoneApi, type DrugConfigVO, type ReportZoneVO } from '@/api/shortage'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import DrugConfigForm from './DrugConfigForm.vue'
import BatchImportDialog from './BatchImportDialog.vue'
import PageHeader from '@/components/PageHeader/index.vue'
import DrugCategoryManagement from './components/DrugCategoryManagement.vue'
import DosageCategoryManagement from './components/DosageCategoryManagement.vue'
import { DataBoard, List, Grid } from '@element-plus/icons-vue'

/** 专区药品配置 列表 */
defineOptions({ name: 'ShortageDrugConfig' })

const message = useMessage() // 消息弹窗
const route = useRoute()
const router = useRouter()

const loading = ref(true) // 列表的加载中
const list = ref<DrugConfigVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const zoneInfo = ref<ReportZoneVO>()
const currentZoneId = ref<number>()

// Tab相关
const activeTab = ref('drugConfig')
const headerTabs = ref([
  { key: 'drugConfig', label: '药品配置', icon: DataBoard },
  { key: 'drugCategory', label: '药品分类', icon: List },
  { key: 'dosageCategory', label: '剂型分类', icon: Grid }
])

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneId: undefined,
  drugName: '',
  drugCategory: '',
  dosageCategory: '',
  dosageForm: '',
  status: undefined
})

const queryFormRef = ref() // 搜索的表单

// 页面头部元数据
const zoneMeta = computed(() => {
  if (!zoneInfo.value) return []
  return [
    { label: '专区编码', value: zoneInfo.value.zoneCode || `ZONE_${zoneInfo.value.id}` },
    { label: '状态', value: zoneInfo.value.status === 0 ? '启用' : '停用' }
  ]
})

// 返回专区管理页面
const handleBackToZone = () => {
  router.push('/shortage/report-zone')
}

// Tab切换处理
const handleTabChange = (tabKey: string) => {
  activeTab.value = tabKey
  console.log('Tab changed to:', tabKey)
  // 切换到药品配置tab时重新加载数据
  if (tabKey === 'drugConfig') {
    getList()
  }
}

// 从路由参数获取专区信息
const initZoneInfo = async () => {
  const zoneId = route.query.zoneId as string
  const zoneName = route.query.zoneName as string

  if (!zoneId) {
    message.error('缺少专区信息，请从专区管理页面进入')
    router.back()
    return
  }

  currentZoneId.value = Number(zoneId)
  queryParams.zoneId = Number(zoneId)

  // 查询完整的专区信息
  try {
    const data = await ReportZoneApi.get(Number(zoneId))
    zoneInfo.value = data
  } catch (error) {
    // 如果查询失败，使用路由参数设置基本信息
    zoneInfo.value = {
      id: Number(zoneId),
      zoneName: zoneName || '药品配置管理',
      zoneCode: `ZONE_${String(zoneId).padStart(3, '0')}`,
      status: 1
    } as ReportZoneVO
    message.error('获取专区信息失败，使用默认信息')
  }
}

/** 查询列表 */
const getList = async () => {
  // 只在药品配置tab时才查询药品列表
  if (activeTab.value !== 'drugConfig') return

  if (!currentZoneId.value) return

  loading.value = true
  try {
    const data = await DrugConfigApi.getPage(queryParams)
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
  queryParams.drugName = ''
  queryParams.drugCategory = ''
  queryParams.dosageCategory = ''
  queryParams.dosageForm = ''
  queryParams.status = undefined
  handleQuery()
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 批量导入操作 */
const batchImportRef = ref()
const handleBatchImport = () => {
  batchImportRef.value.open()
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await DrugConfigApi.delete(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  await initZoneInfo()
  getList()
})
</script>
