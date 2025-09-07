<template>
  <ContentWrap>
    <!-- 专区信息显示 -->
    <el-card v-if="zoneInfo" class="zone-info-card" shadow="never">
      <div class="zone-info">
        <div class="zone-title">
          <Icon icon="ep:setting" class="mr-2" />
          <span>{{ zoneInfo.zoneName }} - 药品配置管理</span>
        </div>
        <div class="zone-code">专区编码：{{ zoneInfo.zoneCode }}</div>
      </div>
    </el-card>

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
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['shortage:drug-config:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增药品
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleBatchImport"
          v-hasPermi="['shortage:drug-config:create']"
        >
          <Icon icon="ep:upload" class="mr-5px" /> 批量导入
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="序号" type="index" width="60" />
      <el-table-column label="药品名称" align="center" prop="drugName" width="200" />
      <el-table-column label="剂型" align="center" prop="dosageForm" width="120" />
      <el-table-column label="最小剂量单位" align="center" prop="dosageUnit" width="100" />
      <el-table-column label="状态" align="center" prop="status" width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
            {{ scope.row.status === 1 ? '启用' : '停用' }}
          </el-tag>
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
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <DrugConfigForm ref="formRef" @success="getList" :zone-id="currentZoneId" />
  
  <!-- 批量导入弹窗 -->
  <BatchImportDialog ref="batchImportRef" @success="getList" :zone-id="currentZoneId" />
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DrugConfigApi, ReportZoneApi, type DrugConfigVO, type ReportZoneVO } from '@/api/shortage'
import DrugConfigForm from './DrugConfigForm.vue'
import BatchImportDialog from './BatchImportDialog.vue'

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

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  zoneId: undefined,
  drugName: '',
  dosageForm: '',
  status: undefined,
})

const queryFormRef = ref() // 搜索的表单

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
  
  // 设置专区信息（如果有名称直接使用，否则查询）
  if (zoneName) {
    zoneInfo.value = {
      id: Number(zoneId),
      zoneName: zoneName,
      zoneCode: `ZONE_${zoneId}`,
      status: 1
    } as ReportZoneVO
  } else {
    // 查询完整的专区信息
    try {
      const data = await ReportZoneApi.get(Number(zoneId))
      zoneInfo.value = data
    } catch (error) {
      message.error('获取专区信息失败')
    }
  }
}

/** 查询列表 */
const getList = async () => {
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

<style scoped>
.zone-info-card {
  margin-bottom: 20px;
}

.zone-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zone-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.zone-code {
  color: #909399;
  font-size: 14px;
}
</style>